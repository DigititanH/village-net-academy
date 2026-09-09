<?php
require dirname(__DIR__) . '/bootstrap.php';

header('Content-Type: text/plain');

try {
    $pdo = Database::connection();
    echo "DB_OK\n";
    echo "driver=" . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) . "\n";

    try {
        $pdo->query('SELECT 1 FROM ccna_enrolments LIMIT 1');
        echo "TABLE_EXISTS\n";
    } catch (Throwable $e) {
        echo "TABLE_MISSING_OR_ERROR=" . $e->getMessage() . "\n";
    }
} catch (Throwable $e) {
    echo "DB_FAIL=" . $e->getMessage() . "\n";
}
