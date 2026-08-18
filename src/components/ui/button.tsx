import Link from 'next/link';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cx } from './styles';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  /** Cream-filled, for placement on the dark page ground. */
  inverted: 'btn-inverted',
} as const;

const sizes = {
  md: 'btn-md',
  sm: 'btn-sm',
} as const;

interface StyleProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ComponentPropsWithRef<'button'> & StyleProps): ReactNode {
  return (
    <button
      type={type}
      className={cx('btn', variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

/** A Next.js Link styled identically to Button. */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentPropsWithRef<typeof Link> & StyleProps): ReactNode {
  return (
    <Link
      className={cx('btn', variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
