<?php
require dirname(__DIR__) . '/bootstrap.php';

Router::registerRoutes();

$ref = new ReflectionClass(Router::class);
$prop = $ref->getProperty('routes');
$prop->setAccessible(true);
$n = count($prop->getValue());

echo "Routes registered: {$n}\n";
if ($n < 60) {
    fwrite(STDERR, "Expected 60+ routes, got {$n}\n");
    exit(1);
}

echo "OK\n";
