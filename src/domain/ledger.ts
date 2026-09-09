/**
 * Pure helpers for viewing a ledger: filtering, searching, sorting, and
 * totals. They never mutate the input; the reducer's newest-first order is
 * the baseline every view derives from.
 */

import type { Transaction, TransactionType } from '@/domain/bank';
import { formatCents } from '@/domain/money';

export type LedgerTypeFilter = 'all' | TransactionType;
export type LedgerSortKey = 'time' | 'amount';
export type SortDirection = 'asc' | 'desc';

export interface LedgerFilter {
  readonly type: LedgerTypeFilter;
  /** Free text matched against the amount and the type label. */
  readonly query: string;
}

export interface LedgerSummary {
  readonly count: number;
  readonly depositsCents: number;
  readonly withdrawalsCents: number;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
};

/** Case-insensitive, ignoring the characters a person may or may not type in an amount. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[$,\s]/g, '');
}

export function matchesQuery(
  transaction: Transaction,
  query: string,
  currency?: string,
): boolean {
  const needle = normalize(query);
  if (needle === '') {
    return true;
  }
  const haystacks = [
    formatCents(transaction.amountCents, currency),
    TRANSACTION_TYPE_LABELS[transaction.type],
  ];
  return haystacks.some((text) => normalize(text).includes(needle));
}

export function filterTransactions(
  transactions: readonly Transaction[],
  filter: LedgerFilter,
  currency?: string,
): readonly Transaction[] {
  return transactions.filter(
    (transaction) =>
      (filter.type === 'all' || transaction.type === filter.type) &&
      matchesQuery(transaction, filter.query, currency),
  );
}

/**
 * Stable sort: equal keys keep their incoming (newest-first) order, so two
 * transactions of the same amount still read chronologically.
 */
export function sortTransactions(
  transactions: readonly Transaction[],
  key: LedgerSortKey,
  direction: SortDirection,
): readonly Transaction[] {
  const sign = direction === 'asc' ? 1 : -1;
  const valueOf = (transaction: Transaction): number =>
    key === 'time' ? transaction.timestamp : transaction.amountCents;

  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort(
      (left, right) =>
        sign * (valueOf(left.transaction) - valueOf(right.transaction)) ||
        left.index - right.index,
    )
    .map((entry) => entry.transaction);
}

export function summarizeTransactions(
  transactions: readonly Transaction[],
): LedgerSummary {
  return transactions.reduce<LedgerSummary>(
    (summary, transaction) => ({
      count: summary.count + 1,
      depositsCents:
        summary.depositsCents +
        (transaction.type === 'deposit' ? transaction.amountCents : 0),
      withdrawalsCents:
        summary.withdrawalsCents +
        (transaction.type === 'withdrawal' ? transaction.amountCents : 0),
    }),
    { count: 0, depositsCents: 0, withdrawalsCents: 0 },
  );
}
