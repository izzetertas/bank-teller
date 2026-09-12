'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { AccountService } from '@/domain/account-service';
import type { Account } from '@/domain/models';
import type { ValidationResult } from '@/domain/rules';

export type CreateAccountResult =
  | { ok: true; accountId: string }
  | { ok: false; error: string };

export interface BankContextValue {
  readonly accounts: readonly Account[];
  readonly selectedAccount: Account | undefined;

  createAccount(name: string, currency?: string): CreateAccountResult;
  selectAccount(id: string): void;
  deposit(accountId: string, amountCents: number): ValidationResult;
  withdraw(accountId: string, amountCents: number): ValidationResult;
}

const BankContext = createContext<BankContextValue | null>(null);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

/**
 * Talks to an account service like an API client — including turning what
 * it throws back into a typed result — and mirrors its account list into
 * React state so the UI re-renders after each mutation. The selection is
 * pure UI state the service knows nothing about.
 */
export function BankProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [service] = useState(() => new AccountService());
  const [accounts, setAccounts] = useState<readonly Account[]>(() => service.getAllAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    () => accounts[0]?.id ?? null,
  );

  const contextValue = useMemo<BankContextValue>(
    () => ({
      accounts,
      selectedAccount: accounts.find((account) => account.id === selectedAccountId),
      createAccount(name: string, currency?: string): CreateAccountResult {
        try {
          const account = service.createAccount(name, currency);
          setAccounts(service.getAllAccounts());
          setSelectedAccountId(account.id);
          return { ok: true, accountId: account.id };
        } catch (error) {
          return { ok: false, error: errorMessage(error) };
        }
      },
      selectAccount(id: string): void {
        if (service.getAccount(id) !== undefined) {
          setSelectedAccountId(id);
        }
      },
      deposit(accountId: string, amountCents: number): ValidationResult {
        try {
          service.deposit(accountId, amountCents);
          setAccounts(service.getAllAccounts());
          return { ok: true };
        } catch (error) {
          return { ok: false, error: errorMessage(error) };
        }
      },
      withdraw(accountId: string, amountCents: number): ValidationResult {
        try {
          service.withdraw(accountId, amountCents);
          setAccounts(service.getAllAccounts());
          return { ok: true };
        } catch (error) {
          return { ok: false, error: errorMessage(error) };
        }
      },
    }),
    [service, accounts, selectedAccountId],
  );

  return <BankContext.Provider value={contextValue}>{children}</BankContext.Provider>;
}

export function useBank(): BankContextValue {
  const context = useContext(BankContext);
  if (context === null) {
    throw new Error('useBank must be used inside <BankProvider>');
  }
  return context;
}
