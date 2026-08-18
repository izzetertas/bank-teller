import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageLayout } from '@/components/ui';

describe('PageLayout', () => {
  it('renders the title as the page heading with the subtitle below', () => {
    render(
      <PageLayout title="Bank Teller" subtitle="Sub">
        body
      </PageLayout>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Bank Teller' }),
    ).toBeVisible();
    expect(screen.getByText('Sub')).toBeVisible();
    expect(screen.getByRole('main')).toHaveTextContent('body');
  });

  it('omits the subtitle when not provided', () => {
    render(<PageLayout title="Bank Teller">body</PageLayout>);
    expect(screen.queryByText('Sub')).not.toBeInTheDocument();
  });

  it('renders header actions next to the title block', () => {
    render(
      <PageLayout title="Bank Teller" actions={<button>Act</button>}>
        body
      </PageLayout>,
    );
    expect(screen.getByRole('button', { name: 'Act' })).toBeVisible();
  });
});
