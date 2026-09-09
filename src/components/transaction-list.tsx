'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { TransactionFilter } from '@/components/transaction-filter';
import { TransactionRow } from '@/components/transaction-row';
import { Button, MicroLabel } from '@/components/ui';
import type { Transaction } from '@/domain/bank';
import {
  filterTransactions,
  sortTransactions,
  summarizeTransactions,
  type LedgerFilter,
  type LedgerSortKey,
  type SortDirection,
} from '@/domain/ledger';
import { formatCents } from '@/domain/money';

const NO_FILTER: LedgerFilter = { type: 'all', query: '' };

function countActiveFilters(filter: LedgerFilter): number {
  return (filter.type === 'all' ? 0 : 1) + (filter.query.trim() === '' ? 0 : 1);
}

/**
 * The account's ledger with view controls. Filter, search, sort, and the
 * toolbar's open state are view state only — they never touch the account —
 * and reset when the parent remounts the list for another account.
 */
export function TransactionList({
  transactions,
  currency,
}: {
  transactions: readonly Transaction[];
  /** ISO 4217 code of the account the transactions belong to. */
  currency?: string;
}): ReactNode {
  const [filter, setFilter] = useState<LedgerFilter>(NO_FILTER);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<LedgerSortKey>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const toolbarId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Opening the toolbar is an invitation to type; land focus in the search box.
  useEffect(() => {
    if (filtersOpen) {
      searchRef.current?.focus();
    }
  }, [filtersOpen]);

  const heading = <MicroLabel>Transaction ledger</MicroLabel>;

  if (transactions.length === 0) {
    return (
      <>
        {heading}
        <p className="m-0 text-soft">No transactions yet.</p>
      </>
    );
  }

  const visible = sortTransactions(
    filterTransactions(transactions, filter, currency),
    sortKey,
    sortDirection,
  );
  const summary = summarizeTransactions(visible);
  const activeFilters = countActiveFilters(filter);
  const isFiltered = activeFilters > 0;

  function toggleFilters(): void {
    if (filtersOpen) {
      setFiltersOpen(false);
      toggleRef.current?.focus();
      return;
    }
    setFiltersOpen(true);
  }

  function clearFilters(): void {
    setFilter(NO_FILTER);
    // The clear button disappears with the filter; keep focus somewhere useful.
    if (filtersOpen) {
      searchRef.current?.focus();
    } else {
      toggleRef.current?.focus();
    }
  }

  function toggleSort(key: LedgerSortKey): void {
    if (key === sortKey) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
      return;
    }
    setSortKey(key);
    // Newest first and largest first are the natural starting points.
    setSortDirection('desc');
  }

  function sortHeader(key: LedgerSortKey, label: string, numeric = false): ReactNode {
    const active = key === sortKey;
    return (
      <th
        scope="col"
        className={numeric ? 'ledger-th text-right' : 'ledger-th'}
        aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          className={active ? 'ledger-sort active' : 'ledger-sort'}
          onClick={() => toggleSort(key)}
        >
          {label}
          <span className="ledger-sort-arrow" aria-hidden="true">
            {active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        </button>
      </th>
    );
  }

  const clearButton = (
    <Button variant="ghost" size="sm" onClick={clearFilters}>
      Clear filters
    </Button>
  );

  return (
    <>
      <div className="ledger-heading">
        {heading}
        <Button
          ref={toggleRef}
          variant="secondary"
          size="sm"
          aria-expanded={filtersOpen}
          aria-controls={toolbarId}
          onClick={toggleFilters}
        >
          Filter
          {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
        </Button>
      </div>
      {filtersOpen && (
        <TransactionFilter
          id={toolbarId}
          value={filter}
          onChange={setFilter}
          searchRef={searchRef}
        />
      )}
      {visible.length === 0 ? (
        <p className="ledger-empty">
          <span>No transactions match.</span>
          {clearButton}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                {sortHeader('time', 'Time')}
                <th scope="col" className="ledger-th">
                  Type
                </th>
                {sortHeader('amount', 'Amount', true)}
                <th scope="col" className="ledger-th text-right">
                  Balance after
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  currency={currency}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="ledger-summary" aria-live="polite">
        <span>
          {isFiltered
            ? `${summary.count} of ${transactions.length} transactions`
            : `${summary.count} transactions`}
        </span>
        <span>In {formatCents(summary.depositsCents, currency)}</span>
        <span>Out −{formatCents(summary.withdrawalsCents, currency)}</span>
        {isFiltered && visible.length > 0 && clearButton}
      </p>
    </>
  );
}
