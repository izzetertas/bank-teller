'use client';

import type { ReactNode } from 'react';

import { Button, PageLayout, Panel } from '@/components/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <PageLayout
      title="Something went wrong"
      subtitle={error.message || 'An unexpected error occurred.'}
    >
      <Panel className="p-10 text-center">
        <Button onClick={reset}>Try again</Button>
      </Panel>
    </PageLayout>
  );
}
