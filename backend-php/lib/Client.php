<?php

class Client
{
    public static function getClientUrl(): string
    {
        $raw = Env::get('CLIENT_URL', 'http://localhost:5173');
        $primary = trim(explode(',', $raw)[0]);
        return rtrim($primary, '/');
    }

    public static function getAllowedOrigins(): array
    {
        $raw = Env::get('CLIENT_URL');
        if (!$raw) {
            return ['http://localhost:5173'];
        }
        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }
}
