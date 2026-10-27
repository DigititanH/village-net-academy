<?php

/**
 * Mustek dealer feed: ItemsStock CSV (ItemId, Description, QtyAvailable, Price,
 * SupplierItemId, ProductLine, Status, UPCBarcode, Primary Image, Thumbnail).
 * Prices in the feed exclude VAT.
 */
class Mustek
{
    public static function token(): string
    {
        return trim((string) Env::get('MUSTEK_CUSTOMER_TOKEN', ''));
    }

    public static function isConfigured(): bool
    {
        return self::token() !== '';
    }

    public static function markup(mixed $override = null): float
    {
        $markup = $override !== null && $override !== ''
            ? (float) $override
            : (float) (Env::get('MUSTEK_MARKUP', '1.25') ?: '1.25');
        return $markup > 0 ? $markup : 1.25;
    }

    public static function vatRate(): float
    {
        $rate = (float) (Env::get('MUSTEK_VAT_RATE', '0.15') ?: '0.15');
        return $rate >= 0 ? $rate : 0.15;
    }

    public static function sellPrice(float $cost, float $markup): float
    {
        return round($cost * $markup * (1 + self::vatRate()), 2);
    }

    public static function productName(string $description, string $itemId): string
    {
        $name = trim($description) !== '' ? trim($description) : $itemId;
        if (strlen($name) > 240) {
            $name = rtrim(substr($name, 0, 237)) . '...';
        }
        return $name;
    }

    public static function isActive(array $item): bool
    {
        $status = trim((string) ($item['status'] ?? ''));
        return $status === '' || strcasecmp($status, 'Active') === 0;
    }

    /** @return list<array<string, mixed>> */
    public static function fetchItemsStock(bool $useCache = true): array
    {
        if ($useCache) {
            $cached = self::readCache();
            if ($cached !== null) {
                return $cached;
            }
        }

        if (!self::isConfigured()) {
            throw new RuntimeException('MUSTEK_CUSTOMER_TOKEN is not set in backend-php/.env');
        }

        $base = rtrim((string) (Env::get('MUSTEK_API_URL', '') ?: 'https://api.mustek.co.za/Customer/ItemsStock.ashx'), '?&');
        $url = $base . (str_contains($base, '?') ? '&' : '?') . 'CustomerToken=' . rawurlencode(self::token());

        $csv = self::httpGet($url);
        if ($csv === '' || stripos($csv, 'ItemId') === false) {
            throw new RuntimeException('Mustek API returned an empty or unexpected response. Check MUSTEK_CUSTOMER_TOKEN.');
        }

        $rows = self::parseCsv($csv);
        @file_put_contents(self::cachePath(), json_encode($rows));
        return $rows;
    }

    public static function clearCache(): void
    {
        $path = self::cachePath();
        if (is_file($path)) {
            @unlink($path);
        }
    }

    /** @return list<array<string, mixed>>|null */
    private static function readCache(): ?array
    {
        $path = self::cachePath();
        if (!is_file($path)) {
            return null;
        }
        $ttl = max(60, (int) (Env::get('MUSTEK_CACHE_TTL', '300') ?: 300));
        if (time() - (int) filemtime($path) > $ttl) {
            return null;
        }
        $data = json_decode((string) file_get_contents($path), true);
        return is_array($data) ? $data : null;
    }

    private static function cachePath(): string
    {
        return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'villagenetacad_mustek_items.json';
    }

    /** @return list<array<string, mixed>> */
    public static function parseCsv(string $csv): array
    {
        $csv = preg_replace('/^\xEF\xBB\xBF/', '', $csv) ?? $csv;
        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            throw new RuntimeException('Unable to open temp stream for Mustek CSV');
        }
        fwrite($stream, $csv);
        rewind($stream);

        $header = fgetcsv($stream, 0, ',', '"', '\\');
        if (!$header) {
            fclose($stream);
            throw new RuntimeException('Mustek CSV has no header row');
        }
        $map = [];
        foreach ($header as $i => $name) {
            $map[strtolower(trim((string) $name))] = $i;
        }
        foreach (['itemid', 'description', 'qtyavailable', 'price'] as $col) {
            if (!isset($map[$col])) {
                fclose($stream);
                throw new RuntimeException('Mustek CSV missing column: ' . $col);
            }
        }

        $rows = [];
        while (($cols = fgetcsv($stream, 0, ',', '"', '\\')) !== false) {
            if ($cols === [null]) {
                continue;
            }
            $itemId = trim((string) ($cols[$map['itemid']] ?? ''));
            if ($itemId === '') {
                continue;
            }
            $rows[] = [
                'item_id' => $itemId,
                'description' => self::col($cols, $map, 'description'),
                'qty_available' => (int) self::col($cols, $map, 'qtyavailable'),
                'price' => (float) str_replace(',', '', self::col($cols, $map, 'price')),
                'supplier_item_id' => self::col($cols, $map, 'supplieritemid'),
                'product_line' => self::col($cols, $map, 'productline'),
                'status' => self::col($cols, $map, 'status'),
                'upc' => self::col($cols, $map, 'upcbarcode'),
                'image_url' => self::col($cols, $map, 'primary image'),
                'thumbnail_url' => self::col($cols, $map, 'thumbnail'),
            ];
        }
        fclose($stream);
        return $rows;
    }

    /** @param list<string|null> $cols @param array<string, int> $map */
    private static function col(array $cols, array $map, string $key): string
    {
        return isset($map[$key]) ? trim((string) ($cols[$map[$key]] ?? '')) : '';
    }

    private static function sslVerify(): bool
    {
        return strtolower((string) Env::get('MUSTEK_SSL_VERIFY', 'true')) !== 'false';
    }

    private static function httpGet(string $url): string
    {
        $verifySsl = self::sslVerify();

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_CONNECTTIMEOUT => 20,
                CURLOPT_TIMEOUT => 120,
                CURLOPT_HTTPHEADER => ['Accept: text/csv,text/plain,*/*'],
                CURLOPT_SSL_VERIFYPEER => $verifySsl,
                CURLOPT_SSL_VERIFYHOST => $verifySsl ? 2 : 0,
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            if ($body !== false && $code < 400 && $body !== '') {
                return (string) $body;
            }
            // Windows PHP often lacks a CA bundle; curl.exe uses the system store.
            if ($verifySsl && str_contains($err, 'SSL certificate')) {
                $cli = self::httpGetViaCurlCli($url);
                if ($cli !== null) {
                    return $cli;
                }
            }
            if ($code === 401 || $code === 403) {
                throw new RuntimeException('Mustek rejected the Customer Token (HTTP ' . $code . ')');
            }
            throw new RuntimeException('Mustek API request failed' . ($err ? ': ' . $err : ' (HTTP ' . $code . ')'));
        }

        $cli = self::httpGetViaCurlCli($url);
        if ($cli !== null) {
            return $cli;
        }
        $ctx = stream_context_create([
            'http' => ['method' => 'GET', 'timeout' => 120, 'header' => "Accept: text/csv,text/plain,*/*\r\n"],
            'ssl' => ['verify_peer' => $verifySsl, 'verify_peer_name' => $verifySsl],
        ]);
        $body = @file_get_contents($url, false, $ctx);
        if ($body === false) {
            throw new RuntimeException('Mustek API request failed');
        }
        return $body;
    }

    public static function httpGetViaCurlCli(string $url): ?string
    {
        if (!function_exists('proc_open')) {
            return null;
        }
        $cmd = [PHP_OS_FAMILY === 'Windows' ? 'curl.exe' : 'curl', '-sS', '-L', '--max-time', '120', $url];
        $proc = @proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, null, null, ['bypass_shell' => true]);
        if (!is_resource($proc)) {
            return null;
        }
        $out = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $code = proc_close($proc);
        return ($code !== 0 || $out === false || $out === '') ? null : $out;
    }
}
