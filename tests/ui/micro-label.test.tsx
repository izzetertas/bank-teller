import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MicroLabel } from '@/components/ui';

describe('MicroLabel', () => {
  it('renders its recipe class plus custom ones', () => {
    render(<MicroLabel className="extra">Current balance</MicroLabel>);
    expect(screen.getByText('Current balance')).toHaveClass(
      'micro-label',
      'extra',
    );
  });

  it('forwards arbitrary props such as aria-hidden', () => {
    render(<MicroLabel aria-hidden="true">Decorative</MicroLabel>);
    expect(screen.getByText('Decorative')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
