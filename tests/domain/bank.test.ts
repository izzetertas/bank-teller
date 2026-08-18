import { describe, expect, it } from 'vitest';

import {
  bankReducer,
  getAccount,
  getSelectedAccount,
  initialBankState,
  validateAccountName,
  validateTransaction,
  type BankAction,
  type BankState,
} from '@/domain/bank';

function createAccount(state: BankState, id: string, name: string): BankState {
  return bankReducer(state, { type: 'account/create', id, name });
}

function apply(
  state: BankState,
  accountId: string,
  transactionType: 'deposit' | 'withdrawal',
  amountCents: number,
  transactionId = `tx-${transactionType}-${amountCents}`,
): BankState {
  const action: BankAction = {
    type: 'transaction/apply',
    transactionType,
    accountId,
    amountCents,
    transactionId,
    timestamp: 1_700_000_000_000,
  };
  return bankReducer(state, action);
}

describe('account creation', () => {
  it('creates an account with a zero balance and selects it', () => {
    const state = createAccount(initialBankState, 'a1', 'Ada Lovelace');
    expect(state.accounts).toHaveLength(1);
    expect(getAccount(state, 'a1')).toMatchObject({
      number: 'ACC-1001',
      name: 'Ada Lovelace',
      currency: 'USD',
      balanceCents: 0,
      transactions: [],
    });
    expect(state.selectedAccountId).toBe('a1');
  });

  it('trims the customer name', () => {
    const state = createAccount(initialBankState, 'a1', '  Ada  Lovelace ');
    expect(getAccount(state, 'a1')?.name).toBe('Ada  Lovelace');
  });

  it('stores an explicitly requested currency', () => {
    const state = bankReducer(initialBankState, {
      type: 'account/create',
      id: 'a1',
      name: 'Ada',
      currency: 'EUR',
    });
    expect(getAccount(state, 'a1')?.currency).toBe('EUR');
  });

  it('ignores creation with a duplicate name, ignoring case and padding', () => {
    const state = createAccount(initialBankState, 'a1', 'Ada Lovelace');
    expect(createAccount(state, 'a2', 'ada lovelace')).toBe(state);
    expect(createAccount(state, 'a2', '  Ada Lovelace  ')).toBe(state);
  });

  it('ignores creation with a blank name', () => {
    expect(createAccount(initialBankState, 'a1', '   ')).toBe(initialBankState);
  });

  it('keeps the current selection when a second account is opened, until selected', () => {
    let state = createAccount(initialBankState, 'a1', 'Ada');
    state = createAccount(state, 'a2', 'Grace');
    expect(state.selectedAccountId).toBe('a2');
    state = bankReducer(state, { type: 'account/select', id: 'a1' });
    expect(getSelectedAccount(state)?.id).toBe('a1');
  });

  it('ignores selecting an unknown account', () => {
    const state = createAccount(initialBankState, 'a1', 'Ada');
    expect(bankReducer(state, { type: 'account/select', id: 'nope' })).toBe(state);
  });
});

describe('deposits and withdrawals', () => {
  const base = createAccount(initialBankState, 'a1', 'Ada');

  it('deposit increases the balance and records the transaction', () => {
    const state = apply(base, 'a1', 'deposit', 2500);
    const account = getAccount(state, 'a1');
    expect(account?.balanceCents).toBe(2500);
    expect(account?.transactions).toHaveLength(1);
    expect(account?.transactions[0]).toMatchObject({
      type: 'deposit',
      amountCents: 2500,
      balanceAfterCents: 2500,
    });
  });

  it('withdrawal decreases the balance', () => {
    let state = apply(base, 'a1', 'deposit', 2500);
    state = apply(state, 'a1', 'withdrawal', 1000);
    expect(getAccount(state, 'a1')?.balanceCents).toBe(1500);
  });

  it('records transactions newest first with running balances', () => {
    let state = apply(base, 'a1', 'deposit', 2500, 'tx1');
    state = apply(state, 'a1', 'withdrawal', 1000, 'tx2');
    const transactions = getAccount(state, 'a1')?.transactions;
    expect(transactions?.map((transaction) => transaction.id)).toEqual([
      'tx2',
      'tx1',
    ]);
    expect(
      transactions?.map((transaction) => transaction.balanceAfterCents),
    ).toEqual([1500, 2500]);
  });

  it('rejects an overdraft and leaves state untouched', () => {
    const funded = apply(base, 'a1', 'deposit', 500);
    expect(apply(funded, 'a1', 'withdrawal', 501)).toBe(funded);
  });

  it('allows withdrawing the exact balance', () => {
    let state = apply(base, 'a1', 'deposit', 500);
    state = apply(state, 'a1', 'withdrawal', 500);
    expect(getAccount(state, 'a1')?.balanceCents).toBe(0);
  });

  it('ignores transactions for unknown accounts and invalid amounts', () => {
    expect(apply(base, 'nope', 'deposit', 100)).toBe(base);
    expect(apply(base, 'a1', 'deposit', 0)).toBe(base);
    expect(apply(base, 'a1', 'deposit', -100)).toBe(base);
    expect(apply(base, 'a1', 'deposit', 10.5)).toBe(base);
  });

  it('only touches the targeted account', () => {
    let state = createAccount(base, 'a2', 'Grace');
    state = apply(state, 'a2', 'deposit', 700);
    expect(getAccount(state, 'a1')?.balanceCents).toBe(0);
    expect(getAccount(state, 'a2')?.balanceCents).toBe(700);
  });
});

describe('validation helpers', () => {
  it('validateAccountName rejects names already taken, ignoring case', () => {
    const state = createAccount(initialBankState, 'a1', 'Ada Lovelace');
    expect(validateAccountName('ada lovelace', state.accounts)).toBe(
      'An account for “ada lovelace” already exists',
    );
    expect(validateAccountName('Grace Hopper', state.accounts)).toBeNull();
  });

  it('validateAccountName requires a non-blank name', () => {
    expect(validateAccountName('Ada')).toBeNull();
    expect(validateAccountName('  ')).toBe('Customer name is required');
  });

  it('validateTransaction reports overdrafts with the current balance', () => {
    const state = apply(createAccount(initialBankState, 'a1', 'Ada'), 'a1', 'deposit', 500);
    const account = getAccount(state, 'a1');
    expect(account).toBeDefined();
    if (account === undefined) return;
    expect(validateTransaction(account, 'withdrawal', 500)).toBeNull();
    expect(validateTransaction(account, 'withdrawal', 501)).toBe(
      'Insufficient funds — the balance is $5.00',
    );
    expect(validateTransaction(account, 'deposit', 0)).toBe(
      'Amount must be greater than zero',
    );
  });
});
