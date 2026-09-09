<?php

class AcademyController
{
    private static function normalizeAcademyName(string $name): string
    {
        $name = strtolower(trim($name));
        $name = preg_replace('/\s+/', ' ', $name) ?? $name;
        return $name;
    }

    /** @return list<array<string, mixed>> */
    private static function loadAscCentres(): array
    {
        $path = Paths::backendRoot() . '/data/asc_centres.json';
        if (!is_file($path)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($path), true);
        return is_array($data) ? $data : [];
    }

    private static function findRegisteredAcademy(string $academyName): ?array
    {
        $needle = self::normalizeAcademyName($academyName);
        if ($needle === '') {
            return null;
        }
        foreach (self::loadAscCentres() as $centre) {
            if (!is_array($centre)) {
                continue;
            }
            $name = self::normalizeAcademyName((string) ($centre['name'] ?? ''));
            if ($name !== '' && $name === $needle) {
                return $centre;
            }
        }
        return null;
    }

    private static function requireAcademyUser(): array
    {
        Auth::authorize('academy');
        $user = Auth::$user;
        $academyName = trim((string) ($user['academy_name'] ?? ''));
        if ($academyName === '') {
            Response::error('No academy is linked to your account', 400);
        }
        return [
            'user' => $user,
            'academy_name' => $academyName,
            'registered' => self::findRegisteredAcademy($academyName),
        ];
    }

    public static function overview(): void
    {
        $ctx = self::requireAcademyUser();
        $academyName = $ctx['academy_name'];
        $registered = $ctx['registered'];

        if (!$registered) {
            Response::json([
                'academy_name' => $academyName,
                'academy_registered' => false,
                'message' => 'Your academy is not registered on the system yet. Once an admin adds it under Map academies (with the same name), you can view reseller sales.',
                'reseller_count' => 0,
                'sales_total' => 0,
                'academy_share' => 0,
                'academy_rate' => ResellersController::ACADEMY_COMMISSION_RATE,
                'resellers' => [],
            ]);
        }

        $rate = ResellersController::ACADEMY_COMMISSION_RATE;
        $summary = Database::queryGet(
            "SELECT
                COUNT(DISTINCT rp.id) AS reseller_count,
                COALESCE(SUM(o.total), 0) AS sales_total,
                COALESCE(SUM(c.amount), 0) AS reseller_commission_total
             FROM reseller_profiles rp
             LEFT JOIN commissions c ON c.reseller_id = rp.id
             LEFT JOIN orders o ON o.id = c.order_id
             WHERE LOWER(TRIM(rp.academy)) = LOWER(TRIM(?))",
            [$academyName]
        );

        $resellers = Database::queryAll(
            "SELECT rp.id, rp.referral_code, rp.total_earned, rp.wallet_balance, rp.status,
                    r.name, l.email,
                    (SELECT COUNT(*) FROM commissions c WHERE c.reseller_id = rp.id) AS sale_count,
                    (SELECT COALESCE(SUM(o.total), 0)
                     FROM commissions c
                     JOIN orders o ON o.id = c.order_id
                     WHERE c.reseller_id = rp.id) AS sales_total
             FROM reseller_profiles rp
             JOIN registrations r ON r.id = rp.user_id
             JOIN logins l ON l.registration_id = r.id
             WHERE LOWER(TRIM(rp.academy)) = LOWER(TRIM(?))
             ORDER BY sales_total DESC, r.name ASC",
            [$academyName]
        );

        $salesTotal = round((float) ($summary['sales_total'] ?? 0), 2);

        Response::json([
            'academy_name' => $academyName,
            'academy_registered' => true,
            'registered_centre' => [
                'id' => (int) ($registered['id'] ?? 0),
                'name' => (string) ($registered['name'] ?? $academyName),
                'province' => (string) ($registered['province'] ?? ''),
                'city' => (string) ($registered['city'] ?? ''),
            ],
            'reseller_count' => (int) ($summary['reseller_count'] ?? 0),
            'sales_total' => $salesTotal,
            'reseller_commission_total' => round((float) ($summary['reseller_commission_total'] ?? 0), 2),
            'academy_rate' => $rate,
            'academy_share' => round($salesTotal * ($rate / 100), 2),
            'resellers' => array_map(static function (array $r): array {
                $r['sales_total'] = round((float) ($r['sales_total'] ?? 0), 2);
                $r['total_earned'] = round((float) ($r['total_earned'] ?? 0), 2);
                $r['wallet_balance'] = round((float) ($r['wallet_balance'] ?? 0), 2);
                $r['sale_count'] = (int) ($r['sale_count'] ?? 0);
                return $r;
            }, $resellers),
        ]);
    }

    public static function sales(): void
    {
        $ctx = self::requireAcademyUser();
        $academyName = $ctx['academy_name'];

        if (!$ctx['registered']) {
            Response::json([
                'academy_registered' => false,
                'academy_name' => $academyName,
                'sales' => [],
                'message' => 'Your academy is not registered on the system yet.',
            ]);
        }

        $rate = ResellersController::ACADEMY_COMMISSION_RATE;
        $sales = Database::queryAll(
            "SELECT o.id, o.total, o.status, o.created_at,
                    cust.name AS customer_name,
                    r.name AS reseller_name,
                    l.email AS reseller_email,
                    rp.referral_code,
                    c.amount AS reseller_commission
             FROM commissions c
             JOIN orders o ON o.id = c.order_id
             JOIN reseller_profiles rp ON rp.id = c.reseller_id
             JOIN registrations r ON r.id = rp.user_id
             JOIN logins l ON l.registration_id = r.id
             JOIN registrations cust ON cust.id = o.user_id
             WHERE LOWER(TRIM(rp.academy)) = LOWER(TRIM(?))
             ORDER BY o.created_at DESC",
            [$academyName]
        );

        Response::json([
            'academy_registered' => true,
            'academy_name' => $academyName,
            'academy_rate' => $rate,
            'sales' => array_map(static function (array $s) use ($rate): array {
                $total = (float) ($s['total'] ?? 0);
                $s['total'] = round($total, 2);
                $s['reseller_commission'] = round((float) ($s['reseller_commission'] ?? 0), 2);
                $s['academy_share'] = round($total * ($rate / 100), 2);
                return $s;
            }, $sales),
        ]);
    }
}
