'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode, type SubmitEvent } from 'react';

import {
  Button,
  ErrorNote,
  Field,
  PageLayout,
  Panel,
  TextInput,
} from '@/components/ui';
import { validateAccountName } from '@/domain/rules';
import { useBank } from '@/state/bank-context';
import { useToast } from '@/state/toast-context';

export default function NewAccountPage(): ReactNode {
  const router = useRouter();
  const { createAccount } = useBank();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const validation = validateAccountName(name);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const result = createAccount(name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(`Account opened for ${name.trim()}`);
    router.push('/');
  }

  return (
    <PageLayout title="Open account">
      <Panel>
        <form onSubmit={handleSubmit} noValidate>
          <Field label="Customer name">
            <TextInput
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="e.g. Ada Lovelace"
            />
          </Field>
          {error !== null && <ErrorNote>{error}</ErrorNote>}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => router.push('/')}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Panel>
    </PageLayout>
  );
}
