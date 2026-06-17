<?php

class WishlistController
{
    public static function index(): void
    {
        Auth::authenticate();
        Response::json(Database::queryAll(
            'SELECT w.*, p.name, p.price, p.image, p.slug FROM wishlist w
             JOIN products p ON w.product_id = p.id WHERE w.user_id = ?',
            [Auth::$user['id']]
        ));
    }

    public static function toggle(): void
    {
        Auth::authenticate();
        $body = Request::jsonBody();
        $productId = $body['product_id'] ?? null;

        $existing = Database::queryGet(
            'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
            [Auth::$user['id'], $productId]
        );

        if ($existing) {
            Database::queryRun('DELETE FROM wishlist WHERE id = ?', [$existing['id']]);
            Response::json(['message' => 'Removed from wishlist', 'wishlisted' => false]);
        } else {
            Database::queryRun(
                'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
                [Auth::$user['id'], $productId]
            );
            Response::json(['message' => 'Added to wishlist', 'wishlisted' => true]);
        }
    }
}
