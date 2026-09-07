'use client';

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  bankReducer,
  initialBankState,
  type BankState,
  type CashTransactionType,
} from '@/domain/bank';

export interface BankApi {
  readonly state: BankState;
  /**
   * Creates the account and selects it. Returns the new account id.
   * Defaults to the app currency when none is given.
   */
  createAccount(name: string, currency?: string): string;
  selectAccount(id: string): void;
  applyTransaction(
    accountId: string,
    type: CashTransactionType,
    amountCents: number,
  ): void;
  /** Moves funds between two accounts as one atomic state transition. */
  transfer(fromAccountId: string, toAccountId: string, amountCents: number): void;
}

const BankContext = createContext<BankApi | null>(null);

export function BankProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, dispatch] = useReducer(bankReducer, initialBankState);

  const contextValue = useMemo<BankApi>(
    () => ({
      state,
      createAccount(name: string, currency?: string): string {
        const id = crypto.randomUUID();
        dispatch({ type: 'account/create', id, name, currency });
        return id;
      },
      selectAccount(id: string): void {
        dispatch({ type: 'account/select', id });
      },
      applyTransaction(
        accountId: string,
        type: CashTransactionType,
        amountCents: number,
      ): void {
        dispatch({
          type: 'transaction/apply',
          transactionType: type,
          accountId,
          amountCents,
          transactionId: crypto.randomUUID(),
          timestamp: Date.now(),
        });
      },
      transfer(fromAccountId: string, toAccountId: string, amountCents: number): void {
        dispatch({
          type: 'transfer/apply',
          fromAccountId,
          toAccountId,
          amountCents,
          outTransactionId: crypto.randomUUID(),
          inTransactionId: crypto.randomUUID(),
          timestamp: Date.now(),
        });
      },
    }),
    [state],
  );

  return <BankContext.Provider value={contextValue}>{children}</BankContext.Provider>;
}

export function useBank(): BankApi {
  const context = useContext(BankContext);
  if (context === null) {
    throw new Error('useBank must be used inside <BankProvider>');
  }
  return context;
}
