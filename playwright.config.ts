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
    // Serve the static export (out/) exactly as production hosting does;
    // this also avoids Next 16's one-dev-server-per-project lock.
    command: 'npm run build && npx serve out -l 3211',
    port: 3211,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
