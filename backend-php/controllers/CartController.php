<?php

class CartController
{
    public static function index(): void
    {
        Auth::authenticate();
        SchemaEnsure::products();
        SchemaEnsure::cartAndOrderItems();
        $rows = Database::queryAll(
            'SELECT c.*, p.name, p.price, p.image, p.stock, p.sizes as available_sizes, p.colors as available_colors, p.color_stock,
                    cat.slug as category_slug
             FROM cart c
             JOIN products p ON c.product_id = p.id
             LEFT JOIN categories cat ON cat.id = p.category_id
             WHERE c.user_id = ?',
            [Auth::$user['id']]
        );
        foreach ($rows as &$row) {
            $row['base_price'] = $row['price'];
            $row['price'] = ProductOptions::priceFor($row['available_sizes'] ?? null, $row['size'] ?? null, (float) $row['price']);
        }
        unset($row);
        Response::json($rows);
    }

    /** Validate a chosen size/capacity against the product's options; returns the canonical name. */
    private static function resolveOption(?string $sizesRaw, mixed $size, string $productName): ?string
    {
        $map = ProductOptions::decode($sizesRaw);
        $size = $size !== null ? trim((string) $size) : '';
        if (!$map) {
            return $size !== '' ? $size : null;
        }
        if ($size === '') {
            return null;
        }
        $name = ProductOptions::match($map, $size);
        if ($name === null) {
            Response::error($productName . ' is not available in ' . $size, 400);
        }
        return $name;
    }

    public static function add(): void
    {
        Auth::authenticate();
        SchemaEnsure::products();
        SchemaEnsure::cartAndOrderItems();
        $body = Request::jsonBody();
        $productId = $body['product_id'] ?? null;
        $quantity = max(1, (int) ($body['quantity'] ?? 1));
        $size = $body['size'] ?? null;
        $color = isset($body['color']) ? trim((string) $body['color']) : null;
        if ($color === '') {
            $color = null;
        }

        $product = Database::queryGet(
            'SELECT id, name, stock, sizes, colors, color_stock FROM products WHERE id = ? AND is_active = 1',
            [$productId]
        );
        if (!$product) {
            Response::error('Product not found', 404);
        }
        $size = self::resolveOption($product['sizes'] ?? null, $size, (string) $product['name']);

        $colorMap = ColorStock::decode($product['color_stock'] ?? null);
        $colorNames = $colorMap
            ? ColorStock::colorNames($colorMap)
            : array_map('strval', json_decode((string) ($product['colors'] ?? '[]'), true) ?: []);
        if (!$colorNames && !empty($product['colors'])) {
            $decoded = json_decode((string) $product['colors'], true);
            if (!is_array($decoded)) {
                $colorNames = array_values(array_filter(array_map('trim', explode(',', (string) $product['colors']))));
            }
        }
        if ($colorNames) {
            if ($color === null) {
                Response::error('Please select a colour', 400);
            }
            $available = ColorStock::available($colorMap, $color, (int) $product['stock']);
            if ($available < $quantity) {
                Response::error(
                    $product['name'] . ($available < 1 ? ' — ' . $color . ' is out of stock' : ' — only ' . $available . ' left in ' . $color),
                    400
                );
            }
        } elseif ((int) $product['stock'] < $quantity) {
            Response::error($product['name'] . ' is out of stock', 400);
        }

        $existing = Database::queryGet(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?
             AND (size = ? OR (size IS NULL AND ? IS NULL))
             AND (color = ? OR (color IS NULL AND ? IS NULL))',
            [Auth::$user['id'], $productId, $size, $size, $color, $color]
        );

        if ($existing) {
            $newQty = (int) $existing['quantity'] + $quantity;
            if ($colorNames) {
                $available = ColorStock::available($colorMap, $color, (int) $product['stock']);
                if ($available < $newQty) {
                    Response::error(
                        $product['name'] . ' — only ' . $available . ' left in ' . $color,
                        400
                    );
                }
            } elseif ((int) $product['stock'] < $newQty) {
                Response::error($product['name'] . ' is out of stock', 400);
            }
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
        SchemaEnsure::products();
        SchemaEnsure::cartAndOrderItems();
        $body = Request::jsonBody();
        $quantity = $body['quantity'] ?? null;
        $size = $body['size'] ?? null;

        $row = Database::queryGet(
            'SELECT c.*, p.name, p.stock, p.sizes as available_sizes, p.colors, p.color_stock
             FROM cart c JOIN products p ON p.id = c.product_id
             WHERE c.id = ? AND c.user_id = ?',
            [$params['id'], Auth::$user['id']]
        );
        if (!$row) {
            Response::error('Cart item not found', 404);
        }
        if (array_key_exists('size', $body)) {
            $size = self::resolveOption($row['available_sizes'] ?? null, $size, (string) $row['name']);
        }

        if ($quantity !== null && (int) $quantity < 1) {
            Database::queryRun('DELETE FROM cart WHERE id = ? AND user_id = ?', [$params['id'], Auth::$user['id']]);
            Response::json(['message' => 'Cart updated']);
            return;
        }

        $nextQty = $quantity !== null ? max(1, (int) $quantity) : (int) $row['quantity'];
        $nextSize = array_key_exists('size', $body) ? $size : ($row['size'] ?? null);
        $color = isset($row['color']) ? trim((string) $row['color']) : null;
        if ($color === '') {
            $color = null;
        }

        $colorMap = ColorStock::decode($row['color_stock'] ?? null);
        $colorNames = $colorMap ? ColorStock::colorNames($colorMap) : [];
        if (!$colorNames && !empty($row['colors'])) {
            $decoded = json_decode((string) $row['colors'], true);
            if (is_array($decoded)) {
                $colorNames = array_values(array_filter(array_map(
                    static fn ($v) => trim((string) (is_array($v) ? ($v['name'] ?? '') : $v)),
                    $decoded
                )));
            } else {
                $colorNames = array_values(array_filter(array_map('trim', explode(',', (string) $row['colors']))));
            }
        }

        if ($colorNames) {
            if ($color === null) {
                Response::error('Please select a colour for ' . $row['name'], 400);
            }
            $available = ColorStock::available($colorMap, $color, (int) $row['stock']);
            if ($available < $nextQty) {
                Response::error(
                    $row['name'] . ' — only ' . $available . ' left' . ($color ? ' in ' . $color : ''),
                    400
                );
            }
        } elseif ((int) $row['stock'] < $nextQty) {
            Response::error($row['name'] . ' is out of stock', 400);
        }

        $fields = [];
        $sqlParams = [];
        if ($quantity !== null) {
            $fields[] = 'quantity = ?';
            $sqlParams[] = $nextQty;
        }
        if (array_key_exists('size', $body)) {
            $fields[] = 'size = ?';
            $sqlParams[] = $nextSize;
        }
        if ($fields) {
            $sqlParams[] = $params['id'];
            $sqlParams[] = Auth::$user['id'];
            Database::queryRun(
                'UPDATE cart SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?',
                $sqlParams
            );
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
