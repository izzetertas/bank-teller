import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cx } from './styles';

/** Uppercase, letterspaced micro-heading, e.g. "CURRENT BALANCE". */
export function MicroLabel({
  className,
  ...props
}: ComponentPropsWithRef<'p'>): ReactNode {
  return <p className={cx('micro-label', className)} {...props} />;
}
