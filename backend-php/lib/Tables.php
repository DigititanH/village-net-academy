<?php

/** Table names from .env.database (TABLE_*). */
class Tables
{
    public static function name(string $key, string $default): string
    {
        $name = Env::get('TABLE_' . strtoupper($key), $default) ?? $default;
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $name)) {
            throw new InvalidArgumentException('Invalid table name: ' . $key);
        }
        return $name;
    }

    public static function registrations(): string
    {
        return self::name('REGISTRATIONS', 'registrations');
    }

    public static function logins(): string
    {
        return self::name('LOGINS', 'logins');
    }
}
