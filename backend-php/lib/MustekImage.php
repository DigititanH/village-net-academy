<?php

/**
 * Serves Mustek product images through our own server.
 *
 * Mustek answers bursts of parallel requests with its "No Product Image"
 * placeholder and its full images can be 9000px / 7MB, so images are fetched
 * a couple at a time, retried when the placeholder comes back, shrunk when GD
 * is available, and cached on disk.
 */
class MustekImage
{
    private const SOURCE = 'https://api.mustek.co.za/customer/PartImage.ashx';
    private const PLACEHOLDER_MD5 = [
        'a928ddb3267056d6aaf82b6a87f2bce7',
        '1e91d1b445fe59f5f8c657d2a5badf4c',
    ];
    private const IMAGE_TTL = 1_209_600;
    private const MISSING_TTL = 43_200;
    private const MAX_WIDTH = 1200;
    private const FETCH_SLOTS = 2;
    private const ATTEMPTS = 1;

    /** GET /api/mustek/image?sku=...&size=thumb|large */
    public static function serve(): never
    {
        $sku = trim((string) ($_GET['sku'] ?? ''));
        if ($sku === '' || strlen($sku) > 120 || preg_match('/[\x00-\x1F]/', $sku)) {
            Response::error('Invalid sku', 422);
        }
        $thumb = ($_GET['size'] ?? '') === 'thumb';

        $dir = self::cacheDir();
        $base = $dir . DIRECTORY_SEPARATOR . sha1($sku) . ($thumb ? '.thumb' : '');
        $file = $base . '.img';
        $missing = $base . '.missing';

        if (!self::fresh($file, self::IMAGE_TTL) && !self::fresh($missing, self::MISSING_TTL)) {
            $fetched = self::withSlot($dir, static function () use ($sku, $thumb, $file, $missing): bool {
                if (self::fresh($file, self::IMAGE_TTL) || self::fresh($missing, self::MISSING_TTL)) {
                    return true;
                }
                $result = self::download($sku, $thumb);
                if ($result === null) {
                    return false;
                }
                [$body, $isPlaceholder] = $result;
                if ($isPlaceholder) {
                    self::writeAtomic($missing, $body);
                    @unlink($file);
                    return true;
                }
                self::writeAtomic($file, $thumb ? $body : self::shrink($body));
                @unlink($missing);
                return true;
            });
            // Don't block the PHP built-in server behind Mustek — fall through to redirect.
            if ($fetched === null) {
                header('Location: ' . self::sourceUrl($sku, $thumb), true, 302);
                exit;
            }
        }

        $path = self::fresh($file, self::IMAGE_TTL) ? $file : (self::fresh($missing, self::MISSING_TTL) ? $missing : null);
        if ($path === null) {
            header('Location: ' . self::sourceUrl($sku, $thumb), true, 302);
            exit;
        }

        $body = (string) file_get_contents($path);
        $info = @getimagesizefromstring($body);
        header('Content-Type: ' . (is_array($info) ? $info['mime'] : 'image/jpeg'));
        header('Content-Length: ' . strlen($body));
        header('Cache-Control: public, max-age=' . ($path === $file ? 604800 : 3600));
        echo $body;
        exit;
    }

    /** Store-relative image link for a Mustek SKU. */
    public static function urlForSku(string $sku, bool $thumb = false): string
    {
        return '/api/mustek/image?sku=' . rawurlencode($sku) . ($thumb ? '&size=thumb' : '');
    }

    /** Rewrites a Mustek PartImage link to the cached proxy; other links pass through. */
    public static function proxyUrl(?string $url, bool $thumb = false): ?string
    {
        if ($url === null || $url === '') {
            return $url;
        }
        $parts = parse_url($url);
        if (!is_array($parts)
            || strcasecmp((string) ($parts['host'] ?? ''), 'api.mustek.co.za') !== 0
            || stripos((string) ($parts['path'] ?? ''), 'PartImage.ashx') === false) {
            return $url;
        }
        parse_str((string) ($parts['query'] ?? ''), $query);
        $sku = trim((string) ($query['partnum'] ?? ''));
        return $sku === '' ? $url : self::urlForSku($sku, $thumb);
    }

    /** @return array{0: string, 1: bool}|null */
    private static function download(string $sku, bool $thumb): ?array
    {
        $verifySsl = strtolower((string) Env::get('MUSTEK_SSL_VERIFY', 'true')) !== 'false';
        $last = null;
        for ($attempt = 1; $attempt <= self::ATTEMPTS; $attempt++) {
            $ch = curl_init(self::sourceUrl($sku, $thumb));
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT => 12,
                CURLOPT_SSL_VERIFYPEER => $verifySsl,
                CURLOPT_SSL_VERIFYHOST => $verifySsl ? 2 : 0,
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            if ($body === false && $verifySsl && str_contains($err, 'SSL certificate')) {
                $body = Mustek::httpGetViaCurlCli(self::sourceUrl($sku, $thumb)) ?? false;
                $code = $body === false ? 0 : 200;
            }

            if (is_string($body) && $body !== '' && $code === 200 && @getimagesizefromstring($body) !== false) {
                if (!in_array(md5($body), self::PLACEHOLDER_MD5, true)) {
                    return [$body, false];
                }
                $last = $body;
            }
            if ($attempt < self::ATTEMPTS) {
                usleep(250_000 * $attempt);
            }
        }
        return $last !== null ? [$last, true] : null;
    }

    private static function shrink(string $body): string
    {
        if (!function_exists('imagecreatefromstring')) {
            return $body;
        }
        $info = @getimagesizefromstring($body);
        if (!is_array($info) || $info[0] <= self::MAX_WIDTH) {
            return $body;
        }
        @ini_set('memory_limit', '1024M');
        $needed = (int) ($info[0] * $info[1] * 5) + 64 * 1024 * 1024;
        if ($needed > self::memoryLimitBytes()) {
            return $body;
        }
        $src = @imagecreatefromstring($body);
        if ($src === false) {
            return $body;
        }
        $scaled = imagescale($src, self::MAX_WIDTH);
        imagedestroy($src);
        if ($scaled === false) {
            return $body;
        }
        ob_start();
        imagejpeg($scaled, null, 85);
        imagedestroy($scaled);
        $out = (string) ob_get_clean();
        return $out !== '' ? $out : $body;
    }

    private static function memoryLimitBytes(): int
    {
        $raw = trim((string) ini_get('memory_limit'));
        if ($raw === '' || $raw === '-1') {
            return PHP_INT_MAX;
        }
        $num = (int) $raw;
        return match (strtolower(substr($raw, -1))) {
            'g' => $num * 1024 ** 3,
            'm' => $num * 1024 ** 2,
            'k' => $num * 1024,
            default => $num,
        };
    }

    /** @return mixed|null null when every fetch slot is busy (caller should not block) */
    private static function withSlot(string $dir, callable $fn): mixed
    {
        $handles = [];
        $held = null;
        for ($i = 0; $i < self::FETCH_SLOTS; $i++) {
            $h = @fopen($dir . DIRECTORY_SEPARATOR . '.fetch' . $i . '.lock', 'c');
            if ($h === false) {
                continue;
            }
            $handles[] = $h;
            if (flock($h, LOCK_EX | LOCK_NB)) {
                $held = $h;
                break;
            }
        }
        if ($held === null) {
            foreach ($handles as $h) {
                fclose($h);
            }
            return null;
        }
        try {
            return $fn();
        } finally {
            flock($held, LOCK_UN);
            foreach ($handles as $h) {
                fclose($h);
            }
        }
    }

    private static function sourceUrl(string $sku, bool $thumb): string
    {
        return self::SOURCE . '?partnum=' . rawurlencode($sku) . ($thumb ? '&thumb=true' : '');
    }

    private static function fresh(string $path, int $ttl): bool
    {
        return is_file($path) && time() - (int) filemtime($path) < $ttl;
    }

    private static function writeAtomic(string $path, string $body): void
    {
        $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
        if (@file_put_contents($tmp, $body) === false) {
            return;
        }
        if (!@rename($tmp, $path)) {
            @unlink($path);
            @rename($tmp, $path);
        }
    }

    private static function cacheDir(): string
    {
        $dir = Paths::backendRoot() . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'mustek-images';
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'villagenetacad-mustek-images';
            @mkdir($dir, 0775, true);
        }
        return $dir;
    }
}
