import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from '@/components/ui';

describe('Modal', () => {
  it('renders a dialog named after its title', () => {
    render(
      <Modal title="Switch account" onClose={() => {}}>
        body
      </Modal>,
    );
    expect(
      screen.getByRole('dialog', { name: 'Switch account' }),
    ).toHaveTextContent('body');
  });

  it('calls onClose from the × button', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="T" onClose={onClose}>
        body
      </Modal>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop, but not the dialog itself', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="T" onClose={onClose}>
        <p>body</p>
      </Modal>,
    );
    await userEvent.click(screen.getByText('body'));
    expect(onClose).not.toHaveBeenCalled();
    const backdrop = container.firstElementChild as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape regardless of where focus is', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="T" onClose={onClose}>
        body
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus between the first and last focusable elements', async () => {
    const user = userEvent.setup();
    render(
      <Modal title="T" onClose={() => {}}>
        <button>inner</button>
      </Modal>,
    );
    const close = screen.getByRole('button', { name: 'Close' });
    const inner = screen.getByRole('button', { name: 'inner' });

    inner.focus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(inner).toHaveFocus();
  });
});
