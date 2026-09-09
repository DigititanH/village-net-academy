<?php

/**
 * PayFast ITN endpoint (shop orders, donations, CCNA):
 * https://www.villagenetacad.co.za/payfast/notify.php
 */
require_once dirname(__DIR__, 2) . '/bootstrap.php';

// Acknowledge immediately (PayFast requirement)
http_response_code(200);
header('Content-Type: text/plain');
echo 'OK';

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    if (ob_get_level()) {
        ob_end_flush();
    }
    flush();
}

$logDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'payfast';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
@file_put_contents(
    $logDir . DIRECTORY_SEPARATOR . 'payfast.log',
    date('c') . PHP_EOL . print_r($_POST, true) . PHP_EOL,
    FILE_APPEND
);

try {
    PayfastController::notify();
} catch (Throwable $e) {
    error_log('payfast/notify.php: ' . $e->getMessage());
}
