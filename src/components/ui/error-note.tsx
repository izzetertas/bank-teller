import type { ReactNode } from 'react';

/** Inline validation error, announced to screen readers. */
export function ErrorNote({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className="error-note" role="alert">
      {children}
    </p>
  );
}
