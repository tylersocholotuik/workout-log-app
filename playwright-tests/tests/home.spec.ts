import { test, expect } from '@playwright/test';

/**
 * Smoke test proving the saved auth state from the setup project is reused:
 * navigating straight to the home page should already show a signed-in nav.
 */
test('home page shows signed-in nav', async ({ page }) => {
  await page.goto('/');

  // "Logout" only renders once the user menu dropdown is opened, so check
  // for the always-visible user menu trigger instead.
  await expect(page.getByRole('button', { name: 'User Actions' })).toBeVisible();
});
