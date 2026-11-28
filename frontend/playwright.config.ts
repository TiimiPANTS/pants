import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// These specs run against the real backend and database instead of mocked
// API responses. They share data, so they run once (Chromium) and one at a time.
const BACKEND_SPECS = [
  /reservation-modify-e2e\.spec\.ts/,
  /system-reservation-lifecycle\.spec\.ts/,
];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  // Fail a stuck test quickly instead of hanging the whole run.
  timeout: 30_000,
  expect: { timeout: 5_000 },

  fullyParallel: true,

  // Fail CI if a test.only was left in the code.
  forbidOnly: isCI,

  // One retry on CI catches flaky tests without hiding real failures.
  retries: isCI ? 1 : 0,

  // GitHub-hosted runners have 4 vCPUs; the backend uses one of them.
  workers: isCI ? 3 : undefined,

  // On CI: annotations in the PR + an HTML report uploaded as an artifact.
  reporter: isCI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // UI tests with a mocked API, run in every browser.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: BACKEND_SPECS,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: BACKEND_SPECS,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: BACKEND_SPECS,
    },

    // End-to-end tests against the real backend.
    {
      name: 'backend-e2e',
      use: { ...devices['Desktop Chrome'] },
      testMatch: BACKEND_SPECS,
      fullyParallel: false,
      workers: 1,
    },
  ],

  webServer: {
    // CI serves a production build: faster page loads than the dev server,
    // and a compile error fails here immediately instead of in every test.
    command: isCI
      ? 'npx vite build && npx vite preview --port 5173 --strictPort'
      : 'npm run dev -- --host 0.0.0.0',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
