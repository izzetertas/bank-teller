/**
 * All monetary values are handled as integer cents. Floating-point dollar
 * arithmetic (0.1 + 0.2 !== 0.3) is never used for balances.
 */

/** Upper bound for a single transaction: $1,000,000,000.00 in cents. */
export const MAX_TRANSACTION_CENTS = 100_000_000_000;

export type ParseAmountResult =
  | { ok: true; cents: number }
  | { ok: false; error: string };

const AMOUNT_PATTERN = /^\$?\d+(\.\d{1,2})?$/;

/**
 * Parses a user-entered dollar amount (e.g. "25", "25.5", "$25.50") into
 * integer cents. Rejects anything non-positive, malformed, or above
 * MAX_TRANSACTION_CENTS.
 */
export function parseAmount(input: string): ParseAmountResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Enter an amount' };
  }

  if (!AMOUNT_PATTERN.test(trimmed)) {
    return { ok: false, error: 'Enter a valid amount, e.g. 25.00' };
  }

  const dollars = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
  const [wholePart = '0', fractionPart = ''] = dollars.split('.');
  const cents =
    Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0') || '0');

  if (cents === 0) {
    return { ok: false, error: 'Amount must be greater than zero' };
  }

  if (cents > MAX_TRANSACTION_CENTS) {
    return {
      ok: false,
      error: `Amount exceeds the maximum of ${formatCents(MAX_TRANSACTION_CENTS)}`,
    };
  }

  return { ok: true, cents };
}

/** ISO 4217 code the app operates in; every formatter defaults to it. */
export const CURRENCY = 'USD';

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats integer cents as a currency string, e.g. 123456 -> "$1,234.56". */
export function formatCents(cents: number, currency: string = CURRENCY): string {
  let formatter = formatters.get(currency);

  if (formatter === undefined) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    formatters.set(currency, formatter);
  }

  return formatter.format(cents / 100);
}
