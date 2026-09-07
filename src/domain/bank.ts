/**
 * Pure domain model for the teller session: plain data plus a reducer.
 * No React, no side effects — ids and timestamps are supplied by the
 * action creators in src/state so every state transition is deterministic
 * and directly unit-testable.
 */

import { DEFAULT_CURRENCY, formatCents } from '@/domain/money';

/** Over-the-counter cash movements on a single account. */
export type CashTransactionType = 'deposit' | 'withdrawal';

/** Every ledger entry kind; a transfer writes one leg into each account. */
export type TransactionType = CashTransactionType | 'transfer-in' | 'transfer-out';

export interface Transaction {
  readonly id: string;
  readonly type: TransactionType;
  readonly amountCents: number;
  /** Account balance immediately after this transaction was applied. */
  readonly balanceAfterCents: number;
  readonly timestamp: number;
  /**
   * Teller-facing number of the other account in a transfer ("ACC-1002").
   * A snapshot, like balanceAfterCents: the ledger stays readable on its own.
   */
  readonly counterpartyNumber?: string;
}

/** True for entries that reduce the balance. */
export function isOutgoing(type: TransactionType): boolean {
  return type === 'withdrawal' || type === 'transfer-out';
}

export interface Account {
  readonly id: string;
  /** Teller-facing sequential number, e.g. "ACC-1001". */
  readonly number: string;
  readonly name: string;
  /** ISO 4217 code the account is denominated in. */
  readonly currency: string;
  readonly balanceCents: number;
  /** Newest first. */
  readonly transactions: readonly Transaction[];
}

export interface BankState {
  readonly accounts: readonly Account[];
  readonly selectedAccountId: string | null;
}

export const initialBankState: BankState = {
  accounts: [],
  selectedAccountId: null,
};

export type BankAction =
  | { type: 'account/create'; id: string; name: string; currency?: string }
  | { type: 'account/select'; id: string }
  | {
      type: 'transaction/apply';
      transactionType: CashTransactionType;
      accountId: string;
      amountCents: number;
      transactionId: string;
      timestamp: number;
    }
  | {
      type: 'transfer/apply';
      fromAccountId: string;
      toAccountId: string;
      amountCents: number;
      /** One id per ledger leg, so each entry stays unique across accounts. */
      outTransactionId: string;
      inTransactionId: string;
      timestamp: number;
    };

export function getAccount(state: BankState, id: string): Account | undefined {
  return state.accounts.find((account) => account.id === id);
}

export function getSelectedAccount(state: BankState): Account | undefined {
  return state.selectedAccountId === null
    ? undefined
    : getAccount(state, state.selectedAccountId);
}

/**
 * Returns an error message when the name is unusable — blank, or already
 * taken by an existing account (case-insensitive) — otherwise null.
 */
export function validateAccountName(
  name: string,
  existingAccounts: readonly Account[] = [],
): string | null {
  const accountName = name.trim();
  if (accountName === '') {
    return 'Customer name is required';
  }

  const taken = existingAccounts.some(
    (account) => account.name.toLowerCase() === accountName.toLowerCase(),
  );

  return taken ? `An account for “${accountName}” already exists` : null;
}

/**
 * Returns an error message when the transaction must be rejected
 * (e.g. an overdraft), otherwise null.
 */
export function validateTransaction(
  account: Account,
  type: TransactionType,
  amountCents: number,
): string | null {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return 'Amount must be greater than zero';
  }
  if (isOutgoing(type) && amountCents > account.balanceCents) {
    return `Insufficient funds — the balance is ${formatCents(account.balanceCents, account.currency)}`;
  }
  return null;
}

/**
 * Returns an error message when a transfer between two accounts must be
 * rejected — same account, different currencies, or an overdraft on the
 * source — otherwise null. Currency conversion is deliberately unsupported.
 */
export function validateTransfer(
  from: Account,
  to: Account,
  amountCents: number,
): string | null {
  if (from.id === to.id) {
    return 'Choose a different destination account';
  }
  if (from.currency !== to.currency) {
    return `Accounts must share a currency — ${from.number} is ${from.currency}, ${to.number} is ${to.currency}`;
  }
  return validateTransaction(from, 'transfer-out', amountCents);
}

/** Appends a ledger entry and moves the balance by its signed amount. */
function recordTransaction(
  account: Account,
  entry: Omit<Transaction, 'balanceAfterCents'>,
): Account {
  const delta = isOutgoing(entry.type) ? -entry.amountCents : entry.amountCents;
  const balanceAfterCents = account.balanceCents + delta;

  return {
    ...account,
    balanceCents: balanceAfterCents,
    transactions: [{ ...entry, balanceAfterCents }, ...account.transactions],
  };
}

/**
 * The reducer is defensive: actions that fail validation (unknown account,
 * overdraft, bad amount) leave state unchanged. The UI is expected to
 * validate first so it can show a message, but correctness never depends
 * on the UI doing so.
 */
export function bankReducer(state: BankState, action: BankAction): BankState {
  switch (action.type) {
    case 'account/create': {
      if (validateAccountName(action.name, state.accounts) !== null) {
        return state;
      }
      const account: Account = {
        id: action.id,
        number: `ACC-${1001 + state.accounts.length}`,
        name: action.name.trim(),
        currency: action.currency ?? DEFAULT_CURRENCY,
        balanceCents: 0,
        transactions: [],
      };

      return {
        accounts: [...state.accounts, account],
        // A newly opened account becomes the active one.
        selectedAccountId: account.id,
      };
    }
    case 'account/select': {
      if (getAccount(state, action.id) === undefined) {
        return state;
      }

      return { ...state, selectedAccountId: action.id };
    }
    case 'transaction/apply': {
      const account = getAccount(state, action.accountId);
      if (
        account === undefined ||
        validateTransaction(account, action.transactionType, action.amountCents) !== null
      ) {
        return state;
      }

      return {
        ...state,
        accounts: state.accounts.map((candidate) =>
          candidate.id === account.id
            ? recordTransaction(candidate, {
                id: action.transactionId,
                type: action.transactionType,
                amountCents: action.amountCents,
                timestamp: action.timestamp,
              })
            : candidate,
        ),
      };
    }
    case 'transfer/apply': {
      const from = getAccount(state, action.fromAccountId);
      const to = getAccount(state, action.toAccountId);
      if (
        from === undefined ||
        to === undefined ||
        validateTransfer(from, to, action.amountCents) !== null
      ) {
        return state;
      }

      // Both legs land in one state transition, so no observer can ever see
      // the money in flight.
      return {
        ...state,
        accounts: state.accounts.map((candidate) => {
          if (candidate.id === from.id) {
            return recordTransaction(candidate, {
              id: action.outTransactionId,
              type: 'transfer-out',
              amountCents: action.amountCents,
              timestamp: action.timestamp,
              counterpartyNumber: to.number,
            });
          }
          if (candidate.id === to.id) {
            return recordTransaction(candidate, {
              id: action.inTransactionId,
              type: 'transfer-in',
              amountCents: action.amountCents,
              timestamp: action.timestamp,
              counterpartyNumber: from.number,
            });
          }
          return candidate;
        }),
      };
    }
  }
}
