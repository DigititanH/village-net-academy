<?php

class OrdersController
{
    public static function create(): void
    {
        Auth::authenticate();
        $body = Request::jsonBody();
        $items = $body['items'] ?? [];
        $shippingAddress = $body['shipping_address'] ?? null;
        $referralCode = trim((string) ($body['referral_code'] ?? ''));

        if (!$items || !$shippingAddress) {
            Response::error('Items and shipping address are required', 400);
        }

        $reseller = null;
        if (Auth::$user['role'] !== 'admin') {
            if ($referralCode === '') {
                Response::error('A reseller referral code is required to place an order', 400);
            }
            $reseller = Database::queryGet(
                "SELECT id, commission_rate FROM reseller_profiles WHERE referral_code = ? AND status = 'approved'",
                [$referralCode]
            );
            if (!$reseller) {
                Response::error('Invalid or inactive reseller referral code', 400);
            }
        } elseif ($referralCode !== '') {
            $reseller = Database::queryGet(
                "SELECT id, commission_rate FROM reseller_profiles WHERE referral_code = ? AND status = 'approved'",
                [$referralCode]
            );
        }

        $total = 0.0;
        $orderItems = [];

        foreach ($items as $item) {
            $product = Database::queryGet(
                'SELECT id, price, stock, name FROM products WHERE id = ? AND is_active = 1',
                [$item['product_id']]
            );
            if (!$product) {
                Response::error('Product ' . ($item['product_id'] ?? '') . ' not found', 400);
            }
            if ((int) $product['stock'] < (int) $item['quantity']) {
                Response::error($product['name'] . ' is out of stock', 400);
            }
            $lineTotal = (float) $product['price'] * (int) $item['quantity'];
            $total += $lineTotal;
            $orderItems[] = array_merge($item, [
                'price' => $product['price'],
                'name' => $product['name'],
            ]);
        }

        $payfastEnabled = Payfast::isConfigured();
        $order = Database::queryRun(
            "INSERT INTO orders (user_id, total, shipping_address, payment_status, referral_code) VALUES (?, ?, ?, 'pending', ?)",
            [Auth::$user['id'], $total, json_encode($shippingAddress), $referralCode ?: null]
        );
        $orderId = $order['lastInsertRowid'];

        foreach ($orderItems as $item) {
            Database::queryRun(
                'INSERT INTO order_items (order_id, product_id, quantity, price, size, color) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    $orderId,
                    $item['product_id'],
                    $item['quantity'],
                    $item['price'],
                    $item['size'] ?? null,
                    $item['color'] ?? null,
                ]
            );
        }

        if ($payfastEnabled) {
            Response::json([
                'order_id' => $orderId,
                'total' => $total,
                'payfast' => true,
                'message' => 'Order created. Redirecting to PayFast for payment.',
            ], 201);
        }

        OrderFulfillment::fulfill($orderId);
        Response::json([
            'order_id' => $orderId,
            'total' => $total,
            'payfast' => false,
            'message' => 'Order placed successfully.',
        ], 201);
    }

    public static function myOrders(): void
    {
        Auth::authenticate();
        $orders = Database::queryAll(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [Auth::$user['id']]
        );
        foreach ($orders as &$order) {
            $order['items'] = Database::queryAll('SELECT * FROM order_items WHERE order_id = ?', [$order['id']]);
        }
        Response::json($orders);
    }

    public static function adminAll(): void
    {
        Auth::authorize('admin');
        $status = Request::query('status');
        $page = max(1, (int) Request::query('page', 1));
        $limit = max(1, (int) Request::query('limit', 20));

        $sql = 'SELECT o.*, r.name as customer_name, l.email as customer_email
                FROM orders o
                JOIN registrations r ON o.user_id = r.id
                JOIN logins l ON l.registration_id = r.id';
        $params = [];
        if ($status) {
            $sql .= ' WHERE o.status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = ($page - 1) * $limit;

        $orders = Database::queryAll($sql, $params);
        $countResult = Database::queryGet('SELECT COUNT(*) as total FROM orders');
        Response::json(['orders' => $orders, 'total' => (int) ($countResult['total'] ?? 0)]);
    }

    public static function show(array $params): void
    {
        Auth::authenticate();
        $order = Database::queryGet('SELECT * FROM orders WHERE id = ?', [$params['id']]);
        if (!$order) {
            Response::error('Order not found', 404);
        }
        if (Auth::$user['role'] !== 'admin' && (int) $order['user_id'] !== (int) Auth::$user['id']) {
            Response::error('Access denied', 403);
        }
        $order['items'] = Database::queryAll('SELECT * FROM order_items WHERE order_id = ?', [$order['id']]);
        Response::json($order);
    }

    public static function update(array $params): void
    {
        Auth::authorize('admin');
        $body = Request::jsonBody();
        $fields = [];
        $sqlParams = [];

        if (!empty($body['status'])) {
            $fields[] = 'status = ?';
            $sqlParams[] = $body['status'];
        }
        if (!empty($body['tracking_number'])) {
            $fields[] = 'tracking_number = ?';
            $sqlParams[] = $body['tracking_number'];
        }

        if (!$fields) {
            Response::error('Nothing to update', 400);
        }

        $sqlParams[] = $params['id'];
        Database::queryRun('UPDATE orders SET ' . implode(', ', $fields) . ' WHERE id = ?', $sqlParams);
        Response::json(['message' => 'Order updated']);
    }
}
