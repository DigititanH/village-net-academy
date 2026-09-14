<?php

/** Delivery clock, 7-day returns, and purchase-gated reviews. */
class OrderAfterDelivery
{
    public const RETURN_WINDOW_DAYS = 7;

    public static function loadOrder(int $orderId): ?array
    {
        return Database::queryGet('SELECT * FROM orders WHERE id = ?', [$orderId]);
    }

    public static function withItems(array $order): array
    {
        $order['items'] = Database::queryAll(
            'SELECT oi.*, p.name, p.image, p.slug
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?',
            [$order['id']]
        );
        return self::decorate($order);
    }

    public static function deliveryTime(array $order): ?string
    {
        $raw = $order['delivered_at'] ?? null;
        if (is_string($raw) && trim($raw) !== '' && $raw !== '0000-00-00 00:00:00') {
            return $raw;
        }
        if (($order['status'] ?? '') === 'delivered') {
            return $order['updated_at'] ?? $order['created_at'] ?? null;
        }
        return null;
    }

    public static function decorate(array $order): array
    {
        SchemaEnsure::orderReturns();
        $orderId = (int) $order['id'];
        $userId = (int) $order['user_id'];
        $deliveredAt = self::deliveryTime($order);
        $order['delivered_at'] = $deliveredAt;

        $ret = null;
        try {
            $ret = Database::queryGet(
                'SELECT id, reason, status, created_at FROM order_returns WHERE order_id = ?',
                [$orderId]
            );
        } catch (Throwable $e) {
            $ret = null;
        }
        $order['return_requested'] = $ret !== null;
        $order['return_reason'] = $ret['reason'] ?? null;
        $order['return_status'] = $ret['status'] ?? null;

        $review = null;
        try {
            $review = Database::queryGet(
                'SELECT r.id, r.rating, r.comment, r.created_at
                 FROM reviews r
                 INNER JOIN order_items oi ON oi.product_id = r.product_id
                 WHERE r.user_id = ? AND oi.order_id = ?
                 ORDER BY r.created_at DESC
                 LIMIT 1',
                [$userId, $orderId]
            );
        } catch (Throwable $e) {
            $review = null;
        }
        $order['reviewed'] = $review !== null;
        $order['review_id'] = $review['id'] ?? null;
        $order['review_stars'] = $review ? (int) $review['rating'] : null;
        $order['review_text'] = $review['comment'] ?? null;

        $isDelivered = ($order['status'] ?? '') === 'delivered' || $deliveredAt !== null;
        $cancelled = ($order['status'] ?? '') === 'cancelled';
        $order['can_review'] = $isDelivered && !$cancelled && !$order['reviewed'];

        $daysLeft = 0;
        $canReturn = false;
        if ($isDelivered && !$cancelled && !$order['return_requested'] && $deliveredAt) {
            try {
                $deadline = (new DateTimeImmutable($deliveredAt))
                    ->modify('+' . self::RETURN_WINDOW_DAYS . ' days');
                $now = new DateTimeImmutable('now');
                $canReturn = $now <= $deadline;
                $daysLeft = (int) $now->diff($deadline)->format('%r%a');
                if ($daysLeft < 0) {
                    $daysLeft = 0;
                }
            } catch (Exception $e) {
                $canReturn = false;
            }
        }
        $order['can_return'] = $canReturn;
        $order['return_days_left'] = $daysLeft;

        return $order;
    }

    public static function assertOwner(array $order, int $userId): void
    {
        $role = (string) (Auth::$user['role'] ?? '');
        if ((int) $order['user_id'] !== $userId && !in_array($role, ['admin', 'super_admin'], true)) {
            Response::error('Access denied', 403);
        }
    }

    public static function assertDeliveredOwner(int $orderId, int $userId): array
    {
        $order = self::loadOrder($orderId);
        if (!$order) {
            Response::error('Order not found', 404);
        }
        self::assertOwner($order, $userId);
        $deliveredAt = self::deliveryTime($order);
        if (($order['status'] ?? '') === 'cancelled') {
            Response::error('This order was cancelled', 400);
        }
        if (!$deliveredAt && ($order['status'] ?? '') !== 'delivered') {
            Response::error('This order has not been delivered yet', 400);
        }
        $order['delivered_at'] = $deliveredAt;
        return $order;
    }

    public static function assertPurchasedDelivered(int $productId, int $userId): void
    {
        $sql = "SELECT o.id, o.status, o.updated_at, o.created_at
                FROM orders o
                INNER JOIN order_items oi ON oi.order_id = o.id
                WHERE o.user_id = ? AND oi.product_id = ? AND o.status <> 'cancelled'
                ORDER BY o.created_at DESC";
        try {
            $row = Database::queryGet(
                "SELECT o.id, o.status, o.delivered_at, o.updated_at, o.created_at
                 FROM orders o
                 INNER JOIN order_items oi ON oi.order_id = o.id
                 WHERE o.user_id = ? AND oi.product_id = ? AND o.status <> 'cancelled'
                 ORDER BY o.created_at DESC",
                [$userId, $productId]
            );
        } catch (Throwable $e) {
            $row = Database::queryGet($sql, [$userId, $productId]);
        }
        if (!$row) {
            Response::error('You can only review a product after you receive it', 403);
        }
        $deliveredAt = self::deliveryTime($row);
        if (!$deliveredAt && ($row['status'] ?? '') !== 'delivered') {
            Response::error('You can only review a product after it has been delivered', 403);
        }
    }

    public static function notify(int $userId, string $title, string $message, string $type = 'info'): void
    {
        try {
            Database::queryRun(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [$userId, $title, $message, $type]
            );
        } catch (Throwable $e) {
            error_log('OrderAfterDelivery notify: ' . $e->getMessage());
        }
    }

    public static function adminUpdate(int $orderId, array $body): void
    {
        SchemaEnsure::orderReturns();
        $order = self::loadOrder($orderId);
        if (!$order) {
            Response::error('Order not found', 404);
        }

        $status = isset($body['status']) ? strtolower(trim((string) $body['status'])) : '';
        $tracking = isset($body['tracking_number']) ? trim((string) $body['tracking_number']) : '';

        $fields = [];
        $params = [];
        if ($status !== '') {
            $allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!in_array($status, $allowed, true)) {
                Response::error('Invalid status', 400);
            }
            $fields[] = 'status = ?';
            $params[] = $status;
        }
        if ($tracking !== '') {
            $fields[] = 'tracking_number = ?';
            $params[] = $tracking;
        }
        if (!$fields) {
            Response::error('Nothing to update', 400);
        }

        $becameDelivered = $status === 'delivered' && ($order['status'] ?? '') !== 'delivered';
        $sql = 'UPDATE orders SET ' . implode(', ', $fields);
        if ($status === 'delivered') {
            $sql .= ', delivered_at = COALESCE(delivered_at, NOW())';
        }
        $sql .= ' WHERE id = ?';
        $params[] = $orderId;

        try {
            Database::queryRun($sql, $params);
        } catch (Throwable $e) {
            $fallback = 'UPDATE orders SET ' . implode(', ', $fields) . ' WHERE id = ?';
            Database::queryRun($fallback, $params);
        }

        if ($becameDelivered) {
            $days = self::RETURN_WINDOW_DAYS;
            self::notify(
                (int) $order['user_id'],
                'Order delivered',
                "Order #$orderId was delivered. You have $days days to request a return. Please leave a review.",
                'success'
            );
            if (class_exists('AccountSecurity') && method_exists('AccountSecurity', 'deliveryReviewAsk')) {
                try {
                    $fresh = self::loadOrder($orderId);
                    if ($fresh) {
                        AccountSecurity::deliveryReviewAsk($fresh);
                    }
                } catch (Throwable $e) {
                    error_log('[OrderAfterDelivery] deliveryReviewAsk: ' . $e->getMessage());
                }
            }
        }

        Response::json(['message' => 'Order updated']);
    }
}
