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

if (!columnExists($pdo, 'products', 'subcategory')) {
    $pdo->exec('ALTER TABLE products ADD COLUMN subcategory VARCHAR(80) DEFAULT NULL AFTER category_id');
    echo "Added products.subcategory\n";
} else {
    echo "products.subcategory already exists\n";
}
