<?php
require_once dirname(__DIR__) . '/bootstrap.php';

$path = Paths::backendRoot() . '/data/asc_centres.json';
$data = json_decode((string) file_get_contents($path), true);
if (!is_array($data)) {
    fwrite(STDERR, "Invalid JSON\n");
    exit(1);
}

$out = array_map(static function (array $c): array {
    return [
        'id' => (int) ($c['id'] ?? 0),
        'name' => (string) ($c['name'] ?? ''),
        'province' => (string) ($c['province'] ?? ''),
        'city' => (string) ($c['city'] ?? ''),
        'address' => (string) ($c['address'] ?? ''),
        'contact' => (string) ($c['contact'] ?? ''),
        'people_trained' => (int) ($c['people_trained'] ?? 0),
        'sales_made' => (int) ($c['sales_made'] ?? 0),
    ];
}, $data);

file_put_contents(
    $path,
    json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL,
    LOCK_EX
);
echo 'Updated ' . count($out) . " centres with people_trained and sales_made\n";
