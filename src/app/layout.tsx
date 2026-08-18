import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'Bank Teller',
  description: 'In-browser bank teller console — no backend, no persistence.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <html lang="en">
      <body className="bg-shell font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
