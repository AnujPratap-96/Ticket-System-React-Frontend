import { defineConfig } from '@playwright/test';

// The tests drive a real browser against a running API + seeded database (see .github/workflows/ci.yml).
// CHROMIUM_PATH lets you use a browser you already have instead of downloading one.
const base = process.env.E2E_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: base,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {},
  },
  // Start the dev server for you when nothing is listening yet.
  webServer: process.env.E2E_NO_SERVER ? undefined : { command: 'npm run dev -- --host 127.0.0.1 --port 5173', url: base, reuseExistingServer: true, timeout: 60_000 },
});
