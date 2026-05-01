import { describe, expect, it } from 'vitest';

import { centsToDecimal, decimalToCents, formatMoney } from './format-money';

describe('formatMoney', () => {
  it('formats USD cents as currency', () => {
    expect(formatMoney(1234, 'USD')).toMatch(/\$12\.34/);
  });

  it('handles zero', () => {
    expect(formatMoney(0, 'USD')).toMatch(/\$0\.00/);
  });

  it('falls back gracefully on unknown currency code', () => {
    const out = formatMoney(1234, 'ZZZ');
    expect(out).toContain('12.34');
    expect(out).toContain('ZZZ');
  });
});

describe('decimalToCents', () => {
  it.each([
    ['0', 0],
    ['1', 100],
    ['12.5', 1250],
    ['12.50', 1250],
    ['0.99', 99],
    ['  3.14  ', 314],
  ])('parses %s as %i cents', (input, expected) => {
    expect(decimalToCents(input)).toBe(expected);
  });

  it.each(['', 'abc', '1.234', '-5', '5.'])('rejects invalid input %s', (input) => {
    expect(decimalToCents(input)).toBeNull();
  });
});

describe('centsToDecimal', () => {
  it('round-trips with decimalToCents', () => {
    for (const cents of [0, 1, 99, 100, 150, 9999, 100_000]) {
      const decimal = centsToDecimal(cents);
      expect(decimalToCents(decimal)).toBe(cents);
    }
  });
});
