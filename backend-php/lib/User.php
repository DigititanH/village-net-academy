<?php

class User
{
    private static function profileSelect(): string
    {
        $reg = Tables::registrations();
        $log = Tables::logins();
        return "SELECT r.id, r.name, l.email, r.role, r.avatar, r.phone, r.is_verified, r.is_approved
            FROM `{$reg}` r
            INNER JOIN `{$log}` l ON l.registration_id = r.id";
    }

    public static function findById(int $id): ?array
    {
        return Database::queryGet(self::profileSelect() . ' WHERE r.id = ?', [$id]);
    }

    public static function findByEmailForAuth(string $email): ?array
    {
        $reg = Tables::registrations();
        $log = Tables::logins();
        return Database::queryGet(
            "SELECT r.id, r.name, l.email, l.password, r.role, r.avatar, r.phone, r.is_verified, r.is_approved
             FROM `{$log}` l
             INNER JOIN `{$reg}` r ON r.id = l.registration_id
             WHERE LOWER(l.email) = ?",
            [strtolower(trim($email))]
        );
    }

    public static function emailExists(string $email): bool
    {
        $log = Tables::logins();
        $row = Database::queryGet("SELECT id FROM `{$log}` WHERE LOWER(email) = ?", [strtolower(trim($email))]);
        return $row !== null;
    }
}
