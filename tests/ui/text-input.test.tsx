import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { TextInput } from '@/components/ui';

describe('TextInput', () => {
  it('merges a custom class onto the input recipe', () => {
    render(<TextInput aria-label="Amount" className="w-full" />);
    expect(screen.getByLabelText('Amount')).toHaveClass('text-input', 'w-full');
  });

  it('forwards native props and accepts typing', async () => {
    render(<TextInput aria-label="Amount" type="search" placeholder="Search…" />);
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('placeholder', 'Search…');
    await userEvent.type(input, 'ada');
    expect(input).toHaveValue('ada');
  });

  it('exposes the underlying element through ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextInput aria-label="Amount" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
