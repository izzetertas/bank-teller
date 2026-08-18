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

import { Button, LinkButton } from '@/components/ui';

describe('Button', () => {
  it('defaults to type="button" so it cannot submit forms accidentally', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('still allows an explicit type="submit"', () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('defaults to the primary variant at medium size', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(
      'btn',
      'btn-primary',
      'btn-md',
    );
  });

  it.each([
    ['secondary', 'btn-secondary'],
    ['inverted', 'btn-inverted'],
  ] as const)('maps the %s variant to %s', (variant, expected) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(expected);
  });

  it('merges custom classes after the recipe classes', () => {
    render(
      <Button size="sm" className="w-full">
        Go
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(
      'btn-sm',
      'w-full',
    );
  });

  it('forwards native props like disabled and onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toBeDisabled();
    await userEvent.click(button).catch(() => {});
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('LinkButton', () => {
  it('renders a link with the same button styling', () => {
    render(<LinkButton href="/somewhere">Go</LinkButton>);
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveAttribute('href', '/somewhere');
    expect(link).toHaveClass('btn', 'btn-primary', 'btn-md');
  });

  it('supports the same variant and size options as Button', () => {
    render(
      <LinkButton href="/x" variant="inverted" size="sm">
        Go
      </LinkButton>,
    );
    expect(screen.getByRole('link', { name: 'Go' })).toHaveClass(
      'btn-inverted',
      'btn-sm',
    );
  });
});
