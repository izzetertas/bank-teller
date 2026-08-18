'use client';

import type { ReactNode } from 'react';

import './globals.css';

import { Button, PageLayout, Panel } from '@/components/ui';

/**
 * Last-resort boundary: catches errors thrown by the root layout itself
 * (including the providers mounted there), which app/error.tsx cannot see.
 * It replaces the root layout, so it must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <html lang="en">
      <body className="bg-shell font-sans text-ink antialiased">
        <PageLayout
          title="Something went wrong"
          subtitle={error.message || 'An unexpected error occurred.'}
        >
          <Panel className="p-10 text-center">
            <Button onClick={reset}>Try again</Button>
          </Panel>
        </PageLayout>
      </body>
    </html>
  );
}
