<?php

/** Laptop and tablet brands carried by Mustek and Pinnacle (keep in sync with frontend/src/data/laptopBrands.js). */
class Brands
{
    private const LAPTOP_BRANDS = [
        'Acer', 'Apple', 'Asus', 'Dell', 'Dynabook', 'Fujitsu', 'Gigabyte', 'HONOR',
        'HP', 'Huawei', 'Lenovo', 'Mecer', 'MSI', 'Proline', 'Samsung',
    ];

    private const ALIASES = [
        'hp inc' => 'HP',
        'hewlett packard' => 'HP',
        'toshiba' => 'Dynabook',
        'dell technologies' => 'Dell',
        'ipad' => 'Apple',
        'macbook' => 'Apple',
        'galaxy tab' => 'Samsung',
        'matepad' => 'Huawei',
        'iconia' => 'Acer',
        'aspire' => 'Acer',
        'ideatab' => 'Lenovo',
        'ideapad' => 'Lenovo',
        'thinkpad' => 'Lenovo',
        'vivobook' => 'Asus',
        'zenbook' => 'Asus',
    ];

    /** Canonical brand name, or the trimmed input when it is not a known brand. */
    public static function normalize(?string $value): ?string
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return null;
        }
        $key = strtolower(preg_replace('/\s+(consumer|smb|device|commercial)$/i', '', $raw) ?? $raw);
        if (isset(self::ALIASES[$key])) {
            return self::ALIASES[$key];
        }
        foreach (self::LAPTOP_BRANDS as $brand) {
            if (strtolower($brand) === $key) {
                return $brand;
            }
        }
        return mb_substr($raw, 0, 80);
    }

    /** Known brand mentioned at the start of / inside a product name. */
    public static function fromName(string $name): ?string
    {
        $lower = ' ' . strtolower($name) . ' ';
        foreach (array_merge(array_keys(self::ALIASES), self::LAPTOP_BRANDS) as $candidate) {
            if (str_contains($lower, ' ' . strtolower($candidate) . ' ')) {
                return self::normalize($candidate);
            }
        }
        return null;
    }
}
