<?php

class ResellersController
{
    private static function requireApprovedReseller(): void
    {
        $profile = Database::queryGet('SELECT status FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Reseller profile not found', 404);
        }
        if ($profile['status'] !== 'approved') {
            Response::error('Reseller account is pending admin approval', 403);
        }
    }

    public static function profile(): void
    {
        Auth::authorize('reseller');
        $row = Database::queryGet(
            'SELECT rp.*, r.name, l.email, r.is_approved FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id WHERE rp.user_id = ?',
            [Auth::$user['id']]
        );
        if (!$row) {
            Response::error('Reseller profile not found', 404);
        }

        if ($row['is_approved'] === 'approved' && $row['status'] === 'pending') {
            Database::queryRun("UPDATE reseller_profiles SET status = 'approved' WHERE user_id = ?", [Auth::$user['id']]);
            $row['status'] = 'approved';
        }
        if ($row['is_approved'] === 'declined' && $row['status'] === 'pending') {
            Database::queryRun("UPDATE reseller_profiles SET status = 'rejected' WHERE user_id = ?", [Auth::$user['id']]);
            $row['status'] = 'rejected';
        }

        Response::json($row);
    }

    public static function commissions(): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        $profile = Database::queryGet('SELECT id FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Profile not found', 404);
        }
        Response::json(Database::queryAll(
            'SELECT c.*, o.total as order_total, o.created_at as order_date FROM commissions c
             JOIN orders o ON c.order_id = o.id WHERE c.reseller_id = ? ORDER BY c.created_at DESC',
            [$profile['id']]
        ));
    }

    public static function sales(): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        $profile = Database::queryGet('SELECT id FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Profile not found', 404);
        }
        Response::json(Database::queryAll(
            'SELECT o.id, o.total, o.status, o.created_at, r.name as customer_name FROM commissions c
             JOIN orders o ON c.order_id = o.id JOIN registrations r ON o.user_id = r.id
             WHERE c.reseller_id = ? ORDER BY o.created_at DESC',
            [$profile['id']]
        ));
    }

    public static function withdraw(): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        $body = Request::jsonBody();
        $amount = (float) ($body['amount'] ?? 0);
        $bankDetails = $body['bank_details'] ?? [];

        $profile = Database::queryGet('SELECT id, wallet_balance FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Profile not found', 404);
        }
        if ($amount > (float) $profile['wallet_balance']) {
            Response::error('Insufficient balance', 400);
        }

        Database::queryRun(
            'INSERT INTO withdrawals (reseller_id, amount, bank_details) VALUES (?, ?, ?)',
            [$profile['id'], $amount, json_encode($bankDetails)]
        );
        Database::queryRun(
            'UPDATE reseller_profiles SET wallet_balance = wallet_balance - ? WHERE id = ?',
            [$amount, $profile['id']]
        );

        Mailer::send([
            'to' => Site::email(),
            'replyTo' => Auth::$user['email'],
            'subject' => "Withdrawal request: R$amount from " . Auth::$user['name'],
            'html' => '<p><strong>Reseller:</strong> ' . htmlspecialchars(Auth::$user['name']) . ' (' . htmlspecialchars(Auth::$user['email']) . ')</p>
                <p><strong>Amount:</strong> R' . $amount . '</p>
                <p><strong>Bank details:</strong><br><pre>' . htmlspecialchars(json_encode($bankDetails, JSON_PRETTY_PRINT)) . '</pre></p>',
        ]);

        Response::json(['message' => 'Withdrawal request submitted'], 201);
    }

    public static function withdrawals(): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        $profile = Database::queryGet('SELECT id FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Profile not found', 404);
        }
        Response::json(Database::queryAll(
            'SELECT * FROM withdrawals WHERE reseller_id = ? ORDER BY created_at DESC',
            [$profile['id']]
        ));
    }

    public static function adminAll(): void
    {
        Auth::authorize('admin');
        Response::json(Database::queryAll(
            'SELECT rp.*, r.name, l.email FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id ORDER BY rp.created_at DESC'
        ));
    }

    public static function adminStatus(array $params): void
    {
        Auth::authorize('admin');
        $body = Request::jsonBody();
        $status = $body['status'] ?? '';
        if (!in_array($status, ['approved', 'rejected', 'suspended'], true)) {
            Response::error('Invalid status', 400);
        }

        Database::queryRun('UPDATE reseller_profiles SET status = ? WHERE id = ?', [$status, $params['id']]);
        $profile = Database::queryGet('SELECT user_id FROM reseller_profiles WHERE id = ?', [$params['id']]);
        if ($profile) {
            $userStatus = $status === 'approved' ? 'approved' : 'declined';
            Database::queryRun('UPDATE registrations SET is_approved = ? WHERE id = ?', [$userStatus, $profile['user_id']]);
        }
        Response::json(['message' => "Reseller $status"]);
    }

    public static function adminWithdrawals(): void
    {
        Auth::authorize('admin');
        Response::json(Database::queryAll(
            'SELECT w.*, rp.referral_code, r.name, l.email FROM withdrawals w
             JOIN reseller_profiles rp ON w.reseller_id = rp.id
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id ORDER BY w.created_at DESC'
        ));
    }

    public static function adminWithdrawalUpdate(array $params): void
    {
        Auth::authorize('admin');
        $body = Request::jsonBody();
        $status = $body['status'] ?? '';
        if (!in_array($status, ['approved', 'rejected', 'completed'], true)) {
            Response::error('Invalid status', 400);
        }

        if ($status === 'rejected') {
            $w = Database::queryGet('SELECT reseller_id, amount FROM withdrawals WHERE id = ?', [$params['id']]);
            if ($w) {
                Database::queryRun(
                    'UPDATE reseller_profiles SET wallet_balance = wallet_balance + ? WHERE id = ?',
                    [$w['amount'], $w['reseller_id']]
                );
            }
        }

        Database::queryRun(
            "UPDATE withdrawals SET status = ?, processed_at = NOW() WHERE id = ?",
            [$status, $params['id']]
        );
        Response::json(['message' => "Withdrawal $status"]);
    }
}
