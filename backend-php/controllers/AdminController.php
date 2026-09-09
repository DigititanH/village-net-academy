<?php

class AdminController
{
    private static function toCsv(array $rows, array $fields): string
    {
        $out = fopen('php://temp', 'r+');
        fputcsv($out, $fields);
        foreach ($rows as $row) {
            $line = [];
            foreach ($fields as $f) {
                $line[] = $row[$f] ?? '';
            }
            fputcsv($out, $line);
        }
        rewind($out);
        $csv = stream_get_contents($out);
        fclose($out);
        return $csv ?: '';
    }

    public static function dashboard(): void
    {
        Auth::authorize('admin');
        $users = Database::queryAll('SELECT role, COUNT(*) as count FROM registrations GROUP BY role');
        $totalUsers = Database::queryGet('SELECT COUNT(*) as total FROM registrations');
        $orders = Database::queryGet('SELECT COUNT(*) as total, COALESCE(SUM(total),0) as revenue FROM orders');
        $pendingOrders = Database::queryGet("SELECT COUNT(*) as total FROM orders WHERE status = 'pending'");
        $products = Database::queryGet('SELECT COUNT(*) as total FROM products');
        $pendingResellers = Database::queryGet(
            "SELECT COUNT(*) as total FROM reseller_profiles WHERE status = 'pending'"
        );

        Response::json([
            'stats' => [
                'total_users' => (int) ($totalUsers['total'] ?? 0),
                'users_by_role' => $users,
                'total_orders' => (int) ($orders['total'] ?? 0),
                'total_revenue' => (float) ($orders['revenue'] ?? 0),
                'pending_orders' => (int) ($pendingOrders['total'] ?? 0),
                'total_products' => (int) ($products['total'] ?? 0),
                'pending_resellers' => (int) ($pendingResellers['total'] ?? 0),
            ],
            'monthly_sales' => Database::queryAll(
                "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as revenue, COUNT(*) as orders
                 FROM orders GROUP BY month ORDER BY month DESC LIMIT 12"
            ),
            'recent_orders' => Database::queryAll(
                'SELECT o.id, o.total, o.status, o.created_at, r.name FROM orders o
                 JOIN registrations r ON o.user_id = r.id ORDER BY o.created_at DESC LIMIT 10'
            ),
            'top_products' => Database::queryAll(
                'SELECT p.name, SUM(oi.quantity) as sold, SUM(oi.quantity * oi.price) as revenue
                 FROM order_items oi JOIN products p ON oi.product_id = p.id
                 GROUP BY p.id ORDER BY sold DESC LIMIT 5'
            ),
        ]);
    }

    public static function users(): void
    {
        Auth::authorize('admin');
        $role = Request::query('role');
        $search = Request::query('search');
        $page = max(1, (int) Request::query('page', 1));
        $limit = max(1, (int) Request::query('limit', 20));

        $sql = 'SELECT r.id, r.name, l.email, r.role, r.avatar, r.phone, r.is_verified, r.is_approved, r.created_at
                FROM registrations r
                JOIN logins l ON l.registration_id = r.id WHERE 1=1';
        $params = [];
        if ($role) {
            $sql .= ' AND r.role = ?';
            $params[] = $role;
        }
        if ($search) {
            $sql .= ' AND (r.name LIKE ? OR l.email LIKE ?)';
            $term = '%' . $search . '%';
            $params[] = $term;
            $params[] = $term;
        }
        $sql .= ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = ($page - 1) * $limit;

        $users = Database::queryAll($sql, $params);
        $count = Database::queryGet('SELECT COUNT(*) as total FROM registrations');
        Response::json(['users' => $users, 'total' => (int) ($count['total'] ?? 0)]);
    }

    public static function userRole(array $params): void
    {
        Auth::authorize('admin');
        $body = Request::jsonBody();
        $role = $body['role'] ?? '';
        if (!in_array($role, ['admin', 'super_admin', 'reseller', 'customer'], true)) {
            Response::error('Invalid role', 400);
        }
        Database::queryRun('UPDATE registrations SET role = ? WHERE id = ?', [$role, $params['id']]);
        Response::json(['message' => 'User role updated']);
    }

    public static function userApprove(array $params): void
    {
        Auth::authorize('admin');
        $body = Request::jsonBody();
        $status = $body['status'] ?? '';
        if (!in_array($status, ['approved', 'declined'], true)) {
            Response::error("Status must be 'approved' or 'declined'", 400);
        }
        Database::queryRun('UPDATE registrations SET is_approved = ? WHERE id = ?', [$status, $params['id']]);

        $user = Database::queryGet('SELECT role FROM registrations WHERE id = ?', [$params['id']]);
        if ($user && $user['role'] === 'reseller') {
            $profileStatus = $status === 'approved' ? 'approved' : 'rejected';
            Database::queryRun('UPDATE reseller_profiles SET status = ? WHERE user_id = ?', [$profileStatus, $params['id']]);
        }

        Response::json(['message' => "User $status"]);
    }

    public static function userDelete(array $params): void
    {
        Auth::authorize('admin');
        if ((string) $params['id'] === (string) Auth::$user['id']) {
            Response::error('Cannot delete yourself', 400);
        }
        Database::queryRun('DELETE FROM registrations WHERE id = ?', [$params['id']]);
        Response::json(['message' => 'User deleted']);
    }

    public static function contacts(): void
    {
        Auth::authorize('admin');
        Response::json(Database::queryAll('SELECT * FROM contact_messages ORDER BY created_at DESC'));
    }

    public static function sendNotification(): void
    {
        Auth::authorize('admin');
        $body = Request::jsonBody();
        Database::queryRun(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [$body['user_id'], $body['title'], $body['message'], $body['type'] ?? 'info']
        );
        Response::json(['message' => 'Notification sent'], 201);
    }

    public static function createCategory(): void
    {
        Auth::authorize('admin');
        $body = Request::jsonBody();
        $name = $body['name'] ?? '';
        $slug = Request::slugify($name);
        Database::queryRun('INSERT INTO categories (name, slug) VALUES (?, ?)', [$name, $slug]);
        Response::json(['message' => 'Category created'], 201);
    }

    public static function deleteCategory(array $params): void
    {
        Auth::authorize('admin');
        Database::queryRun('DELETE FROM categories WHERE id = ?', [$params['id']]);
        Response::json(['message' => 'Category deleted']);
    }

    public static function salesCsv(): void
    {
        Auth::authorize('admin');
        $orders = Database::queryAll(
            'SELECT o.id, r.name as customer, l.email, o.total, o.status, o.payment_status, o.tracking_number, o.created_at
             FROM orders o
             JOIN registrations r ON o.user_id = r.id
             JOIN logins l ON l.registration_id = r.id
             ORDER BY o.created_at DESC'
        );
        $fields = ['id', 'customer', 'email', 'total', 'status', 'payment_status', 'tracking_number', 'created_at'];
        Response::csv('sales-report.csv', self::toCsv($orders, $fields));
    }

    public static function salesPdf(): void
    {
        Auth::authorize('admin');
        $orders = Database::queryAll(
            'SELECT o.id, r.name as customer, o.total, o.status, o.created_at
             FROM orders o JOIN registrations r ON o.user_id = r.id ORDER BY o.created_at DESC'
        );
        $summary = Database::queryGet('SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders');

        $lines = ["Village NetAcad — Sales Report", 'Generated: ' . date('c'), ''];
        $lines[] = 'Summary';
        $lines[] = 'Total Orders: ' . ($summary['count'] ?? 0);
        $lines[] = 'Total Revenue: R' . number_format((float) ($summary['revenue'] ?? 0), 2);
        $lines[] = '';
        $lines[] = 'Order # | Customer | Amount | Status | Date';
        foreach ($orders as $o) {
            $lines[] = sprintf(
                '%s | %s | R%s | %s | %s',
                $o['id'],
                $o['customer'],
                number_format((float) $o['total'], 2),
                $o['status'],
                $o['created_at']
            );
        }

        Response::textReport('sales-report.txt', implode("\n", $lines));
    }

    public static function donationsCsv(): void
    {
        Auth::authorize('admin');
        $donations = Database::queryAll(
            'SELECT id, donor_name, email, academy, amount, payment_status, is_recurring, message, created_at
             FROM donations ORDER BY created_at DESC'
        );
        $fields = ['id', 'donor_name', 'email', 'academy', 'amount', 'payment_status', 'is_recurring', 'message', 'created_at'];
        Response::csv('donations-report.csv', self::toCsv($donations, $fields));
    }

    public static function donationsPdf(): void
    {
        Auth::authorize('admin');
        $donations = Database::queryAll(
            'SELECT id, donor_name, amount, payment_status, created_at FROM donations ORDER BY created_at DESC'
        );
        $summary = Database::queryGet(
            "SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM donations WHERE payment_status = 'completed'"
        );

        $lines = ["Village NetAcad — Donations Report", 'Generated: ' . date('c'), ''];
        $lines[] = 'Summary';
        $lines[] = 'Total Donations: ' . ($summary['count'] ?? 0);
        $lines[] = 'Total Amount: R' . number_format((float) ($summary['total'] ?? 0), 2);
        $lines[] = '';
        $lines[] = '# | Donor | Amount | Status | Date';
        foreach ($donations as $d) {
            $lines[] = sprintf(
                '%s | %s | R%s | %s | %s',
                $d['id'],
                $d['donor_name'],
                number_format((float) $d['amount'], 2),
                $d['payment_status'],
                $d['created_at']
            );
        }

        Response::textReport('donations-report.txt', implode("\n", $lines));
    }

    public static function resellersCsv(): void
    {
        Auth::authorize('admin');
        SchemaEnsure::resellerProfiles();
        $rows = Database::queryAll(
            'SELECT rp.*, r.name, l.email FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id
             ORDER BY rp.created_at DESC'
        );

        $base = rtrim((string) (Env::get('CLIENT_URL') ?: Env::get('API_URL') ?: ''), '/');
        $export = [];
        foreach ($rows as $r) {
            $bank = [];
            $decoded = json_decode((string) ($r['bank_details'] ?? ''), true);
            if (is_array($decoded)) {
                $bank = $decoded;
            }
            $idDoc = (string) ($r['id_document_url'] ?? '');
            $proof = (string) ($r['proof_of_account_url'] ?? '');
            if ($base !== '' && $idDoc !== '' && str_starts_with($idDoc, '/')) {
                $idDoc = $base . $idDoc;
            }
            if ($base !== '' && $proof !== '' && str_starts_with($proof, '/')) {
                $proof = $base . $proof;
            }
            $export[] = [
                'id' => $r['id'],
                'name' => $r['name'],
                'email' => $r['email'],
                'academy' => $r['academy'] ?? '',
                'referral_code' => $r['referral_code'],
                'status' => $r['status'],
                'wallet_balance' => $r['wallet_balance'],
                'total_earned' => $r['total_earned'],
                'account_name' => $bank['account_name'] ?? '',
                'bank_name' => $bank['bank_name'] ?? '',
                'account_number' => $bank['account_number'] ?? '',
                'branch_code' => $bank['branch_code'] ?? '',
                'account_type' => $bank['account_type'] ?? '',
                'id_document_url' => $idDoc,
                'proof_of_account_url' => $proof,
                'created_at' => $r['created_at'],
            ];
        }

        $fields = [
            'id', 'name', 'email', 'academy', 'referral_code', 'status', 'wallet_balance', 'total_earned',
            'account_name', 'bank_name', 'account_number', 'branch_code', 'account_type',
            'id_document_url', 'proof_of_account_url', 'created_at',
        ];
        Response::csv('resellers-banking-report.csv', self::toCsv($export, $fields));
    }

    public static function resellersPdf(): void
    {
        Auth::authorize('admin');
        SchemaEnsure::resellerProfiles();
        $rows = Database::queryAll(
            'SELECT rp.*, r.name, l.email FROM reseller_profiles rp
             JOIN registrations r ON rp.user_id = r.id
             JOIN logins l ON l.registration_id = r.id
             ORDER BY rp.created_at DESC'
        );

        $base = rtrim((string) (Env::get('CLIENT_URL') ?: Env::get('API_URL') ?: ''), '/');
        $lines = ['Village NetAcad — Reseller Banking Report', 'Generated: ' . date('c'), ''];
        $lines[] = 'Total resellers: ' . count($rows);
        $lines[] = '';

        foreach ($rows as $r) {
            $bank = [];
            $decoded = json_decode((string) ($r['bank_details'] ?? ''), true);
            if (is_array($decoded)) {
                $bank = $decoded;
            }
            $idDoc = (string) ($r['id_document_url'] ?? '—');
            $proof = (string) ($r['proof_of_account_url'] ?? '—');
            if ($base !== '' && $idDoc !== '—' && str_starts_with($idDoc, '/')) {
                $idDoc = $base . $idDoc;
            }
            if ($base !== '' && $proof !== '—' && str_starts_with($proof, '/')) {
                $proof = $base . $proof;
            }

            $lines[] = '--- Reseller #' . $r['id'] . ' ---';
            $lines[] = 'Name: ' . $r['name'];
            $lines[] = 'Email: ' . $r['email'];
            $lines[] = 'Academy: ' . ($r['academy'] ?: '—');
            $lines[] = 'Referral: ' . $r['referral_code'];
            $lines[] = 'Status: ' . $r['status'];
            $lines[] = 'Wallet: R' . number_format((float) $r['wallet_balance'], 2);
            $lines[] = 'Total earned: R' . number_format((float) $r['total_earned'], 2);
            $lines[] = 'Account holder: ' . ($bank['account_name'] ?? '—');
            $lines[] = 'Bank: ' . ($bank['bank_name'] ?? '—');
            $lines[] = 'Account number: ' . ($bank['account_number'] ?? '—');
            $lines[] = 'Branch code: ' . ($bank['branch_code'] ?? '—');
            $lines[] = 'Account type: ' . ($bank['account_type'] ?? '—');
            $lines[] = 'ID document: ' . $idDoc;
            $lines[] = 'Proof of account: ' . $proof;
            $lines[] = '';
        }

        Response::textReport('resellers-banking-report.txt', implode("\n", $lines));
    }
}
