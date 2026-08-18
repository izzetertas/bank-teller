import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from '@/components/ui';

describe('Avatar', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['ada', 'A'],
    ['  jean  luc  picard ', 'JL'], // extra whitespace, only first two words
    ['x', 'X'],
    ['', ''],
  ])('renders the initials of %j as %j', (name, expected) => {
    const { container } = render(<Avatar name={name} />);
    expect(container.textContent).toBe(expected);
  });

  it('is hidden from assistive technology (the name is expected alongside)', () => {
    const { container } = render(<Avatar name="Ada" />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
