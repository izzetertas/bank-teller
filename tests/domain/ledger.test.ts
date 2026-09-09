import { describe, expect, it } from 'vitest';

import type { Transaction } from '@/domain/bank';
import {
  filterTransactions,
  matchesQuery,
  sortTransactions,
  summarizeTransactions,
} from '@/domain/ledger';

function transaction(
  id: string,
  type: Transaction['type'],
  amountCents: number,
  timestamp: number,
): Transaction {
  return { id, type, amountCents, balanceAfterCents: 0, timestamp };
}

// Newest first, as the reducer stores them.
const ledger: readonly Transaction[] = [
  transaction('t4', 'withdrawal', 4000, 4000),
  transaction('t3', 'deposit', 123456, 3000),
  transaction('t2', 'deposit', 4000, 2000),
  transaction('t1', 'deposit', 10000, 1000),
];

const ids = (transactions: readonly Transaction[]): string[] =>
  transactions.map((entry) => entry.id);

describe('filterTransactions', () => {
  it('keeps everything with the neutral filter', () => {
    expect(filterTransactions(ledger, { type: 'all', query: '' })).toEqual(ledger);
  });

  it('narrows by type', () => {
    expect(ids(filterTransactions(ledger, { type: 'withdrawal', query: '' }))).toEqual(['t4']);
    expect(ids(filterTransactions(ledger, { type: 'deposit', query: '' }))).toEqual([
      't3',
      't2',
      't1',
    ]);
  });

  it('combines type and query', () => {
    expect(ids(filterTransactions(ledger, { type: 'deposit', query: '40' }))).toEqual(['t2']);
  });
});

describe('matchesQuery', () => {
  const large = transaction('x', 'deposit', 123456, 0);

  it('matches the formatted amount however the person types it', () => {
    expect(matchesQuery(large, '1,234.56')).toBe(true);
    expect(matchesQuery(large, '$1234.56')).toBe(true);
    expect(matchesQuery(large, '234')).toBe(true);
    expect(matchesQuery(large, ' 1 234 ')).toBe(true);
  });

  it('matches the type label, ignoring case', () => {
    expect(matchesQuery(large, 'DEP')).toBe(true);
    expect(matchesQuery(large, 'withdraw')).toBe(false);
  });

  it('formats in the given currency', () => {
    expect(matchesQuery(large, '€', 'EUR')).toBe(true);
    expect(matchesQuery(large, '€')).toBe(false);
  });

  it('treats a blank query as a match', () => {
    expect(matchesQuery(large, '   ')).toBe(true);
  });
});

describe('sortTransactions', () => {
  it('sorts by time in either direction', () => {
    expect(ids(sortTransactions(ledger, 'time', 'desc'))).toEqual(['t4', 't3', 't2', 't1']);
    expect(ids(sortTransactions(ledger, 'time', 'asc'))).toEqual(['t1', 't2', 't3', 't4']);
  });

  it('sorts by amount, keeping equal amounts in their incoming order', () => {
    expect(ids(sortTransactions(ledger, 'amount', 'desc'))).toEqual(['t3', 't1', 't4', 't2']);
    expect(ids(sortTransactions(ledger, 'amount', 'asc'))).toEqual(['t4', 't2', 't1', 't3']);
  });

  it('does not mutate the input', () => {
    const before = [...ledger];
    sortTransactions(ledger, 'amount', 'asc');
    expect(ledger).toEqual(before);
  });
});

describe('summarizeTransactions', () => {
  it('totals deposits and withdrawals separately', () => {
    expect(summarizeTransactions(ledger)).toEqual({
      count: 4,
      depositsCents: 137456,
      withdrawalsCents: 4000,
    });
  });

  it('is zero for an empty ledger', () => {
    expect(summarizeTransactions([])).toEqual({
      count: 0,
      depositsCents: 0,
      withdrawalsCents: 0,
    });
  });
});
