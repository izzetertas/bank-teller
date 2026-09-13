import { render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NewAccountPage from '@/app/accounts/new/page';
import Page from '@/app/page';
import { Providers } from '@/app/providers';

// Minimal router: TestApp registers its route setter here, and the
// next/navigation + next/link mocks below drive it.
let navigate: (path: string) => void = () => {};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: (path: string) => navigate(path) }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a
      href={href}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  ),
}));

/** Renders the app with providers at the "layout" level, like production. */
function TestApp(): ReactNode {
  const [route, setRoute] = useState('/');
  useEffect(() => {
    navigate = setRoute;
  }, []);
  return (
    <Providers>
      {route === '/accounts/new' ? <NewAccountPage /> : <Page />}
    </Providers>
  );
}

function balancePanel(): HTMLElement {
  return screen.getByRole('region', { name: 'Selected account' });
}

async function openAccount(user: UserEvent, name: string): Promise<void> {
  await user.click(screen.getByRole('link', { name: 'Open account' }));
  await user.type(screen.getByLabelText('Customer name'), name);
  await user.click(screen.getByRole('button', { name: 'Save' }));
}

async function submitTransaction(
  user: UserEvent,
  type: 'Deposit' | 'Withdrawal',
  amount: string,
): Promise<void> {
  await user.click(
    screen.getByRole('button', {
      name: type === 'Deposit' ? 'Deposit' : 'Withdraw',
    }),
  );
  const amountInput = screen.getByLabelText('Amount (USD)');
  await user.clear(amountInput);
  await user.type(amountInput, amount);
  await user.click(
    screen.getByRole('button', {
      name: type === 'Deposit' ? 'Deposit cash' : 'Withdraw cash',
    }),
  );
}

async function switchToAccount(user: UserEvent, name: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Switch account' }));
  const dialog = screen.getByRole('dialog', { name: 'Switch account' });
  await user.click(
    within(dialog).getByRole('button', { name: new RegExp(name) }),
  );
}

async function submitTransfer(
  user: UserEvent,
  destinationName: string,
  amount: string,
): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Transfer' }));
  const select = screen.getByLabelText('To Account');
  await user.selectOptions(
    select,
    within(select).getByRole('option', { name: new RegExp(destinationName) }),
  );
  const amountInput = screen.getByLabelText('Amount (USD)');
  await user.clear(amountInput);
  await user.type(amountInput, amount);
  await user.click(screen.getByRole('button', { name: 'Transfer funds' }));
}

describe('teller dashboard', () => {
  beforeEach(() => {
    render(<TestApp />);
  });

  it('starts with no accounts and prompts the teller', () => {
    expect(
      screen.getByText(
        'No accounts yet — click “Open account” to get started.',
      ),
    ).toBeInTheDocument();
  });

  it('opens an account with a $0.00 balance and selects it', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada Lovelace');

    expect(
      within(balancePanel()).getByText('Ada Lovelace'),
    ).toBeInTheDocument();
    expect(within(balancePanel()).getByText('ACC-1001')).toBeInTheDocument();
    expect(screen.getByLabelText('Current balance')).toHaveTextContent('$0.00');
    expect(screen.getByText('No transactions yet.')).toBeInTheDocument();
  });

  it('requires a customer name to open an account', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Open account' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Customer name is required',
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.getByText(
        'No accounts yet — click “Open account” to get started.',
      ),
    ).toBeInTheDocument();
  });

  it('deposits cash and shows the transaction', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '25.50');

    expect(screen.getByLabelText('Current balance')).toHaveTextContent(
      '$25.50',
    );
    const history = screen.getByRole('region', { name: 'Transaction history' });
    const row = within(history).getAllByRole('row')[1];
    expect(row).toHaveTextContent('Deposit');
    expect(row).toHaveTextContent('$25.50');
  });

  it('withdraws cash within the balance', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '100');
    await submitTransaction(user, 'Withdrawal', '40');

    expect(screen.getByLabelText('Current balance')).toHaveTextContent(
      '$60.00',
    );
  });

  it('blocks an overdraft with a validation error and keeps the balance', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '10');
    await submitTransaction(user, 'Withdrawal', '10.01');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Insufficient funds — the balance is $10.00',
    );
    expect(screen.getByLabelText('Current balance')).toHaveTextContent(
      '$10.00',
    );
    const history = screen.getByRole('region', { name: 'Transaction history' });
    expect(within(history).getAllByRole('row')).toHaveLength(2); // header + deposit
  });

  it('shows a toast after opening an account, depositing, and withdrawing', async () => {
    const user = userEvent.setup();
    const toasts = (): HTMLElement => screen.getByRole('status');

    await openAccount(user, 'Ada');
    expect(toasts()).toHaveTextContent('Account opened for Ada');

    await submitTransaction(user, 'Deposit', '100');
    expect(toasts()).toHaveTextContent('Deposited $100.00 — balance $100.00');

    await submitTransaction(user, 'Withdrawal', '40');
    expect(toasts()).toHaveTextContent('Withdrew $40.00 — balance $60.00');
  });

  it('shows at most three toasts at a time', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    for (const amount of ['1', '2', '3', '4']) {
      await submitTransaction(user, 'Deposit', amount);
    }

    const stack = within(screen.getByRole('status')).getAllByRole('button');
    expect(stack.length).toBeLessThanOrEqual(3);
    expect(screen.getByRole('status')).toHaveTextContent('Deposited $4.00');
  });

  it('ignores keystrokes that cannot form a valid amount', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    const input = screen.getByLabelText('Amount (USD)');

    await user.type(input, 'sdsd');
    expect(input).toHaveValue('');

    await user.type(input, '12.345');
    expect(input).toHaveValue('12.34'); // third decimal digit is dropped
  });

  it('switches between accounts, keeping balances independent', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '100');
    await openAccount(user, 'Grace');

    expect(within(balancePanel()).getByText('Grace')).toBeInTheDocument();
    expect(screen.getByLabelText('Current balance')).toHaveTextContent('$0.00');

    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    const dialog = screen.getByRole('dialog', { name: 'Switch account' });
    await user.type(within(dialog).getByLabelText('Search accounts'), 'ada');
    expect(
      within(dialog).queryByRole('button', { name: /Grace/ }),
    ).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Ada/ }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(balancePanel()).getByText('Ada')).toBeInTheDocument();
    expect(screen.getByLabelText('Current balance')).toHaveTextContent(
      '$100.00',
    );
  });

  it('resets the deposit/withdraw toggle to Deposit when switching accounts', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '50');
    await user.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(screen.getByRole('button', { name: 'Withdraw' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await openAccount(user, 'Grace');
    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    const dialog = screen.getByRole('dialog', { name: 'Switch account' });
    await user.click(within(dialog).getByRole('button', { name: /Ada/ }));

    expect(screen.getByRole('button', { name: 'Deposit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Withdraw' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('opens a second account for the same customer name as a separate account', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await openAccount(user, 'Ada');

    expect(within(balancePanel()).getByText('ACC-1002')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    const dialog = screen.getByRole('dialog', { name: 'Switch account' });
    expect(within(dialog).getAllByText('Ada')).toHaveLength(2);
    expect(
      within(dialog).getByRole('button', { name: /ACC-1001/ }),
    ).toBeInTheDocument();
  });

  it('marks the current account in the switch-account modal and disables it', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await openAccount(user, 'Grace');

    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    const dialog = screen.getByRole('dialog', { name: 'Switch account' });
    expect(
      within(dialog).getByText('Select the account you want to operate on.'),
    ).toBeInTheDocument();
    const current = within(dialog).getByRole('button', { name: /Grace/ });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveTextContent('Current');
    expect(current).toBeDisabled();
  });

  it('shows a validation error when withdrawing from a zero balance', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');

    await user.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(screen.getByRole('button', { name: 'Withdraw cash' })).toBeEnabled();
    expect(screen.getByText('Available balance: $0.00')).toBeInTheDocument();

    await submitTransaction(user, 'Withdrawal', '10');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Insufficient funds — the balance is $0.00',
    );
    expect(screen.getByLabelText('Current balance')).toHaveTextContent('$0.00');
  });

  it('lists accounts sorted alphabetically by name', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Zeynep');
    await openAccount(user, 'Ada');
    await openAccount(user, 'Merve'); // becomes the current account

    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    const dialog = screen.getByRole('dialog', { name: 'Switch account' });
    const names = within(dialog)
      .getAllByRole('listitem')
      .map((item) => within(item).getByRole('button').textContent);

    expect(names[0]).toContain('Ada');
    expect(names[1]).toContain('Merve'); // current, but not pinned
    expect(names[2]).toContain('Zeynep');
  });

  it('finds accounts by account number in the switch-account modal', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada'); // ACC-1001
    await openAccount(user, 'Grace'); // ACC-1002

    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    const dialog = screen.getByRole('dialog', { name: 'Switch account' });
    expect(
      within(dialog).getByRole('button', { name: /Ada/ }),
    ).toHaveTextContent('ACC-1001');

    await user.type(
      within(dialog).getByLabelText('Search accounts'),
      'acc-1001',
    );
    expect(
      within(dialog).queryByRole('button', { name: /Grace/ }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Ada/ })).toBeVisible();
  });

  it('supports keyboard interaction in the switch-account modal', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await openAccount(user, 'Grace');
    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    const dialog = screen.getByRole('dialog', { name: 'Switch account' });

    // Arrow keys move focus to the account options (the disabled current one is skipped).
    await user.keyboard('{ArrowDown}');
    expect(within(dialog).getByRole('button', { name: /Ada/ })).toHaveFocus();

    // Tab from the last focusable element wraps back to the first (focus trap).
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(dialog).getByRole('button', { name: /Ada/ })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Switch account' }),
    ).toHaveFocus();

    // Escape also works when focus has left the modal, e.g. after clicking
    // non-interactive text inside it.
    await user.click(screen.getByRole('button', { name: 'Switch account' }));
    await user.click(
      screen.getByText('Select the account you want to operate on.'),
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides the switch-account button with a single account', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    expect(
      screen.queryByRole('button', { name: 'Switch account' }),
    ).not.toBeInTheDocument();
  });

  it('renders deposits and withdrawals with typed badges and signed amounts', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '100');
    await submitTransaction(user, 'Withdrawal', '40');

    const history = screen.getByRole('region', { name: 'Transaction history' });
    const [withdrawalRow, depositRow] = within(history)
      .getAllByRole('row')
      .slice(1); // newest first, after the header row
    expect(withdrawalRow).toHaveTextContent('Withdrawal');
    expect(withdrawalRow).toHaveTextContent('−$40.00');
    expect(depositRow).toHaveTextContent('Deposit');
    expect(depositRow).toHaveTextContent('$100.00');
    expect(depositRow?.textContent).not.toContain('+');
  });

  it('transfers money between two accounts and records both legs', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada'); // ACC-1001
    await submitTransaction(user, 'Deposit', '200');
    await openAccount(user, 'Grace'); // ACC-1002
    await switchToAccount(user, 'Ada');

    await submitTransfer(user, 'Grace', '50');

    expect(screen.getByLabelText('Current balance')).toHaveTextContent(
      '$150.00',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Transferred $50.00 — balance $150.00',
    );
    const history = screen.getByRole('region', { name: 'Transaction history' });
    const row = within(history).getAllByRole('row')[1];
    expect(row).toHaveTextContent('Transfer to ACC-1002');
    expect(row).toHaveTextContent('−$50.00');

    await switchToAccount(user, 'Grace');
    expect(screen.getByLabelText('Current balance')).toHaveTextContent(
      '$50.00',
    );
    const destinationHistory = screen.getByRole('region', {
      name: 'Transaction history',
    });
    expect(within(destinationHistory).getAllByRole('row')[1]).toHaveTextContent(
      'Transfer from ACC-1001',
    );
  });

  it('excludes the current account from the transfer destination list', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await user.click(screen.getByRole('button', { name: 'Transfer' }));
    expect(
      within(screen.getByLabelText('To Account')).getAllByRole('option'),
    ).toHaveLength(1); // only the disabled placeholder

    await openAccount(user, 'Grace');
    await user.click(screen.getByRole('button', { name: 'Transfer' }));
    const select = screen.getByLabelText('To Account');
    expect(
      within(select).queryByRole('option', { name: /Grace/ }),
    ).not.toBeInTheDocument();
    expect(
      within(select).getByRole('option', { name: /Ada/ }),
    ).toBeInTheDocument();
  });

  it('blocks a transfer that exceeds the balance', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '10');
    await openAccount(user, 'Grace');
    await switchToAccount(user, 'Ada');

    await submitTransfer(user, 'Grace', '10.01');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Insufficient funds — the balance is $10.00',
    );
    expect(screen.getByLabelText('Current balance')).toHaveTextContent(
      '$10.00',
    );
  });

  it('disables the transfer submit until a destination account is chosen', async () => {
    const user = userEvent.setup();
    await openAccount(user, 'Ada');
    await submitTransaction(user, 'Deposit', '10');
    await openAccount(user, 'Grace');
    await switchToAccount(user, 'Ada');

    await user.click(screen.getByRole('button', { name: 'Transfer' }));
    expect(
      screen.getByRole('button', { name: 'Transfer funds' }),
    ).toBeDisabled();

    const select = screen.getByLabelText('To Account');
    await user.selectOptions(
      select,
      within(select).getByRole('option', { name: /Grace/ }),
    );
    expect(
      screen.getByRole('button', { name: 'Transfer funds' }),
    ).toBeEnabled();
  });
});
