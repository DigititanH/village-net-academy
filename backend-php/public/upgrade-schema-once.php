<?php
/**
 * One-time live schema upgrade for cPanel (no Terminal needed).
 *
 * Upload this file into backend-php/public/ (or use the one in your zip),
 * then open in the browser:
 *
 *   https://www.villagenetacad.co.za/upgrade-schema-once.php?key=YOUR_JWT_SECRET
 *
 * Use the same JWT_SECRET value from backend-php/.env as ?key=
 * After it says Done, DELETE this file from the server.
 */
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

require_once dirname(__DIR__) . '/bootstrap.php';

$key = (string) ($_GET['key'] ?? '');
$expected = (string) (Env::get('UPGRADE_KEY') ?: Env::get('JWT_SECRET') ?: '');

if ($expected === '' || !hash_equals($expected, $key)) {
    http_response_code(403);
    echo "Forbidden.\n";
    echo "Open this URL with ?key= equal to JWT_SECRET from backend-php/.env\n";
    echo "Example: /upgrade-schema-once.php?key=your-jwt-secret-here\n";
    exit;
}

echo "Village NetAcad schema upgrade\n";
echo "==============================\n\n";

try {
    $pdo = Database::connection();
} catch (Throwable $e) {
    http_response_code(500);
    echo "ERROR: cannot connect to database. Check DB_* in backend-php/.env\n";
    echo $e->getMessage() . "\n";
    exit(1);
}

function columnExists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $stmt->execute([$table, $column]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return (int) ($row['c'] ?? 0) > 0;
}

function ensureColumn(PDO $pdo, string $table, string $column, string $definition): void
{
    if (columnExists($pdo, $table, $column)) {
        echo "OK already exists: {$table}.{$column}\n";
        return;
    }
    $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    echo "Added {$table}.{$column}\n";
}

$patches = [
    ['registrations', 'academy_name', 'VARCHAR(255) DEFAULT NULL'],
    ['registrations', 'verification_token', 'VARCHAR(255) DEFAULT NULL'],
    ['registrations', 'verification_token_expires', 'DATETIME DEFAULT NULL'],
    ['logins', 'reset_token', 'VARCHAR(255) DEFAULT NULL'],
    ['logins', 'reset_token_expires', 'DATETIME DEFAULT NULL'],
    ['orders', 'delivery_method', "VARCHAR(20) NOT NULL DEFAULT 'delivery'"],
    ['orders', 'shipping_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00'],
    ['reseller_profiles', 'bank_details', 'TEXT DEFAULT NULL'],
    ['reseller_profiles', 'id_document_url', 'VARCHAR(500) DEFAULT NULL'],
    ['reseller_profiles', 'proof_of_account_url', 'VARCHAR(500) DEFAULT NULL'],
    ['hero_slides', 'label', "VARCHAR(255) NOT NULL DEFAULT ''"],
    ['hero_slides', 'title', "VARCHAR(255) NOT NULL DEFAULT ''"],
    ['hero_slides', 'title_highlight', "VARCHAR(255) NOT NULL DEFAULT ''"],
    ['hero_slides', 'subtitle', 'TEXT NULL'],
    ['hero_slides', 'body', 'TEXT NULL'],
    ['hero_slides', 'text_position', "VARCHAR(40) NOT NULL DEFAULT 'center'"],
    ['hero_slides', 'label_color', "VARCHAR(20) NOT NULL DEFAULT '#FDE68A'"],
    ['hero_slides', 'title_color', "VARCHAR(20) NOT NULL DEFAULT '#FFFFFF'"],
    ['hero_slides', 'title_highlight_color', "VARCHAR(20) NOT NULL DEFAULT ''"],
    ['hero_slides', 'subtitle_color', "VARCHAR(20) NOT NULL DEFAULT '#F5F5F5'"],
    ['hero_slides', 'body_color', "VARCHAR(20) NOT NULL DEFAULT '#E5E5E5'"],
    ['hero_buttons', 'slide_id', 'INT NULL'],
    ['products', 'subcategory', 'VARCHAR(80) DEFAULT NULL'],
];

foreach ($patches as [$table, $column, $def]) {
    try {
        ensureColumn($pdo, $table, $column, $def);
    } catch (Throwable $e) {
        echo "WARN {$table}.{$column}: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec(
        "ALTER TABLE registrations MODIFY role ENUM('admin','super_admin','reseller','customer','academy') DEFAULT 'customer'"
    );
    echo "OK registrations.role includes academy\n";
} catch (Throwable $e) {
    echo 'WARN role enum: ' . $e->getMessage() . "\n";
}

try {
    $pdo->exec("INSERT IGNORE INTO categories (name, slug) VALUES ('Merchandise', 'merchandise')");
    $pdo->exec("INSERT IGNORE INTO categories (name, slug) VALUES ('Electronics', 'electronics')");
    echo "OK store categories\n";
} catch (Throwable $e) {
    echo 'WARN categories: ' . $e->getMessage() . "\n";
}

echo "\nDone. Schema should be up to date.\n";
echo "IMPORTANT: Delete this file from the server now:\n";
echo "  public/upgrade-schema-once.php\n";
