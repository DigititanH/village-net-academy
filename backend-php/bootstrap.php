<?php

$root = __DIR__;
require_once $root . '/lib/Env.php';
Env::load($root);

spl_autoload_register(function (string $class) use ($root): void {
    $paths = [
        $root . '/lib/' . $class . '.php',
        $root . '/controllers/' . $class . '.php',
        $root . '/routes/' . $class . '.php',
    ];
    foreach ($paths as $path) {
        if (is_file($path)) {
            require_once $path;
            return;
        }
    }
});

Paths::ensureDir(Paths::getUploadsDir());

if (php_sapi_name() === 'cli') {
    Env::validateProductionCli();
}
