import type { ReactNode } from 'react';

/** Labeled form field: renders the caption above whatever control it wraps. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
