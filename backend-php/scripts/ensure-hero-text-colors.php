<?php
/**
 * Ensure hero_slides text color columns exist.
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
    'label_color' => "VARCHAR(20) NOT NULL DEFAULT '#FDE68A'",
    'title_color' => "VARCHAR(20) NOT NULL DEFAULT '#FFFFFF'",
    'title_highlight_color' => "VARCHAR(20) NOT NULL DEFAULT ''",
    'subtitle_color' => "VARCHAR(20) NOT NULL DEFAULT '#F5F5F5'",
    'body_color' => "VARCHAR(20) NOT NULL DEFAULT '#E5E5E5'",
];

foreach ($cols as $name => $def) {
    if (!columnExists($pdo, 'hero_slides', $name)) {
        $pdo->exec("ALTER TABLE hero_slides ADD COLUMN {$name} {$def}");
        echo "Added hero_slides.{$name}\n";
    } else {
        echo "hero_slides.{$name} already exists\n";
    }
}
