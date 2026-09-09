<?php
/**
 * Ensure reseller banking/document columns exist.
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
    'bank_details' => 'TEXT DEFAULT NULL',
    'id_document_url' => 'VARCHAR(500) DEFAULT NULL',
    'proof_of_account_url' => 'VARCHAR(500) DEFAULT NULL',
];

foreach ($cols as $name => $def) {
    if (!columnExists($pdo, 'reseller_profiles', $name)) {
        $pdo->exec("ALTER TABLE reseller_profiles ADD COLUMN {$name} {$def}");
        echo "Added reseller_profiles.{$name}\n";
    } else {
        echo "reseller_profiles.{$name} already exists\n";
    }
}
