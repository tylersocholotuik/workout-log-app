import { test, expect } from '@playwright/test';

test.describe('Register form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('tab', { name: 'Sign up' }).click();
  });

  test('shows required field errors when submitted empty', async ({ page }) => {
    const form = page.locator('#signup-form');

    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(form.getByText('Email is required.')).toBeVisible();
    await expect(form.getByText('First name is required.')).toBeVisible();
    await expect(form.getByText('Last name is required.')).toBeVisible();
    await expect(form.getByText('Password is required.')).toBeVisible();
  });

  test('shows an error when passwords do not match', async ({ page }) => {
    const form = page.locator('#signup-form');

    await form.getByLabel('Email').fill('new-user@example.com');
    await form.getByLabel('First Name').fill('Test');
    await form.getByLabel('Last Name').fill('User');
    await form.getByLabel('Password', { exact: true }).fill('password123');
    await form.getByLabel('Confirm Password').fill('different123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(form.getByText('Passwords do not match.').first()).toBeVisible();
  });

  test('shows an error when the password is too short', async ({ page }) => {
    const form = page.locator('#signup-form');

    await form.getByLabel('Email').fill('new-user@example.com');
    await form.getByLabel('First Name').fill('Test');
    await form.getByLabel('Last Name').fill('User');
    await form.getByLabel('Password', { exact: true }).fill('abc');
    await form.getByLabel('Confirm Password').fill('abc');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(
      form.getByText('Password must be at least 6 characters')
    ).toBeVisible();
  });

  test('rejects a malformed email address', async ({ page }) => {
    const form = page.locator('#signup-form');

    await form.getByLabel('Email').fill('not-an-email');
    await form.getByLabel('First Name').fill('Test');
    await form.getByLabel('Last Name').fill('User');
    await form.getByLabel('Password', { exact: true }).fill('password123');
    await form.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // No client-side email format check; the API rejects it and the message
    // is surfaced under the input.
    await expect(form.getByText('Invalid email address')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
