import { describe, expect, it } from 'vitest';

import { formatMonth, isValidMonth, shiftMonth } from './month';

describe('isValidMonth', () => {
  it.each(['2025-01', '2025-12', '1999-06'])('accepts %s', (m) => {
    expect(isValidMonth(m)).toBe(true);
  });

  it.each(['2025-13', '2025-00', '2025-1', '25-01', '2025/01', ''])('rejects %s', (m) => {
    expect(isValidMonth(m)).toBe(false);
  });
});

describe('shiftMonth', () => {
  it('moves forward across year boundaries', () => {
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
  });

  it('moves backward across year boundaries', () => {
    expect(shiftMonth('2025-01', -1)).toBe('2024-12');
  });
});

describe('formatMonth', () => {
  it('formats as Month YYYY', () => {
    expect(formatMonth('2025-03')).toBe('March 2025');
  });
});
