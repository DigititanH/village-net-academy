<?php
/**
 * Ensure orders delivery_method + shipping_fee columns exist.
 */
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

$cols = [
    'delivery_method' => "VARCHAR(20) NOT NULL DEFAULT 'delivery'",
    'shipping_fee' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
];

foreach ($cols as $name => $def) {
    if (!columnExists($pdo, 'orders', $name)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN {$name} {$def}");
        echo "Added orders.{$name}\n";
    } else {
        echo "orders.{$name} already exists\n";
    }
}
