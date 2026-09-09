<?php
require_once dirname(__DIR__) . '/bootstrap.php';

$pdo = Database::connection();

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

// Expand role enum for academy affiliates
try {
    $pdo->exec(
        "ALTER TABLE registrations MODIFY role ENUM('admin','super_admin','reseller','customer','academy') DEFAULT 'customer'"
    );
    echo "Updated registrations.role enum (academy)\n";
} catch (Throwable $e) {
    echo "Role enum: " . $e->getMessage() . "\n";
}

if (!columnExists($pdo, 'registrations', 'academy_name')) {
    $pdo->exec('ALTER TABLE registrations ADD COLUMN academy_name VARCHAR(255) DEFAULT NULL AFTER phone');
    echo "Added registrations.academy_name\n";
} else {
    echo "registrations.academy_name already exists\n";
}

if (!columnExists($pdo, 'registrations', 'verification_token')) {
    $pdo->exec('ALTER TABLE registrations ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL');
    echo "Added registrations.verification_token\n";
} else {
    echo "registrations.verification_token already exists\n";
}
