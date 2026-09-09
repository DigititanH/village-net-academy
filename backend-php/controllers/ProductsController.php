<?php

class ProductsController
{
    private static function nullableDecimal(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return (string) $value;
    }

    private static function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        return (int) $value;
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $trimmed = trim((string) $value);
        return $trimmed === '' ? null : $trimmed;
    }

    /** @return list<string> */
    private static function electronicsTypes(): array
    {
        return ['laptop', 'tablet', 'accessories'];
    }

    /** @return list<string> */
    private static function merchandiseTypes(): array
    {
        return ['hoodie', 't-shirt', 'cap', 'golf-t-shirt'];
    }

    private static function normalizeSubcategory(mixed $value, ?string $categorySlug = null): ?string
    {
        $raw = strtolower(trim((string) ($value ?? '')));
        if ($raw === '') {
            return null;
        }

        $raw = str_replace(['_', ' '], '-', $raw);
        $aliases = [
            'laptops' => 'laptop',
            'tablets' => 'tablet',
            'accessory' => 'accessories',
            'accesories' => 'accessories',
            'accesorries' => 'accessories',
            'hoodies' => 'hoodie',
            'tshirt' => 't-shirt',
            'tshirts' => 't-shirt',
            't-shirts' => 't-shirt',
            'tee' => 't-shirt',
            'tees' => 't-shirt',
            'caps' => 'cap',
            'hat' => 'cap',
            'hats' => 'cap',
            'golf-tshirt' => 'golf-t-shirt',
            'golf-tshirts' => 'golf-t-shirt',
            'golf-tee' => 'golf-t-shirt',
            'golftee' => 'golf-t-shirt',
            'golftshirt' => 'golf-t-shirt',
        ];
        $normalized = $aliases[$raw] ?? $raw;

        if ($categorySlug === 'electronics') {
            return in_array($normalized, self::electronicsTypes(), true) ? $normalized : null;
        }
        if ($categorySlug === 'merchandise') {
            return in_array($normalized, self::merchandiseTypes(), true) ? $normalized : null;
        }

        if (in_array($normalized, self::electronicsTypes(), true) || in_array($normalized, self::merchandiseTypes(), true)) {
            return $normalized;
        }
        return null;
    }

    private static function categorySlugById(?int $categoryId): ?string
    {
        if (!$categoryId) {
            return null;
        }
        $row = Database::queryGet('SELECT slug FROM categories WHERE id = ?', [$categoryId]);
        return $row['slug'] ?? null;
    }

    public static function index(): void
    {
        $category = Request::query('category');
        $subcategory = self::normalizeSubcategory(Request::query('subcategory'), $category ?: null);
        $search = Request::query('search');
        $sort = Request::query('sort');
        $page = max(1, (int) Request::query('page', 1));
        $limit = max(1, (int) Request::query('limit', 12));

        $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug,
            (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id = p.id) as avg_rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
            FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1";
        $params = [];

        if ($category) {
            $sql .= ' AND c.slug = ?';
            $params[] = $category;
        }
        if ($subcategory) {
            $sql .= ' AND p.subcategory = ?';
            $params[] = $subcategory;
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

    public static function adminIndex(): void
    {
        Auth::authorize('admin');
        $products = Database::queryAll(
            "SELECT p.*, c.name as category_name, c.slug as category_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.updated_at DESC, p.created_at DESC"
        );
        Response::json(['products' => $products]);
    }

    public static function categories(): void
    {
        Response::json(Database::queryAll('SELECT * FROM categories ORDER BY name'));
    }

    public static function show(array $params): void
    {
        $row = Database::queryGet(
            'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p
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

        $categoryId = self::nullableInt($body['category_id'] ?? null);
        $categorySlug = self::categorySlugById($categoryId);
        if (!$categoryId || !in_array($categorySlug, ['merchandise', 'electronics'], true)) {
            Response::error('Please select Merchandise or Electronics', 400);
        }

        $subcategory = self::normalizeSubcategory($body['subcategory'] ?? null, $categorySlug);
        if ($categorySlug === 'electronics' && !$subcategory) {
            Response::error('Please select an electronics type (Laptop, Tablet, or Accessories)', 400);
        }
        if ($categorySlug === 'merchandise' && !$subcategory) {
            Response::error('Please select a merchandise type (Hoodie, T-shirt, Cap, or Golf t-shirt)', 400);
        }

        $imageUrl = Request::handleUpload($_FILES['image'] ?? null);
        $slug = Request::slugify($name) . '-' . time();

        $result = Database::queryRun(
            'INSERT INTO products (name, slug, description, price, compare_price, category_id, subcategory, image, stock, sizes, colors)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $name,
                $slug,
                self::nullableString($body['description'] ?? null),
                $body['price'] ?? 0,
                self::nullableDecimal($body['compare_price'] ?? null),
                $categoryId,
                $subcategory,
                $imageUrl,
                isset($body['stock']) && $body['stock'] !== '' ? (int) $body['stock'] : 0,
                $categorySlug === 'merchandise' ? self::nullableString($body['sizes'] ?? null) : null,
                self::nullableString($body['colors'] ?? null),
            ]
        );

        Response::json(['id' => $result['lastInsertRowid'], 'message' => 'Product created'], 201);
    }

    public static function update(array $params): void
    {
        Auth::authorizeAdmin();
        $json = [];
        try {
            $json = Request::jsonBody();
        } catch (Throwable $e) {
            $json = [];
        }
        $body = array_merge(is_array($json) ? $json : [], $_POST);
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::error('Invalid product id', 400);
        }

        $existing = Database::queryGet('SELECT id FROM products WHERE id = ?', [$id]);
        if (!$existing) {
            Response::error('Product not found', 404);
        }

        $fields = [];
        $sqlParams = [];

        if (array_key_exists('name', $body) && trim((string) $body['name']) !== '') {
            $fields[] = 'name = ?';
            $sqlParams[] = trim((string) $body['name']);
            $fields[] = 'slug = ?';
            $sqlParams[] = Request::slugify((string) $body['name']) . '-' . time();
        }
        if (array_key_exists('description', $body)) {
            $fields[] = 'description = ?';
            $sqlParams[] = $body['description'] !== '' ? $body['description'] : null;
        }
        if (array_key_exists('price', $body) && $body['price'] !== '' && $body['price'] !== null) {
            $fields[] = 'price = ?';
            $sqlParams[] = $body['price'];
        }
        if (array_key_exists('compare_price', $body)) {
            $fields[] = 'compare_price = ?';
            $sqlParams[] = self::nullableDecimal($body['compare_price']);
        }
        $categoryIdForSub = null;
        if (array_key_exists('category_id', $body)) {
            $categoryIdForSub = self::nullableInt($body['category_id']);
            $categorySlug = self::categorySlugById($categoryIdForSub);
            if (!$categoryIdForSub || !in_array($categorySlug, ['merchandise', 'electronics'], true)) {
                Response::error('Please select Merchandise or Electronics', 400);
            }
            $fields[] = 'category_id = ?';
            $sqlParams[] = $categoryIdForSub;
        } else {
            $current = Database::queryGet(
                'SELECT p.category_id, c.slug as category_slug FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
                [$id]
            );
            $categoryIdForSub = self::nullableInt($current['category_id'] ?? null);
            $categorySlug = $current['category_slug'] ?? null;
        }

        if (array_key_exists('subcategory', $body) || array_key_exists('category_id', $body)) {
            $subcategory = self::normalizeSubcategory($body['subcategory'] ?? null, $categorySlug);
            if ($categorySlug === 'electronics' && !$subcategory) {
                Response::error('Please select an electronics type (Laptop, Tablet, or Accessories)', 400);
            }
            if ($categorySlug === 'merchandise' && !$subcategory) {
                Response::error('Please select a merchandise type (Hoodie, T-shirt, Cap, or Golf t-shirt)', 400);
            }
            $fields[] = 'subcategory = ?';
            $sqlParams[] = $subcategory;
        }

        if (array_key_exists('stock', $body)) {
            $fields[] = 'stock = ?';
            $sqlParams[] = max(0, (int) $body['stock']);
        }
        if (array_key_exists('sizes', $body)) {
            $sizesValue = ($body['sizes'] === '' || $body['sizes'] === null) ? null : $body['sizes'];
            if (($categorySlug ?? null) === 'electronics') {
                $sizesValue = null;
            }
            $fields[] = 'sizes = ?';
            $sqlParams[] = $sizesValue;
        }
        if (array_key_exists('colors', $body)) {
            $fields[] = 'colors = ?';
            $sqlParams[] = ($body['colors'] === '' || $body['colors'] === null) ? null : $body['colors'];
        }
        if (array_key_exists('is_active', $body)) {
            $fields[] = 'is_active = ?';
            $sqlParams[] = (int) ((bool) $body['is_active']);
        }

        $imageUrl = Request::handleUpload($_FILES['image'] ?? null);
        if ($imageUrl) {
            $fields[] = 'image = ?';
            $sqlParams[] = $imageUrl;
        }

        if (!$fields) {
            Response::error('No fields to update', 400);
        }

        $fields[] = 'updated_at = NOW()';
        $sqlParams[] = $id;
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
