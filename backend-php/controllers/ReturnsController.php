<?php

class ReturnsController
{
    public static function meta(array $params): void
    {
        Auth::authenticate();
        SchemaEnsure::orderReturns();
        $orderId = (int) $params['id'];
        $order = OrderAfterDelivery::loadOrder($orderId);
        if (!$order) {
            Response::error('Order not found', 404);
        }
        OrderAfterDelivery::assertOwner($order, (int) Auth::$user['id']);
        Response::json(OrderAfterDelivery::withItems($order));
    }

    public static function create(array $params): void
    {
        Auth::authenticate();
        SchemaEnsure::orderReturns();
        $orderId = (int) $params['id'];
        $userId = (int) Auth::$user['id'];
        $body = Request::jsonBody();
        $reason = trim((string) ($body['reason'] ?? ''));
        if ($reason === '') {
            Response::error('Please describe why you are returning this order', 400);
        }

        $order = OrderAfterDelivery::assertDeliveredOwner($orderId, $userId);
        $decorated = OrderAfterDelivery::decorate($order);
        if (!empty($decorated['return_requested'])) {
            Response::error('Return already requested for this order', 409);
        }
        if (empty($decorated['can_return'])) {
            Response::error(
                'Return window closed (' . OrderAfterDelivery::RETURN_WINDOW_DAYS . ' days after delivery).',
                400
            );
        }

        try {
            Database::queryRun(
                'INSERT INTO order_returns (order_id, user_id, reason) VALUES (?, ?, ?)',
                [$orderId, $userId, $reason]
            );
        } catch (Throwable $e) {
            Response::error(
                'Could not log return. Ensure order_returns exists (SchemaEnsure / phpMyAdmin SQL).',
                500
            );
        }

        OrderAfterDelivery::notify(
            $userId,
            'Return requested',
            "We received your return for order #$orderId.",
            'info'
        );

        $customerName = trim((string) (Auth::$user['name'] ?? ''));
        $customerEmail = strtolower(trim((string) (Auth::$user['email'] ?? '')));
        $orderTotal = (float) ($order['total'] ?? 0);
        try {
            if (class_exists('AdminNotify') && method_exists('AdminNotify', 'returnRequested')) {
                AdminNotify::returnRequested($orderId, $customerName, $customerEmail, $reason, $orderTotal);
            } else {
                Mailer::send([
                    'to' => Site::email(),
                    'replyTo' => $customerEmail !== '' ? $customerEmail : null,
                    'subject' => 'Return request — order #' . $orderId,
                    'html' => '<p>Return logged for order <strong>#' . $orderId . '</strong>.</p>'
                        . '<p><strong>Customer:</strong> ' . htmlspecialchars($customerName) . ' (' . htmlspecialchars($customerEmail) . ')</p>'
                        . '<p><strong>Reason:</strong> ' . nl2br(htmlspecialchars($reason)) . '</p>',
                ]);
            }
        } catch (Throwable $e) {
            error_log('[ReturnsController] admin notify: ' . $e->getMessage());
        }

        $fresh = OrderAfterDelivery::loadOrder($orderId);
        Response::json(OrderAfterDelivery::withItems($fresh), 201);
    }

    public static function adminAll(): void
    {
        Auth::authorize('admin');
        SchemaEnsure::orderReturns();
        try {
            $rows = Database::queryAll(
                'SELECT r.*, o.total, o.status AS order_status, l.email AS customer_email,
                        reg.name AS customer_name
                 FROM order_returns r
                 JOIN orders o ON o.id = r.order_id
                 LEFT JOIN logins l ON l.registration_id = r.user_id
                 LEFT JOIN registrations reg ON reg.id = r.user_id
                 ORDER BY r.created_at DESC'
            );
        } catch (Throwable $e) {
            Response::json([]);
            return;
        }
        foreach ($rows as &$row) {
            $row['items'] = Database::queryAll(
                'SELECT oi.product_id, oi.quantity, oi.price, oi.size, oi.color,
                        p.name, p.image
                 FROM order_items oi
                 LEFT JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ?',
                [$row['order_id']]
            );
        }
        unset($row);
        Response::json($rows);
    }

    public static function adminUpdate(array $params): void
    {
        Auth::authorize('admin');
        SchemaEnsure::orderReturns();
        $status = strtolower(trim((string) (Request::jsonBody()['status'] ?? '')));
        if (!in_array($status, ['requested', 'approved', 'rejected', 'completed'], true)) {
            Response::error('Invalid return status', 400);
        }
        $row = Database::queryGet(
            'SELECT r.id, r.order_id, r.user_id, r.reason, l.email AS customer_email, reg.name AS customer_name
             FROM order_returns r
             LEFT JOIN logins l ON l.registration_id = r.user_id
             LEFT JOIN registrations reg ON reg.id = r.user_id
             WHERE r.id = ?',
            [$params['id']]
        );
        if (!$row) {
            Response::error('Return not found', 404);
        }
        Database::queryRun('UPDATE order_returns SET status = ? WHERE id = ?', [$status, $params['id']]);

        if ($status === 'approved' || $status === 'rejected') {
            self::informCustomer((array) $row, $status);
        }

        Response::json(['message' => "Return $status"]);
    }

    private static function informCustomer(array $row, string $status): void
    {
        $orderId = (int) $row['order_id'];
        $userId = (int) $row['user_id'];
        $email = strtolower(trim((string) ($row['customer_email'] ?? '')));
        $name = trim((string) ($row['customer_name'] ?? 'there'));
        $approved = $status === 'approved';
        $title = $approved ? 'Return approved' : 'Return not approved';
        $message = $approved
            ? "Your return for order #$orderId was approved. Village NetAcad will contact you about the next steps. Never pay cash to individuals for refunds."
            : "Your return for order #$orderId was not approved. If you have questions, reply to this email or contact Village NetAcad support.";

        OrderAfterDelivery::notify($userId, $title, $message, $approved ? 'success' : 'info');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_log("ReturnsController: no customer email for return order #$orderId");
            return;
        }

        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safeMsg = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        $subject = $approved
            ? "Village NetAcad — return approved (order #$orderId)"
            : "Village NetAcad — return update (order #$orderId)";

        try {
            Mailer::send([
                'to' => $email,
                'subject' => $subject,
                'html' => '<p>Hi ' . $safeName . ',</p><p>' . $safeMsg . '</p>'
                    . '<p>Order: <strong>#' . $orderId . '</strong></p>'
                    . '<p>Village NetAcad / Digititan</p>',
            ]);
        } catch (Throwable $e) {
            error_log('ReturnsController mail: ' . $e->getMessage());
        }
    }
}
