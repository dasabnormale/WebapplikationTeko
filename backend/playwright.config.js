// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './backend/tests',                 // Tests liegen unter backend/tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',        // Basis-URL für page.goto('/')
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],

  // Startet das Backend vor den Tests und wartet auf den Health-Endpoint
  webServer: {
    command: 'npm run start --prefix backend',  // nutzt backend/package.json -> "start": "node server.js"
    url: 'http://localhost:3000/health',        // wartet bis Server bereit ist
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
