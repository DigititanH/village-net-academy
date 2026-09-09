<?php
/**
 * Afrihost / cPanel post-deploy: create/upgrade schema and seed essentials.
 *
 * Usage (SSH or cPanel Terminal), from backend-php/:
 *   php scripts/post-deploy.php
 *
 * Requires backend-php/.env already configured with MySQL credentials.
 */
require_once dirname(__DIR__) . '/bootstrap.php';

echo "Village NetAcad post-deploy\n";
echo "==========================\n";

if (!Env::envFileFound()) {
    fwrite(STDERR, "ERROR: backend-php/.env not found. Create it from deploy/env.production.template first.\n");
    exit(1);
}

$scripts = [
    dirname(__DIR__) . '/database/migrate.php',
];

$ensure = [
    'ensure-store-categories.php',
    'ensure-product-subcategory.php',
    'ensure-hero-text-position.php',
    'ensure-hero-text-colors.php',
    'ensure-hero-buttons.php',
    'ensure-academy-role.php',
    'ensure-order-delivery.php',
    'ensure-reseller-banking.php',
];

// migrate.php is a full script — run via include after marking
passthru('php ' . escapeshellarg($scripts[0]), $migrateCode);
if ($migrateCode !== 0) {
    fwrite(STDERR, "Migration failed (exit $migrateCode)\n");
    exit($migrateCode);
}

foreach ($ensure as $name) {
    $path = __DIR__ . DIRECTORY_SEPARATOR . $name;
    if (!is_file($path)) {
        echo "SKIP missing $name\n";
        continue;
    }
    echo "\n--- $name ---\n";
    passthru('php ' . escapeshellarg($path), $code);
    if ($code !== 0) {
        fwrite(STDERR, "WARN: $name exited $code\n");
    }
}

echo "\n--- Health summary ---\n";
try {
    $payload = Hosting::healthPayload();
    echo 'status: ' . ($payload['status'] ?? 'unknown') . "\n";
    $db = $payload['checks']['database'] ?? [];
    echo 'database: ' . (!empty($db['ok']) ? 'ok' : 'FAIL') . "\n";
    $writable = $payload['checks']['writable'] ?? [];
    if (empty($writable['ok'])) {
        echo 'uploads: NOT writable — set UPLOADS_DIR to a writable folder outside public (see AFRIHOST.md)\n';
        foreach (($writable['errors'] ?? []) as $err) {
            echo "  - $err\n";
        }
    } else {
        echo "uploads: ok\n";
    }
    $smtpUser = Env::get('SMTP_USER') ?: Env::get('MAIL_USERNAME');
    $smtpPass = Env::get('SMTP_PASS') ?: Env::get('MAIL_PASSWORD');
    if (!$smtpUser || !$smtpPass || stripos((string) $smtpPass, 'YOUR_EMAIL') !== false) {
        echo "smtp: NOT configured — registration confirmation emails will fail until SMTP_* / MAIL_* are set\n";
    } else {
        echo "smtp: credentials present\n";
    }
    $jwt = (string) Env::get('JWT_SECRET', '');
    if (strlen($jwt) < 32 || preg_match('/CHANGE_ME|placeholder|dev-secret|REPLACE_WITH/i', $jwt)) {
        echo "jwt: WEAK — set a long random JWT_SECRET in .env\n";
    } else {
        echo "jwt: ok\n";
    }
} catch (Throwable $e) {
    echo 'health check error: ' . $e->getMessage() . "\n";
}

echo "\nDone. Next: open https://YOUR_DOMAIN/health and change the default admin password.\n";
