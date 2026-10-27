/** South African VAT — store prices are stored inclusive of VAT. */
export const VAT_RATE = 0.15;

export function formatRand(amount) {
  const n = Number(amount);
  return `R${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

/** Split a VAT-inclusive amount into excl. VAT, VAT, and total. */
export function vatFromInclusive(inclusive) {
  const total = Math.round((Number(inclusive) || 0) * 100) / 100;
  const excl = Math.round((total / (1 + VAT_RATE)) * 100) / 100;
  const vat = Math.round((total - excl) * 100) / 100;
  return { excl, vat, total, rate: VAT_RATE };
}

export function vatPercentLabel(rate = VAT_RATE) {
  return `${Math.round(rate * 100)}%`;
}
