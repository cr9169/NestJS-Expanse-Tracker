/**
 * Format integer cents as a currency string for display.
 * Cents-as-integer is the canonical wire format — never compute on these values
 * with floating point arithmetic; only format for display.
 */
export function formatMoney(amountCents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    // Unknown currency code — fall back to bare numeric.
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

/**
 * Convert a user-typed decimal string (e.g. "12.50") to integer cents (1250).
 * Returns null if the input is not a valid non-negative decimal.
 */
export function decimalToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, frac = ''] = trimmed.split('.');
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isFinite(cents) ? cents : null;
}

export function centsToDecimal(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : '';
  const abs = Math.abs(amountCents);
  const whole = Math.floor(abs / 100);
  const frac = (abs % 100).toString().padStart(2, '0');
  return `${sign}${whole}.${frac}`;
}
