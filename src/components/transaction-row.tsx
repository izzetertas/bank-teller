'use client';

import type { ReactNode } from 'react';

import type { Transaction } from '@/domain/bank';
import { formatCents } from '@/domain/money';

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** One ledger entry; expects to be rendered inside the ledger <tbody>. */
export function TransactionRow({
  transaction,
  currency,
}: {
  transaction: Transaction;
  /** ISO 4217 code of the account the transaction belongs to. */
  currency?: string;
}): ReactNode {
  const isDeposit = transaction.type === 'deposit';
  const tone = isDeposit ? 'text-success' : 'text-danger';

  return (
    <tr className="odd:bg-panel-alt">
      <td className="ledger-td">{timeFormatter.format(transaction.timestamp)}</td>
      <td className="ledger-td">
        <span className={`font-sans font-semibold ${tone}`}>
          {isDeposit ? 'Deposit' : 'Withdrawal'}
        </span>
      </td>
      <td className={`ledger-td text-right tabular-nums ${tone}`}>
        {!isDeposit && '−'}
        {formatCents(transaction.amountCents, currency)}
      </td>
      <td className="ledger-td text-right tabular-nums">
        {formatCents(transaction.balanceAfterCents, currency)}
      </td>
    </tr>
  );
}
