<?php

class ReviewsController
{
    public static function byProduct(array $params): void
    {
        Response::json(Database::queryAll(
            'SELECT r.*, reg.name as user_name, reg.avatar FROM reviews r
             JOIN registrations reg ON r.user_id = reg.id WHERE r.product_id = ? ORDER BY r.created_at DESC',
            [$params['productId']]
        ));
    }

    public static function create(): void
    {
        Auth::authenticate();
        $body = Request::jsonBody();
        $productId = $body['product_id'] ?? null;
        $rating = (int) ($body['rating'] ?? 0);
        $comment = $body['comment'] ?? null;

        if ($rating < 1 || $rating > 5) {
            Response::error('Rating must be 1-5', 400);
        }

        $existing = Database::queryGet(
            'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
            [Auth::$user['id'], $productId]
        );
        if ($existing) {
            Response::error('You already reviewed this product', 409);
        }

        Database::queryRun(
            'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
            [Auth::$user['id'], $productId, $rating, $comment]
        );
        Response::json(['message' => 'Review added'], 201);
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
