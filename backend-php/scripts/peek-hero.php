<?php
require_once dirname(__DIR__) . '/bootstrap.php';
ob_start();
HeroController::show();
$out = ob_get_clean();
$data = json_decode($out, true);
foreach ($data['slides'] ?? [] as $s) {
    echo "#{$s['id']} {$s['title']} | buttons=" . count($s['buttons'] ?? []) . PHP_EOL;
}
