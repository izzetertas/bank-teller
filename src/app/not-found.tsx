import type { ReactNode } from 'react';

import { LinkButton, PageLayout, Panel } from '@/components/ui';

export default function NotFound(): ReactNode {
  return (
    <PageLayout
      title="Page not found"
      subtitle="The page you are looking for does not exist."
    >
      <Panel className="p-10 text-center">
        <LinkButton href="/">Back to the dashboard</LinkButton>
      </Panel>
    </PageLayout>
  );
}
