<?php

class Mailer
{
    public static function send(array $opts): void
    {
        $to = $opts['to'] ?? '';
        $subject = $opts['subject'] ?? '';
        $html = $opts['html'] ?? '';
        $replyTo = $opts['replyTo'] ?? null;

        $smtpUser = Env::get('SMTP_USER');
        $smtpPass = Env::get('SMTP_PASS');
        $from = $smtpUser ?: Site::email();

        if (!$smtpUser || !$smtpPass) {
            error_log("[Mailer] SMTP not configured — would send to $to: $subject");
            return;
        }

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            'From: "Village Netacad" <' . $from . '>',
        ];
        if ($replyTo) {
            $headers[] = 'Reply-To: ' . $replyTo;
        }

        @mail($to, $subject, $html, implode("\r\n", $headers));
    }
}
