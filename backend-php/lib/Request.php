<?php

class Request
{
    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function path(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        return rtrim($uri ?: '/', '/') ?: '/';
    }

    public static function jsonBody(): array
    {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }
        $raw = file_get_contents('php://input');
        if ($raw === '' || $raw === false) {
            $cached = $_POST ?: [];
            return $cached;
        }
        $decoded = json_decode($raw, true);
        $cached = is_array($decoded) ? $decoded : ($_POST ?: []);
        return $cached;
    }

    public static function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public static function uuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public static function slugify(string $text): string
    {
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text);
        return trim($text, '-');
    }

    public static function handleUpload(?array $file): ?string
    {
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return null;
        }
        $allowed = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            Response::error('Only image files are allowed', 400);
        }
        $uploadsDir = Paths::getUploadsDir();
        Paths::ensureDir($uploadsDir);
        $filename = time() . '-' . random_int(100000000, 999999999) . '.' . $ext;
        $dest = $uploadsDir . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Upload failed', 500);
        }
        return '/uploads/' . $filename;
    }
}
