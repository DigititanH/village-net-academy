<?php

require_once dirname(__DIR__) . '/bootstrap.php';

$method = Request::method();
$path = Request::path();

// Production misconfiguration (Afrihost: fix .env before go-live)
if (Env::isProduction()) {
    $configErrors = Hosting::productionConfigErrors();
    if ($configErrors !== [] && $path !== '/health') {
        Response::json([
            'status' => 'misconfigured',
            'message' => 'Server configuration incomplete. Fix .env (see deploy/AFRIHOST.md or deploy/azure/AZURE.md).',
            'errors' => $configErrors,
        ], 503);
        exit;
    }
}

$extMissing = Hosting::missingExtensions();
if ($extMissing !== [] && $path !== '/health') {
    Response::json([
        'status' => 'error',
        'message' => 'PHP extensions required: ' . implode(', ', $extMissing),
    ], 503);
    exit;
}

// CORS
$isProduction = Env::isProduction();
$origins = Client::getAllowedOrigins();
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($isProduction) {
    if ($origin && in_array($origin, $origins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
} else {
    header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Static uploads
if (str_starts_with($path, '/uploads/')) {
    $filename = basename($path);
    $file = Paths::getUploadsDir() . DIRECTORY_SEPARATOR . $filename;
    if (!is_file($file)) {
        $file = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $filename;
    }
    if (is_file($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $types = [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
            'gif' => 'image/gif', 'webp' => 'image/webp',
        ];
        header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
        readfile($file);
        exit;
    }
    http_response_code(404);
    exit;
}

// React app (production): serve built files from this folder (see deploy/AFRIHOST.md)
if ($method === 'GET' && !preg_match('#^/(api|uploads|health)(/|$)#', $path)) {
    $rel = $path === '/' ? '/index.html' : $path;
    $file = __DIR__ . str_replace(['..', "\0"], '', $rel);
    if (is_file($file) && !is_dir($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if ($ext !== 'php') {
            $types = [
                'html' => 'text/html', 'css' => 'text/css', 'js' => 'application/javascript',
                'json' => 'application/json', 'svg' => 'image/svg+xml', 'ico' => 'image/x-icon',
                'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp', 'woff2' => 'font/woff2',
            ];
            header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
            readfile($file);
            exit;
        }
    }
    $spa = __DIR__ . '/index.html';
    if (is_file($spa)) {
        header('Content-Type: text/html');
        readfile($spa);
        exit;
    }
}

try {
    Router::registerRoutes();
    Router::dispatch($method, $path);
} catch (Throwable $e) {
    error_log($e->getMessage() . "\n" . $e->getTraceAsString());
    $message = $isProduction ? 'Internal server error' : $e->getMessage();
    Response::json(['message' => $message], 500);
}
