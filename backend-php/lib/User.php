<?php

class User
{
    private static function profileSelect(): string
    {
        $reg = Tables::registrations();
        $log = Tables::logins();
        return "SELECT r.id, r.name, l.email, r.role, r.avatar, r.phone, r.academy_name, r.is_verified, r.is_approved
            FROM `{$reg}` r
            INNER JOIN `{$log}` l ON l.registration_id = r.id";
    }

    private static function profileSelectLegacy(): string
    {
        $reg = Tables::registrations();
        $log = Tables::logins();
        return "SELECT r.id, r.name, l.email, r.role, r.avatar, r.phone, r.is_verified, r.is_approved
            FROM `{$reg}` r
            INNER JOIN `{$log}` l ON l.registration_id = r.id";
    }

    public static function findById(int $id): ?array
    {
        try {
            return Database::queryGet(self::profileSelect() . ' WHERE r.id = ?', [$id]);
        } catch (Throwable $e) {
            $row = Database::queryGet(self::profileSelectLegacy() . ' WHERE r.id = ?', [$id]);
            if ($row) {
                $row['academy_name'] = null;
            }
            return $row;
        }
    }

    public static function findByEmailForAuth(string $email): ?array
    {
        $reg = Tables::registrations();
        $log = Tables::logins();
        try {
            return Database::queryGet(
                "SELECT r.id, r.name, l.email, l.password, r.role, r.avatar, r.phone, r.academy_name, r.is_verified, r.is_approved
                 FROM `{$log}` l
                 INNER JOIN `{$reg}` r ON r.id = l.registration_id
                 WHERE LOWER(l.email) = ?",
                [strtolower(trim($email))]
            );
        } catch (Throwable $e) {
            $row = Database::queryGet(
                "SELECT r.id, r.name, l.email, l.password, r.role, r.avatar, r.phone, r.is_verified, r.is_approved
                 FROM `{$log}` l
                 INNER JOIN `{$reg}` r ON r.id = l.registration_id
                 WHERE LOWER(l.email) = ?",
                [strtolower(trim($email))]
            );
            if ($row) {
                $row['academy_name'] = null;
            }
            return $row;
        }
    }

    public static function emailExists(string $email): bool
    {
        $log = Tables::logins();
        $row = Database::queryGet("SELECT id FROM `{$log}` WHERE LOWER(email) = ?", [strtolower(trim($email))]);
        return $row !== null;
    }
}
