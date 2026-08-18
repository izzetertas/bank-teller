<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bank Teller — agent guide

In-browser bank-teller app: Next.js 16 (App Router), React 19, Tailwind CSS 4,
TypeScript strict. All state is in-memory for the page session — no backend.
The functional spec lives in `README.md`; keep it (and its Index/back-links)
updated whenever behavior changes.

## Commands

- `npm run check` — typecheck + lint + unit/integration tests; run before
  declaring any change done
- `npm run test:e2e` — Playwright smoke suite (builds and starts a production
  server itself; do not run `next dev` for it)
- `npm run test:coverage` — v8 coverage over `src/`
- `npm run build` — production build; must stay green

## Architecture rules

- `src/domain/` is pure TypeScript: no React, no side effects, no Date/random.
  Ids and timestamps come from action creators in `src/state/`, never from the
  reducer — every transition must be deterministic and unit-testable.
- Money is **integer cents** everywhere; never do floating-point dollar math.
  Currency is per-account (ISO 4217), defaulting to `CURRENCY` in
  `src/domain/money.ts`; always pass `account.currency` to `formatCents`.
- The reducer is defensive: invalid actions (duplicate name, overdraft, bad
  amount) leave state unchanged, independent of UI validation. Keep both
  layers when adding rules.
- `src/components/ui/` holds generic primitives (one component per file, name
  matching the file, exported via the barrel `index.ts`); feature components
  live directly in `src/components/`. Extract a component when it carries
  logic, not for static markup.

## Styling rules

- Design tokens live only in the `@theme` block of `src/app/globals.css`;
  style recipes are semantic classes under `@layer components` via `@apply`
  (`.btn`, `.card`, `.ledger-th`, …). JSX carries short semantic class names
  plus one-off layout utilities — no long utility strings inline.
- Mobile-first: base styles are the small-screen layout; widen with `sm:`.

## Code standards

- TypeScript strict; never `any` — use `unknown` and narrow. Exported
  functions get explicit parameter and return types; prefer inference
  elsewhere. Type-only imports use `import type`.
- Files are kebab-case; components PascalCase. React 19 types: use
  `SubmitEvent` (not the deprecated `FormEvent`) for form handlers.
- No single-letter or cryptic variable names, including callback parameters:
  `map((account) => …)`, not `map((a) => …)`; sort comparators use
  `(left, right)`. Idiomatic exceptions: `event` in handlers, loop indexes.
  Test data uses meaningful values too (a label is "Amount", not "q"), and
  variables are named by role (`firstAccountId`), not by fixture persona
  (`adaId`).
- Tests query by role/label/text, never by class or test id. Every behavior
  change lands with a test: domain rules in `tests/domain/`, UI primitives in
  `tests/ui/`, context glue in `tests/state/`, UI flows in
  `tests/teller-dashboard.test.tsx`,
  cross-page navigation only in `e2e/`.
