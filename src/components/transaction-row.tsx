'use client';

import type { ReactNode } from 'react';

import type { Transaction } from '@/domain/models';
import { formatCents } from '@/domain/amount';

export const TransactionTypeMap = {
  deposit: 'Deposited',
  withdrawal: 'Withdrew',
  transfer: 'Transferred',
  'transfer-in': 'Transfer from',
  'transfer-out': 'Transfer to',
};

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function describeTransaction(transaction: Transaction) {
  switch (transaction.type) {
    case 'deposit':
      return 'Deposit';
    case 'withdrawal':
      return 'Withdrawal';
    case 'transfer-in':
      return `Transfer from ${transaction.counterpartyNumber}`;
    case 'transfer-out':
      return `Transfer to ${transaction.counterpartyNumber}`;
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
  const isDeposit =
    transaction.type === 'deposit' || transaction.type === 'transfer-in';
  const tone = isDeposit ? 'text-success' : 'text-danger';

  return (
    <tr className="odd:bg-panel-alt">
      <td className="ledger-td">
        {timeFormatter.format(transaction.timestamp)}
      </td>
      <td className="ledger-td">
        <span className={`ledger-type ${tone}`}>
          {describeTransaction(transaction)}
        </span>
      </td>
      <td className={`ledger-td ledger-num ${tone}`}>
        {!isDeposit && '−'}
        {formatCents(transaction.amountCents, currency)}
      </td>
      <td className="ledger-td ledger-num">
        {formatCents(transaction.balanceAfterCents, currency)}
      </td>
    </tr>
  );
}
