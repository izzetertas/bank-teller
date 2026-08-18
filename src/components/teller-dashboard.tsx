'use client';

import type { ReactNode } from 'react';

import { AccountSelector } from '@/components/account-selector';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { LinkButton, MicroLabel, PageLayout, Panel } from '@/components/ui';
import { getSelectedAccount } from '@/domain/bank';
import { formatCents } from '@/domain/money';
import { useBank } from '@/state/bank-context';

export function TellerDashboard(): ReactNode {
  const { state } = useBank();
  const account = getSelectedAccount(state);

  return (
    <PageLayout
      title="Bank Teller"
      subtitle="Open customer accounts and process cash deposits and withdrawals."
      actions={
        <LinkButton
          href="/accounts/new"
          variant="inverted"
          className="self-start sm:shrink-0"
        >
          Open account
        </LinkButton>
      }
    >
      {account === undefined ? (
        <Panel className="p-10 text-center">
          <p className="m-0 text-soft">
            No accounts yet — click “Open account” to get started.
          </p>
        </Panel>
      ) : (
        <Panel aria-label="Selected account">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="account-name">{account.name}</h2>
                <AccountSelector />
              </div>
              <p className="account-number">{account.number}</p>
            </div>
            <div className="sm:text-right">
              <MicroLabel aria-hidden="true">Current balance</MicroLabel>
              <p
                key={account.balanceCents}
                className="balance"
                aria-label="Current balance"
              >
                {formatCents(account.balanceCents, account.currency)}
              </p>
            </div>
          </div>
          <hr className="divider" />
          <TransactionForm account={account} />
          <hr className="divider" />
          <section aria-label="Transaction history">
            <MicroLabel>Transaction ledger</MicroLabel>
            <TransactionList
              transactions={account.transactions}
              currency={account.currency}
            />
          </section>
        </Panel>
      )}
      <footer className="text-center text-xs text-cream-soft">
        Demo session — data lives in memory and is cleared when the page closes.
      </footer>
    </PageLayout>
  );
}
