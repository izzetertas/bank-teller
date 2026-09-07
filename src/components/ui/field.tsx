import type { ReactNode } from 'react';

import { cx } from './styles';

/** Labeled form field: renders the caption above whatever control it wraps. */
export function Field({
  label,
  className,
  children,
}: {
  label: string;
  /** Layout-only additions (spacing, width); the field recipe itself lives in CSS. */
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className={cx('field', className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}
