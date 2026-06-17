<?php

class OrderFulfillment
{
    public static function fulfill(int $orderId): ?array
    {
        $order = Database::queryGet('SELECT * FROM orders WHERE id = ?', [$orderId]);
        if (!$order) {
            throw new RuntimeException('Order not found');
        }
        if ($order['payment_status'] === 'paid') {
            return $order;
        }

        $items = Database::queryAll(
            'SELECT oi.*, p.name, p.stock FROM order_items oi
             JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?',
            [$orderId]
        );

        foreach ($items as $item) {
            if ((int) $item['stock'] < (int) $item['quantity']) {
                throw new RuntimeException($item['name'] . ' is out of stock');
            }
            Database::queryRun(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [$item['quantity'], $item['product_id']]
            );
        }

        $code = trim($order['referral_code'] ?? '');
        if ($code !== '') {
            $reseller = Database::queryGet(
                "SELECT id, commission_rate FROM reseller_profiles WHERE referral_code = ? AND status = 'approved'",
                [$code]
            );
            if ($reseller) {
                $existing = Database::queryGet('SELECT id FROM commissions WHERE order_id = ?', [$orderId]);
                if (!$existing) {
                    $commission = (float) $order['total'] * ((float) $reseller['commission_rate'] / 100);
                    Database::queryRun(
                        'INSERT INTO commissions (reseller_id, order_id, amount) VALUES (?, ?, ?)',
                        [$reseller['id'], $orderId, $commission]
                    );
                    Database::queryRun(
                        'UPDATE reseller_profiles SET wallet_balance = wallet_balance + ?, total_earned = total_earned + ? WHERE id = ?',
                        [$commission, $commission, $reseller['id']]
                    );
                }
            }
        }

        Database::queryRun(
            "UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = NOW() WHERE id = ?",
            [$orderId]
        );
        Database::queryRun('DELETE FROM cart WHERE user_id = ?', [$order['user_id']]);

        $user = Database::queryGet(
            'SELECT r.name, l.email FROM registrations r
             JOIN logins l ON l.registration_id = r.id WHERE r.id = ?',
            [$order['user_id']]
        );
        if ($user) {
            $itemsList = implode('<br>', array_map(
                fn ($i) => $i['name'] . ' × ' . $i['quantity'] . ' (R' . number_format($i['price'] * $i['quantity'], 2) . ')',
                $items
            ));
            Mailer::send([
                'to' => Site::email(),
                'replyTo' => $user['email'],
                'subject' => 'Paid order #' . $orderId . ' — R' . number_format((float) $order['total'], 2),
                'html' => '<p><strong>Customer:</strong> ' . htmlspecialchars($user['name']) . ' (' . htmlspecialchars($user['email']) . ')</p>
                    <p><strong>Order ID:</strong> ' . $orderId . '</p>
                    <p><strong>Total paid:</strong> R' . number_format((float) $order['total'], 2) . '</p>
                    <p><strong>Items:</strong><br>' . $itemsList . '</p>',
            ]);
        }

        return Database::queryGet('SELECT * FROM orders WHERE id = ?', [$orderId]);
    }
}
