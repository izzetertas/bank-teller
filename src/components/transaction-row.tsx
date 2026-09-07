'use client';

import type { ReactNode } from 'react';

import { isOutgoing, type Transaction } from '@/domain/bank';
import { formatCents } from '@/domain/money';

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Ledger label for an entry, naming the other account for transfer legs. */
function describeTransaction(transaction: Transaction): string {
  switch (transaction.type) {
    case 'deposit':
      return 'Deposit';
    case 'withdrawal':
      return 'Withdrawal';
    case 'transfer-in':
      return `Transfer from ${transaction.counterpartyNumber ?? 'another account'}`;
    case 'transfer-out':
      return `Transfer to ${transaction.counterpartyNumber ?? 'another account'}`;
  }
}

/** One ledger entry; expects to be rendered inside the ledger <tbody>. */
export function TransactionRow({
  transaction,
  currency,
}: {
  transaction: Transaction;
  /** ISO 4217 code of the account the transaction belongs to. */
  currency?: string;
}): ReactNode {
  const outgoing = isOutgoing(transaction.type);
  const tone = outgoing ? 'text-danger' : 'text-success';

  return (
    <tr className="odd:bg-panel-alt">
      <td className="ledger-td">{timeFormatter.format(transaction.timestamp)}</td>
      <td className="ledger-td">
        <span className={`ledger-type ${tone}`}>{describeTransaction(transaction)}</span>
      </td>
      <td className={`ledger-td ledger-num ${tone}`}>
        {outgoing && '−'}
        {formatCents(transaction.amountCents, currency)}
      </td>
      <td className="ledger-td ledger-num">
        {formatCents(transaction.balanceAfterCents, currency)}
      </td>
    </tr>
  );
}
