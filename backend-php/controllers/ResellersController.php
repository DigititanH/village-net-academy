<?php

class ResellersController
{
    /** Academy share of referred sales (percent of order total). */
    public const ACADEMY_COMMISSION_RATE = 26.00;

    private static function requireApprovedReseller(): void
    {
        $profile = Database::queryGet('SELECT status FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Reseller profile not found', 404);
        }
        if ($profile['status'] === 'pending') {
            Database::queryRun(
                "UPDATE reseller_profiles SET status = 'approved' WHERE user_id = ?",
                [Auth::$user['id']]
            );
            Database::queryRun(
                "UPDATE registrations SET is_approved = 'approved' WHERE id = ?",
                [Auth::$user['id']]
            );
            return;
        }
        if (in_array($profile['status'], ['rejected', 'suspended'], true)) {
            Response::error('Reseller account is not active', 403);
        }
    }

    public static function profile(): void
    {
        Auth::authorize('reseller');
        SchemaEnsure::resellerProfiles();
        $row = Database::queryGet(
            'SELECT rp.*, r.name, l.email, r.is_approved FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id WHERE rp.user_id = ?',
            [Auth::$user['id']]
        );
        if (!$row) {
            Response::error('Reseller profile not found', 404);
        }

        if ($row['status'] === 'pending') {
            Database::queryRun("UPDATE reseller_profiles SET status = 'approved' WHERE user_id = ?", [Auth::$user['id']]);
            Database::queryRun("UPDATE registrations SET is_approved = 'approved' WHERE id = ?", [Auth::$user['id']]);
            $row['status'] = 'approved';
            $row['is_approved'] = 'approved';
        }

        $row['bank'] = self::decodeBank($row['bank_details'] ?? null);
        Response::json($row);
    }

    /** @return array<string, string> */
    private static function decodeBank(mixed $raw): array
    {
        if (is_array($raw)) {
            $data = $raw;
        } else {
            $decoded = json_decode((string) ($raw ?? ''), true);
            $data = is_array($decoded) ? $decoded : [];
        }
        return [
            'account_name' => trim((string) ($data['account_name'] ?? '')),
            'bank_name' => trim((string) ($data['bank_name'] ?? '')),
            'account_number' => trim((string) ($data['account_number'] ?? '')),
            'branch_code' => trim((string) ($data['branch_code'] ?? '')),
            'account_type' => trim((string) ($data['account_type'] ?? 'Cheque')) ?: 'Cheque',
        ];
    }

    /** @return array{account_name:string,bank_name:string,account_number:string,branch_code:string,account_type:string}|null */
    private static function normalizeBankInput(array $bankDetails): ?array
    {
        $accountName = trim((string) ($bankDetails['account_name'] ?? ''));
        $bankName = trim((string) ($bankDetails['bank_name'] ?? ''));
        $accountNumber = trim((string) ($bankDetails['account_number'] ?? ''));
        $branchCode = trim((string) ($bankDetails['branch_code'] ?? ''));
        $accountType = trim((string) ($bankDetails['account_type'] ?? 'Cheque'));
        if ($accountName === '' || $bankName === '' || $accountNumber === '' || $branchCode === '') {
            return null;
        }
        return [
            'account_name' => $accountName,
            'bank_name' => $bankName,
            'account_number' => $accountNumber,
            'branch_code' => $branchCode,
            'account_type' => $accountType !== '' ? $accountType : 'Cheque',
        ];
    }

    public static function updateBanking(): void
    {
        Auth::authorize('reseller');
        SchemaEnsure::resellerProfiles();

        $profile = Database::queryGet('SELECT * FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Reseller profile not found', 404);
        }

        $body = array_merge($_POST, Request::jsonBody());
        $bankPayload = self::normalizeBankInput([
            'account_name' => $body['account_name'] ?? '',
            'bank_name' => $body['bank_name'] ?? '',
            'account_number' => $body['account_number'] ?? '',
            'branch_code' => $body['branch_code'] ?? '',
            'account_type' => $body['account_type'] ?? 'Cheque',
        ]);
        if (!$bankPayload) {
            Response::error('Please complete all banking details', 400);
        }

        $idDoc = Request::handleDocumentUpload($_FILES['id_document'] ?? null);
        $proofDoc = Request::handleDocumentUpload($_FILES['proof_of_account'] ?? null);

        $idUrl = $idDoc ?: ($profile['id_document_url'] ?? null);
        $proofUrl = $proofDoc ?: ($profile['proof_of_account_url'] ?? null);

        Database::queryRun(
            'UPDATE reseller_profiles SET bank_details = ?, id_document_url = ?, proof_of_account_url = ?, updated_at = NOW() WHERE id = ?',
            [json_encode($bankPayload), $idUrl, $proofUrl, $profile['id']]
        );

        $row = Database::queryGet(
            'SELECT rp.*, r.name, l.email, r.is_approved FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id WHERE rp.id = ?',
            [$profile['id']]
        );
        $row['bank'] = self::decodeBank($row['bank_details'] ?? null);
        Response::json(['message' => 'Banking details saved', 'profile' => $row]);
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
            'SELECT o.id, o.total, o.status, o.created_at, r.name as customer_name,
                    c.amount as commission, rp.commission_rate
             FROM commissions c
             JOIN orders o ON c.order_id = o.id
             JOIN registrations r ON o.user_id = r.id
             JOIN reseller_profiles rp ON rp.id = c.reseller_id
             WHERE c.reseller_id = ? ORDER BY o.created_at DESC',
            [$profile['id']]
        ));
    }

    public static function withdraw(): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        SchemaEnsure::resellerProfiles();
        $body = Request::jsonBody();
        $amount = (float) ($body['amount'] ?? 0);
        $bankDetails = $body['bank_details'] ?? [];
        if (!is_array($bankDetails)) {
            $bankDetails = [];
        }

        if ($amount < 100) {
            Response::error('Minimum withdrawal amount is R100', 400);
        }

        $profile = Database::queryGet('SELECT * FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Profile not found', 404);
        }
        if ($amount > (float) $profile['wallet_balance']) {
            Response::error('Insufficient balance', 400);
        }

        $bankPayload = self::normalizeBankInput($bankDetails);
        if (!$bankPayload) {
            $bankPayload = self::normalizeBankInput(self::decodeBank($profile['bank_details'] ?? null));
        }
        if (!$bankPayload) {
            Response::error('Please save your banking details before withdrawing', 400);
        }

        Database::queryRun(
            'INSERT INTO withdrawals (reseller_id, amount, bank_details) VALUES (?, ?, ?)',
            [$profile['id'], $amount, json_encode($bankPayload)]
        );
        Database::queryRun(
            'UPDATE reseller_profiles SET wallet_balance = wallet_balance - ?, bank_details = ?, updated_at = NOW() WHERE id = ?',
            [$amount, json_encode($bankPayload), $profile['id']]
        );

        Mailer::send([
            'to' => Site::email(),
            'replyTo' => Auth::$user['email'],
            'subject' => "Withdrawal request: R$amount from " . Auth::$user['name'],
            'html' => '<p><strong>Reseller:</strong> ' . htmlspecialchars(Auth::$user['name']) . ' (' . htmlspecialchars(Auth::$user['email']) . ')</p>
                <p><strong>Amount:</strong> R' . number_format($amount, 2) . '</p>
                <p><strong>Bank details:</strong><br><pre>' . htmlspecialchars(json_encode($bankPayload, JSON_PRETTY_PRINT)) . '</pre></p>
                <p><strong>ID document:</strong> ' . htmlspecialchars((string) ($profile['id_document_url'] ?? '—')) . '</p>
                <p><strong>Proof of account:</strong> ' . htmlspecialchars((string) ($profile['proof_of_account_url'] ?? '—')) . '</p>',
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
        SchemaEnsure::resellerProfiles();
        $rows = Database::queryAll(
            'SELECT rp.*, r.name, l.email FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id ORDER BY rp.created_at DESC'
        );
        foreach ($rows as &$row) {
            $row['bank'] = self::decodeBank($row['bank_details'] ?? null);
        }
        unset($row);
        Response::json($rows);
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

    /** Per-academy amounts due at ACADEMY_COMMISSION_RATE of linked reseller sales. */
    public static function adminAcademyEarnings(): void
    {
        Auth::authorize('admin');
        $rate = self::ACADEMY_COMMISSION_RATE;
        $rows = Database::queryAll(
            "SELECT
                TRIM(rp.academy) AS academy,
                COUNT(DISTINCT rp.id) AS reseller_count,
                COALESCE(SUM(o.total), 0) AS sales_total,
                COALESCE(SUM(c.amount), 0) AS reseller_commission_total
             FROM reseller_profiles rp
             LEFT JOIN commissions c ON c.reseller_id = rp.id
             LEFT JOIN orders o ON o.id = c.order_id
             WHERE rp.academy IS NOT NULL AND TRIM(rp.academy) != ''
             GROUP BY TRIM(rp.academy)
             ORDER BY sales_total DESC, academy ASC"
        );

        $out = array_map(static function (array $row) use ($rate): array {
            $sales = (float) ($row['sales_total'] ?? 0);
            $row['academy_rate'] = $rate;
            $row['academy_due'] = round($sales * ($rate / 100), 2);
            $row['sales_total'] = round($sales, 2);
            $row['reseller_commission_total'] = round((float) ($row['reseller_commission_total'] ?? 0), 2);
            $row['reseller_count'] = (int) ($row['reseller_count'] ?? 0);
            return $row;
        }, $rows);

        Response::json($out);
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
