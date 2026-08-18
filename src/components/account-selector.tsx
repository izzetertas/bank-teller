'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { Avatar, Button, Field, Modal, TextInput } from '@/components/ui';
import { getSelectedAccount, type Account } from '@/domain/bank';
import { formatCents } from '@/domain/money';
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
  const ordered: readonly Account[] = [...matches].sort((left, right) =>
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
          {ordered.length === 0 ? (
            <p className="m-0 text-soft">No accounts match “{query.trim()}”.</p>
          ) : (
            <ul className="-m-[3px] flex max-h-64 list-none flex-col gap-1.5 overflow-y-auto p-[3px]">
              {ordered.map((account) => {
                const current = account.id === selected.id;
                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      data-account-option
                      className={
                        current ? 'account-option current' : 'account-option'
                      }
                      aria-current={current}
                      disabled={current}
                      onClick={() => {
                        selectAccount(account.id);
                        close();
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={account.name} />
                        <span className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-2">
                            <span>{account.name}</span>
                            {current && (
                              <span className="current-tag">Current</span>
                            )}
                          </span>
                          <span className="font-mono text-xs tracking-[0.08em] text-soft">
                            {account.number}
                          </span>
                        </span>
                      </span>
                      <span className="whitespace-nowrap font-mono tabular-nums text-soft">
                        {formatCents(account.balanceCents, account.currency)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
