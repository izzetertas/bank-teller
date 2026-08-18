import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrorNote } from '@/components/ui';

describe('ErrorNote', () => {
  it('announces its content as an alert', () => {
    render(<ErrorNote>Insufficient funds</ErrorNote>);
    expect(screen.getByRole('alert')).toHaveTextContent('Insufficient funds');
  });
});
