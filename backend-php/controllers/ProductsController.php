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
    private static function storeDepartments(): array
    {
        return ['merchandise', 'electronics', 'accessories'];
    }

    /** @return list<string> */
    private static function electronicsTypes(): array
    {
        return ['laptop', 'tablet'];
    }

    /** @return list<string> */
    private static function merchandiseTypes(): array
    {
        return ['hoodie', 't-shirt', 'cap', 'golf-t-shirt'];
    }

    /** @return list<string> */
    private static function accessoriesTypes(): array
    {
        return ['bags', 'usb', 'headphones', 'powerbank', 'cameras'];
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
            'bag' => 'bags',
            'backpack' => 'bags',
            'backpacks' => 'bags',
            'tote' => 'bags',
            'totes' => 'bags',
            'usbs' => 'usb',
            'usb-stick' => 'usb',
            'usb-sticks' => 'usb',
            'flash-drive' => 'usb',
            'flashdrive' => 'usb',
            'thumb-drive' => 'usb',
            'headphone' => 'headphones',
            'earphone' => 'headphones',
            'earphones' => 'headphones',
            'earbuds' => 'headphones',
            'earbud' => 'headphones',
            'headset' => 'headphones',
            'headsets' => 'headphones',
            'power-bank' => 'powerbank',
            'power-banks' => 'powerbank',
            'powerbanks' => 'powerbank',
            'camera' => 'cameras',
            'webcam' => 'cameras',
            'webcams' => 'cameras',
            'cam' => 'cameras',
            'cams' => 'cameras',
        ];
        $normalized = $aliases[$raw] ?? $raw;

        if ($categorySlug === 'electronics') {
            return in_array($normalized, self::electronicsTypes(), true) ? $normalized : null;
        }
        if ($categorySlug === 'merchandise') {
            return in_array($normalized, self::merchandiseTypes(), true) ? $normalized : null;
        }
        if ($categorySlug === 'accessories') {
            return in_array($normalized, self::accessoriesTypes(), true) ? $normalized : null;
        }

        if (
            in_array($normalized, self::electronicsTypes(), true)
            || in_array($normalized, self::merchandiseTypes(), true)
            || in_array($normalized, self::accessoriesTypes(), true)
        ) {
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
        $limit = max(1, min(200, (int) Request::query('limit', 100)));

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
        SchemaEnsure::products();
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
        Auth::authorizeAdmin();
        SchemaEnsure::products();

        $body = array_merge(Request::jsonBody(), $_POST);
        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            Response::error('Name is required', 400);
        }

        $categoryId = self::nullableInt($body['category_id'] ?? null);
        $categorySlug = self::categorySlugById($categoryId);
        if (!$categoryId || !in_array($categorySlug, self::storeDepartments(), true)) {
            Response::error('Please select Merchandise, Electronics, or Accessories', 400);
        }

        $subcategory = self::normalizeSubcategory($body['subcategory'] ?? null, $categorySlug);
        if ($categorySlug === 'electronics' && !$subcategory) {
            Response::error('Please select an electronics type (Laptop or Tablet)', 400);
        }
        if ($categorySlug === 'merchandise' && !$subcategory) {
            Response::error('Please select a merchandise type (Hoodie, T-shirt, Cap, or Golf t-shirt)', 400);
        }
        if ($categorySlug === 'accessories' && !$subcategory) {
            Response::error('Please select an accessories type (Bags, USB, Headphones, Powerbank, or Cameras)', 400);
        }

        $imageUrl = Request::handleUpload($_FILES['image'] ?? null);
        if (!$imageUrl) {
            Response::error('Please choose a product image (JPG, PNG, GIF, or WebP)', 400);
        }
        $slug = Request::slugify($name) . '-' . time();

        $colorInfo = ColorStock::fromRequest($body);
        $stockTotal = $colorInfo['map']
            ? $colorInfo['total']
            : (isset($body['stock']) && $body['stock'] !== '' ? max(0, (int) $body['stock']) : 0);
        $colorsValue = $colorInfo['colorsJson'] ?? self::nullableString($body['colors'] ?? null);

        try {
            $result = Database::queryRun(
                'INSERT INTO products (name, slug, description, price, compare_price, category_id, subcategory, image, stock, sizes, colors, color_stock)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $name,
                    $slug,
                    self::nullableString($body['description'] ?? null),
                    $body['price'] ?? 0,
                    self::nullableDecimal($body['compare_price'] ?? null),
                    $categoryId,
                    $subcategory,
                    $imageUrl,
                    $stockTotal,
                    $categorySlug === 'merchandise' ? self::nullableString($body['sizes'] ?? null) : null,
                    $colorsValue,
                    $colorInfo['colorStockJson'],
                ]
            );
        } catch (Throwable $e) {
            SchemaEnsure::products();
            if (stripos($e->getMessage(), 'Unknown column') !== false || stripos($e->getMessage(), '42S22') !== false) {
                // Retry without color_stock if column missing mid-flight
                try {
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
                            $stockTotal,
                            $categorySlug === 'merchandise' ? self::nullableString($body['sizes'] ?? null) : null,
                            $colorsValue,
                        ]
                    );
                } catch (Throwable $e2) {
                    Response::error(
                        'Database schema is out of date. Import backend-php/database/UPGRADE-LIVE-VIA-PHPMYADMIN.sql in phpMyAdmin, then try again.',
                        500
                    );
                }
            } else {
                throw $e;
            }
        }

        Response::json(['id' => $result['lastInsertRowid'], 'message' => 'Product created', 'image' => $imageUrl], 201);
    }

    public static function update(array $params): void
    {
        Auth::authorizeAdmin();
        SchemaEnsure::products();
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

        $existing = Database::queryGet('SELECT id, color_stock FROM products WHERE id = ?', [$id]);
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
            if (!$categoryIdForSub || !in_array($categorySlug, self::storeDepartments(), true)) {
                Response::error('Please select Merchandise, Electronics, or Accessories', 400);
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
                Response::error('Please select an electronics type (Laptop or Tablet)', 400);
            }
            if ($categorySlug === 'merchandise' && !$subcategory) {
                Response::error('Please select a merchandise type (Hoodie, T-shirt, Cap, or Golf t-shirt)', 400);
            }
            if ($categorySlug === 'accessories' && !$subcategory) {
                Response::error('Please select an accessories type (Bags, USB, Headphones, Powerbank, or Cameras)', 400);
            }
            $fields[] = 'subcategory = ?';
            $sqlParams[] = $subcategory;
        }

        if (array_key_exists('color_stock', $body) || array_key_exists('colors', $body)) {
            $colorInfo = ColorStock::fromRequest($body, $existing['color_stock'] ?? null);
            $fields[] = 'colors = ?';
            $sqlParams[] = $colorInfo['colorsJson'];
            $fields[] = 'color_stock = ?';
            $sqlParams[] = $colorInfo['colorStockJson'];
            if ($colorInfo['map']) {
                $fields[] = 'stock = ?';
                $sqlParams[] = $colorInfo['total'];
            } elseif (array_key_exists('stock', $body)) {
                $fields[] = 'stock = ?';
                $sqlParams[] = max(0, (int) $body['stock']);
            } elseif ($colorInfo['colorsJson'] === null) {
                // Colours cleared — keep stock as provided or unchanged
                if (array_key_exists('stock', $body)) {
                    $fields[] = 'stock = ?';
                    $sqlParams[] = max(0, (int) $body['stock']);
                }
            }
        } elseif (array_key_exists('stock', $body)) {
            $fields[] = 'stock = ?';
            $sqlParams[] = max(0, (int) $body['stock']);
        }
        if (array_key_exists('sizes', $body)) {
            $sizesValue = ($body['sizes'] === '' || $body['sizes'] === null) ? null : $body['sizes'];
            if (($categorySlug ?? null) !== 'merchandise') {
                $sizesValue = null;
            }
            $fields[] = 'sizes = ?';
            $sqlParams[] = $sizesValue;
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
