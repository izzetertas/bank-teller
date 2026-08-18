import type { ReactNode } from 'react';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Circle with the person's initials (first letters of the first two words).
 * Decorative: hidden from assistive tech, the name is expected alongside.
 */
export function Avatar({ name }: { name: string }): ReactNode {
  return (
    <span className="avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}
