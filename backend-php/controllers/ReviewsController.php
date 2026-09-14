<?php

class ReviewsController
{
    public static function byProduct(array $params): void
    {
        $productId = (int) $params['productId'];
        $rows = Database::queryAll(
            'SELECT r.*, reg.name AS user_name, reg.avatar
             FROM reviews r
             JOIN registrations reg ON r.user_id = reg.id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC',
            [$productId]
        );
        Response::json($rows);
    }

    public static function create(): void
    {
        Auth::authenticate();
        SchemaEnsure::orderReturns();
        $body = Request::jsonBody();
        $userId = (int) Auth::$user['id'];
        $productId = (int) ($body['product_id'] ?? 0);
        $orderId = (int) ($body['order_id'] ?? 0);
        $rating = (int) ($body['rating'] ?? 0);
        $comment = trim((string) ($body['comment'] ?? ''));

        if ($rating < 1 || $rating > 5) {
            Response::error('Rating must be 1-5', 400);
        }

        if ($orderId > 0) {
            OrderAfterDelivery::assertDeliveredOwner($orderId, $userId);
            $items = Database::queryAll(
                'SELECT DISTINCT product_id FROM order_items WHERE order_id = ?',
                [$orderId]
            );
            if (!$items) {
                Response::error('Order has no products to review', 400);
            }

            $inserted = 0;
            foreach ($items as $item) {
                $pid = (int) $item['product_id'];
                if ($pid < 1) {
                    continue;
                }
                $prod = Database::queryGet('SELECT slug FROM products WHERE id = ?', [$pid]);
                if (($prod['slug'] ?? '') === 'home-direct-delivery') {
                    continue;
                }
                $existing = Database::queryGet(
                    'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
                    [$userId, $pid]
                );
                if ($existing) {
                    continue;
                }
                Database::queryRun(
                    'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
                    [$userId, $pid, $rating, $comment === '' ? null : $comment]
                );
                $inserted++;
            }

            if ($inserted === 0) {
                Response::error('You already reviewed this order', 409);
            }

            OrderAfterDelivery::notify(
                $userId,
                'Thanks for your review',
                "Your $rating★ review for order #$orderId was saved.",
                'success'
            );

            $order = OrderAfterDelivery::loadOrder($orderId);
            Response::json(OrderAfterDelivery::withItems($order), 201);
            return;
        }

        if ($productId < 1) {
            Response::error('product_id or order_id is required', 400);
        }

        OrderAfterDelivery::assertPurchasedDelivered($productId, $userId);

        $existing = Database::queryGet(
            'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
            [$userId, $productId]
        );
        if ($existing) {
            Response::error('You already reviewed this product', 409);
        }

        Database::queryRun(
            'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
            [$userId, $productId, $rating, $comment === '' ? null : $comment]
        );
        Response::json(['message' => 'Review added'], 201);
    }

    public static function update(array $params): void
    {
        Auth::authenticate();
        $body = Request::jsonBody();
        $rating = (int) ($body['rating'] ?? 0);
        $comment = $body['comment'] ?? null;
        if ($rating < 1 || $rating > 5) {
            Response::error('Rating must be 1-5', 400);
        }
        $row = Database::queryGet('SELECT user_id FROM reviews WHERE id = ?', [$params['id']]);
        if (!$row) {
            Response::error('Review not found', 404);
        }
        if ((int) $row['user_id'] !== (int) Auth::$user['id']) {
            Response::error('You can only edit your own review', 403);
        }
        Database::queryRun(
            'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
            [$rating, $comment, $params['id']]
        );
        Response::json(['message' => 'Review updated']);
    }

    public static function destroy(array $params): void
    {
        Auth::authenticate();
        $row = Database::queryGet('SELECT user_id FROM reviews WHERE id = ?', [$params['id']]);
        if (!$row) {
            Response::error('Review not found', 404);
        }
        if ((int) $row['user_id'] !== (int) Auth::$user['id'] && Auth::$user['role'] !== 'admin') {
            Response::error('Access denied', 403);
        }
        Database::queryRun('DELETE FROM reviews WHERE id = ?', [$params['id']]);
        Response::json(['message' => 'Review deleted']);
    }
}
