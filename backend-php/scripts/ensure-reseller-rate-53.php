<?php
require_once dirname(__DIR__) . '/bootstrap.php';

$pdo = Database::connection();
$pdo->exec('ALTER TABLE reseller_profiles MODIFY commission_rate DECIMAL(5,2) DEFAULT 53.00');
$stmt = $pdo->exec('UPDATE reseller_profiles SET commission_rate = 53.00 WHERE commission_rate IN (56.00, 50.00)');
echo "Updated rows to 53%: " . (int) $stmt . "\n";

$rows = Database::queryAll('SELECT referral_code, academy, commission_rate FROM reseller_profiles ORDER BY id DESC LIMIT 15');
foreach ($rows as $r) {
    echo ($r['referral_code'] ?? '') . ' | ' . ($r['academy'] ?? '') . ' | ' . ($r['commission_rate'] ?? '') . "\n";
}
