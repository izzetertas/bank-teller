import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Panel } from '@/components/ui';

describe('Panel', () => {
  it('becomes a named landmark region when given an aria-label', () => {
    render(<Panel aria-label="Selected account">content</Panel>);
    expect(
      screen.getByRole('region', { name: 'Selected account' }),
    ).toHaveTextContent('content');
  });

  it('is not a landmark without a label', () => {
    render(<Panel>content</Panel>);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('merges custom classes onto the card recipe', () => {
    render(<Panel className="text-center">content</Panel>);
    expect(screen.getByText('content')).toHaveClass('card', 'text-center');
  });
});
