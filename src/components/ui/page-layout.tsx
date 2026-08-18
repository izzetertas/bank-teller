import type { ReactNode } from 'react';

/** Page frame: centered column with a serif title, subtitle, and optional header actions. */
export function PageLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <main className="page-layout">
      <header className={actions !== undefined ? 'page-header' : undefined}>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle !== undefined && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}
