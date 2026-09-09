'use client';

import type { ReactNode, RefObject } from 'react';

import { Field, TextInput } from '@/components/ui';
import type { LedgerFilter, LedgerTypeFilter } from '@/domain/ledger';

const TYPE_FILTER_LABELS: Record<LedgerTypeFilter, string> = {
  all: 'All types',
  deposit: 'Deposits',
  withdrawal: 'Withdrawals',
};

const TYPE_FILTERS: readonly LedgerTypeFilter[] = ['all', 'deposit', 'withdrawal'];

type TransactionFilterProps = {
  id: string;
  value: LedgerFilter;
  onChange: (next: LedgerFilter) => void;
  /** Lets the owner move focus into the search box, e.g. when the toolbar opens. */
  searchRef?: RefObject<HTMLInputElement | null>;
};

/** Controlled toolbar for narrowing the ledger: type dropdown plus free-text search. */
export function TransactionFilter({
  id,
  value,
  onChange,
  searchRef,
}: TransactionFilterProps): ReactNode {
  return (
    <div id={id} className="ledger-toolbar">
      <Field label="Type">
        <select
          className="text-input"
          value={value.type}
          onChange={(event) =>
            onChange({ ...value, type: event.target.value as LedgerTypeFilter })
          }
        >
          {TYPE_FILTERS.map((candidate) => (
            <option key={candidate} value={candidate}>
              {TYPE_FILTER_LABELS[candidate]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Search">
        <TextInput
          ref={searchRef}
          type="search"
          value={value.query}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
          placeholder="Amount or type"
        />
      </Field>
    </div>
  );
}
