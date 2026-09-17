<?php
require_once dirname(__DIR__) . '/bootstrap.php';

$cats = [
    ['Merchandise', 'merchandise'],
    ['Electronics', 'electronics'],
    ['Accessories', 'accessories'],
];

foreach ($cats as [$name, $slug]) {
    $existing = Database::queryGet('SELECT id FROM categories WHERE slug = ?', [$slug]);
    if (!$existing) {
        Database::queryRun('INSERT INTO categories (name, slug) VALUES (?, ?)', [$name, $slug]);
        echo "Added $name\n";
    } else {
        echo "Exists $name\n";
    }
}

$rows = Database::queryAll('SELECT name, slug FROM categories ORDER BY name');
foreach ($rows as $r) {
    echo "- {$r['name']} ({$r['slug']})\n";
}
