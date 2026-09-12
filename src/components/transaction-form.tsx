'use client';

import { type ChangeEvent, useState, type ReactNode, type SubmitEvent } from 'react';

import { Button, ErrorNote, TextInput } from '@/components/ui';
import type { Account, TransactionType } from '@/domain/models';
import { validateAmount, validateWithdrawal } from '@/domain/rules';
import { formatCents, parseAmount } from '@/domain/amount';
import { useBank } from '@/state/bank-context';
import { useToast } from '@/state/toast-context';

/** Matches a complete or partially typed amount, e.g. "$", "25", "25.", "25.5". */
const PARTIAL_AMOUNT_PATTERN = /^\$?\d*(\.\d{0,2})?$/;

export function TransactionForm({ account }: { account: Account }): ReactNode {
  const { deposit, withdraw } = useBank();
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('deposit');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const inputValue = event.target.value;
    if (PARTIAL_AMOUNT_PATTERN.test(inputValue)) {
      setAmount(inputValue);
      setError(null);
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsed = parseAmount(amount, account.currency);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const amountValidation = validateAmount(account, parsed.cents);
    if (!amountValidation.ok) {
      setError(amountValidation.error);
      return;
    }
    if (type === 'withdrawal') {
      const overdraftValidation = validateWithdrawal(account, parsed.cents);
      if (!overdraftValidation.ok) {
        setError(overdraftValidation.error);
        return;
      }
    }
    const result =
      type === 'deposit'
        ? deposit(account.id, parsed.cents)
        : withdraw(account.id, parsed.cents);
    if (!result.ok) {
      // Backstop: the UI already validated, but the service — the source
      // of truth — gets the final say, and its message is what we show.
      setError(result.error);
      return;
    }
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
      <div className="amount-row">
        <TextInput
          className="amount-input"
          inputMode="decimal"
          aria-label={`Amount (${account.currency})`}
          value={amount}
          placeholder="0.00"
          onChange={handleInputChange}
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
