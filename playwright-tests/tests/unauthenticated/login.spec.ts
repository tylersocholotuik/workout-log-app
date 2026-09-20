import { test, expect } from '@playwright/test';

test.describe('Login form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows required field errors when submitted empty', async ({ page }) => {
    const form = page.locator('#password-login-form');

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(form.getByText('Email is required.')).toBeVisible();
    await expect(form.getByText('Password is required.')).toBeVisible();
  });

  test('shows an error for invalid credentials', async ({ page }) => {
    const form = page.locator('#password-login-form');

    await form.getByLabel('Email').fill('nonexistent-user@example.com');
    await form.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid email or password').first()).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('rejects a malformed email address', async ({ page }) => {
    const form = page.locator('#password-login-form');

    await form.getByLabel('Email').fill('not-an-email');
    await form.getByLabel('Password', { exact: true }).fill('somepassword123');
    await page.getByRole('button', { name: 'Login' }).click();

    // No client-side email format check; the API rejects it and the message
    // is surfaced under both inputs.
    await expect(form.getByText('Invalid email address').first()).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
