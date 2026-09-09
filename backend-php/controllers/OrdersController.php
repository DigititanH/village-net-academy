<?php

class OrdersController
{
    private const DELIVERY_FEE = 150.0;

    public static function create(): void
    {
        Auth::authenticate();
        SchemaEnsure::orders();

        $body = Request::jsonBody();
        $items = $body['items'] ?? [];
        $shippingAddress = $body['shipping_address'] ?? null;
        $referralCode = trim((string) ($body['referral_code'] ?? ''));
        $deliveryMethod = strtolower(trim((string) ($body['delivery_method'] ?? '')));

        if (!in_array($deliveryMethod, ['delivery', 'collection'], true)) {
            Response::error('Please select Delivery or Collection at the centre', 400);
        }

        if (!$items || !is_array($shippingAddress)) {
            Response::error('Items and contact details are required', 400);
        }

        $phone = trim((string) ($shippingAddress['phone'] ?? ''));
        if ($phone === '') {
            Response::error('Phone number is required', 400);
        }

        if ($deliveryMethod === 'delivery') {
            foreach (['street', 'city', 'province', 'zip'] as $field) {
                if (trim((string) ($shippingAddress[$field] ?? '')) === '') {
                    Response::error('Full delivery address is required for delivery orders', 400);
                }
            }
            unset($shippingAddress['collection_centre_id'], $shippingAddress['collection_centre'], $shippingAddress['fulfillment']);
        } else {
            $centreId = (int) ($body['collection_centre_id'] ?? $shippingAddress['collection_centre_id'] ?? 0);
            $centre = AscController::findById($centreId);
            if (!$centre) {
                Response::error('Please select a collection centre', 400);
            }
            $shippingAddress = array_merge([
                'street' => '',
                'city' => '',
                'province' => '',
                'zip' => '',
            ], $shippingAddress);
            $shippingAddress['collection_centre_id'] = (int) $centre['id'];
            $shippingAddress['collection_centre'] = $centre['name'];
            $shippingAddress['collection_province'] = $centre['province'] ?? '';
            $shippingAddress['collection_city'] = $centre['city'] ?? '';
            $shippingAddress['collection_address'] = $centre['address'] ?? '';
            $shippingAddress['fulfillment'] = 'Collection at ' . $centre['name'];
        }

        $shippingFee = $deliveryMethod === 'delivery' ? self::DELIVERY_FEE : 0.0;

        $reseller = null;
        if ($referralCode !== '') {
            $reseller = Database::queryGet(
                "SELECT id, commission_rate FROM reseller_profiles WHERE referral_code = ? AND status = 'approved'",
                [$referralCode]
            );
            if (!$reseller) {
                Response::error('Invalid or inactive reseller referral code', 400);
            }
        }

        $subtotal = 0.0;
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
            $subtotal += $lineTotal;
            $orderItems[] = array_merge($item, [
                'price' => $product['price'],
                'name' => $product['name'],
            ]);
        }

        $total = $subtotal + $shippingFee;

        $payfastEnabled = Payfast::isConfigured();
        if ($payfastEnabled && $total < 5) {
            Response::error('PayFast orders must total at least R5.00', 400);
        }

        try {
            $order = Database::queryRun(
                "INSERT INTO orders (user_id, total, delivery_method, shipping_fee, shipping_address, payment_status, referral_code) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
                [Auth::$user['id'], $total, $deliveryMethod, $shippingFee, json_encode($shippingAddress), $referralCode ?: null]
            );
        } catch (Throwable $e) {
            SchemaEnsure::orders();
            $order = Database::queryRun(
                "INSERT INTO orders (user_id, total, delivery_method, shipping_fee, shipping_address, payment_status, referral_code) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
                [Auth::$user['id'], $total, $deliveryMethod, $shippingFee, json_encode($shippingAddress), $referralCode ?: null]
            );
        }
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
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'delivery_method' => $deliveryMethod,
                'payfast' => true,
                'message' => 'Order created. Redirecting to PayFast for payment.',
            ], 201);
        }

        OrderFulfillment::fulfill($orderId);
        Response::json([
            'order_id' => $orderId,
            'total' => $total,
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
            'delivery_method' => $deliveryMethod,
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
