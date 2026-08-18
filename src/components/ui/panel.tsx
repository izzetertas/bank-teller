import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cx } from './styles';

/**
 * Cream card on the dark page ground. Renders a <section>, so passing
 * aria-label also makes it a named landmark region.
 */
export function Panel({
  className,
  ...props
}: ComponentPropsWithRef<'section'>): ReactNode {
  return <section className={cx('card', className)} {...props} />;
}
