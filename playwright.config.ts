import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3211',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // A production build + start rather than `next dev`: Next 16 allows only
    // one dev server per project, so e2e must not race a locally running one.
    command: 'npm run build && npm run start -- --port 3211',
    port: 3211,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
