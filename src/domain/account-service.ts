/**
 * An in-memory "backend" used like an API client: the one place accounts are
 * opened and money moves. A real backend would replace it behind the same
 * method signatures (plus `await`). Like an API, a method throws when it
 * can't do what was asked; the UI validates first to show a message, so this
 * is the backstop, not the normal path.
 */

import type { Account, Transaction, TransactionType } from '@/domain/models';
import { DEFAULT_CURRENCY } from '@/domain/amount';
import {
  validateAccountName,
  validateAmount as checkAmount,
  validateWithdrawal as checkWithdrawal,
} from '@/domain/rules';

export interface Posting {
  readonly account: Account;
  readonly transaction: Transaction;
}

const FIRST_ACCOUNT_NUMBER = 1001;

export class AccountService {
  private readonly accounts = new Map<string, Account>();
  private nextAccountNumber = FIRST_ACCOUNT_NUMBER;

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  getAllAccounts(): readonly Account[] {
    return [...this.accounts.values()];
  }

  createAccount(name: string, currency: string = DEFAULT_CURRENCY): Account {
    const validation = validateAccountName(name);
    if (!validation.ok) {
      throw new Error(validation.error);
    }
    const account: Account = {
      id: crypto.randomUUID(),
      number: this.generateAccountNumber(),
      name: name.trim(),
      currency,
      balanceCents: 0,
      transactions: [],
    };
    this.accounts.set(account.id, account);

    return account;
  }

  deposit(accountId: string, amountCents: number): Posting {
    const account = this.findAccount(accountId);
    this.validateAmount(account, amountCents);

    return this.post(account, 'deposit', amountCents);
  }

  withdraw(accountId: string, amountCents: number): Posting {
    const account = this.findAccount(accountId);
    this.validateAmount(account, amountCents);
    this.validateWithdrawal(account, amountCents);

    return this.post(account, 'withdrawal', amountCents);
  }

  private generateAccountNumber(): string {
    return `ACC-${this.nextAccountNumber++}`;
  }

  private findAccount(accountId: string): Account {
    const account = this.accounts.get(accountId);
    if (account === undefined) {
      throw new Error('Account not found');
    }

    return account;
  }

  private validateAmount(account: Account, amountCents: number): void {
    const validation = checkAmount(account, amountCents);
    if (!validation.ok) {
      throw new Error(validation.error);
    }
  }

  private validateWithdrawal(account: Account, amountCents: number): void {
    const validation = checkWithdrawal(account, amountCents);
    if (!validation.ok) {
      throw new Error(validation.error);
    }
  }

  private post(account: Account, type: TransactionType, amountCents: number): Posting {
    const delta = type === 'deposit' ? amountCents : -amountCents;
    const balanceAfterCents = account.balanceCents + delta;
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amountCents,
      balanceAfterCents,
      timestamp: Date.now(),
    };
    const updatedAccount: Account = {
      ...account,
      balanceCents: balanceAfterCents,
      transactions: [transaction, ...account.transactions],
    };
    this.accounts.set(account.id, updatedAccount);

    return { account: updatedAccount, transaction };
  }
}
