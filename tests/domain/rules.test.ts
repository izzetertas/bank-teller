import { describe, expect, it } from 'vitest';

import type { Account } from '@/domain/models';
import { MAX_TRANSACTION_CENTS } from '@/domain/amount';
import { validateAccountName, validateAmount, validateWithdrawal } from '@/domain/rules';

const accountWithBalance: Account = {
  id: 'a1',
  number: 'ACC-1001',
  name: 'Ada',
  currency: 'USD',
  balanceCents: 500,
  transactions: [],
};

describe('validateAccountName', () => {
  it('accepts a non-blank name', () => {
    expect(validateAccountName('Ada')).toEqual({ ok: true });
  });

  it('rejects a blank or whitespace-only name', () => {
    expect(validateAccountName('')).toEqual({
      ok: false,
      error: 'Customer name is required',
    });
    expect(validateAccountName('  ')).toEqual({
      ok: false,
      error: 'Customer name is required',
    });
  });
});

describe('validateAmount', () => {
  it('accepts a positive integer amount', () => {
    expect(validateAmount(accountWithBalance, 1)).toEqual({ ok: true });
    expect(validateAmount(accountWithBalance, 100_000)).toEqual({ ok: true });
  });

  it('rejects non-positive and non-integer amounts', () => {
    const error = { ok: false, error: 'Amount must be greater than zero' };
    expect(validateAmount(accountWithBalance, 0)).toEqual(error);
    expect(validateAmount(accountWithBalance, -100)).toEqual(error);
    expect(validateAmount(accountWithBalance, 10.5)).toEqual(error);
  });

  it('rejects an amount above the per-transaction maximum, worded in the account currency', () => {
    expect(validateAmount(accountWithBalance, MAX_TRANSACTION_CENTS)).toEqual({ ok: true });
    expect(validateAmount(accountWithBalance, MAX_TRANSACTION_CENTS + 1)).toEqual({
      ok: false,
      error: 'Amount exceeds the maximum of $1,000,000,000.00',
    });
    expect(
      validateAmount({ ...accountWithBalance, currency: 'EUR' }, MAX_TRANSACTION_CENTS + 1),
    ).toEqual({ ok: false, error: 'Amount exceeds the maximum of €1,000,000,000.00' });
  });

  it('does not look at the balance', () => {
    expect(validateAmount({ ...accountWithBalance, balanceCents: 0 }, 100_000)).toEqual({
      ok: true,
    });
  });
});

describe('validateWithdrawal', () => {
  it('allows withdrawing exactly the balance', () => {
    expect(validateWithdrawal(accountWithBalance, 500)).toEqual({ ok: true });
  });

  it('reports an overdraft with the current balance in the account currency', () => {
    expect(validateWithdrawal(accountWithBalance, 501)).toEqual({
      ok: false,
      error: 'Insufficient funds — the balance is $5.00',
    });
    expect(validateWithdrawal({ ...accountWithBalance, currency: 'EUR' }, 501)).toEqual({
      ok: false,
      error: 'Insufficient funds — the balance is €5.00',
    });
  });
});
