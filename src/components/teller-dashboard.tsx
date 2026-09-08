'use client';

import type { ReactNode } from 'react';

import { AccountDetails } from '@/components/account-details';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { LinkButton, MicroLabel, PageLayout, Panel } from '@/components/ui';
import { getSelectedAccount } from '@/domain/bank';
import { formatDate } from '@/domain/time';
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
          <AccountDetails account={account} />
          <hr className="divider" />
          {account.status === 'open' ? (
            <TransactionForm account={account} />
          ) : (
            <p className="closed-notice" role="note">
              This account was closed
              {account.closedAt !== undefined && ` on ${formatDate(account.closedAt)}`}. No
              further transactions can be made. The ledger below is kept for
              reference.
            </p>
          )}
          <hr className="divider" />
          <section aria-label="Transaction history">
            <MicroLabel>Transaction ledger</MicroLabel>
            <TransactionList transactions={account.transactions} currency={account.currency} />
          </section>
        </Panel>
      )}
      <footer className="page-footer">
        Demo session — data lives in memory and is cleared when the page closes.
      </footer>
    </PageLayout>
  );
}
