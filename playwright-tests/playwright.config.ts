import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 * Not present in CI (values come from GitHub Environment secrets instead).
 */
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/* Each browser gets its own storage state - WebKit in particular doesn't
 * reliably honor a cross-site auth cookie captured by a different engine. */
export const storageStateFor = (browserName: string) =>
  path.join(__dirname, `playwright/.auth/${browserName}.json`);

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
// WebKit doesn't reliably send the auth cookie once the frontend and backend
// are on different domains (staging), even with its own storageState captured
// by WebKit itself - a Playwright/WebKit limitation, not an app bug. Rather
// than fail there every time, only run it locally (same-origin) for now.
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseURL);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Wake up Render free-tier services in staging before any test runs. */
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Staging (Render/Vercel) round-trips are noticeably slower than local dev
   * servers, so give assertions more headroom to avoid flaky timeouts there. */
  expect: {
    timeout: 10_000,
  },
  /* Plain actions (e.g. .click()) aren't bounded by expect.timeout above -
   * they wait up to the overall per-test timeout instead, so that needs the
   * same staging headroom. Default (30s) is kept for local runs. */
  timeout: isLocal ? 30_000 : 60_000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup-chromium',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'setup-firefox',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    ...(isLocal
      ? [
          {
            name: 'setup-webkit',
            testMatch: /.*\.setup\.ts/,
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: storageStateFor('chromium') },
      dependencies: ['setup-chromium'],
      testIgnore: /unauthenticated\//,
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: storageStateFor('firefox') },
      dependencies: ['setup-firefox'],
      testIgnore: /unauthenticated\//,
    },

    ...(isLocal
      ? [
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'], storageState: storageStateFor('webkit') },
            dependencies: ['setup-webkit'],
            testIgnore: /unauthenticated\//,
          },
        ]
      : []),

    /* Logged-out tests (e.g. login/register form validation) - no setup dependency, no storageState. */
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /unauthenticated\/.*\.spec\.ts/,
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
