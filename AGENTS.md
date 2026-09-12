<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bank Teller — agent guide

In-browser bank-teller console: open customer accounts, switch between them,
deposit and withdraw cash, see a per-account ledger. Next.js 16 (App Router,
static export), React 19, Tailwind CSS 4, TypeScript strict. All state is
in-memory for the page session — no backend, no persistence.

The functional spec is `README.md`. When behavior changes, the README changes
in the same commit (including its Index and `[↑ Index]` back-links).

## Commands

| Command | Use it when |
|---|---|
| `npm run check` | Before declaring any change done: typecheck + lint + unit/integration tests |
| `npm run build` | Before finishing anything touching `src/app/`, config, or styling; must stay green |
| `npm run test:e2e` | After changes to routing, layout state, or the modal; builds and serves `out/` itself — do not run `next dev` alongside |
| `npm run test:watch` | While iterating on a test |
| `npm run test:coverage` | v8 coverage over `src/`; keep it around 98% |
| `npm run dev` | Manual checks only; never needed for tests |
| `npm run start` | Serves the built `out/` like production hosting does (`next start` does not work with a static export) |

## Repo map

```
src/domain/       plain TS, no React: amount parsing/formatting (amount.ts),
                  account model (models.ts), business rules (rules.ts), the
                  in-memory account service (account-service.ts)
src/state/        React contexts: BankProvider wraps the service; toasts
src/components/   feature UI; src/components/ui/ generic primitives + barrel
src/app/          Next shell: layout (mounts providers), pages, error pages, globals.css
tests/            Vitest: domain/, state/, ui/, teller-dashboard.test.tsx, error-pages.test.tsx
e2e/              Playwright smoke + axe-core a11y scans, against the built out/
```

## Workflow

1. Read the relevant section of `README.md` before changing behavior; if the
   requirement is ambiguous, say so and state the assumption you are taking.
2. Work domain → state → UI → tests: add the rule in `src/domain/` with a unit
   test first, then wire it through.
3. Keep the change scoped. Do not refactor, rename, or reformat code the task
   does not touch; propose it separately instead.
4. Run `npm run check` (and `npm run build` when relevant) and report the
   actual result. A skipped step is reported as skipped, not as passing.
5. Commit only when asked. Messages follow the existing log:
   `feat:`, `fix:`, `test:`, `docs:`, `ci:`, `build:`, `refactor:` + a short
   imperative subject.

## Architecture rules

- `src/domain/` has no React. `amount.ts`, `models.ts` and `rules.ts` are pure
  (no `Date`, no random) and are tested with plain calls. `AccountService` is
  the one place that generates ids (`crypto.randomUUID`) and timestamps
  (`Date.now`); its tests use fake timers and assert on shape, not on exact
  ids.
- The service is the in-memory "backend": the source of truth and the only
  place accounts are opened or money moves. The UI never holds business
  state of its own. A real backend would replace the service behind the same
  method signatures, not change the UI. `BankProvider` constructs its own
  instance per mount, used like an API client — no singleton, no shared
  state, so every render (production or test) starts from an empty bank.
- Money is **integer cents** everywhere; never do floating-point dollar math.
  Currency is per-account (ISO 4217), defaulting to `DEFAULT_CURRENCY` in
  `src/domain/amount.ts`; always pass `account.currency` to `formatCents`.
- Validation runs twice on purpose, in two different shapes. `src/domain/rules.ts`
  holds the rule once as a `validate*` function returning `{ ok: true } | { ok: false, error }`;
  the UI calls it directly to show a message without exceptions. The service
  wraps the same rule and throws when it fails — accounts are opened and
  money moves through the service alone, so a rejected call stores nothing.
  The rule is not duplicated; the call shape is.
- Derived data is not stored. The provider keeps `selectedAccountId` and
  derives `selectedAccount` from the account list; the ledger's
  `balanceAfterCents` snapshot is the deliberate exception.
- Provider state lives in the root layout so it survives client-side
  navigation; do not mount providers inside pages.
- `src/components/ui/` holds generic primitives: one component per file, name
  matching the file, exported via the barrel `index.ts`. Feature components
  live directly in `src/components/`. Extract a component when it carries
  logic or is reused, not to shorten static markup.
- Imports use the `@/` alias, never relative paths across folders.

## Styling rules

- Design tokens live only in the `@theme` block of `src/app/globals.css`.
  Style recipes are semantic classes under `@layer components` via `@apply`
  (`.btn`, `.card`, `.ledger-th`, …). JSX carries a short semantic class plus
  at most one or two one-off layout utilities — no long utility strings
  inline. Three or more utilities, or any typography/color utility, means a
  new semantic class.
- A modifier class (e.g. `.amount-input` on top of `.text-input`) declares
  only the differences and must be defined after the base class.
- Mobile-first: base styles are the small-screen layout; widen with `sm:`.

## Code standards

- TypeScript strict; never `any` — use `unknown` and narrow. Exported
  functions get explicit parameter and return types; prefer inference
  elsewhere. Type-only imports use `import type`. Derive types from values
  when both are needed (`as const` + `(typeof X)[number]`); hand-write a
  union only when there is no runtime list.
- Files are kebab-case; components PascalCase. Inline the props type for
  small components; when it earns a name, call it `<Component>Props`.
  React 19: `ref` is a plain prop (no `forwardRef`);
  form handlers take `SubmitEvent`, inputs take `ChangeEvent<HTMLInputElement>`.
- Names say what a value *is* in its context, not how it was produced:
  `accountName` not `trimmed`, `orderedAccounts` not `ordered`,
  `contextValue` not `api`. No single-letter or cryptic names, including
  callback parameters (`(account) =>`, `(left, right) =>`); idiomatic
  exceptions are `event` in handlers and loop indexes.
- Expected failures are discriminated-union return values (`{ ok: true }` / `{ ok: false, error }`),
  not thrown errors, in `rules.ts` and `amount.ts` — the UI needs to branch
  on them without a `try/catch`. `AccountService` is the exception: like an
  API client, it throws when a call cannot be satisfied.
- Comments explain *why* (a constraint, a browser quirk, a deliberate
  trade-off), not *what* the next line does.

## Testing rules

- Every behavior change lands with a test in the matching folder: domain
  rules in `tests/domain/`, context glue in `tests/state/`, UI primitives in
  `tests/ui/`, dashboard flows in `tests/teller-dashboard.test.tsx`,
  cross-page navigation and a11y only in `e2e/`.
- Query by role, label, or text — never by class or test id.
- Test data uses meaningful values (a label is "Amount", not "q"); variables
  are named by role (`firstAccountId`), not by fixture persona (`adaId`).
- Cover the boundary the change introduces, including the case that would
  have been wrong before (e.g. mixed-case input for a case-insensitive rule).
- Domain tests pass fixed ids and timestamps; nothing in `tests/domain/`
  touches the DOM or the clock.

## Do not

- Do not edit the `nextjs-agent-rules` block above; `next dev` owns it.
- Do not commit `out/`, `.next/`, `coverage/`, `test-results/`, or `.env*`.
- Do not add dependencies without saying why the existing stack cannot do it.
- Do not add persistence, network calls, or `Date`/`random` in `src/domain/`.
- Do not change a Tailwind arbitrary value to a scale value (or back) without
  checking the neighbouring values it must match.
