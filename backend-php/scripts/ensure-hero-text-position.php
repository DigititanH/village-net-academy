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

if (!columnExists($pdo, 'hero_slides', 'text_position')) {
    $pdo->exec("ALTER TABLE hero_slides ADD COLUMN text_position VARCHAR(40) NOT NULL DEFAULT 'center'");
    echo "Added hero_slides.text_position\n";
} else {
    echo "hero_slides.text_position already exists\n";
}
