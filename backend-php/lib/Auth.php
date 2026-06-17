<?php

class Auth
{
    public static ?array $user = null;

    public static function authenticate(): void
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) {
            Response::error('Authentication required', 401);
        }
        $token = trim(substr($header, 7));
        $decoded = Jwt::verify($token);
        if (!$decoded || !isset($decoded['id'])) {
            Response::error('Invalid or expired token', 401);
        }
        $user = User::findById((int) $decoded['id']);
        if (!$user) {
            Response::error('User not found', 401);
        }
        self::$user = $user;
    }

    public static function authorize(string ...$roles): void
    {
        self::authenticate();
        if (!in_array(self::$user['role'], $roles, true)) {
            Response::error('Access denied', 403);
        }
    }

    public static function optionalUser(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }
        $decoded = Jwt::verify(trim(substr($header, 7)));
        if (!$decoded || !isset($decoded['id'])) {
            return null;
        }
        return User::findById((int) $decoded['id']);
    }
}
