<?php

require_once dirname(__DIR__) . '/bootstrap.php';

$db = Database::connection();
$tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

echo 'Database: ' . Paths::getDatabaseName() . PHP_EOL;
echo 'Tables (' . count($tables) . '):' . PHP_EOL;
foreach ($tables as $table) {
    $count = $db->query('SELECT COUNT(*) FROM `' . str_replace('`', '``', $table) . '`')->fetchColumn();
    echo "  - {$table}: {$count} rows" . PHP_EOL;
}
