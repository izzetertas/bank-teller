import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import ErrorPage from '@/app/error';
import NotFound from '@/app/not-found';

describe('error page', () => {
  it('shows the error message and retries on click', async () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('Boom')} reset={reset} />);

    expect(screen.getByText('Boom')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('falls back to a generic message when the error has none', () => {
    render(<ErrorPage error={new Error('')} reset={() => {}} />);
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });
});

describe('not-found page', () => {
  it('links back to the dashboard', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('link', { name: 'Back to the dashboard' }),
    ).toHaveAttribute('href', '/');
  });
});
