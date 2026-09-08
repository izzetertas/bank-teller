'use client';

import type { ReactNode } from 'react';

import { AccountSelector } from '@/components/account-selector';
import { CloseAccountButton } from '@/components/close-account-button';
import { MicroLabel } from '@/components/ui';
import { isClosed, type Account } from '@/domain/bank';
import { formatCents } from '@/domain/money';

type AccountDetailsProps = {
  account: Account;
};

export function AccountDetails({ account }: AccountDetailsProps): ReactNode {
  const isAccountClosed = isClosed(account)
  return (
    <div className="account-header">
      <div>
        <div className="account-title">
          <h2 className="account-name">{account.name}</h2>
          {isAccountClosed && <span className="closed-tag">Closed</span>}
          <AccountSelector />
        </div>
        <p className="account-number">{account.number}</p>
        {/* Below the metadata, away from the everyday actions: destructive and rare. */}
        {!isAccountClosed && (
          <div className="account-meta-actions">
            <CloseAccountButton account={account} />
          </div>
        )}
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
  );
}
