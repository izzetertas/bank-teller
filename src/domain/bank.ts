/**
 * Pure domain model for the teller session: plain data plus a reducer.
 * No React, no side effects — ids and timestamps are supplied by the
 * action creators in src/state so every state transition is deterministic
 * and directly unit-testable.
 */

import { CURRENCY, formatCents } from '@/domain/money';

export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  readonly id: string;
  readonly type: TransactionType;
  readonly amountCents: number;
  /** Account balance immediately after this transaction was applied. */
  readonly balanceAfterCents: number;
  readonly timestamp: number;
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
      transactionType: TransactionType;
      accountId: string;
      amountCents: number;
      transactionId: string;
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
  const trimmed = name.trim();
  if (trimmed === '') {
    return 'Customer name is required';
  }

  const taken = existingAccounts.some(
    (account) => account.name.toLowerCase() === trimmed.toLowerCase(),
  );

  return taken ? `An account for “${trimmed}” already exists` : null;
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
  if (type === 'withdrawal' && amountCents > account.balanceCents) {
    return `Insufficient funds — the balance is ${formatCents(account.balanceCents, account.currency)}`;
  }
  return null;
}

function applyTransaction(
  account: Account,
  action: Extract<BankAction, { type: 'transaction/apply' }>,
): Account {
  const delta =
    action.transactionType === 'deposit'
      ? action.amountCents
      : -action.amountCents;
  const balanceAfterCents = account.balanceCents + delta;
  const transaction: Transaction = {
    id: action.transactionId,
    type: action.transactionType,
    amountCents: action.amountCents,
    balanceAfterCents,
    timestamp: action.timestamp,
  };

  return {
    ...account,
    balanceCents: balanceAfterCents,
    transactions: [transaction, ...account.transactions],
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
        currency: action.currency ?? CURRENCY,
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
            ? applyTransaction(candidate, action)
            : candidate,
        ),
      };
    }
  }
}
