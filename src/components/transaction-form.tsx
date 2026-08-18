'use client';

import { useState, type ReactNode, type SubmitEvent } from 'react';

import { Button, ErrorNote } from '@/components/ui';
import { validateTransaction, type Account, type TransactionType } from '@/domain/bank';
import { formatCents, parseAmount } from '@/domain/money';
import { useBank } from '@/state/bank-context';
import { useToast } from '@/state/toast-context';

/** Matches a complete or partially typed amount, e.g. "$", "25", "25.", "25.5". */
const PARTIAL_AMOUNT_PATTERN = /^\$?\d*(\.\d{0,2})?$/;

export function TransactionForm({ account }: { account: Account }): ReactNode {
  const { applyTransaction } = useBank();
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('deposit');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const validationError = validateTransaction(account, type, parsed.cents);
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    applyTransaction(account.id, type, parsed.cents);
    const balanceAfter =
      type === 'deposit'
        ? account.balanceCents + parsed.cents
        : account.balanceCents - parsed.cents;
    showToast(
      `${type === 'deposit' ? 'Deposited' : 'Withdrew'} ${formatCents(parsed.cents, account.currency)} — balance ${formatCents(balanceAfter, account.currency)}`,
    );
    setAmount('');
    setError(null);
  }

  function selectType(next: TransactionType): void {
    setType(next);
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="segmented" role="group" aria-label="Transaction type">
        <button
          type="button"
          className={type === 'deposit' ? 'segment active' : 'segment'}
          aria-pressed={type === 'deposit'}
          onClick={() => selectType('deposit')}
        >
          Deposit
        </button>
        <button
          type="button"
          className={type === 'withdrawal' ? 'segment active' : 'segment'}
          aria-pressed={type === 'withdrawal'}
          onClick={() => selectType('withdrawal')}
        >
          Withdraw
        </button>
      </div>
      <div className="flex flex-wrap items-stretch gap-3.5">
        <input
          className="amount-input"
          type="text"
          inputMode="decimal"
          aria-label={`Amount (${account.currency})`}
          value={amount}
          onChange={(event) => {
            const next = event.target.value;
            if (!PARTIAL_AMOUNT_PATTERN.test(next)) {
              return;
            }
            setAmount(next);
            setError(null);
          }}
          placeholder="0.00"
        />
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={type === 'withdrawal' && account.balanceCents === 0}
        >
          {type === 'deposit' ? 'Deposit cash' : 'Withdraw cash'}
        </Button>
      </div>
      <p className="hint">
        Available balance: {formatCents(account.balanceCents, account.currency)}
      </p>
      {error !== null && <ErrorNote>{error}</ErrorNote>}
    </form>
  );
}
