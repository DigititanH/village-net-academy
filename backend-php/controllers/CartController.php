<?php

class CartController
{
    public static function index(): void
    {
        Auth::authenticate();
        Response::json(Database::queryAll(
            'SELECT c.*, p.name, p.price, p.image, p.stock, p.sizes as available_sizes
             FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?',
            [Auth::$user['id']]
        ));
    }

    public static function add(): void
    {
        Auth::authenticate();
        $body = Request::jsonBody();
        $productId = $body['product_id'] ?? null;
        $quantity = (int) ($body['quantity'] ?? 1);
        $size = $body['size'] ?? null;
        $color = $body['color'] ?? null;

        $existing = Database::queryGet(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?
             AND (size = ? OR (size IS NULL AND ? IS NULL))
             AND (color = ? OR (color IS NULL AND ? IS NULL))',
            [Auth::$user['id'], $productId, $size, $size, $color, $color]
        );

        if ($existing) {
            Database::queryRun('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [$quantity, $existing['id']]);
        } else {
            Database::queryRun(
                'INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
                [Auth::$user['id'], $productId, $quantity, $size, $color]
            );
        }

        Response::json(['message' => 'Added to cart'], 201);
    }

    public static function update(array $params): void
    {
        Auth::authenticate();
        $body = Request::jsonBody();
        $quantity = $body['quantity'] ?? null;
        $size = $body['size'] ?? null;

        if ($quantity !== null && (int) $quantity < 1) {
            Database::queryRun('DELETE FROM cart WHERE id = ? AND user_id = ?', [$params['id'], Auth::$user['id']]);
        } else {
            $fields = [];
            $sqlParams = [];
            if ($quantity !== null) {
                $fields[] = 'quantity = ?';
                $sqlParams[] = $quantity;
            }
            if (array_key_exists('size', $body)) {
                $fields[] = 'size = ?';
                $sqlParams[] = $size;
            }
            if ($fields) {
                $sqlParams[] = $params['id'];
                $sqlParams[] = Auth::$user['id'];
                Database::queryRun(
                    'UPDATE cart SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?',
                    $sqlParams
                );
            }
        }

        Response::json(['message' => 'Cart updated']);
    }

    public static function remove(array $params): void
    {
        Auth::authenticate();
        Database::queryRun('DELETE FROM cart WHERE id = ? AND user_id = ?', [$params['id'], Auth::$user['id']]);
        Response::json(['message' => 'Item removed from cart']);
    }

    public static function clear(): void
    {
        Auth::authenticate();
        Database::queryRun('DELETE FROM cart WHERE user_id = ?', [Auth::$user['id']]);
        Response::json(['message' => 'Cart cleared']);
    }
}
