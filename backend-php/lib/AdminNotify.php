<?php

/**
 * Emails every admin when a reseller applies.
 * Upload: public_html/backend-php/lib/AdminNotify.php
 */
class AdminNotify
{
    public static function emails(): array
    {
        $out = [];
        try {
            $rows = Database::queryAll(
                "SELECT l.email
                 FROM registrations r
                 JOIN logins l ON l.registration_id = r.id
                 WHERE r.role IN ('admin', 'ops_admin', 'super_admin')"
            );
            foreach ($rows as $row) {
                $e = strtolower(trim((string) ($row['email'] ?? '')));
                if ($e !== '') {
                    $out[$e] = true;
                }
            }
        } catch (Throwable $e) {
            error_log('[AdminNotify] admin query: ' . $e->getMessage());
        }
        $site = '';
        try {
            $site = strtolower(trim((string) Site::email()));
        } catch (Throwable $e) {
            // ignore
        }
        if ($site !== '') {
            $out[$site] = true;
        }
        return array_keys($out);
    }

    public static function resellerApplied(
        string $name,
        string $email,
        string $kindLabel,
        string $academyName,
        string $referralCode,
        float $commissionRate
    ): void {
        $html = '<p>Someone applied as a Village NetAcad reseller. Please verify this application in Admin → Resellers.</p>'
            . '<p><strong>Name:</strong> ' . htmlspecialchars($name) . '</p>'
            . '<p><strong>Email:</strong> ' . htmlspecialchars($email) . '</p>'
            . '<p><strong>Kind:</strong> ' . htmlspecialchars($kindLabel) . '</p>'
            . '<p><strong>Academy:</strong> ' . htmlspecialchars($academyName) . '</p>'
            . '<p><strong>Referral code (pending approval):</strong> ' . htmlspecialchars($referralCode) . '</p>'
            . '<p><strong>Commission:</strong> ' . htmlspecialchars((string) $commissionRate) . '%</p>';

        foreach (self::emails() as $to) {
            try {
                Mailer::send([
                    'to' => $to,
                    'replyTo' => $email,
                    'subject' => 'Reseller application to verify: ' . $name,
                    'html' => $html,
                ]);
            } catch (Throwable $e) {
                error_log('[AdminNotify] skip ' . $to . ': ' . $e->getMessage());
            }
        }
    }
}
