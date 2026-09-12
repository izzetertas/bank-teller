import type { Account } from '@/domain/models';
import { MAX_TRANSACTION_CENTS, formatCents } from '@/domain/amount';

export type ValidationResult = { ok: true } | { ok: false; error: string };

const VALID: ValidationResult = { ok: true };

/**
 * Rejects a blank name. Names are deliberately not unique: the brief only
 * requires a name and a unique id, and one customer may hold several accounts
 * (or two customers may share a name), so the id and account number are the
 * only identifiers.
 */
export function validateAccountName(name: string): ValidationResult {
  return name.trim() === ''
    ? { ok: false, error: 'Customer name is required' }
    : VALID;
}

/**
 * Rejects a non-positive or non-integer amount and an amount above the
 * per-transaction maximum. Applies to deposits and withdrawals alike.
 * parseAmount checks the maximum too so the UI can say so before submitting;
 * this is the check the service relies on.
 */
export function validateAmount(account: Account, amountCents: number): ValidationResult {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: 'Amount must be greater than zero' };
  }
  if (amountCents > MAX_TRANSACTION_CENTS) {
    return {
      ok: false,
      error: `Amount exceeds the maximum of ${formatCents(MAX_TRANSACTION_CENTS, account.currency)}`,
    };
  }
  return VALID;
}

/** Rejects an overdraft: a withdrawal may not exceed the current balance. */
export function validateWithdrawal(account: Account, amountCents: number): ValidationResult {
  if (amountCents > account.balanceCents) {
    return {
      ok: false,
      error: `Insufficient funds — the balance is ${formatCents(account.balanceCents, account.currency)}`,
    };
  }
  return VALID;
}
