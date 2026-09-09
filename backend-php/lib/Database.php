<?php

class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo === null) {
            $dbPath = Env::get('DATABASE_PATH');
            if ($dbPath) {
                $dbDir = dirname($dbPath);
                if (!is_dir($dbDir)) {
                    mkdir($dbDir, 0755, true);
                }
                self::$pdo = new PDO('sqlite:' . $dbPath, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
                
                self::$pdo->exec('PRAGMA foreign_keys = ON');

                self::$pdo->sqliteCreateFunction('NOW', function() {
                    return date('Y-m-d H:i:s');
                });
                self::$pdo->sqliteCreateFunction('DATE_FORMAT', function($date, $format) {
                    if (!$date) return null;
                    $time = strtotime($date);
                    if ($time === false) return $date;
                    $mysqlToPhp = [
                        '%Y' => 'Y',
                        '%m' => 'm',
                        '%d' => 'd',
                        '%H' => 'H',
                        '%i' => 'i',
                        '%s' => 's',
                    ];
                    $phpFormat = str_replace(array_keys($mysqlToPhp), array_values($mysqlToPhp), $format);
                    return date($phpFormat, $time);
                });
            } else {
                $host = Env::get('DB_HOST', '127.0.0.1');
                $port = Env::get('DB_PORT', '3306');
                $name = Env::get('DB_NAME', 'village_netacad');
                $user = Env::get('DB_USER', 'root');
                $pass = Env::get('DB_PASSWORD', '');

                $dsn = sprintf(
                    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                    $host,
                    $port,
                    $name
                );

                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
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

                self::$pdo = new PDO($dsn, $user, $pass, $options);
            }
        }
        return self::$pdo;
    }

    public static function queryAll(string $sql, array $params = []): array
    {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function queryGet(string $sql, array $params = []): ?array
    {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function queryRun(string $sql, array $params = []): array
    {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        return [
            'changes' => $stmt->rowCount(),
            'lastInsertRowid' => (int) self::connection()->lastInsertId(),
        ];
    }
}
