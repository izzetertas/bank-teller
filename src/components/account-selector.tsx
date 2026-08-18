'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { AccountListItem } from '@/components/account-list-item';
import { Button, Field, Modal, TextInput } from '@/components/ui';
import { getSelectedAccount, type Account } from '@/domain/bank';
import { useBank } from '@/state/bank-context';

export function AccountSelector(): ReactNode {
  const { state, selectAccount } = useBank();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  const selected = getSelectedAccount(state);
  if (selected === undefined || state.accounts.length < 2) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const matches = state.accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(normalizedQuery) ||
      account.number.toLowerCase().includes(normalizedQuery),
  );
  const orderedAccounts: readonly Account[] = [...matches].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  function close(): void {
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const options = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(
          '[data-account-option]:not(:disabled)',
        ),
      );
      if (options.length === 0) {
        return;
      }
      event.preventDefault();
      const index = options.indexOf(document.activeElement as HTMLElement);
      const next =
        event.key === 'ArrowDown'
          ? options[index >= options.length - 1 ? 0 : index + 1]
          : options[index <= 0 ? options.length - 1 : index - 1];
      next?.focus();
    }
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Switch account
      </Button>
      {open && (
        <Modal title="Switch account" onClose={close} onKeyDown={handleKeyDown}>
          <p className="m-0 text-soft">
            Select the account you want to operate on.
          </p>
          <Field label="Search accounts">
            <TextInput
              ref={searchRef}
              className="w-full"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or account number"
            />
          </Field>
          {orderedAccounts.length === 0 ? (
            <p className="m-0 text-soft">No accounts match “{query.trim()}”.</p>
          ) : (
            <ul className="account-list">
              {orderedAccounts.map((account) => (
                <AccountListItem
                  key={account.id}
                  current={account.id === selected.id}
                  account={account}
                  onClick={() => {
                    selectAccount(account.id);
                    close();
                  }}
                />
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
