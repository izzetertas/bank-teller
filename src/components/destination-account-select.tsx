'use client';

import type { ReactNode } from 'react';
import { Field } from '@/components/ui';
import { useBank } from '@/state/bank-context';

type DestinationAccountSelectProps = {
  excludeAccountId: string;
  currency: string;
  value: string;
  onChange: (value: string) => void;
};

export function DestinationAccountSelect(
  props: DestinationAccountSelectProps,
): ReactNode {
  const { accounts } = useBank();
  const filteredAccounts = accounts.filter((account) => {
    if (account.currency !== props.currency) {
      return false;
    }
    if (props.excludeAccountId === account.id) {
      return false;
    }
    return true;
  });

  filteredAccounts.sort((left, right) => left.name.localeCompare(right.name));

  return (
    <Field label="To Account">
      <select
        className="select-input"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      >
        <option value="" disabled>
          Choose an account
        </option>
        {filteredAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} ({account.number})
          </option>
        ))}
      </select>
    </Field>
  );
}
