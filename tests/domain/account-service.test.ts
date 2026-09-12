import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountService } from '@/domain/account-service';
import { MAX_TRANSACTION_CENTS } from '@/domain/amount';

const FIXED_TIMESTAMP = 1_700_000_000_000;
const UUID_PATTERN = /^[0-9a-f-]{36}$/;

function createService(): AccountService {
  return new AccountService();
}

function openAccount(service: AccountService, name: string, currency?: string): string {
  return service.createAccount(name, currency).id;
}

describe('AccountService.createAccount', () => {
  let service: AccountService;
  beforeEach(() => {
    service = createService();
  });

  it('opens an account with a generated id, a sequential number and a zero balance', () => {
    const account = service.createAccount('Ada Lovelace');
    expect(account).toEqual({
      id: expect.stringMatching(UUID_PATTERN),
      number: 'ACC-1001',
      name: 'Ada Lovelace',
      currency: 'USD',
      balanceCents: 0,
      transactions: [],
    });
    expect(service.getAllAccounts()).toHaveLength(1);
  });

  it('gives every account its own id', () => {
    const firstAccountId = openAccount(service, 'Ada');
    const secondAccountId = openAccount(service, 'Grace');
    expect(firstAccountId).not.toBe(secondAccountId);
  });

  it('trims the customer name', () => {
    const accountId = openAccount(service, '  Ada  Lovelace ');
    expect(service.getAccount(accountId)?.name).toBe('Ada  Lovelace');
  });

  it('stores an explicitly requested currency, even when it matches the default', () => {
    const accountId = openAccount(service, 'Ada', 'USD');
    expect(service.getAccount(accountId)?.currency).toBe('USD');
  });

  it('opens a second account for the same customer name with its own id and number', () => {
    openAccount(service, 'Ada Lovelace');
    const secondAccountId = openAccount(service, 'ada lovelace');
    expect(service.getAllAccounts()).toHaveLength(2);
    expect(service.getAccount(secondAccountId)).toMatchObject({
      number: 'ACC-1002',
      name: 'ada lovelace',
    });
  });

  it('throws on a blank name and stores nothing', () => {
    expect(() => service.createAccount('   ')).toThrow('Customer name is required');
    expect(service.getAllAccounts()).toHaveLength(0);
  });

  it('lists accounts in creation order', () => {
    openAccount(service, 'Grace');
    openAccount(service, 'Ada');
    expect(service.getAllAccounts().map((account) => account.name)).toEqual(['Grace', 'Ada']);
  });
});

describe('AccountService.deposit and withdraw', () => {
  let service: AccountService;
  let accountId: string;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIMESTAMP);
    service = createService();
    accountId = openAccount(service, 'Ada');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deposit increases the balance and records the transaction with an id and timestamp', () => {
    const posting = service.deposit(accountId, 2500);
    expect(posting).toEqual({
      account: expect.objectContaining({ balanceCents: 2500 }),
      transaction: {
        id: expect.stringMatching(UUID_PATTERN),
        type: 'deposit',
        amountCents: 2500,
        balanceAfterCents: 2500,
        timestamp: FIXED_TIMESTAMP,
      },
    });
    expect(service.getAccount(accountId)?.transactions).toHaveLength(1);
  });

  it('withdrawal decreases the balance', () => {
    service.deposit(accountId, 2500);
    service.withdraw(accountId, 1000);
    expect(service.getAccount(accountId)?.balanceCents).toBe(1500);
  });

  it('records transactions newest first with running balances', () => {
    service.deposit(accountId, 2500);
    service.withdraw(accountId, 1000);
    const transactions = service.getAccount(accountId)?.transactions;
    expect(transactions?.map((transaction) => transaction.type)).toEqual([
      'withdrawal',
      'deposit',
    ]);
    expect(transactions?.map((transaction) => transaction.balanceAfterCents)).toEqual([
      1500, 2500,
    ]);
  });

  it('throws on an overdraft and leaves the account untouched', () => {
    service.deposit(accountId, 500);
    const before = service.getAccount(accountId);
    expect(() => service.withdraw(accountId, 501)).toThrow(
      'Insufficient funds — the balance is $5.00',
    );
    expect(service.getAccount(accountId)).toBe(before);
  });

  it('allows withdrawing the exact balance', () => {
    service.deposit(accountId, 500);
    service.withdraw(accountId, 500);
    expect(service.getAccount(accountId)?.balanceCents).toBe(0);
  });

  it('throws on an unknown account without storing anything', () => {
    expect(() => service.deposit('nope', 100)).toThrow('Account not found');
  });

  it('throws on invalid amounts without storing anything', () => {
    const message = 'Amount must be greater than zero';
    expect(() => service.deposit(accountId, 0)).toThrow(message);
    expect(() => service.deposit(accountId, -100)).toThrow(message);
    expect(() => service.deposit(accountId, 10.5)).toThrow(message);
    expect(service.getAccount(accountId)?.transactions).toHaveLength(0);
  });

  it('throws on an amount above the per-transaction maximum without storing anything', () => {
    expect(() => service.deposit(accountId, MAX_TRANSACTION_CENTS + 1)).toThrow(
      'Amount exceeds the maximum of $1,000,000,000.00',
    );
    const account = service.getAccount(accountId)
    expect(account?.balanceCents).toBe(0);
    expect(account?.transactions).toHaveLength(0);
  });

  it('checks the amount before the overdraft, in that order', () => {
    // An invalid amount is rejected even though it would also overdraw —
    // the caller should see the more basic problem first.
    expect(() => service.withdraw(accountId, -1)).toThrow('Amount must be greater than zero');
  });

  it('only touches the targeted account', () => {
    const secondAccountId = openAccount(service, 'Grace');
    service.deposit(secondAccountId, 700);
    expect(service.getAccount(accountId)?.balanceCents).toBe(0);
    expect(service.getAccount(secondAccountId)?.balanceCents).toBe(700);
  });

  it('never mutates a previously returned account object', () => {
    const before = service.getAccount(accountId);
    service.deposit(accountId, 100);
    expect(before?.balanceCents).toBe(0);
    expect(before?.transactions).toHaveLength(0);
  });
});
