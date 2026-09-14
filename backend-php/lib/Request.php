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

        $contentType = (string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
        // Multipart bodies must use $_POST / $_FILES — php://input is empty / unsafe here.
        if (stripos($contentType, 'multipart/form-data') !== false) {
            $cached = is_array($_POST) ? $_POST : [];
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
        if (!$file || !isset($file['error'])) {
            return null;
        }

        $error = (int) $file['error'];
        if ($error === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            Response::error('Image is too large. Please use a JPG/PNG under 8MB.', 400);
        }
        if ($error === UPLOAD_ERR_PARTIAL) {
            Response::error('Image upload was interrupted. Please try again.', 400);
        }
        if ($error !== UPLOAD_ERR_OK) {
            Response::error('Image upload failed (error code ' . $error . '). Check PHP upload limits in cPanel.', 400);
        }

        $allowed = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
        $ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            Response::error('Only image files are allowed (JPG, PNG, GIF, WebP)', 400);
        }
        $maxBytes = 8 * 1024 * 1024;
        if ((int) ($file['size'] ?? 0) > $maxBytes) {
            Response::error('Image must be 8MB or smaller', 400);
        }
        return self::storeUpload($file, $ext);
    }

    /** Images or PDF for reseller ID / proof-of-account documents. */
    public static function handleDocumentUpload(?array $file): ?string
    {
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return null;
        }
        $allowed = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            Response::error('Documents must be an image (JPG/PNG/WebP) or PDF', 400);
        }
        $maxBytes = 8 * 1024 * 1024;
        if (($file['size'] ?? 0) > $maxBytes) {
            Response::error('Document must be 8MB or smaller', 400);
        }
        return self::storeUpload($file, $ext);
    }

    private static function storeUpload(array $file, string $ext): string
    {
        $uploadsDir = Paths::getUploadsDir();
        Paths::ensureDir($uploadsDir);

        if (!is_dir($uploadsDir) || !is_writable($uploadsDir)) {
            // Fallback to public/uploads so Afrihost product images still work
            $fallback = Paths::backendRoot() . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
            Paths::ensureDir($fallback);
            if (is_dir($fallback) && is_writable($fallback)) {
                $uploadsDir = $fallback;
            } else {
                Response::error(
                    'Uploads folder is not writable. In cPanel create a writable folder and set UPLOADS_DIR in backend-php/.env (see deploy/AFRIHOST.md).',
                    500
                );
            }
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            Response::error('Invalid uploaded file. Please choose the image again.', 400);
        }

        $filename = time() . '-' . random_int(100000000, 999999999) . '.' . $ext;
        $dest = $uploadsDir . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($tmp, $dest)) {
            Response::error('Could not save the image. Check UPLOADS_DIR permissions on the server.', 500);
        }
        @chmod($dest, 0644);
        return '/uploads/' . $filename;
    }
}
