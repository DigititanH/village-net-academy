<?php

class Mailer
{
    public static function send(array $opts): void
    {
        $to = trim((string) ($opts['to'] ?? ''));
        $subject = (string) ($opts['subject'] ?? '');
        $html = (string) ($opts['html'] ?? '');
        $replyTo = $opts['replyTo'] ?? null;

        if ($to === '' || $subject === '') {
            error_log('[Mailer] Missing to/subject — mail skipped');
            return;
        }

        $host = self::cfg('SMTP_HOST', 'MAIL_HOST');
        $port = (int) (self::cfg('SMTP_PORT', 'MAIL_PORT') ?: '587');
        $user = self::cfg('SMTP_USER', 'MAIL_USERNAME');
        $pass = self::cfg('SMTP_PASS', 'MAIL_PASSWORD');
        $encryption = strtolower((string) (self::cfg('SMTP_ENCRYPTION', 'MAIL_ENCRYPTION') ?: 'tls'));
        $fromAddress = self::cfg('SMTP_FROM', 'MAIL_FROM_ADDRESS') ?: ($user ?: Site::email());
        $fromName = self::cfg('SMTP_FROM_NAME', 'MAIL_FROM_NAME') ?: 'Village NetAcad';

        if ($host === '' || $user === '' || $pass === '' || $pass === 'YOUR_EMAIL_PASSWORD') {
            error_log("[Mailer] SMTP not configured — would send to $to: $subject");
            return;
        }

        try {
            self::sendSmtp([
                'host' => $host,
                'port' => $port,
                'user' => $user,
                'pass' => $pass,
                'encryption' => $encryption,
                'fromAddress' => $fromAddress,
                'fromName' => $fromName,
                'to' => $to,
                'subject' => $subject,
                'html' => $html,
                'replyTo' => $replyTo,
            ]);
        } catch (Throwable $e) {
            error_log('[Mailer] SMTP send failed: ' . $e->getMessage());
        }
    }

    private static function cfg(string $primary, string $alias): string
    {
        $value = Env::get($primary);
        if ($value !== null && $value !== '') {
            return trim((string) $value);
        }
        $value = Env::get($alias);
        return $value !== null ? trim((string) $value) : '';
    }

    private static function sendSmtp(array $cfg): void
    {
        $remote = ($cfg['encryption'] === 'ssl' ? 'ssl://' : '') . $cfg['host'] . ':' . $cfg['port'];
        $socket = @stream_socket_client(
            $remote,
            $errno,
            $errstr,
            30,
            STREAM_CLIENT_CONNECT,
            stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]])
        );
        if (!$socket) {
            throw new RuntimeException("Cannot connect to SMTP ($errno): $errstr");
        }
        stream_set_timeout($socket, 30);

        self::expect($socket, [220]);
        self::command($socket, 'EHLO localhost', [250]);

        if ($cfg['encryption'] === 'tls') {
            self::command($socket, 'STARTTLS', [220]);
            $crypto = STREAM_CRYPTO_METHOD_TLS_CLIENT;
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                $crypto |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
            }
            if (!stream_socket_enable_crypto($socket, true, $crypto)) {
                throw new RuntimeException('STARTTLS negotiation failed');
            }
            self::command($socket, 'EHLO localhost', [250]);
        }

        self::command($socket, 'AUTH LOGIN', [334]);
        self::command($socket, base64_encode($cfg['user']), [334]);
        self::command($socket, base64_encode($cfg['pass']), [235]);

        self::command($socket, 'MAIL FROM:<' . $cfg['fromAddress'] . '>', [250]);
        self::command($socket, 'RCPT TO:<' . $cfg['to'] . '>', [250, 251]);
        self::command($socket, 'DATA', [354]);

        $headers = [
            'Date: ' . date('r'),
            'From: ' . self::formatAddress($cfg['fromName'], $cfg['fromAddress']),
            'To: <' . $cfg['to'] . '>',
            'Subject: ' . self::encodeHeader($cfg['subject']),
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];
        if (!empty($cfg['replyTo'])) {
            $headers[] = 'Reply-To: <' . $cfg['replyTo'] . '>';
        }

        $body = preg_replace("/\r\n|\r|\n/", "\r\n", $cfg['html']);
        $body = preg_replace("/^\./m", '..', $body);
        $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
        fwrite($socket, $message . "\r\n");
        self::expect($socket, [250]);
        self::command($socket, 'QUIT', [221]);
        fclose($socket);
    }

    private static function formatAddress(string $name, string $email): string
    {
        $safe = trim(str_replace(["\r", "\n"], '', $name));
        if ($safe === '') {
            return '<' . $email . '>';
        }
        return '"' . addcslashes($safe, '"\\') . '" <' . $email . '>';
    }

    private static function encodeHeader(string $value): string
    {
        if (preg_match('/[^\x20-\x7E]/', $value)) {
            return '=?UTF-8?B?' . base64_encode($value) . '?=';
        }
        return $value;
    }

    private static function command($socket, string $command, array $okCodes): void
    {
        fwrite($socket, $command . "\r\n");
        self::expect($socket, $okCodes);
    }

    private static function expect($socket, array $okCodes): string
    {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $okCodes, true)) {
            throw new RuntimeException('SMTP unexpected response: ' . trim($response));
        }
        return $response;
    }
}
