# Bank Teller

A small bank-teller dashboard built with Next.js 16, React 19, and Tailwind CSS 4.
A teller can open customer accounts, switch between them, and process cash deposits
and withdrawals, with every balance change recorded in a per-account transaction
ledger. All state lives in the browser for the lifetime of the page session — no
backend, no persistence.

## Index

- **[Bank Teller](#bank-teller)**
  - [Getting started](#getting-started)
  - [Specification](#specification)
  - [Project structure](#project-structure)
  - [Styling](#styling)
  - [Tooling & CI](#tooling--ci)
  - [Testing](#testing)

---

## Getting started

```bash
npm install
npm run dev        # start the dev server at http://localhost:3000
npm run check      # typecheck + lint + tests in one go
npm run build      # production build
```

[↑ Index](#index)

## Specification

### Accounts

- A teller opens an account with the **Open account** button in the top-right of
  the dashboard header, which navigates to a dedicated page (`/accounts/new`)
  with a customer-name field and Save / Cancel buttons; Cancel returns to the
  dashboard without creating anything.
- The name is required; a blank or whitespace-only name is rejected with
  "Customer name is required", and the stored name is trimmed.
- Customer names are unique, compared case-insensitively on the trimmed name:
  opening a second account for an existing name is rejected with
  "An account for “X” already exists". The reducer enforces the same rule
  defensively, independent of the UI.
- On Save, the new account starts with a $0.00 balance and an empty transaction
  history, immediately becomes the active account, and the teller is returned to
  the dashboard showing it. Bank state lives in a provider mounted in the root
  layout, so it survives navigating between the two pages.
- Multiple accounts can be open at once, each with an independent balance and
  history. Once a second account exists, a **Switch account** button appears next
  to the account name; it opens a modal with a short instruction ("Select the
  account you want to operate on.") and a search input that filters accounts by
  customer name or account number. Accounts are always listed alphabetically by
  name; the currently selected one is marked "Current" and is not clickable.
  Each entry shows an initials avatar, the name, account number, and balance;
  picking an entry switches to it and closes the modal. The modal is fully
  keyboard-operable: arrow keys move through the options, Tab focus is trapped
  inside, and Escape, the × button, or clicking the backdrop close it.

### Transactions

- Two transaction types: **deposit** and **withdrawal**, chosen with a segmented
  Deposit / Withdraw toggle above the amount field. A single action button whose
  label follows the mode ("Deposit cash" / "Withdraw cash") submits; Enter in the
  amount field submits the current mode. An "Available balance" hint sits under
  the field, and the action button is disabled in withdraw mode while the
  balance is zero.
- The account card shows the customer name with a sequential teller-facing
  account number ("ACC-1001", assigned at creation) and a labeled
  "Current balance" block; the balance briefly flashes when it changes.
- Every applied transaction is recorded with a unique id, a timestamp, the amount,
  and the account balance immediately after it was applied. The "Transaction
  ledger" lists the newest first, showing date + time, a colored type, a
  colored amount (green for deposits; red with a `−` sign for withdrawals),
  and a "Balance after" column.

### Amount input and validation

- All monetary values are handled internally as **integer cents** — floating-point
  dollar arithmetic is never used for balances.
- The currency is not hardcoded: each account stores its own ISO 4217 `currency`,
  assigned at creation and defaulting to `CURRENCY` in `src/domain/money.ts`
  (`USD`). The amount-field label, balances, ledger amounts, and error messages
  all format in the account's currency, and `createAccount(name, currency?)`
  already accepts an explicit code — a currency dropdown on the open-account
  page only needs to pass its value through.
- The amount field only accepts keystrokes that can form a valid amount
  (pattern `^\$?\d*(\.\d{0,2})?$`): digits, an optional leading `$`, and at most one
  decimal point with at most two decimal digits. Anything else is ignored as typed.
- On submit, the amount is parsed and must satisfy all of the following, each with
  its own error message:
  - non-empty — "Enter an amount"
  - well-formed (e.g. `25`, `25.5`, `$25.50`) — "Enter a valid amount, e.g. 25.00"
  - greater than zero — "Amount must be greater than zero"
  - at most $1,000,000,000.00 — "Amount exceeds the maximum of $1,000,000,000.00"
- A withdrawal larger than the current balance is rejected as an overdraft with
  "Insufficient funds — the balance is $X.XX", and the balance and history are
  left unchanged.
- Validation is enforced twice: the UI validates first so it can show a message,
  and the state reducer independently rejects any invalid action (unknown account,
  overdraft, non-positive or non-integer amount) by leaving state unchanged, so
  correctness never depends on the UI.

### Notifications

- A transient toast notification confirms each successful action: opening an
  account ("Account opened for Ada"), a deposit ("Deposited $100.00 — balance
  $100.00"), and a withdrawal ("Withdrew $40.00 — balance $60.00").
- Toasts appear top-center (full-width on small screens) with a green check
  icon, auto-dismiss after 3 seconds, and can be dismissed early by clicking
  them. At most three are visible at once — older ones are dropped so the stack
  never buries the page. The toast area is an `aria-live` status region so
  screen readers announce confirmations.

### State

- State lives in memory in a React reducer (`bankReducer`) behind a context
  provider; there is no backend or persistence, and a page reload starts a fresh
  session.
- The reducer is pure and deterministic: ids and timestamps are supplied by the
  action creators, never generated inside the reducer.

[↑ Index](#index)

## Project structure

```
src/
  app/          Next.js app shell: layout (mounts providers), dashboard page,
                accounts/new page, error / global-error / not-found pages,
                global styles
  components/   Feature UI: teller dashboard, account selector, transaction
                form, transaction list + row
  components/ui/  Reusable primitives: Avatar, Button/LinkButton, ErrorNote,
                Field, MicroLabel, Modal, PageLayout, Panel, TextInput
  domain/       Pure domain logic — money parsing/formatting (money.ts) and
                the account/transaction model + reducer (bank.ts)
  state/        React contexts: bank reducer (bank-context.tsx) and toast
                notifications (toast-context.tsx)
tests/          Vitest suites: unit tests for the pure domain logic, jsdom
                integration tests for the dashboard flows, and error-page tests
e2e/            Playwright smoke suite against the real app in Chromium
```

[↑ Index](#index)

## Styling

The look is a dark forest-green page ground with cream cards, serif page and
account headings, and monospace tabular numerals for everything monetary.

Tailwind CSS v4, in two layers inside `src/app/globals.css`:

- **`@theme`** defines the design tokens once (colors, serif/mono font stacks,
  animations), which generate utilities like `bg-panel` and `text-ink`.
- **`@layer components`** composes those utilities into semantic classes with
  `@apply` (`.btn`, `.card`, `.ledger-th`, `.toast`, …), so the full style
  recipes live in the stylesheet and JSX only carries short class names plus
  the occasional one-off layout utility.

Reusable primitives in `src/components/ui/` (Button with variants/sizes and a
Link twin, TextInput, Field, Panel, PageLayout, Modal, Avatar, MicroLabel,
ErrorNote) wrap those classes with markup and behavior — one component per
file, exported through a barrel. The layout is responsive: the account card,
transaction row, and toasts stack or go full-width below the `sm` breakpoint,
and the ledger scrolls horizontally inside its card.

[↑ Index](#index)

## Tooling & CI

- `npm run typecheck` — strict TypeScript (`tsc --noEmit`)
- `npm run lint` — ESLint 9 flat config with `eslint-config-next`
  (core-web-vitals + typescript)
- `npm test` — Vitest; `npm run test:coverage` for a v8 coverage report
- `npm run check` — typecheck + lint + tests in one go
- `npm run test:e2e` — Playwright smoke suite in Chromium
- GitHub Actions (`.github/workflows/ci.yml`) runs two jobs on every push and
  pull request: typecheck + lint + unit tests + production build, and the
  Playwright e2e suite.
- `.vscode/` recommends the Tailwind CSS IntelliSense extension and silences
  the built-in CSS linter's false positives on Tailwind at-rules.

[↑ Index](#index)

## Testing

Tests run with Vitest. Domain logic (`tests/domain/`)
is unit-tested directly since it is pure. The dashboard flows
(`tests/teller-dashboard.test.tsx`) are tested through Testing Library in jsdom:
opening accounts (including duplicate-name rejection), depositing, withdrawing,
overdraft rejection, input filtering, toast behavior, and the switch-account
modal — search by name or number, sorting, and full keyboard interaction
(arrow keys, focus trap, Escape). `tests/ui/` mirrors `components/ui/` with
one suite per primitive, covering each component's contract (variant/size
mappings, initials logic, focus trap and Escape, landmark and alert
semantics, ref forwarding), `tests/state/` covers the context layer (provider
guards, id/timestamp supply, toast auto-dismiss timing with fake timers), and
`tests/error-pages.test.tsx` covers the error and not-found pages.

A small Playwright smoke suite (`e2e/`) runs the real app in Chromium through
real Next.js routing — the piece jsdom cannot cover, since the integration
tests mock `next/link`/`next/navigation`. It covers the full happy path
(open account → deposit → withdraw → ledger), overdraft rejection, and
switching accounts via the modal, plus axe-core accessibility scans
(`e2e/a11y.spec.ts`) asserting zero WCAG 2.x A/AA violations — color contrast
included — on every distinct screen state. Playwright's `webServer` builds and
starts a production server automatically.

```bash
npm test              # unit + integration, single run
npm run test:watch
npm run test:coverage # v8 coverage report (~98% statements over src/)
npm run test:e2e      # Playwright smoke suite, headless (CI mode)
npm run test:e2e:ui   # Playwright UI mode — watch the tests run in a browser
                      # (both need: npx playwright install chromium)
```

[↑ Index](#index)
