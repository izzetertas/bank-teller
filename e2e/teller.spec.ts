import { expect, test, type Page } from '@playwright/test';

/**
 * Smoke suite through a real browser and real Next.js routing — the piece
 * the jsdom tests cannot cover, since they mock next/link and next/navigation.
 * Detailed behavior (validation messages, sorting, keyboard) stays in Vitest.
 */

/**
 * Toasts stack top-center and can briefly cover the header controls; they
 * dismiss on click, so clear them before interacting with anything above.
 */
async function dismissToasts(page: Page): Promise<void> {
  const toasts = page.getByRole('status').getByRole('button');
  for (const toast of await toasts.all()) {
    // A toast may auto-dismiss mid-click; that is fine, we only want it gone.
    await toast.click({ timeout: 1000 }).catch(() => {});
  }
  await expect(toasts).toHaveCount(0);
}

async function openAccount(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Open account' }).click();
  await expect(page).toHaveURL(/\/accounts\/new/);
  await page.getByLabel('Customer name').fill(name);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Bank Teller' })).toBeVisible();
  await dismissToasts(page);
}

test('opens an account, deposits and withdraws, and records the ledger', async ({
  page,
}) => {
  await page.goto('/');
  await openAccount(page, 'Ada Lovelace');

  // State survived the round-trip navigation; the account is active.
  await expect(page.getByText('ACC-1001')).toBeVisible();
  await expect(page.getByLabel('Current balance')).toHaveText('$0.00');

  await page.getByLabel(/Amount/).fill('120');
  await page.getByRole('button', { name: 'Deposit cash' }).click();
  await expect(page.getByLabel('Current balance')).toHaveText('$120.00');

  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await page.getByLabel(/Amount/).fill('45.50');
  await page.getByRole('button', { name: 'Withdraw cash' }).click();
  await expect(page.getByLabel('Current balance')).toHaveText('$74.50');

  const rows = page
    .getByRole('region', { name: 'Transaction history' })
    .getByRole('row');
  await expect(rows).toHaveCount(3); // header + two transactions, newest first
  await expect(rows.nth(1)).toContainText('Withdrawal');
  await expect(rows.nth(1)).toContainText('−$45.50');
  await expect(rows.nth(2)).toContainText('Deposit');
});

test('blocks an overdraft with a visible error', async ({ page }) => {
  await page.goto('/');
  await openAccount(page, 'Grace Hopper');

  await page.getByLabel(/Amount/).fill('10');
  await page.getByRole('button', { name: 'Deposit cash' }).click();
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await page.getByLabel(/Amount/).fill('10.01');
  await page.getByRole('button', { name: 'Withdraw cash' }).click();

  // Next.js's route announcer is also role="alert", so filter by content.
  await expect(
    page.getByRole('alert').filter({ hasText: 'Insufficient funds' }),
  ).toHaveText('Insufficient funds — the balance is $10.00');
  await expect(page.getByLabel('Current balance')).toHaveText('$10.00');
});

test('switches between accounts through the modal', async ({ page }) => {
  await page.goto('/');
  await openAccount(page, 'Ada Lovelace');
  await page.getByLabel(/Amount/).fill('100');
  await page.getByRole('button', { name: 'Deposit cash' }).click();
  await dismissToasts(page);
  await openAccount(page, 'Grace Hopper');

  await page.getByRole('button', { name: 'Switch account' }).click();
  const dialog = page.getByRole('dialog', { name: 'Switch account' });
  await dialog.getByLabel('Search accounts').fill('ada');
  await dialog.getByRole('button', { name: /Ada/ }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByLabel('Current balance')).toHaveText('$100.00');
  await expect(page.getByText('ACC-1001')).toBeVisible();
});
