<?php

class Env
{
    private static bool $loaded = false;

    public static function load(string $root): void
    {
        if (self::$loaded) {
            return;
        }

        self::loadFile($root . DIRECTORY_SEPARATOR . '.env');

        self::$loaded = true;
    }

    private static function loadFile(string $path): void
    {
        if (!is_file($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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
            $value = trim($value);
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }
            if (getenv($key) === false) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
            }
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $v = $_ENV[$key] ?? getenv($key);
        if ($v === false || $v === null || $v === '') {
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
