import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Automated WCAG 2.x A/AA scans (axe-core) over every distinct screen state.
 * Manual keyboard/focus behavior is covered separately in the jsdom suites.
 */

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function openAccount(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Open account' }).click();
  await page.getByLabel('Customer name').fill(name);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Bank Teller' })).toBeVisible();
}

test('empty dashboard has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expectNoViolations(page);
});

test('open-account page has no accessibility violations', async ({ page }) => {
  await page.goto('/accounts/new');
  await expect(page.getByLabel('Customer name')).toBeVisible();
  await expectNoViolations(page);
});

test('dashboard with transactions has no accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await openAccount(page, 'Ada Lovelace');
  await page.getByLabel(/Amount/).fill('120');
  await page.getByRole('button', { name: 'Deposit cash' }).click();
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await page.getByLabel(/Amount/).fill('45.50');
  await page.getByRole('button', { name: 'Withdraw cash' }).click();
  await expect(page.getByLabel('Current balance')).toHaveText('$74.50');
  await expectNoViolations(page);
});

test('close-account dialog and a closed account have no accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await openAccount(page, 'Ada Lovelace');
  await page.getByRole('button', { name: 'Close account' }).click();
  await expect(page.getByRole('dialog', { name: 'Close account' })).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole('button', { name: 'Close this account' }).click();
  await expect(page.getByRole('note')).toBeVisible();
  // Dismiss the confirmation toast: mid-fade-in its blended colors would be
  // reported as a contrast failure that no user ever sees settled.
  const toasts = page.getByRole('status').getByRole('button');
  for (const toast of await toasts.all()) {
    await toast.click({ timeout: 1000 }).catch(() => {}); // may auto-dismiss mid-click
  }
  await expect(toasts).toHaveCount(0);
  await expectNoViolations(page);
});

test('switch-account modal has no accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await openAccount(page, 'Ada Lovelace');
  await openAccount(page, 'Grace Hopper');
  await page.getByRole('button', { name: 'Switch account' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Switch account' }),
  ).toBeVisible();
  await expectNoViolations(page);
});
