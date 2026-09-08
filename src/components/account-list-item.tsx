'use client';

import type { ReactNode } from 'react';

import { Avatar } from '@/components/ui';
import { isClosed, type Account } from '@/domain/bank';
import { formatCents } from '@/domain/money';

type AccountListItemProps = {
  current: boolean;
  account: Account;
  onClick: () => void;
};

export function AccountListItem({
  account,
  current,
  onClick,
}: AccountListItemProps): ReactNode {
  return (
    <li>
      <button
        type="button"
        data-account-option
        className={current ? 'account-option current' : 'account-option'}
        aria-current={current}
        disabled={current}
        onClick={onClick}
      >
        <span className="account-option-main">
          <Avatar name={account.name} />
          <span className="account-option-text">
            <span className="account-option-title">
              <span>{account.name}</span>
              {current && <span className="current-tag">Current</span>}
              {isClosed(account) && <span className="closed-tag">Closed</span>}
            </span>
            <span className="account-option-number">{account.number}</span>
          </span>
        </span>
        <span className="account-option-balance">
          {formatCents(account.balanceCents, account.currency)}
        </span>
      </button>
    </li>
  );
}
