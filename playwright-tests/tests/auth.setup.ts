import { test as setup, expect } from '@playwright/test';

import { storageStateFor } from '../playwright.config';

/**
 * Logs in once per browser with the dedicated Playwright test account and
 * saves the resulting cookies/storage to disk. Each browser project depends
 * on its own "setup-<browser>" run and reuses that saved state instead of
 * logging in per test.
 */
setup('authenticate', async ({ page }, testInfo) => {
  // testInfo.project.name is e.g. "setup-chromium" - the part after the dash
  // matches the browser name used in storageStateFor().
  const browserName = testInfo.project.name.replace(/^setup-/, '');

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set. See .env.example.'
    );
  }

  await page.goto('/login');

  const loginForm = page.locator('#password-login-form');
  await loginForm.getByLabel('Email').fill(email);
  await loginForm.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  // global-setup's health check only confirms the server process and DB
  // connection are up - the login endpoint itself (password hashing, JWT
  // signing, first-time query compilation) can still be much slower right
  // after a Render free-tier instance wakes from a cold start. Give this
  // specific check a longer allowance than the default expect timeout.
  await expect(page).toHaveURL('/', { timeout: 60_000 });

  await page.context().storageState({ path: storageStateFor(browserName) });
});
