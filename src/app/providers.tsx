'use client';

import type { ReactNode } from 'react';

import { BankProvider } from '@/state/bank-context';
import { ToastProvider } from '@/state/toast-context';

/**
 * Mounted in the root layout so bank state and toasts survive client-side
 * navigation between the dashboard and the open-account page.
 */
export function Providers({ children }: { children: ReactNode }): ReactNode {
  return (
    <ToastProvider>
      <BankProvider>{children}</BankProvider>
    </ToastProvider>
  );
}
