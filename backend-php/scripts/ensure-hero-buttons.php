<?php
require_once dirname(__DIR__) . '/bootstrap.php';

$sql = <<<'SQL'
CREATE TABLE IF NOT EXISTS hero_buttons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  url VARCHAR(500) NOT NULL,
  style VARCHAR(40) DEFAULT 'primary',
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  open_in_new_tab TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL;

Database::connection()->exec($sql);

$count = Database::queryGet('SELECT COUNT(*) AS total FROM hero_buttons');
if ((int) ($count['total'] ?? 0) === 0) {
    $defaults = [
        ['Explore Courses', '/courses', 'primary', 1],
        ['Join Now', '/login', 'outline-primary', 2],
        ['Contact Us', '/contact', 'outline-accent', 3],
    ];
    foreach ($defaults as $b) {
        Database::queryRun(
            'INSERT INTO hero_buttons (label, url, style, sort_order, is_active, open_in_new_tab) VALUES (?, ?, ?, ?, 1, 0)',
            $b
        );
    }
}

$final = Database::queryGet('SELECT COUNT(*) AS total FROM hero_buttons');
echo 'hero_buttons ready, count=' . (int) ($final['total'] ?? 0) . PHP_EOL;
