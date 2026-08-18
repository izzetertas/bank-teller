/**
 * All monetary values are handled as integer cents. Floating-point dollar
 * arithmetic (0.1 + 0.2 !== 0.3) is never used for balances.
 */

/** Upper bound for a single transaction: $1,000,000,000.00 in cents. */
export const MAX_TRANSACTION_CENTS = 100_000_000_000;

export type ParseAmountResult =
  | { ok: true; cents: number }
  | { ok: false; error: string };

/** Optional "$", whole units, optional 1–2 decimals: "25", "25.5", "$25.50". */
const AMOUNT_PATTERN = /^\$?(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parses a user-entered amount into integer cents without ever touching a
 * float: the whole and fraction parts are combined as integers. Rejects
 * anything empty, malformed, non-positive, or above MAX_TRANSACTION_CENTS.
 * The currency only affects how the maximum is worded in the error.
 */
export function parseAmount(
  input: string,
  currency: string = DEFAULT_CURRENCY,
): ParseAmountResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Enter an amount' };
  }

  const match = AMOUNT_PATTERN.exec(trimmed);
  if (match === null) {
    return { ok: false, error: 'Enter a valid amount, e.g. 25.00' };
  }

  const [, wholeUnits = '0', fraction = ''] = match;
  const cents = Number(wholeUnits) * 100 + Number(fraction.padEnd(2, '0'));

  if (cents === 0) {
    return { ok: false, error: 'Amount must be greater than zero' };
  }
  if (cents > MAX_TRANSACTION_CENTS) {
    return {
      ok: false,
      error: `Amount exceeds the maximum of ${formatCents(MAX_TRANSACTION_CENTS, currency)}`,
    };
  }

  return { ok: true, cents };
}

/** ISO 4217 code the app operates in; every formatter defaults to it. */
export const DEFAULT_CURRENCY = 'USD';

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats integer cents as a currency string, e.g. 123456 -> "$1,234.56". */
export function formatCents(cents: number, currency: string = DEFAULT_CURRENCY): string {
  let formatter = formatters.get(currency);

  if (formatter === undefined) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    formatters.set(currency, formatter);
  }

  return formatter.format(cents / 100);
}
