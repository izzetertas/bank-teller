'use client';

import type { ReactNode } from 'react';

import { TransactionRow } from '@/components/transaction-row';
import type { Transaction } from '@/domain/bank';

const headerCell = 'ledger-th';

export function TransactionList({
  transactions,
  currency,
}: {
  transactions: readonly Transaction[];
  /** ISO 4217 code of the account the transactions belong to. */
  currency?: string;
}): ReactNode {
  if (transactions.length === 0) {
    return <p className="m-0 text-soft">No transactions yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col" className={headerCell}>
              Time
            </th>
            <th scope="col" className={headerCell}>
              Type
            </th>
            <th scope="col" className={`${headerCell} text-right`}>
              Amount
            </th>
            <th scope="col" className={`${headerCell} text-right`}>
              Balance after
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              currency={currency}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
