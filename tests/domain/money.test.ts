import { describe, expect, it } from 'vitest';

import { formatCents, MAX_TRANSACTION_CENTS, parseAmount } from '@/domain/money';

describe('parseAmount', () => {
  it.each([
    ['25', 2500],
    ['25.5', 2550],
    ['25.50', 2550],
    ['0.01', 1],
    ['$100', 10000],
    ['  10.00  ', 1000],
    ['1000000000', MAX_TRANSACTION_CENTS],
  ])('parses %s into %d cents', (input, cents) => {
    expect(parseAmount(input)).toEqual({ ok: true, cents });
  });

  it.each([
    [''],
    ['   '],
    ['abc'],
    ['-5'],
    ['1.234'],
    ['1,000'],
    ['10.'],
    ['.50'],
    ['1e3'],
    ['Infinity'],
  ])('rejects malformed input %j', (input) => {
    const result = parseAmount(input);
    expect(result.ok).toBe(false);
  });

  it('rejects zero', () => {
    expect(parseAmount('0')).toEqual({
      ok: false,
      error: 'Amount must be greater than zero',
    });
    expect(parseAmount('0.00').ok).toBe(false);
  });

  it('rejects amounts above the maximum', () => {
    expect(parseAmount('1000000000.01').ok).toBe(false);
  });

  it('avoids floating-point drift on decimal inputs', () => {
    // 19.99 * 100 === 1998.9999999999998 in floating point.
    expect(parseAmount('19.99')).toEqual({ ok: true, cents: 1999 });
  });
});

describe('formatCents', () => {
  it('formats cents in the default currency (USD) with grouping', () => {
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(1)).toBe('$0.01');
    expect(formatCents(123456)).toBe('$1,234.56');
  });

  it('formats cents in an explicitly passed currency', () => {
    expect(formatCents(123456, 'EUR')).toBe('€1,234.56');
  });
});
