<?php

/**
 * Commission / affiliation constants for resellers and centres.
 */
class Commission
{
    /** Reseller share of product sales (affiliated or independent). */
    public const RESELLER_RATE = 53.00;

    /** Centre / academy share of referred sales. */
    public const ACADEMY_RATE = 26.00;

    /** Auto-assigned when an independent reseller does not enter a centre. */
    public const PROGRAMME_CENTRE = 'Digititan Programme';

    public static function normalizeCentreName(string $name): string
    {
        return trim(preg_replace('/\s+/', ' ', $name) ?? $name);
    }

    public static function isProgrammeCentre(string $name): bool
    {
        $n = strtolower(self::normalizeCentreName($name));
        return $n === strtolower(self::PROGRAMME_CENTRE)
            || $n === 'digititan'
            || $n === 'programme'
            || $n === 'program'
            || $n === 'village netacad programme';
    }

    /** @return array{affiliation: string, affiliation_label: string, centre: string, centre_display: string, reseller_rate: float, centre_rate: float} */
    public static function resellerAffiliationInfo(?string $academy): array
    {
        $centre = self::normalizeCentreName((string) $academy);
        $independent = self::isProgrammeCentre($centre);

        return [
            'affiliation' => $independent ? 'independent' : 'affiliated',
            'affiliation_label' => $independent ? 'Independent' : 'Affiliated',
            'centre' => $centre !== '' ? $centre : '—',
            'centre_display' => $independent ? self::PROGRAMME_CENTRE : ($centre !== '' ? $centre : '—'),
            'reseller_rate' => self::RESELLER_RATE,
            'centre_rate' => self::ACADEMY_RATE,
        ];
    }
}
