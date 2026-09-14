<?php

class ResellersController
{
    /** Centre / academy share of referred sales (percent of order total). */
    public const ACADEMY_COMMISSION_RATE = Commission::ACADEMY_RATE;

    /** Matches existing withdraw minimum (R100). */
    private const MIN_WITHDRAWAL_ZAR = 100.0;

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

    /** True when office UAT may withdraw on a non–last day. */
    private static function allowWithdrawUat(): bool
    {
        if (!class_exists('Env')) {
            return false;
        }
        $flag = strtolower(trim((string) (Env::get('ALLOW_WITHDRAW_UAT') ?? '')));
        return in_array($flag, ['1', 'true', 'yes'], true);
    }

    private static function ensureResellerClientsTable(): void
    {
        if (class_exists('SchemaEnsure') && method_exists('SchemaEnsure', 'resellerClients')) {
            SchemaEnsure::resellerClients();
        }
    }

    /**
     * Public legitimacy check — no auth, no wallet/bank/email secrets.
     * GET /api/resellers/verify/{code}
     */
    public static function verify(array $params): void
    {
        $code = strtoupper(trim((string) ($params['code'] ?? '')));
        if ($code === '') {
            Response::error('Reseller code is required', 400);
        }

        $row = Database::queryGet(
            'SELECT rp.referral_code, rp.status, rp.academy, r.name
             FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             WHERE UPPER(rp.referral_code) = ?',
            [$code]
        );
        if (!$row) {
            Response::error('Code not found or inactive', 404);
        }

        $approved = ($row['status'] ?? '') === 'approved';
        Response::json([
            'code' => $row['referral_code'],
            'name' => $row['name'],
            'academy' => $row['academy'],
            'status' => $row['status'],
            'approved' => $approved,
            'active' => $approved,
        ]);
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
        $accountName = trim((string) ($data['account_name'] ?? $data['account_holder'] ?? ''));
        return [
            'account_name' => $accountName,
            'account_holder' => $accountName,
            'bank_name' => trim((string) ($data['bank_name'] ?? '')),
            'account_number' => trim((string) ($data['account_number'] ?? '')),
            'branch_code' => trim((string) ($data['branch_code'] ?? '')),
            'account_type' => trim((string) ($data['account_type'] ?? 'Cheque')) ?: 'Cheque',
        ];
    }

    /** @return array{account_name:string,bank_name:string,account_number:string,branch_code:string,account_type:string}|null */
    private static function normalizeBankInput(array $bankDetails): ?array
    {
        $accountName = trim((string) (
            $bankDetails['account_name']
            ?? $bankDetails['account_holder']
            ?? $bankDetails['accountName']
            ?? $bankDetails['accountHolder']
            ?? ''
        ));
        $bankName = trim((string) ($bankDetails['bank_name'] ?? $bankDetails['bankName'] ?? ''));
        $accountNumber = preg_replace(
            '/\s+/',
            '',
            (string) ($bankDetails['account_number'] ?? $bankDetails['accountNumber'] ?? '')
        ) ?? '';
        $branchCode = preg_replace(
            '/\s+/',
            '',
            (string) ($bankDetails['branch_code'] ?? $bankDetails['branchCode'] ?? '')
        ) ?? '';
        $accountType = trim((string) ($bankDetails['account_type'] ?? $bankDetails['accountType'] ?? 'Cheque'));
        if ($accountName === '' || $bankName === '' || $accountNumber === '' || $branchCode === '') {
            return null;
        }
        return [
            'account_name' => $accountName,
            'account_holder' => $accountName,
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
            'account_name' => $body['account_name'] ?? $body['account_holder'] ?? '',
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

    /**
     * Month-end earnings statement from live commissions.
     * GET /api/resellers/statement?month=YYYY-MM (defaults to current UTC month)
     */
    public static function statement(): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        SchemaEnsure::resellerProfiles();
        $profile = Database::queryGet(
            'SELECT id, referral_code, commission_rate, academy, wallet_balance, total_earned
             FROM reseller_profiles WHERE user_id = ?',
            [Auth::$user['id']]
        );
        if (!$profile) {
            Response::error('Profile not found', 404);
        }

        $month = trim((string) (Request::query('month') ?? ''));
        if ($month === '' || !preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = gmdate('Y-m');
        }
        $start = $month . '-01 00:00:00';
        $end = gmdate('Y-m-d H:i:s', strtotime($start . ' +1 month'));

        $lines = [];
        try {
            $lines = Database::queryAll(
                "SELECT c.id, c.amount, c.party, c.share_percent, c.created_at,
                        o.id AS order_id, o.total AS order_total, o.created_at AS order_date,
                        r.name AS customer_name
                 FROM commissions c
                 JOIN orders o ON o.id = c.order_id
                 JOIN registrations r ON r.id = o.user_id
                 WHERE c.reseller_id = ?
                   AND c.created_at >= ? AND c.created_at < ?
                 ORDER BY c.created_at DESC",
                [$profile['id'], $start, $end]
            );
        } catch (Throwable $e) {
            $lines = Database::queryAll(
                "SELECT c.id, c.amount, c.created_at,
                        o.id AS order_id, o.total AS order_total, o.created_at AS order_date,
                        r.name AS customer_name
                 FROM commissions c
                 JOIN orders o ON o.id = c.order_id
                 JOIN registrations r ON r.id = o.user_id
                 WHERE c.reseller_id = ?
                   AND c.created_at >= ? AND c.created_at < ?
                 ORDER BY c.created_at DESC",
                [$profile['id'], $start, $end]
            );
            foreach ($lines as &$line) {
                $line['party'] = 'seller';
                $line['share_percent'] = null;
            }
            unset($line);
        }

        $sellerEarned = 0.0;
        $centreEarned = 0.0;
        $digititanDue = 0.0;
        $orderTotal = 0.0;
        $seenOrders = [];
        foreach ($lines as $line) {
            $party = (string) ($line['party'] ?? 'seller');
            $amt = (float) $line['amount'];
            if ($party === 'digititan') {
                $digititanDue += $amt;
            } elseif ($party === 'centre') {
                $centreEarned += $amt;
            } else {
                $sellerEarned += $amt;
            }
            $oid = (string) ($line['order_id'] ?? '');
            if ($oid !== '' && !isset($seenOrders[$oid])) {
                $seenOrders[$oid] = true;
                $orderTotal += (float) ($line['order_total'] ?? 0);
            }
        }

        if ($digititanDue <= 0 && $orderTotal > 0) {
            $walletLines = $sellerEarned + $centreEarned;
            $digititanDue = max(0, round($orderTotal - $walletLines, 2));
        }

        $ref = strtoupper(trim((string) $profile['referral_code']));
        $isCentre = strpos($ref, 'VNA-C-') === 0;
        $affiliated = !$isCentre && trim((string) ($profile['academy'] ?? '')) !== '';

        Response::json([
            'month' => $month,
            'referral_code' => $profile['referral_code'],
            'commission_rate' => (float) $profile['commission_rate'],
            'academy' => $profile['academy'],
            'is_centre' => $isCentre,
            'affiliated' => $affiliated,
            'wallet_balance' => (float) $profile['wallet_balance'],
            'total_earned' => (float) $profile['total_earned'],
            'period' => [
                'orders_total' => round($orderTotal, 2),
                'seller_earned' => round($sellerEarned, 2),
                'centre_earned' => round($centreEarned, 2),
                'digititan_due' => round($digititanDue, 2),
                'line_count' => count($lines),
            ],
            'lines' => $lines,
            'withdraw_rules' => [
                'min_zar' => self::MIN_WITHDRAWAL_ZAR,
                'last_calendar_day_only' => true,
            ],
        ]);
    }

    public static function clients(): void
    {
        Auth::authorize('reseller');
        SchemaEnsure::resellerProfiles();
        self::ensureResellerClientsTable();
        $profile = Database::queryGet(
            'SELECT id, status FROM reseller_profiles WHERE user_id = ?',
            [Auth::$user['id']]
        );
        if (!$profile) {
            Response::error('Profile not found', 404);
        }
        // Pending / rejected: empty list so the app shell can still open.
        if (($profile['status'] ?? '') !== 'approved') {
            Response::json([]);
            return;
        }
        try {
            Response::json(Database::queryAll(
                'SELECT * FROM reseller_clients WHERE reseller_id = ? ORDER BY updated_at DESC',
                [$profile['id']]
            ));
        } catch (Throwable $e) {
            Response::json([]);
        }
    }

    public static function addClient(): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        SchemaEnsure::resellerProfiles();
        self::ensureResellerClientsTable();
        $profile = Database::queryGet('SELECT id FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Profile not found', 404);
        }

        $body = Request::jsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $interest = trim((string) ($body['product_interest'] ?? $body['productInterest'] ?? ''));
        $status = self::normalizeClientStatus($body['status'] ?? 'pending');

        if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Name and valid email are required', 400);
        }

        try {
            $result = Database::queryRun(
                'INSERT INTO reseller_clients (reseller_id, name, email, product_interest, status)
                 VALUES (?, ?, ?, ?, ?)',
                [$profile['id'], $name, $email, $interest !== '' ? $interest : null, $status]
            );
        } catch (Throwable $e) {
            Response::error('Clients table missing or schema mismatch. Contact Digititan support.', 500);
        }
        $row = Database::queryGet('SELECT * FROM reseller_clients WHERE id = ?', [$result['lastInsertRowid']]);
        Response::json($row, 201);
    }

    public static function updateClient(array $params): void
    {
        Auth::authorize('reseller');
        self::requireApprovedReseller();
        SchemaEnsure::resellerProfiles();
        self::ensureResellerClientsTable();
        $profile = Database::queryGet('SELECT id FROM reseller_profiles WHERE user_id = ?', [Auth::$user['id']]);
        if (!$profile) {
            Response::error('Profile not found', 404);
        }

        $clientId = (int) ($params['id'] ?? 0);
        try {
            $row = Database::queryGet(
                'SELECT * FROM reseller_clients WHERE id = ? AND reseller_id = ?',
                [$clientId, $profile['id']]
            );
        } catch (Throwable $e) {
            Response::error('Clients table missing or schema mismatch. Contact Digititan support.', 500);
        }
        if (!$row) {
            Response::error('Client not found', 404);
        }

        $body = Request::jsonBody();
        $status = self::normalizeClientStatus($body['status'] ?? $row['status']);
        Database::queryRun(
            'UPDATE reseller_clients SET status = ?, updated_at = NOW() WHERE id = ?',
            [$status, $clientId]
        );
        Response::json(Database::queryGet('SELECT * FROM reseller_clients WHERE id = ?', [$clientId]));
    }

    private static function normalizeClientStatus(mixed $raw): string
    {
        $s = strtolower(trim((string) $raw));
        $map = [
            'pending' => 'pending',
            'confirmed' => 'confirmed',
            'bought' => 'bought',
            'did_not_buy' => 'did_not_buy',
            'didnotbuy' => 'did_not_buy',
            'did-not-buy' => 'did_not_buy',
        ];
        if (!isset($map[$s])) {
            Response::error('Invalid client status', 400);
        }
        return $map[$s];
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

        if ($amount <= 0) {
            Response::error('Invalid withdrawal amount', 400);
        }
        if ($amount < self::MIN_WITHDRAWAL_ZAR) {
            Response::error('Minimum withdrawal amount is R100', 400);
        }

        // Production: last calendar day (SA). Office UAT: ALLOW_WITHDRAW_UAT=1 in .env
        $tz = new DateTimeZone('Africa/Johannesburg');
        $now = new DateTime('now', $tz);
        $lastDay = (int) $now->format('t');
        if ((int) $now->format('j') !== $lastDay && !self::allowWithdrawUat()) {
            Response::error(
                'Withdrawals are only allowed on the last calendar day of the month (South Africa).',
                400
            );
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
            $row = array_merge($row, Commission::resellerAffiliationInfo($row['academy'] ?? null));
        }
        unset($row);
        Response::json($rows);
    }

    public static function adminStatus(array $params): void
    {
        Auth::authorize('admin');
        SchemaEnsure::registrations();
        SchemaEnsure::resellerProfiles();
        $body = Request::jsonBody();
        $status = $body['status'] ?? '';
        if (!in_array($status, ['approved', 'rejected', 'suspended'], true)) {
            Response::error('Invalid status', 400);
        }

        Database::queryRun('UPDATE reseller_profiles SET status = ? WHERE id = ?', [$status, $params['id']]);
        $profile = Database::queryGet('SELECT user_id FROM reseller_profiles WHERE id = ?', [$params['id']]);
        $approvalEmailSent = null;
        if ($profile) {
            $userStatus = $status === 'approved' ? 'approved' : 'declined';
            Database::queryRun('UPDATE registrations SET is_approved = ? WHERE id = ?', [$userStatus, $profile['user_id']]);

            if ($status === 'approved') {
                $user = null;
                try {
                    $user = Database::queryGet(
                        'SELECT r.name, r.is_verified, r.signup_client, l.email
                         FROM registrations r
                         JOIN logins l ON l.registration_id = r.id
                         WHERE r.id = ?',
                        [$profile['user_id']]
                    );
                } catch (Throwable $e) {
                    $user = Database::queryGet(
                        'SELECT r.name, r.is_verified, l.email
                         FROM registrations r
                         JOIN logins l ON l.registration_id = r.id
                         WHERE r.id = ?',
                        [$profile['user_id']]
                    );
                }
                if ($user && !empty($user['email']) && AuthController::isMobileSignupClient($user['signup_client'] ?? null)) {
                    $approvalEmailSent = AuthController::sendResellerApprovedForAppEmail(
                        (string) $user['email'],
                        (string) ($user['name'] ?? ''),
                        !empty($user['is_verified'])
                    );
                    if (empty($user['is_verified'])) {
                        AuthController::issueVerificationEmail(
                            (int) $profile['user_id'],
                            (string) $user['email'],
                            (string) ($user['name'] ?? ''),
                            true
                        );
                    }
                }
            }
        }
        Response::json([
            'message' => "Reseller $status",
            'approval_email_sent' => $approvalEmailSent,
        ]);
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
