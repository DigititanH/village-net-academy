<?php

class MustekController
{
    public static function status(): void
    {
        Auth::authorizeAdmin();
        Response::json([
            'configured' => Mustek::isConfigured(),
            'markup' => Mustek::markup(),
            'vat_rate' => Mustek::vatRate(),
        ]);
    }

    /** GET /api/mustek/image?sku=... (public, cached proxy) */
    public static function image(): void
    {
        MustekImage::serve();
    }

    /** GET /api/mustek/catalog — browse the Mustek feed for the admin picker. */
    public static function catalog(): void
    {
        Auth::authorizeAdmin();
        SchemaEnsure::products();

        try {
            $items = Mustek::fetchItemsStock(Request::query('refresh') !== '1');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 502);
        }

        $search = strtolower(trim((string) Request::query('search', '')));
        $productLine = trim((string) Request::query('product_line', ''));
        $onlyInStock = Request::query('only_in_stock', '1') !== '0';
        $onlyActive = Request::query('only_active', '1') !== '0';
        $excludeExisting = Request::query('exclude_existing', '1') !== '0';
        $skip = max(0, (int) Request::query('skip', 0));
        $limit = min(max(1, (int) Request::query('limit', 50)), 200);
        $markup = Mustek::markup();

        $existing = [];
        foreach (Database::queryAll("SELECT mustek_sku FROM products WHERE mustek_sku IS NOT NULL AND mustek_sku <> ''") as $row) {
            $existing[strtolower((string) $row['mustek_sku'])] = true;
        }

        $lines = [];
        $filtered = [];
        foreach ($items as $item) {
            $line = (string) ($item['product_line'] ?? '');
            if ($line !== '') {
                $lines[$line] = true;
            }
            if ($onlyActive && !Mustek::isActive($item)) {
                continue;
            }
            if ($onlyInStock && (int) $item['qty_available'] <= 0) {
                continue;
            }
            if ($productLine !== '' && strcasecmp($line, $productLine) !== 0) {
                continue;
            }
            $inStore = isset($existing[strtolower((string) $item['item_id'])]);
            if ($excludeExisting && $inStore) {
                continue;
            }
            if ($search !== '') {
                $hay = strtolower($item['item_id'] . ' ' . $item['description'] . ' ' . $line);
                foreach (preg_split('/\s+/', $search) ?: [] as $term) {
                    if ($term !== '' && !str_contains($hay, $term)) {
                        continue 2;
                    }
                }
            }
            $cost = (float) $item['price'];
            $filtered[] = [
                'item_id' => $item['item_id'],
                'name' => Mustek::productName((string) $item['description'], (string) $item['item_id']),
                'description' => $item['description'],
                'qty_available' => (int) $item['qty_available'],
                'cost_price' => $cost,
                'sell_price_excl_vat' => round($cost * $markup, 2),
                'sell_price' => Mustek::sellPrice($cost, $markup),
                'product_line' => $line,
                'image_url' => self::imageFor($item),
                'preview_url' => self::imageFor($item, true),
                'already_in_store' => $inStore,
            ];
        }

        $lineList = array_keys($lines);
        natcasesort($lineList);

        Response::json([
            'items' => array_values(array_slice($filtered, $skip, $limit)),
            'total' => count($filtered),
            'skip' => $skip,
            'limit' => $limit,
            'markup' => $markup,
            'vat_rate' => Mustek::vatRate(),
            'product_lines' => array_values($lineList),
        ]);
    }

    /**
     * POST /api/mustek/import
     * Body: { category_id, subcategory, skus: [...], items?: [...], markup? }
     */
    public static function import(): void
    {
        Auth::authorizeAdmin();
        SchemaEnsure::products();

        $input = Request::jsonBody();
        $categoryId = (int) ($input['category_id'] ?? 0);
        $categorySlug = ProductsController::categorySlugById($categoryId ?: null);
        if (!$categoryId || !in_array($categorySlug, ProductsController::storeDepartments(), true)) {
            Response::error('Please select Merchandise, Electronics, or Accessories', 422);
        }
        $subcategory = ProductsController::normalizeSubcategory($input['subcategory'] ?? null, $categorySlug);
        if (!$subcategory) {
            Response::error('Please choose a product type for this department', 422);
        }
        $markup = Mustek::markup($input['markup'] ?? null);

        /** @var array<string, array<string, mixed>> $bySku */
        $bySku = [];
        foreach ((array) ($input['items'] ?? []) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $id = trim((string) ($row['item_id'] ?? ''));
            if ($id === '') {
                continue;
            }
            $bySku[self::key($id)] = [
                'item_id' => $id,
                'description' => (string) ($row['description'] ?? $row['name'] ?? $id),
                'qty_available' => (int) ($row['qty_available'] ?? 0),
                'price' => (float) ($row['cost_price'] ?? $row['price'] ?? 0),
                'image_url' => (string) ($row['image_url'] ?? ''),
                'product_line' => (string) ($row['product_line'] ?? ''),
            ];
        }

        $wanted = [];
        foreach ((array) ($input['skus'] ?? array_column($bySku, 'item_id')) as $sku) {
            $sku = trim((string) $sku);
            if ($sku !== '' && !in_array($sku, $wanted, true)) {
                $wanted[] = $sku;
            }
        }
        if ($wanted === []) {
            Response::error('Select at least one Mustek product', 422);
        }

        foreach ($wanted as $sku) {
            if (isset($bySku[self::key($sku)])) {
                continue;
            }
            try {
                foreach (Mustek::fetchItemsStock() as $item) {
                    $bySku[self::key((string) $item['item_id'])] ??= array_merge($item, ['image_url' => self::imageFor($item)]);
                }
            } catch (Throwable $e) {
                Response::error('Could not refresh Mustek feed: ' . $e->getMessage(), 502);
            }
            break;
        }

        $created = 0;
        $updated = 0;
        $missing = [];
        $errors = [];
        foreach ($wanted as $sku) {
            $item = $bySku[self::key($sku)] ?? null;
            if ($item === null) {
                $missing[] = $sku;
                continue;
            }
            $cost = (float) $item['price'];
            $sell = Mustek::sellPrice($cost, $markup);
            $image = trim((string) ($item['image_url'] ?? '')) ?: MustekImage::urlForSku($sku);
            $existing = Database::queryGet('SELECT id FROM products WHERE mustek_sku = ? LIMIT 1', [$sku]);
            $brand = Brands::normalize((string) ($item['product_line'] ?? ''))
                ?? Brands::fromName((string) ($item['description'] ?? ''));

            try {
                if ($existing) {
                    Database::queryRun(
                        'UPDATE products SET stock = ?, mustek_cost = ?, price = ?, category_id = ?, subcategory = ?,
                         image = COALESCE(NULLIF(image, ""), ?), brand = COALESCE(brand, ?),
                         mustek_synced_at = NOW(), updated_at = NOW()
                         WHERE id = ?',
                        [(int) $item['qty_available'], $cost, $sell, $categoryId, $subcategory, $image, $brand, $existing['id']]
                    );
                    $updated++;
                    continue;
                }

                $name = Mustek::productName((string) ($item['description'] ?? ''), $sku);
                $description = trim((string) ($item['description'] ?? ''));
                Database::queryRun(
                    'INSERT INTO products (name, slug, description, price, category_id, subcategory, image, stock,
                        is_active, mustek_sku, mustek_cost, mustek_synced_at, brand)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(), ?)',
                    [
                        $name,
                        substr(Request::slugify('mustek-' . $sku), 0, 200) . '-' . time(),
                        $description !== '' ? $description : null,
                        $sell,
                        $categoryId,
                        $subcategory,
                        $image,
                        (int) $item['qty_available'],
                        $sku,
                        $cost,
                        $brand,
                    ]
                );
                $created++;
            } catch (Throwable $e) {
                $errors[] = ['sku' => $sku, 'error' => $e->getMessage()];
            }
        }

        if ($created === 0 && $updated === 0) {
            $msg = 'No products were imported.';
            if ($missing) {
                $msg .= ' Missing SKUs: ' . implode(', ', array_slice($missing, 0, 5));
            }
            if ($errors) {
                $msg .= ' ' . $errors[0]['error'];
            }
            Response::error($msg, 422);
        }

        Response::json([
            'ok' => true,
            'created' => $created,
            'updated' => $updated,
            'missing' => $missing,
            'errors' => $errors,
            'markup' => $markup,
        ]);
    }

    /** POST /api/mustek/sync — update prices, stock and specials of Mustek-linked products. */
    public static function sync(): void
    {
        Auth::authorizeAdmin();
        SchemaEnsure::products();
        Mustek::clearCache();
        try {
            $result = self::runSync(Request::jsonBody());
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 502);
        }
        Response::json($result);
    }

    /** GET|POST /api/cron/mustek-sync?key=MUSTEK_CRON_KEY */
    public static function cron(): void
    {
        $expected = trim((string) Env::get('MUSTEK_CRON_KEY', ''));
        $given = (string) ($_GET['key'] ?? $_SERVER['HTTP_X_CRON_KEY'] ?? '');
        if ($expected === '' || !hash_equals($expected, $given)) {
            Response::error('Not found', 404);
        }
        @set_time_limit(600);
        ignore_user_abort(true);
        SchemaEnsure::products();
        Mustek::clearCache();
        try {
            $result = self::runSync([]);
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 502);
        }
        Response::json(['ok' => true, 'stats' => $result['stats']]);
    }

    /** @return array<string, mixed> */
    private static function runSync(array $input): array
    {
        $dryRun = filter_var($input['dry_run'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $markup = Mustek::markup($input['markup'] ?? null);
        try {
            $items = Mustek::fetchItemsStock(false);
        } catch (Throwable $e) {
            throw new RuntimeException($e->getMessage(), 0, $e);
        }

        $linked = [];
        foreach (Database::queryAll("SELECT * FROM products WHERE mustek_sku IS NOT NULL AND mustek_sku <> ''") as $row) {
            $linked[strtolower((string) $row['mustek_sku'])] = $row;
        }

        $stats = [
            'fetched' => count($items),
            'linked' => count($linked),
            'updated' => 0,
            'not_in_feed' => 0,
            'errors' => 0,
            'specials_started' => 0,
            'specials_ended' => 0,
            'dry_run' => $dryRun,
            'markup' => $markup,
        ];
        $specials = ['started' => [], 'ended' => []];
        $seen = [];

        foreach ($items as $item) {
            $product = $linked[strtolower((string) $item['item_id'])] ?? null;
            if ($product === null) {
                continue;
            }
            $seen[(int) $product['id']] = true;
            $cost = (float) $item['price'];
            $sell = Mustek::sellPrice($cost, $markup);
            $special = self::specialFor($product, $sell);
            if ($special['event'] !== null) {
                $specials[$special['event'] === 'ended' ? 'ended' : 'started'][] = self::specialRow($product, $sell, $special);
            }
            if (!$dryRun) {
                $hasColourStock = trim((string) ($product['color_stock'] ?? '')) !== '';
                try {
                    Database::queryRun(
                        'UPDATE products SET mustek_cost = ?, price = ?, compare_price = ?, mustek_special = ?,
                         stock = ?, image = COALESCE(NULLIF(image, ""), ?), mustek_synced_at = NOW(), updated_at = NOW()
                         WHERE id = ?',
                        [
                            $cost,
                            $sell,
                            $special['compare'],
                            $special['flag'],
                            $hasColourStock ? (int) $product['stock'] : (int) $item['qty_available'],
                            self::imageFor($item),
                            $product['id'],
                        ]
                    );
                } catch (Throwable $e) {
                    $stats['errors']++;
                    continue;
                }
            }
            $stats['updated']++;
        }

        // Linked products Mustek no longer lists are treated as out of stock.
        foreach ($linked as $product) {
            if (isset($seen[(int) $product['id']])) {
                continue;
            }
            $stats['not_in_feed']++;
            if (!$dryRun && trim((string) ($product['color_stock'] ?? '')) === '') {
                Database::queryRun('UPDATE products SET stock = 0, mustek_synced_at = NOW() WHERE id = ?', [$product['id']]);
            }
        }

        $stats['specials_started'] = count($specials['started']);
        $stats['specials_ended'] = count($specials['ended']);
        if (!$dryRun) {
            AdminNotify::mustekSpecials($specials['started'], $specials['ended']);
        }

        return ['ok' => true, 'stats' => $stats, 'specials' => $specials];
    }

    /**
     * Mustek's feed has a single price, so a special is inferred from a drop of
     * at least MUSTEK_SPECIAL_MIN_DROP; it ends once the price recovers.
     * Sales an admin set by hand (mustek_special = 0) are left alone.
     *
     * @return array{compare: ?float, flag: int, event: ?string}
     */
    private static function specialFor(array $before, float $sell): array
    {
        $oldPrice = (float) ($before['price'] ?? 0);
        $oldCompare = isset($before['compare_price']) && $before['compare_price'] !== null && $before['compare_price'] !== ''
            ? (float) $before['compare_price']
            : null;
        $flag = (int) ($before['mustek_special'] ?? 0);
        $minDrop = min(0.9, max(0.0, (float) (Env::get('MUSTEK_SPECIAL_MIN_DROP', '0.05') ?: '0.05')));
        $bigDrop = $oldPrice > 0 && $sell <= $oldPrice * (1 - $minDrop) + 0.009;

        if ($flag === 0 && $oldCompare !== null && $oldCompare > $oldPrice) {
            return ['compare' => $oldCompare, 'flag' => 0, 'event' => null];
        }
        if ($flag === 1 && $oldCompare !== null) {
            if ($sell < $oldCompare - 0.009) {
                return ['compare' => $oldCompare, 'flag' => 1, 'event' => $bigDrop ? 'deeper' : null];
            }
            return ['compare' => null, 'flag' => 0, 'event' => 'ended'];
        }
        if ($bigDrop) {
            return ['compare' => $oldPrice, 'flag' => 1, 'event' => 'started'];
        }
        return ['compare' => null, 'flag' => 0, 'event' => null];
    }

    /** @return array<string, mixed> */
    private static function specialRow(array $before, float $sell, array $special): array
    {
        $was = $special['event'] === 'ended'
            ? (float) ($before['compare_price'] ?? $before['price'] ?? 0)
            : (float) ($special['compare'] ?? $before['price'] ?? 0);
        return [
            'id' => (int) ($before['id'] ?? 0),
            'sku' => (string) ($before['mustek_sku'] ?? ''),
            'name' => (string) ($before['name'] ?? ''),
            'was' => round($was, 2),
            'now' => round($sell, 2),
            'event' => $special['event'],
        ];
    }

    private static function imageFor(array $item, bool $thumb = false): string
    {
        $url = (string) ($item['image_url'] ?? '') ?: (string) ($item['thumbnail_url'] ?? '');
        if ($url !== '') {
            return (string) MustekImage::proxyUrl($url, $thumb);
        }
        return MustekImage::urlForSku((string) $item['item_id'], $thumb);
    }

    /** Prefix keys so PHP does not cast numeric SKUs to int. */
    private static function key(string $sku): string
    {
        return 'sku:' . strtolower($sku);
    }
}
