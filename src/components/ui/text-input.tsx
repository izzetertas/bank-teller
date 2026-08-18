import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cx } from './styles';

export function TextInput({
  className,
  ...props
}: ComponentPropsWithRef<'input'>): ReactNode {
  return <input className={cx('text-input', className)} {...props} />;
}
