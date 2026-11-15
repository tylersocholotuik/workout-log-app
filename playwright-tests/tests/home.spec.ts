import { test, expect } from '@playwright/test';

/**
 * Smoke test proving the saved auth state from the setup project is reused:
 * navigating straight to the home page should already show a signed-in nav.
 */
test('home page shows signed-in nav', async ({ page }) => {
  await page.goto('/');

  // The navbar has no direct Login/Logout links - everything lives behind
  // the user menu trigger. It isn't exposed with a button role (and a second,
  // hidden copy exists for the mobile layout), so find it by label and keep
  // only the visible one.
  const userMenuTrigger = page.getByLabel('User Actions').filter({ visible: true });
  await expect(userMenuTrigger).toBeVisible();

  // A signed-out visitor's menu would only offer "Login".
  await userMenuTrigger.click();
  await expect(page.getByRole('menuitem', { name: 'Account' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Login' })).toHaveCount(0);
});
