<?php
/**
 * Rebuild database/import.sql + PHPMYADMIN-IMPORT-THIS-FILE.sql from tables/*.sql + seed.
 * Run: php scripts/rebuild-import-sql.php
 */
$root = dirname(__DIR__);
$tablesDir = $root . '/database/tables';
$seedFile = $root . '/database/seed.sql';
$outFiles = [
    $root . '/database/import.sql',
    $root . '/database/PHPMYADMIN-IMPORT-THIS-FILE.sql',
];

$header = <<<'SQL'
-- Village NetAcad - phpMyAdmin import (cPanel / Afrihost)
-- DO NOT paste into SQL tab - use Import and choose this file
-- DO NOT import .env (that is app config, not SQL)
-- Admin: admin@villagenetacad.com / Admin123!
--
-- STEP 1: In cPanel create MySQL database + user
-- STEP 2: In phpMyAdmin click your database name on the left
-- STEP 3: Import tab -> Choose File -> import.sql -> Go

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

SQL;

$footer = <<<'SQL'

SET FOREIGN_KEY_CHECKS = 1;

INSERT IGNORE INTO registrations (name, role, is_verified, is_approved) VALUES ('Admin', 'admin', 1, 'approved');

INSERT IGNORE INTO logins (registration_id, email, password)
SELECT r.id, 'admin@villagenetacad.com', '$2y$12$5ncCsyV9hyJHSzRFr69vG.F.F/N4kA24JgyPNxeeeh3wnOtgyJNZO'
FROM registrations r
WHERE r.role = 'admin' AND r.name = 'Admin'
AND NOT EXISTS (SELECT 1 FROM logins l WHERE l.email = 'admin@villagenetacad.com');

SQL;

$files = glob($tablesDir . '/*.sql');
if (!$files) {
    fwrite(STDERR, "No table SQL files found\n");
    exit(1);
}
sort($files, SORT_NATURAL);

$body = '';
foreach ($files as $file) {
    $sql = trim((string) file_get_contents($file));
    if ($sql === '') {
        continue;
    }
    $body .= "\n-- " . basename($file) . "\n" . $sql . "\n";
}

$seed = is_file($seedFile) ? trim((string) file_get_contents($seedFile)) : '';
if ($seed !== '') {
    $body .= "\n-- seed.sql\n" . $seed . "\n";
}

$content = $header . $body . $footer;

foreach ($outFiles as $out) {
    if (file_put_contents($out, $content) === false) {
        fwrite(STDERR, "Failed writing $out\n");
        exit(1);
    }
    echo "Wrote $out (" . strlen($content) . " bytes)\n";
}
