import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from '@/state/toast-context';

function Trigger({ message }: { message: string }): ReactNode {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(message)}>
      trigger
    </button>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useToast', () => {
  it('throws when used outside <ToastProvider>', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used inside <ToastProvider>',
    );
    spy.mockRestore();
  });

  it('shows a toast and auto-dismisses it after 3 seconds', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('status')).not.toHaveTextContent('Saved');
  });

  it('dismisses a toast immediately on click', () => {
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'trigger' }));
    fireEvent.click(screen.getByRole('button', { name: /Saved/ }));
    expect(screen.getByRole('status')).not.toHaveTextContent('Saved');
  });
});
