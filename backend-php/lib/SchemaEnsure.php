<?php

/**
 * Lightweight production schema patches for shared hosting
 * (when post-deploy.php was not run after upload).
 */
class SchemaEnsure
{
    private static bool $registrationsDone = false;
    private static bool $loginsDone = false;

    public static function registrations(): void
    {
        if (self::$registrationsDone) {
            return;
        }
        self::$registrationsDone = true;

        try {
            $pdo = Database::connection();

            try {
                $pdo->exec(
                    "ALTER TABLE registrations MODIFY role ENUM('admin','super_admin','reseller','customer','academy') DEFAULT 'customer'"
                );
            } catch (Throwable $e) {
                // ignore if already correct / unsupported
            }

            if (!self::columnExists($pdo, 'registrations', 'academy_name')) {
                $pdo->exec('ALTER TABLE registrations ADD COLUMN academy_name VARCHAR(255) DEFAULT NULL');
            }

            if (!self::columnExists($pdo, 'registrations', 'verification_token')) {
                $pdo->exec('ALTER TABLE registrations ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL');
            }

            if (!self::columnExists($pdo, 'registrations', 'verification_token_expires')) {
                $pdo->exec('ALTER TABLE registrations ADD COLUMN verification_token_expires DATETIME DEFAULT NULL');
            }
        } catch (Throwable $e) {
            error_log('[SchemaEnsure] registrations: ' . $e->getMessage());
        }
    }

    public static function heroSlides(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        try {
            $pdo = Database::connection();
            $cols = [
                'label_color' => "VARCHAR(20) NOT NULL DEFAULT '#FDE68A'",
                'title_color' => "VARCHAR(20) NOT NULL DEFAULT '#FFFFFF'",
                'title_highlight_color' => "VARCHAR(20) NOT NULL DEFAULT ''",
                'subtitle_color' => "VARCHAR(20) NOT NULL DEFAULT '#F5F5F5'",
                'body_color' => "VARCHAR(20) NOT NULL DEFAULT '#E5E5E5'",
            ];
            foreach ($cols as $name => $def) {
                if (!self::columnExists($pdo, 'hero_slides', $name)) {
                    $pdo->exec("ALTER TABLE hero_slides ADD COLUMN {$name} {$def}");
                }
            }
        } catch (Throwable $e) {
            error_log('[SchemaEnsure] heroSlides: ' . $e->getMessage());
        }
    }

    public static function logins(): void
    {
        if (self::$loginsDone) {
            return;
        }
        self::$loginsDone = true;

        try {
            $pdo = Database::connection();

            if (!self::columnExists($pdo, 'logins', 'reset_token')) {
                $pdo->exec('ALTER TABLE logins ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL');
            }
            if (!self::columnExists($pdo, 'logins', 'reset_token_expires')) {
                $pdo->exec('ALTER TABLE logins ADD COLUMN reset_token_expires DATETIME DEFAULT NULL');
            }
            if (!self::columnExists($pdo, 'logins', 'must_change_password')) {
                $pdo->exec('ALTER TABLE logins ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0');
            }
            if (!self::columnExists($pdo, 'logins', 'temp_password_expires')) {
                $pdo->exec('ALTER TABLE logins ADD COLUMN temp_password_expires DATETIME DEFAULT NULL');
            }
        } catch (Throwable $e) {
            error_log('[SchemaEnsure] logins: ' . $e->getMessage());
        }
    }

    public static function orders(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        try {
            $pdo = Database::connection();
            $cols = [
                'delivery_method' => "VARCHAR(20) NOT NULL DEFAULT 'delivery'",
                'shipping_fee' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
            ];
            foreach ($cols as $name => $def) {
                if (!self::columnExists($pdo, 'orders', $name)) {
                    $pdo->exec("ALTER TABLE orders ADD COLUMN {$name} {$def}");
                }
            }
        } catch (Throwable $e) {
            error_log('[SchemaEnsure] orders: ' . $e->getMessage());
        }
    }

    public static function resellerProfiles(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        try {
            $pdo = Database::connection();
            $cols = [
                'bank_details' => 'TEXT DEFAULT NULL',
                'id_document_url' => 'VARCHAR(500) DEFAULT NULL',
                'proof_of_account_url' => 'VARCHAR(500) DEFAULT NULL',
            ];
            foreach ($cols as $name => $def) {
                if (!self::columnExists($pdo, 'reseller_profiles', $name)) {
                    $pdo->exec("ALTER TABLE reseller_profiles ADD COLUMN {$name} {$def}");
                }
            }
        } catch (Throwable $e) {
            error_log('[SchemaEnsure] resellerProfiles: ' . $e->getMessage());
        }
    }

    /** CRM client list for mobile / reseller portal. */
    public static function resellerClients(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        try {
            $pdo = Database::connection();
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS reseller_clients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    reseller_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    product_interest VARCHAR(255) DEFAULT NULL,
                    status ENUM('pending','confirmed','bought','did_not_buy') NOT NULL DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_reseller_clients_reseller (reseller_id),
                    INDEX idx_reseller_clients_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            );
        } catch (Throwable $e) {
            error_log('[SchemaEnsure] resellerClients: ' . $e->getMessage());
        }
    }

    public static function products(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        try {
            $pdo = Database::connection();
            if (!self::columnExists($pdo, 'products', 'subcategory')) {
                $pdo->exec('ALTER TABLE products ADD COLUMN subcategory VARCHAR(80) DEFAULT NULL');
            }
            $pdo->exec("INSERT IGNORE INTO categories (name, slug) VALUES ('Merchandise', 'merchandise')");
            $pdo->exec("INSERT IGNORE INTO categories (name, slug) VALUES ('Electronics', 'electronics')");
        } catch (Throwable $e) {
            error_log('[SchemaEnsure] products: ' . $e->getMessage());
        }
    }

    private static function columnExists(PDO $pdo, string $table, string $column): bool
    {
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $stmt = $pdo->query("PRAGMA table_info($table)");
            $cols = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            foreach ($cols as $col) {
                if (($col['name'] ?? '') === $column) {
                    return true;
                }
            }
            return false;
        }

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) AS c FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) ($row['c'] ?? 0) > 0;
    }
}
