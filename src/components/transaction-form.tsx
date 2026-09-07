'use client';

import { useState, type ChangeEvent, type ReactNode, type SubmitEvent } from 'react';

import { Button, ErrorNote, Field, TextInput } from '@/components/ui';
import {
  validateTransaction,
  validateTransfer,
  type Account,
  type CashTransactionType,
} from '@/domain/bank';
import { formatCents, parseAmount } from '@/domain/money';
import { useBank } from '@/state/bank-context';
import { useToast } from '@/state/toast-context';

/** Matches a complete or partially typed amount, e.g. "$", "25", "25.", "25.5". */
const PARTIAL_AMOUNT_PATTERN = /^\$?\d*(\.\d{0,2})?$/;

/** What the segmented toggle selects; only "transfer" needs a second account. */
type FormMode = CashTransactionType | 'transfer';

const MODES: readonly FormMode[] = ['deposit', 'withdrawal', 'transfer'];

const MODE_LABELS: Record<FormMode, { segment: string; action: string }> = {
  deposit: { segment: 'Deposit', action: 'Deposit cash' },
  withdrawal: { segment: 'Withdraw', action: 'Withdraw cash' },
  transfer: { segment: 'Transfer', action: 'Transfer funds' },
};

export function TransactionForm({ account }: { account: Account }): ReactNode {
  const { state, applyTransaction, transfer } = useBank();
  const { showToast } = useToast();
  const [mode, setMode] = useState<FormMode>('deposit');
  const [amount, setAmount] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const otherAccounts = state.accounts
    .filter((candidate) => candidate.id !== account.id)
    .sort((left, right) => left.name.localeCompare(right.name));
  const canTransfer = otherAccounts.length > 0;
  const drainsBalance = mode === 'withdrawal' || mode === 'transfer';
  const submitDisabled =
    (drainsBalance && account.balanceCents === 0) ||
    (mode === 'transfer' && !canTransfer);

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>): void {
    const inputValue = event.target.value;
    if (PARTIAL_AMOUNT_PATTERN.test(inputValue)) {
      setAmount(inputValue);
      setError(null);
    }
  }

  function selectMode(next: FormMode): void {
    setMode(next);
    setError(null);
  }

  function finish(message: string): void {
    showToast(message);
    setAmount('');
    setError(null);
  }

  function submitCash(type: CashTransactionType, amountCents: number): void {
    const validationError = validateTransaction(account, type, amountCents);
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    applyTransaction(account.id, type, amountCents);
    const balanceAfter =
      type === 'deposit'
        ? account.balanceCents + amountCents
        : account.balanceCents - amountCents;
    finish(
      `${type === 'deposit' ? 'Deposited' : 'Withdrew'} ${formatCents(amountCents, account.currency)} — balance ${formatCents(balanceAfter, account.currency)}`,
    );
  }

  function submitTransfer(amountCents: number): void {
    const destination = otherAccounts.find(
      (candidate) => candidate.id === destinationId,
    );
    if (destination === undefined) {
      setError('Choose a destination account');
      return;
    }
    const validationError = validateTransfer(account, destination, amountCents);
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    transfer(account.id, destination.id, amountCents);
    finish(
      `Transferred ${formatCents(amountCents, account.currency)} to ${destination.name} — balance ${formatCents(account.balanceCents - amountCents, account.currency)}`,
    );
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (mode === 'transfer') {
      submitTransfer(parsed.cents);
    } else {
      submitCash(mode, parsed.cents);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="segmented" role="group" aria-label="Transaction type">
        {MODES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={mode === candidate ? 'segment active' : 'segment'}
            aria-pressed={mode === candidate}
            onClick={() => selectMode(candidate)}
          >
            {MODE_LABELS[candidate].segment}
          </button>
        ))}
      </div>
      {mode === 'transfer' &&
        (canTransfer ? (
          <Field label="To account" className="transfer-field">
            <select
              className="text-input select"
              value={destinationId}
              onChange={(event) => {
                setDestinationId(event.target.value);
                setError(null);
              }}
            >
              <option value="">Select an account</option>
              {otherAccounts.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} ({candidate.number})
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <p className="hint transfer-field">
            Open a second account to transfer funds between accounts.
          </p>
        ))}
      <div className="amount-row">
        <TextInput
          className="amount-input"
          inputMode="decimal"
          aria-label={`Amount (${account.currency})`}
          value={amount}
          placeholder="0.00"
          onChange={handleAmountChange}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={submitDisabled}>
          {MODE_LABELS[mode].action}
        </Button>
      </div>
      <p className="hint">
        Available balance: {formatCents(account.balanceCents, account.currency)}
      </p>
      {error !== null && <ErrorNote>{error}</ErrorNote>}
    </form>
  );
}
