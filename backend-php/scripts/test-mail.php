<?php
// Usage: php scripts/test-mail.php you@example.com
require_once dirname(__DIR__) . '/bootstrap.php';

$to = $argv[1] ?? Site::email();
echo "SMTP configured: " . (Mailer::isConfigured() ? 'yes' : 'NO') . "\n";
echo "Sending test email to $to ...\n";

$ok = Mailer::send([
    'to' => $to,
    'subject' => 'Village NetAcad test email',
    'html' => '<p>This is a test email from Village NetAcad. If you received it, confirmation emails can be delivered.</p>',
]);

if ($ok) {
    echo "OK - accepted by SMTP server\n";
    exit(0);
}
echo "FAILED: " . (Mailer::$lastError ?? 'unknown error') . "\n";
exit(1);
