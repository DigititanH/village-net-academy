<?php

class Env
{
    private static bool $loaded = false;
    private static ?string $loadedPath = null;

    public static function load(string $root): void
    {
        if (self::$loaded) {
            return;
        }

        $candidates = [
            $root . DIRECTORY_SEPARATOR . '.env',
            $root . DIRECTORY_SEPARATOR . '.env.production',
            // Common cPanel mistake: .env placed next to public/index.php
            $root . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . '.env',
        ];

        foreach ($candidates as $path) {
            if (is_file($path) && is_readable($path)) {
                self::loadFile($path);
                self::$loadedPath = $path;
                break;
            }
        }

        self::$loaded = true;
    }

    public static function loadedPath(): ?string
    {
        return self::$loadedPath;
    }

    public static function envFileFound(): bool
    {
        return self::$loadedPath !== null;
    }

    private static function loadFile(string $path): void
    {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (!str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            if ($key === '') {
                continue;
            }
            $value = trim($value);
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }
            // Prefer $_ENV (putenv can break on some hosts with special chars in passwords)
            $_ENV[$key] = $value;
            @putenv("$key=$value");
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        if (array_key_exists($key, $_ENV)) {
            return (string) $_ENV[$key];
        }
        $v = getenv($key);
        if ($v === false || $v === null) {
            return $default;
        }
        return (string) $v;
    }

    public static function isProduction(): bool
    {
        return self::get('NODE_ENV', 'development') === 'production';
    }

    /** CLI only — exits with message when production .env is invalid. */
    public static function validateProductionCli(): void
    {
        if (!self::isProduction()) {
            return;
        }

        $errors = Hosting::productionConfigErrors();
        if ($errors === []) {
            return;
        }

        fwrite(STDERR, "[env] Production configuration errors:\n");
        foreach ($errors as $e) {
            fwrite(STDERR, "  - $e\n");
        }
        exit(1);
    }
}
