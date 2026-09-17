<?php

/**
 * Per-colour stock helpers.
 * Stored as JSON object: {"Black":10,"White":5}
 */
class ColorStock
{
    /** @return array<string,int> */
    public static function decode(?string $raw): array
    {
        if ($raw === null || trim($raw) === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }
        $out = [];
        foreach ($decoded as $key => $value) {
            if (is_array($value) && isset($value['name'])) {
                $name = trim((string) $value['name']);
                $qty = (int) ($value['stock'] ?? $value['qty'] ?? 0);
            } else {
                $name = trim((string) $key);
                $qty = (int) $value;
            }
            if ($name === '') {
                continue;
            }
            $out[$name] = max(0, $qty);
        }
        return $out;
    }

    /** @param array<string,int>|list<array{name:string,stock?:int|string}> $map */
    public static function encode(array $map): ?string
    {
        $normalized = [];
        foreach ($map as $key => $value) {
            if (is_array($value) && isset($value['name'])) {
                $name = trim((string) $value['name']);
                $qty = (int) ($value['stock'] ?? 0);
            } else {
                $name = trim((string) $key);
                $qty = (int) $value;
            }
            if ($name === '') {
                continue;
            }
            $normalized[$name] = max(0, $qty);
        }
        if (!$normalized) {
            return null;
        }
        return json_encode($normalized, JSON_UNESCAPED_UNICODE);
    }

    /** @return list<string> */
    public static function colorNames(array $map): array
    {
        return array_keys($map);
    }

    public static function total(array $map): int
    {
        $sum = 0;
        foreach ($map as $qty) {
            $sum += max(0, (int) $qty);
        }
        return $sum;
    }

    public static function available(array $map, ?string $color, int $fallbackStock): int
    {
        if (!$map) {
            return max(0, $fallbackStock);
        }
        $color = trim((string) $color);
        if ($color === '') {
            return 0;
        }
        foreach ($map as $name => $qty) {
            if (strcasecmp((string) $name, $color) === 0) {
                return max(0, (int) $qty);
            }
        }
        return 0;
    }

    /**
     * Deduct quantity from a colour (and keep total stock in sync).
     * @return array{color_stock:?string,stock:int}
     */
    public static function deduct(array $map, ?string $color, int $qty, int $fallbackStock): array
    {
        $qty = max(0, $qty);
        if (!$map) {
            return [
                'color_stock' => null,
                'stock' => max(0, $fallbackStock - $qty),
            ];
        }
        $color = trim((string) $color);
        $found = false;
        foreach ($map as $name => $stock) {
            if (strcasecmp((string) $name, $color) === 0) {
                $map[$name] = max(0, (int) $stock - $qty);
                $found = true;
                break;
            }
        }
        if (!$found) {
            throw new RuntimeException('Selected colour is not available');
        }
        return [
            'color_stock' => self::encode($map),
            'stock' => self::total($map),
        ];
    }

    /**
     * Build map from request: color_stock JSON and/or colors list + stock.
     * @return array{map: array<string,int>, colorsJson: ?string, total: int}
     */
    public static function fromRequest(array $body, ?string $existingColorStock = null): array
    {
        $rawStock = $body['color_stock'] ?? null;
        if (is_string($rawStock) && trim($rawStock) !== '') {
            $map = self::decode($rawStock);
        } elseif (is_array($rawStock)) {
            $map = self::decode(json_encode($rawStock));
        } else {
            $map = [];
        }

        if (!$map) {
            // Fall back to colours list with shared stock split not applied — keep existing map if colours unchanged
            $colorsRaw = $body['colors'] ?? null;
            $names = [];
            if (is_string($colorsRaw) && trim($colorsRaw) !== '') {
                $decoded = json_decode($colorsRaw, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $item) {
                        if (is_array($item) && isset($item['name'])) {
                            $names[] = trim((string) $item['name']);
                        } else {
                            $names[] = trim((string) $item);
                        }
                    }
                } else {
                    foreach (explode(',', $colorsRaw) as $part) {
                        $part = trim($part);
                        if ($part !== '') {
                            $names[] = $part;
                        }
                    }
                }
            }
            $names = array_values(array_filter($names));
            if ($names) {
                $existing = self::decode($existingColorStock);
                $defaultQty = isset($body['stock']) && $body['stock'] !== ''
                    ? max(0, (int) $body['stock'])
                    : 0;
                foreach ($names as $name) {
                    $map[$name] = array_key_exists($name, $existing)
                        ? (int) $existing[$name]
                        : $defaultQty;
                }
            }
        }

        $colorsJson = $map ? json_encode(self::colorNames($map), JSON_UNESCAPED_UNICODE) : null;
        if (!$map && isset($body['colors']) && is_string($body['colors']) && trim($body['colors']) !== '') {
            // Plain colours without per-colour stock
            $colorsJson = self::normalizeColorsList($body['colors']);
        }

        $total = $map ? self::total($map) : (isset($body['stock']) && $body['stock'] !== '' ? max(0, (int) $body['stock']) : 0);

        return [
            'map' => $map,
            'colorsJson' => $colorsJson,
            'colorStockJson' => self::encode($map),
            'total' => $total,
        ];
    }

    private static function normalizeColorsList(string $raw): ?string
    {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $names = [];
            foreach ($decoded as $item) {
                $name = is_array($item) ? trim((string) ($item['name'] ?? '')) : trim((string) $item);
                if ($name !== '') {
                    $names[] = $name;
                }
            }
            return $names ? json_encode($names, JSON_UNESCAPED_UNICODE) : null;
        }
        $names = array_values(array_filter(array_map('trim', explode(',', $raw))));
        return $names ? json_encode($names, JSON_UNESCAPED_UNICODE) : null;
    }
}
