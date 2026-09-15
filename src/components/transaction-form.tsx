'use client';

import {
  type ChangeEvent,
  useState,
  type ReactNode,
  type SubmitEvent,
} from 'react';

import { Button, ErrorNote, TextInput } from '@/components/ui';
import type { Account } from '@/domain/models';
import { validateAmount, validateWithdrawal } from '@/domain/rules';
import type { ValidationResult } from '@/domain/rules';
import { formatCents, parseAmount } from '@/domain/amount';
import { useBank } from '@/state/bank-context';
import { useToast } from '@/state/toast-context';
import { DestinationAccountSelect } from '@/components/destination-account-select';
import { TransactionTypeMap } from '@/components/transaction-row';

/** Matches a complete or partially typed amount, e.g. "$", "25", "25.", "25.5". */
const PARTIAL_AMOUNT_PATTERN = /^\$?\d*(\.\d{0,2})?$/;

/** Which transaction the form is composing — distinct from the domain's
 * ledger-entry `TransactionType`, which has no single "transfer" case. */
type TransactionFormType = 'deposit' | 'withdrawal' | 'transfer';

export function TransactionForm({ account }: { account: Account }): ReactNode {
  const { deposit, withdraw, transfer } = useBank();
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionFormType>('deposit');
  const [amount, setAmount] = useState('');
  const [transferAccountId, setTransferAccountId] = useState('');
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

    if (type === 'withdrawal' || type === 'transfer') {
      const overdraftValidation = validateWithdrawal(account, parsed.cents);
      if (!overdraftValidation.ok) {
        setError(overdraftValidation.error);
        return;
      }
    }
    let result: ValidationResult | undefined = undefined;
    if (type === 'deposit') {
      result = deposit(account.id, parsed.cents);
    } else if (type === 'withdrawal') {
      result = withdraw(account.id, parsed.cents);
    } else {
      result = transfer(account.id, transferAccountId, parsed.cents);
    }

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
      `${TransactionTypeMap[type]} ${formatCents(parsed.cents, account.currency)} — balance ${formatCents(balanceAfter, account.currency)}`,
    );
    setAmount('');
    setTransferAccountId('');
    setError(null);
  }

  function selectType(next: TransactionFormType): void {
    setType(next);
    setError(null);
  }

  function getButtonLabel(): string {
    if (type === 'deposit') return 'Deposit cash';
    if (type === 'withdrawal') return 'Withdraw cash';
    return 'Transfer';
  }

  // The submit button and the "Transfer" segment toggle would otherwise
  // share an accessible name; only the submit button needs disambiguating.
  function getButtonAriaLabel(): string | undefined {
    return type === 'transfer' ? 'Transfer funds' : undefined;
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
        <button
          type="button"
          className={type === 'transfer' ? 'segment active' : 'segment'}
          aria-pressed={type === 'transfer'}
          onClick={() => selectType('transfer')}
        >
          Transfer
        </button>
      </div>
      {type === 'transfer' && (
        <DestinationAccountSelect
          currency={account.currency}
          excludeAccountId={account.id}
          value={transferAccountId}
          onChange={setTransferAccountId}
        />
      )}
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
          aria-label={getButtonAriaLabel()}
          disabled={type === 'transfer' && transferAccountId === ''}
        >
          {getButtonLabel()}
        </Button>
      </div>
      <p className="hint">
        Available balance: {formatCents(account.balanceCents, account.currency)}
      </p>
      {error !== null && <ErrorNote>{error}</ErrorNote>}
    </form>
  );
}
