'use client';

import type { ReactNode } from 'react';

import { AccountSelector } from '@/components/account-selector';
import { MicroLabel } from '@/components/ui';
import type { Account } from '@/domain/models';
import { formatCents } from '@/domain/amount';

type AccountDetailsProps = {
  account: Account;
};

export function AccountDetails({ account }: AccountDetailsProps): ReactNode {
  return (
    <div className="account-header">
      <div>
        <div className="account-title">
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
  );
}
