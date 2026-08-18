import { describe, expect, it } from 'vitest';

import { cx } from '@/components/ui/styles';

describe('cx', () => {
  it('joins truthy fragments with single spaces', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy fragments', () => {
    expect(cx('a', undefined, 'b', false, null, '')).toBe('a b');
  });

  it('returns an empty string for no input', () => {
    expect(cx()).toBe('');
  });
});
