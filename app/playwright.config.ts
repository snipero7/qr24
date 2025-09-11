import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});

