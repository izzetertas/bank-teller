/**
 * Account and ledger model. Plain data only: the rules that guard it live in
 * rules.ts and the transitions in account-service.ts, so this file has no
 * dependencies and every other domain module can import it freely.
 */

export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  readonly id: string;
  readonly type: TransactionType;
  readonly amountCents: number;
  readonly balanceAfterCents: number;
  readonly timestamp: number;
}

export interface Account {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  /** ISO 4217 code the account is denominated in. */
  readonly currency: string;
  readonly balanceCents: number;
  readonly transactions: readonly Transaction[];
}
