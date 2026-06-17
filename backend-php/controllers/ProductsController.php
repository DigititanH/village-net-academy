<?php

class ProductsController
{
    public static function index(): void
    {
        $category = Request::query('category');
        $search = Request::query('search');
        $sort = Request::query('sort');
        $page = max(1, (int) Request::query('page', 1));
        $limit = max(1, (int) Request::query('limit', 12));

        $sql = "SELECT p.*, c.name as category_name,
            (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id = p.id) as avg_rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
            FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1";
        $params = [];

        if ($category) {
            $sql .= ' AND c.slug = ?';
            $params[] = $category;
        }
        if ($search) {
            $sql .= ' AND (p.name LIKE ? OR p.description LIKE ?)';
            $term = '%' . $search . '%';
            $params[] = $term;
            $params[] = $term;
        }

        if ($sort === 'price_asc') {
            $sql .= ' ORDER BY p.price ASC';
        } elseif ($sort === 'price_desc') {
            $sql .= ' ORDER BY p.price DESC';
        } else {
            $sql .= ' ORDER BY p.created_at DESC';
        }

        $offset = ($page - 1) * $limit;
        $sql .= ' LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $products = Database::queryAll($sql, $params);
        $countResult = Database::queryGet('SELECT COUNT(*) as total FROM products WHERE is_active = 1');

        Response::json([
            'products' => $products,
            'total' => (int) ($countResult['total'] ?? 0),
            'page' => $page,
            'limit' => $limit,
        ]);
    }

    public static function categories(): void
    {
        Response::json(Database::queryAll('SELECT * FROM categories ORDER BY name'));
    }

    public static function show(array $params): void
    {
        $row = Database::queryGet(
            'SELECT p.*, c.name as category_name FROM products p
             LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?',
            [$params['slug']]
        );
        if (!$row) {
            Response::error('Product not found', 404);
        }
        Response::json($row);
    }

    public static function create(): void
    {
        Auth::authorize('admin');
        $body = array_merge(Request::jsonBody(), $_POST);
        $name = $body['name'] ?? '';
        if (!$name) {
            Response::error('Name is required', 400);
        }

        $imageUrl = Request::handleUpload($_FILES['image'] ?? null);
        $slug = Request::slugify($name) . '-' . time();

        $result = Database::queryRun(
            'INSERT INTO products (name, slug, description, price, compare_price, category_id, image, stock, sizes, colors)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $name,
                $slug,
                $body['description'] ?? null,
                $body['price'] ?? 0,
                $body['compare_price'] ?? null,
                $body['category_id'] ?? null,
                $imageUrl,
                $body['stock'] ?? 0,
                $body['sizes'] ?? null,
                $body['colors'] ?? null,
            ]
        );

        Response::json(['id' => $result['lastInsertRowid'], 'message' => 'Product created'], 201);
    }

    public static function update(array $params): void
    {
        Auth::authorize('admin');
        $body = array_merge(Request::jsonBody(), $_POST);
        $fields = [];
        $sqlParams = [];

        if (!empty($body['name'])) {
            $fields[] = 'name = ?';
            $sqlParams[] = $body['name'];
            $fields[] = 'slug = ?';
            $sqlParams[] = Request::slugify($body['name']) . '-' . time();
        }
        if (array_key_exists('description', $body)) {
            $fields[] = 'description = ?';
            $sqlParams[] = $body['description'];
        }
        if (!empty($body['price'])) {
            $fields[] = 'price = ?';
            $sqlParams[] = $body['price'];
        }
        if (array_key_exists('compare_price', $body)) {
            $fields[] = 'compare_price = ?';
            $sqlParams[] = $body['compare_price'] ?: null;
        }
        if (array_key_exists('category_id', $body)) {
            $fields[] = 'category_id = ?';
            $sqlParams[] = $body['category_id'] ?: null;
        }
        if (array_key_exists('stock', $body)) {
            $fields[] = 'stock = ?';
            $sqlParams[] = $body['stock'];
        }
        if (!empty($body['sizes'])) {
            $fields[] = 'sizes = ?';
            $sqlParams[] = $body['sizes'];
        }
        if (!empty($body['colors'])) {
            $fields[] = 'colors = ?';
            $sqlParams[] = $body['colors'];
        }
        if (array_key_exists('is_active', $body)) {
            $fields[] = 'is_active = ?';
            $sqlParams[] = $body['is_active'];
        }

        $imageUrl = Request::handleUpload($_FILES['image'] ?? null);
        if ($imageUrl) {
            $fields[] = 'image = ?';
            $sqlParams[] = $imageUrl;
        }

        if (!$fields) {
            Response::error('No fields to update', 400);
        }

        $sqlParams[] = $params['id'];
        Database::queryRun('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?', $sqlParams);
        Response::json(['message' => 'Product updated']);
    }

    public static function destroy(array $params): void
    {
        Auth::authorize('admin');
        Database::queryRun('DELETE FROM products WHERE id = ?', [$params['id']]);
        Response::json(['message' => 'Product deleted']);
    }
}
