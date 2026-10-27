<?php

/**
 * Size / capacity options stored in products.sizes.
 * Either a JSON list of names (["S","M"]) or a JSON object of name => price
 * ({"16 GB": 129.99, "32 GB": null}); a null/zero price means "use the base price".
 */
class ProductOptions
{
    /** @return array<string,?float> option name => price override (null = base price) */
    public static function decode(?string $raw): array
    {
        if ($raw === null || trim($raw) === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            $out = [];
            foreach (explode(',', $raw) as $part) {
                $name = trim($part);
                if ($name !== '') {
                    $out[$name] = null;
                }
            }
            return $out;
        }

        $out = [];
        $isList = array_is_list($decoded);
        foreach ($decoded as $key => $value) {
            if ($isList) {
                $name = trim((string) (is_array($value) ? ($value['name'] ?? '') : $value));
                $price = is_array($value) ? ($value['price'] ?? null) : null;
            } else {
                $name = trim((string) $key);
                $price = $value;
            }
            if ($name === '') {
                continue;
            }
            $out[$name] = (is_numeric($price) && (float) $price > 0) ? round((float) $price, 2) : null;
        }
        return $out;
    }

    /** Normalise admin input into the stored JSON, or null when there are no options. */
    public static function encode(mixed $raw): ?string
    {
        if ($raw === null || (is_string($raw) && trim($raw) === '')) {
            return null;
        }
        $map = self::decode(is_string($raw) ? $raw : json_encode($raw));
        if (!$map) {
            return null;
        }
        $hasPrices = false;
        foreach ($map as $price) {
            if ($price !== null) {
                $hasPrices = true;
                break;
            }
        }
        return $hasPrices
            ? json_encode($map, JSON_UNESCAPED_UNICODE)
            : json_encode(array_keys($map), JSON_UNESCAPED_UNICODE);
    }

    /** Matching option name (case-insensitive), or null when not offered. */
    public static function match(array $map, ?string $option): ?string
    {
        $wanted = strtolower(trim((string) $option));
        if ($wanted === '') {
            return null;
        }
        foreach (array_keys($map) as $name) {
            if (strtolower($name) === $wanted) {
                return $name;
            }
        }
        return null;
    }

    public static function priceFor(?string $sizesRaw, ?string $option, float $basePrice): float
    {
        $map = self::decode($sizesRaw);
        $name = self::match($map, $option);
        if ($name !== null && $map[$name] !== null) {
            return (float) $map[$name];
        }
        return $basePrice;
    }
}
