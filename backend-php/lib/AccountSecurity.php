<?php

/**
 * Admin invites, finance role helpers, login alerts, delivery review email.
 * Upload: public_html/backend-php/lib/AccountSecurity.php
 * Must contain staffInvited() and requireFinance(). If the file is ~6 KB, it is the old copy.
 *
 * Safe SAST patch: based on CURRENT LIVE content + formatSast() / formatStoredAsSast() only.
 * See SAFE-SAST-PATCH.md — do not replace live AuthController wholesale.
 */
class AccountSecurity
{
    /** South Africa Standard Time (no DST). */
    public static function sastZone(): DateTimeZone
    {
        return new DateTimeZone('Africa/Johannesburg');
    }

    /**
     * User-facing timestamp in SAST. Pass a unix timestamp, or null for now.
     * Example: 2026-09-14 13:41 SAST
     */
    public static function formatSast(?int $timestamp = null, string $format = 'Y-m-d H:i'): string
    {
        $dt = new DateTime('@' . ($timestamp ?? time()));
        $dt->setTimezone(self::sastZone());
        return $dt->format($format) . ' SAST';
    }

    public static function tempPassword(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $out = '';
        for ($i = 0; $i < 10; $i++) {
            $out .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $out;
    }

    /** Absolute expiry for DB (unix-based). Compare with time()/strtotime. */
    public static function expiresAt(): string
    {
        return date('Y-m-d H:i:s', time() + (72 * 3600));
    }

    /** Format a stored expiry datetime string for emails (SAST). */
    public static function formatStoredAsSast(string $stored): string
    {
        $ts = strtotime($stored);
        if ($ts === false) {
            return $stored;
        }
        return self::formatSast($ts, 'Y-m-d H:i');
    }

    public static function setTempPassword(int $userId, string $plain): string
    {
        $hash = password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);
        $expires = self::expiresAt();
        Database::queryRun(
            'UPDATE logins SET password = ?, must_change_password = 1, temp_password_expires = ?, reset_token = NULL, reset_token_expires = NULL WHERE registration_id = ?',
            [$hash, $expires, $userId]
        );
        return $expires;
    }

    public static function loginFlags(int $userId): array
    {
        try {
            $row = Database::queryGet(
                'SELECT must_change_password, temp_password_expires FROM logins WHERE registration_id = ?',
                [$userId]
            );
        } catch (Throwable $e) {
            return ['must_change_password' => false, 'temp_password_expires' => null];
        }
        return [
            'must_change_password' => (int) ($row['must_change_password'] ?? 0) === 1,
            'temp_password_expires' => $row['temp_password_expires'] ?? null,
        ];
    }

    public static function isActive(array $user): bool
    {
        if (!array_key_exists('is_active', $user)) {
            return true;
        }
        return (int) $user['is_active'] !== 0;
    }

    public static function sendApp(string $to, string $subject, string $html): void
    {
        if ($to === '' || $subject === '') {
            return;
        }
        try {
            Mailer::send([
                'to' => $to,
                'subject' => $subject,
                'html' => $html,
                'channel' => 'app',
            ]);
        } catch (Throwable $e) {
            error_log('[AccountSecurity] ' . $e->getMessage());
        }
    }

    public static function staffInvited(
        string $name,
        string $email,
        string $tempPassword,
        string $expires,
        string $kind
    ): void {
        $isFinance = $kind === 'finance';
        $roleLabel = $isFinance ? 'finance admin' : 'admin';
        $safeName = htmlspecialchars($name);
        $safePass = htmlspecialchars($tempPassword);
        $safeExp = htmlspecialchars(self::formatStoredAsSast($expires));
        $extra = $isFinance
            ? '<p>You will see reseller / centre bank details only after a Super Admin has approved a withdrawal. You then mark the payout Paid after the EFT.</p>'
            : '<p>You can approve withdrawals. Bank account numbers are not shown to you — Finance sees those after you approve.</p>';
        self::sendApp(
            $email,
            'You have been added as a Village NetAcad ' . $roleLabel,
            "<h2>Hello {$safeName}</h2>
            <p>You have been added as a <strong>{$roleLabel}</strong> on Village NetAcad.</p>
            <p><strong>Sign-in email:</strong> " . htmlspecialchars($email) . "</p>
            <p><strong>Temporary password:</strong> <code style=\"font-size:1.15em\">{$safePass}</code></p>
            <p>This temporary password is valid for <strong>72 hours</strong> (until {$safeExp}). After you sign in, you must create your own password once.</p>
            {$extra}
            <p>Open the Village NetAcad app and sign in with this email and the temporary password.</p>
            <p>If you did not expect this, write to <a href=\"mailto:info@villagenetacad.co.za\">info@villagenetacad.co.za</a>.</p>
            <p>— Village NetAcad · Powered by Digititan</p>"
        );
    }

    public static function adminInvited(string $name, string $email, string $tempPassword, string $expires): void
    {
        self::staffInvited($name, $email, $tempPassword, $expires, 'admin');
    }

    public static function role(): string
    {
        return strtolower(trim((string) (Auth::$user['role'] ?? '')));
    }

    public static function isFinance(): bool
    {
        $r = self::role();
        return $r === 'finance' || $r === 'finance_admin';
    }

    public static function isApprover(): bool
    {
        $r = self::role();
        return in_array($r, ['admin', 'super_admin', 'ops_admin'], true);
    }

    public static function requireStaff(): void
    {
        Auth::authenticate();
        $r = self::role();
        if (!in_array($r, ['admin', 'super_admin', 'finance', 'finance_admin', 'ops_admin'], true)) {
            Response::error('Access denied', 403);
        }
    }

    public static function requireApprover(): void
    {
        self::requireStaff();
        if (!self::isApprover()) {
            Response::error('Only Super Admin can approve withdrawals', 403);
        }
    }

    public static function requireFinance(): void
    {
        self::requireStaff();
        if (!self::isFinance()) {
            Response::error('Only Finance can view bank details and mark Paid', 403);
        }
    }

    public static function notifyFinanceOfApprovedWithdrawal(array $w): void
    {
        $amount = number_format((float) ($w['amount'] ?? 0), 2);
        $name = htmlspecialchars((string) ($w['name'] ?? 'Reseller'));
        $html = "<p>Super Admin approved a withdrawal. Please log in as Finance, confirm the bank details, send the EFT, then tap Paid.</p>"
            . "<p><strong>Reseller:</strong> {$name}</p>"
            . "<p><strong>Amount:</strong> R{$amount}</p>"
            . "<p><strong>Withdrawal ID:</strong> " . htmlspecialchars((string) ($w['id'] ?? '')) . "</p>";
        try {
            $rows = Database::queryAll(
                "SELECT l.email FROM registrations r
                 JOIN logins l ON l.registration_id = r.id
                 WHERE r.role IN ('finance', 'finance_admin') AND COALESCE(r.is_active, 1) = 1"
            );
            foreach ($rows as $row) {
                $to = strtolower(trim((string) ($row['email'] ?? '')));
                if ($to !== '') {
                    self::sendApp($to, 'Withdrawal approved — ready for Finance payout', $html);
                }
            }
        } catch (Throwable $e) {
            error_log('[AccountSecurity] finance notify: ' . $e->getMessage());
        }
    }

    public static function deliveryReviewAsk(array $order): void
    {
        $userId = (int) ($order['user_id'] ?? 0);
        if ($userId < 1) {
            return;
        }
        $user = Database::queryGet(
            'SELECT r.name, l.email FROM registrations r
             JOIN logins l ON l.registration_id = r.id WHERE r.id = ?',
            [$userId]
        );
        if (!$user || empty($user['email'])) {
            return;
        }
        $orderId = (int) ($order['id'] ?? 0);
        $safeName = htmlspecialchars((string) $user['name']);
        self::sendApp(
            (string) $user['email'],
            "How was your order #{$orderId}? Please rate your experience",
            "<h2>Hello {$safeName}</h2>
            <p>Your Village NetAcad order <strong>#{$orderId}</strong> has been delivered.</p>
            <p>Please rate your experience in the Village NetAcad app: <strong>Profile → My orders</strong> → this order → Leave a review (or Edit review if you already wrote one).</p>
            <p>Your feedback helps other customers and our centres.</p>
            <p>— Village NetAcad · Powered by Digititan</p>"
        );
    }

    public static function loginAlert(int $userId, string $name, string $email, string $when): void
    {
        $safeName = htmlspecialchars($name);
        $safeWhen = htmlspecialchars($when);
        self::sendApp(
            $email,
            'New sign-in to your Village NetAcad account',
            "<h2>Hello {$safeName}</h2>
            <p>Someone just signed in to Village NetAcad with your email.</p>
            <p><strong>Time:</strong> {$safeWhen} (South Africa time)</p>
            <p>If this was you, no action is needed.</p>
            <p>If this was <strong>not</strong> you:</p>
            <ul>
              <li>Change your password immediately in the app after you sign in, or</li>
              <li>Contact Digititan / Village NetAcad at <a href=\"mailto:info@villagenetacad.co.za\">info@villagenetacad.co.za</a> so an admin can temporarily deactivate the account or reset the password.</li>
            </ul>
            <p>— Village NetAcad · Powered by Digititan</p>"
        );
        if (class_exists('InAppNotifications')) {
            try {
                InAppNotifications::notify(
                    $userId,
                    'New sign-in',
                    'Someone signed in with your email at ' . $when . '. If this was not you, change your password or contact Digititan / Village NetAcad.',
                    'warning'
                );
            } catch (Throwable $e) {
                error_log('[AccountSecurity] in-app login alert: ' . $e->getMessage());
            }
        }
    }

    public static function passwordResetByAdmin(string $name, string $email, string $tempPassword, string $expires): void
    {
        $safeName = htmlspecialchars($name);
        $safePass = htmlspecialchars($tempPassword);
        $safeExp = htmlspecialchars(self::formatStoredAsSast($expires));
        self::sendApp(
            $email,
            'Your Village NetAcad password was reset',
            "<h2>Hello {$safeName}</h2>
            <p>An admin reset your Village NetAcad password.</p>
            <p><strong>Temporary password:</strong> <code style=\"font-size:1.15em\">{$safePass}</code></p>
            <p>Valid for <strong>72 hours</strong> (until {$safeExp}). Sign in, then create a new password (once).</p>
            <p>If you did not ask for this, contact <a href=\"mailto:info@villagenetacad.co.za\">info@villagenetacad.co.za</a>.</p>
            <p>— Village NetAcad · Powered by Digititan</p>"
        );
    }
}
