<?php

require_once dirname(__DIR__) . '/bootstrap.php';

function translateMysqlToSqlite(string $sql): string
{
    // Remove InnoDB engine and charset definitions
    $sql = preg_replace('/ENGINE\s*=\s*InnoDB\s*(?:DEFAULT)?\s*(?:CHARSET|CHARACTER SET)\s*=\s*\w+(?:\s*COLLATE\s*=\s*[\w_]+)?/i', '', $sql);
    
    // Replace MySQL INT AUTO_INCREMENT PRIMARY KEY with SQLite INTEGER PRIMARY KEY AUTOINCREMENT
    $sql = preg_replace('/id\s+INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/i', 'id INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
    $sql = preg_replace('/id\s+INT\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/i', 'id INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
    
    // Replace auto increment in general (if any)
    $sql = preg_replace('/\bINT\s+AUTO_INCREMENT\b/i', 'INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
    
    // SQLite doesn't support ON UPDATE CURRENT_TIMESTAMP
    $sql = preg_replace('/ON\s+UPDATE\s+CURRENT_TIMESTAMP/i', '', $sql);
    
    // Replace MySQL ENUM with TEXT
    $sql = preg_replace('/ENUM\s*\([^)]+\)/i', 'TEXT', $sql);
    
    // Replace TINYINT(1) or TINYINT with INTEGER
    $sql = preg_replace('/\bTINYINT(\s*\(\d+\))?/i', 'INTEGER', $sql);

    // Replace UNIQUE KEY uniq_name (col1, col2) -> UNIQUE (col1, col2)
    $sql = preg_replace('/UNIQUE\s+KEY\s+\w+\s*\(([^)]+)\)/i', 'UNIQUE ($1)', $sql);
    
    return $sql;
}

function runSqlFile(PDO $pdo, string $path, bool $ignoreErrors = false): void
{
    if (!is_readable($path)) {
        throw new RuntimeException('SQL file not found: ' . $path);
    }

    $sql = file_get_contents($path);
    $isSqlite = ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite');

    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        if ($stmt === '' || str_starts_with($stmt, '--')) {
            continue;
        }

        if ($isSqlite) {
            $stmt = translateMysqlToSqlite($stmt);
            if (trim($stmt) === '') {
                continue;
            }
        }

        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            if (!$ignoreErrors) {
                throw new RuntimeException("Migration query failed: $stmt. Error: " . $e->getMessage(), 0, $e);
            }
        }
    }
}

function runSqlFilesInDirectory(PDO $pdo, string $directory, bool $ignoreErrors = false): void
{
    if (!is_dir($directory)) {
        throw new RuntimeException('SQL directory not found: ' . $directory);
    }

    $files = glob($directory . DIRECTORY_SEPARATOR . '*.sql');
    if ($files === false || $files === []) {
        throw new RuntimeException('No SQL files found in: ' . $directory);
    }

    sort($files, SORT_NATURAL);
    foreach ($files as $file) {
        runSqlFile($pdo, $file, $ignoreErrors);
    }
}

function ensureDatabaseExists(): void
{
    $dbPath = Env::get('DATABASE_PATH');
    if ($dbPath) {
        $dbDir = dirname($dbPath);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }
        return;
    }

    $host = Env::get('DB_HOST', '127.0.0.1');
    $port = Env::get('DB_PORT', '3306');
    $name = Env::get('DB_NAME', 'village_netacad');
    $user = Env::get('DB_USER', 'root');
    $pass = Env::get('DB_PASSWORD', '');

    $dsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $host, $port);
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ];

    $sslCa = Env::get('DB_SSL_CA');
    if ($sslCa) {
        if (!preg_match('#^[a-zA-Z]:\\\\#', $sslCa) && !str_starts_with($sslCa, '/')) {
            $sslCa = Paths::backendRoot() . DIRECTORY_SEPARATOR . $sslCa;
        }
        if (is_file($sslCa)) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCa;
        }
    }

    $pdo = new PDO($dsn, $user, $pass, $options);
    $pdo->exec(
        sprintf(
            'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            str_replace('`', '``', (string) $name)
        )
    );
}

try {
    ensureDatabaseExists();

    $pdo = Database::connection();
    $dbDir = __DIR__;

    runSqlFilesInDirectory($pdo, $dbDir . DIRECTORY_SEPARATOR . 'tables');
    runSqlFile($pdo, $dbDir . DIRECTORY_SEPARATOR . 'migrations.sql', true);
    runSqlFile($pdo, $dbDir . DIRECTORY_SEPARATOR . 'seed.sql');

    $existing = Database::queryGet(
        'SELECT r.id FROM registrations r
         JOIN logins l ON l.registration_id = r.id
         WHERE l.email = ?',
        ['admin@villagenetacad.com']
    );
    if (!$existing) {
        $hash = password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12]);
        $result = Database::queryRun(
            'INSERT INTO registrations (name, role, is_verified, is_approved) VALUES (?, ?, ?, ?)',
            ['Admin', 'admin', 1, 'approved']
        );
        Database::queryRun(
            'INSERT INTO logins (registration_id, email, password) VALUES (?, ?, ?)',
            [$result['lastInsertRowid'], 'admin@villagenetacad.com', $hash]
        );
    }

    echo "Database migrated and seeded successfully!\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Migration failed: ' . $e->getMessage() . "\n");
    exit(1);
}
