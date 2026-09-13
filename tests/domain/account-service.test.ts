import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountService } from '@/domain/account-service';
import { MAX_TRANSACTION_CENTS } from '@/domain/amount';

const FIXED_TIMESTAMP = 1_700_000_000_000;
const UUID_PATTERN = /^[0-9a-f-]{36}$/;

function createService(): AccountService {
  return new AccountService();
}

function openAccount(
  service: AccountService,
  name: string,
  currency?: string,
): string {
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
    expect(() => service.createAccount('   ')).toThrow(
      'Customer name is required',
    );
    expect(service.getAllAccounts()).toHaveLength(0);
  });

  it('lists accounts in creation order', () => {
    openAccount(service, 'Grace');
    openAccount(service, 'Ada');
    expect(service.getAllAccounts().map((account) => account.name)).toEqual([
      'Grace',
      'Ada',
    ]);
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
    expect(
      transactions?.map((transaction) => transaction.balanceAfterCents),
    ).toEqual([1500, 2500]);
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
    const account = service.getAccount(accountId);
    expect(account?.balanceCents).toBe(0);
    expect(account?.transactions).toHaveLength(0);
  });

  it('checks the amount before the overdraft, in that order', () => {
    // An invalid amount is rejected even though it would also overdraw —
    // the caller should see the more basic problem first.
    expect(() => service.withdraw(accountId, -1)).toThrow(
      'Amount must be greater than zero',
    );
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

describe('AccountService.transfer', () => {
  let service: AccountService;
  let account1Id: string;
  let account2Id: string;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIMESTAMP);
    service = createService();
    account1Id = openAccount(service, 'Ada');
    account2Id = openAccount(service, 'John');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when either account does not exist', () => {
    expect(() => service.transfer('wrong-id-1', account2Id, 1000)).toThrow(
      'Account not found',
    );
    expect(() => service.transfer(account1Id, 'wrong-id-2', 1000)).toThrow(
      'Account not found',
    );
  });

  it('throws on a transfer to the same account', () => {
    expect(() => service.transfer(account1Id, account1Id, 1000)).toThrow(
      'Accounts must be different',
    );
  });

  it('throws on invalid amounts', () => {
    const message = 'Amount must be greater than zero';
    expect(() => service.transfer(account1Id, account2Id, 0)).toThrow(message);
    expect(() => service.transfer(account1Id, account2Id, -10)).toThrow(
      message,
    );
    expect(() => service.transfer(account1Id, account2Id, 10.5)).toThrow(
      message,
    );
  });

  it('throws on an overdraft and leaves the account untouched', () => {
    service.deposit(account1Id, 1000);
    expect(() => service.transfer(account1Id, account2Id, 1500)).toThrow(
      'Insufficient funds — the balance is $10.00',
    );
    expect(service.getAccount(account1Id)?.balanceCents).toBe(1000);
    expect(service.getAccount(account2Id)?.balanceCents).toBe(0);
  });

  it('throws when accounts are in different currencies', () => {
    const accountId3 = openAccount(service, 'Sam', 'GBP');
    expect(() => service.transfer(account1Id, accountId3, 100)).toThrow(
      'Accounts must be in the same currency',
    );
  });

  it('transfers amount successfully between accounts', () => {
    const account1Number = service.getAccount(account1Id)?.number;
    const account2Number = service.getAccount(account2Id)?.number;
    const transferAmount = 400;
    service.deposit(account1Id, 2000);
    const result = service.transfer(account1Id, account2Id, transferAmount);

    expect(result.from.account).toMatchObject({
      balanceCents: 1600,
      id: account1Id,
    });
    expect(result.from.transaction).toMatchObject({
      type: 'transfer-out',
      amountCents: transferAmount,
      balanceAfterCents: 1600,
      counterpartyNumber: account2Number,
    });
    expect(result.to.transaction).toMatchObject({
      type: 'transfer-in',
      amountCents: transferAmount,
      balanceAfterCents: 400,
      counterpartyNumber: account1Number,
    });
  });
});
