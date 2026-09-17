<?php

class Paths
{
    public static function backendRoot(): string
    {
        return dirname(__DIR__);
    }

    public static function getDatabaseName(): string
    {
        $dbPath = Env::get('DATABASE_PATH');
        if ($dbPath) {
            return basename($dbPath);
        }
        return Env::get('DB_NAME', 'village_netacad') ?? 'village_netacad';
    }

    public static function getUploadsDir(): string
    {
        $custom = trim((string) Env::get('UPLOADS_DIR', ''));
        if ($custom !== '') {
            return self::resolvePath($custom);
        }
        return self::backendRoot() . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
    }

    public static function ensureDir(string $dir): void
    {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    private static function resolvePath(string $path): string
    {
        // Absolute: Unix (/...), Windows (C:\... or C:/...)
        if (
            str_starts_with($path, '/')
            || preg_match('#^[a-zA-Z]:[\\\\/]#', $path) === 1
        ) {
            return str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
        }
        return self::backendRoot() . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    }
}
