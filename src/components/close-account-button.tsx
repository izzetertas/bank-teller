'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button, ErrorNote, Modal } from '@/components/ui';
import { validateAccountClose, type Account } from '@/domain/bank';
import { useBank } from '@/state/bank-context';
import { useToast } from '@/state/toast-context';

/**
 * "Close account" trigger plus its confirmation dialog. Closing is
 * irreversible, so it always asks first; with funds still on the account the
 * dialog explains what must happen and keeps the confirm button disabled.
 */
export function CloseAccountButton({ account }: { account: Account }): ReactNode {
  const { closeAccount } = useBank();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Land focus on the safe choice when the dialog opens.
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  const blocker = validateAccountClose(account);

  function dismiss(): void {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function confirm(): void {
    closeAccount(account.id);
    showToast(`Account ${account.number} closed`);
    dismiss();
  }

  return (
    <>
      <Button ref={triggerRef} variant="danger-ghost" size="sm" onClick={() => setOpen(true)}>
        Close account
      </Button>
      {open && (
        <Modal title="Close account" onClose={dismiss}>
          <p className="m-0 text-soft">
            Close {account.number} for {account.name}? The account will stop
            accepting deposits and withdrawals. Its ledger stays available, and
            this cannot be undone.
          </p>
          {blocker !== null && <ErrorNote>{blocker}</ErrorNote>}
          <div className="form-actions">
            <Button ref={cancelRef} variant="secondary" onClick={dismiss}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={blocker !== null}>
              Close this account
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
