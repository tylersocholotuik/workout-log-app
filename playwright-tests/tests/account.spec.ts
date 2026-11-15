import type { Page } from '@playwright/test';

import { test, expect } from './fixtures';
import {
  getUserSettingsViaApi,
  acquireAccountLock,
  releaseAccountLock,
  ACCOUNT_LOCK_HOOK_TIMEOUT_MS,
  type UserSettings,
} from './helpers';

// Every test here is independent, so this file deliberately does NOT use
// `serial` mode (which would skip the remaining tests after one failure).
// Overriding `fullyParallel` back to the default mode still keeps the file's
// tests in order on a single worker, which the account lock below needs:
// it's acquired per worker, so two workers on this file would deadlock
// waiting for each other.
test.describe.configure({ mode: 'default' });

// This suite changes the shared test account's preferences, which
// workout.spec.ts reads (new exercises default to them), so it takes the
// same account-wide lock workout/history use to keep them from overlapping.
test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(ACCOUNT_LOCK_HOOK_TIMEOUT_MS);
  await acquireAccountLock();
});

test.afterAll(() => {
  releaseAccountLock();
});

// Snapshots the profile names/preferences before every test and restores
// them afterward no matter what - see "Test data & cleanup" in
// test-plans/account.md.
test.beforeEach(async ({ page, restoreAccount }) => {
  void restoreAccount;
  await page.goto('/account');
});

const PROFILE_PATCH_URL = /\/api\/users\/me$/;
const SETTINGS_PATCH_URL = /\/api\/users\/me\/settings$/;

// Safety net for the email-change scenarios: tests must never actually
// submit an email change (it would change the shared account's email and
// send a real confirmation email through the metered Brevo plan - see
// "Email change caveat" in test-plans/account.md). Aborts any profile PATCH
// instead of sending it, and returns the requests that were attempted.
async function blockProfilePatches(page: Page): Promise<string[]> {
  const attempted: string[] = [];
  await page.route(PROFILE_PATCH_URL, (route) => {
    if (route.request().method() === 'PATCH') {
      attempted.push(route.request().postData() ?? '');
      return route.abort();
    }
    return route.continue();
  });
  return attempted;
}

function saveButton(page: Page) {
  return page.getByRole('button', { name: 'Save', exact: true });
}

function cancelButton(page: Page) {
  return page.getByRole('button', { name: 'Cancel', exact: true });
}

test.describe('Profile tab', () => {
  test('shows required field errors when submitted empty', async ({ page }) => {
    const form = page.locator('#profile-form');

    await form.getByLabel('Email').fill('');
    await form.getByLabel('First Name').fill('');
    await form.getByLabel('Last Name').fill('');
    await saveButton(page).click();

    await expect(form.getByText('Email is required.')).toBeVisible();
    await expect(form.getByText('First name is required.')).toBeVisible();
    await expect(form.getByText('Last name is required.')).toBeVisible();
    // Display Name is optional
    await expect(form.getByText(/Display name .*required/i)).toHaveCount(0);
  });

  test('rejects a malformed email address', async ({ page }) => {
    const form = page.locator('#profile-form');

    await form.getByLabel('Email').fill('not-an-email');
    await saveButton(page).click();

    await expect(form.getByText('Invalid email address.')).toBeVisible();
  });

  test('rejects an over-length email', async ({ page }) => {
    const form = page.locator('#profile-form');

    await form.getByLabel('Email').fill(`${'a'.repeat(250)}@example.com`);
    await saveButton(page).click();

    await expect(form.getByText('Email must be less than 255 characters.')).toBeVisible();
  });

  test('rejects an over-length first/last name', async ({ page }) => {
    const form = page.locator('#profile-form');

    await form.getByLabel('First Name').fill('a'.repeat(51));
    await form.getByLabel('Last Name').fill('b'.repeat(51));
    await saveButton(page).click();

    await expect(form.getByText('First name must be less than 50 characters.')).toBeVisible();
    await expect(form.getByText('Last name must be less than 50 characters.')).toBeVisible();
  });

  test('Save/Cancel are disabled until the form is dirty', async ({ page }) => {
    const form = page.locator('#profile-form');
    const firstName = form.getByLabel('First Name');
    const original = await firstName.inputValue();

    await expect(saveButton(page)).toBeDisabled();
    await expect(cancelButton(page)).toBeDisabled();

    await firstName.fill(`${original}x`);
    await expect(saveButton(page)).toBeEnabled();
    await expect(cancelButton(page)).toBeEnabled();

    await cancelButton(page).click();
    await expect(firstName).toHaveValue(original);
    await expect(saveButton(page)).toBeDisabled();
    await expect(cancelButton(page)).toBeDisabled();
  });

  test('Cancel also clears validation errors', async ({ page }) => {
    const form = page.locator('#profile-form');

    await form.getByLabel('First Name').fill('');
    await saveButton(page).click();
    await expect(form.getByText('First name is required.')).toBeVisible();

    await cancelButton(page).click();
    await expect(form.getByText('First name is required.')).toHaveCount(0);
  });

  test('changing first/last/display name saves immediately', async ({ page }) => {
    const form = page.locator('#profile-form');
    const stamp = Date.now();
    const firstName = `E2E First ${stamp}`;
    const lastName = `E2E Last ${stamp}`;
    const displayName = `E2E ${stamp}`;

    await form.getByLabel('First Name').fill(firstName);
    await form.getByLabel('Last Name').fill(lastName);
    await form.getByLabel('Display Name').fill(displayName);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => PROFILE_PATCH_URL.test(res.url()) && res.request().method() === 'PATCH'
      ),
      saveButton(page).click(),
    ]);
    expect(response.ok()).toBeTruthy();

    await expect(page.getByText('Your profile has been updated.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.reload();
    await expect(form.getByLabel('First Name')).toHaveValue(firstName);
    await expect(form.getByLabel('Last Name')).toHaveValue(lastName);
    await expect(form.getByLabel('Display Name')).toHaveValue(displayName);
  });

  test('changing the email opens a confirmation modal', async ({ page }) => {
    const attempted = await blockProfilePatches(page);
    const newEmail = `e2e-${Date.now()}@example.com`;

    await page.locator('#profile-form').getByLabel('Email').fill(newEmail);
    await saveButton(page).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Confirm Email Change')).toBeVisible();
    await expect(dialog.getByText(newEmail)).toBeVisible();
    await expect(dialog.getByText(/will not receive password reset emails/)).toBeVisible();

    // Never confirm - see "Email change caveat" in the test plan.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    expect(attempted).toHaveLength(0);
  });

  test('canceling an email change discards it', async ({ page }) => {
    const attempted = await blockProfilePatches(page);
    const emailInput = page.locator('#profile-form').getByLabel('Email');
    const originalEmail = await emailInput.inputValue();

    await emailInput.fill(`e2e-${Date.now()}@example.com`);
    await saveButton(page).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Confirm Email Change')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);

    expect(attempted).toHaveLength(0);

    // The modal closing doesn't revert the form on its own - the unsaved
    // value is still in the field until the user cancels the form itself.
    await cancelButton(page).click();
    await expect(emailInput).toHaveValue(originalEmail);

    await page.reload();
    await expect(page.locator('#profile-form').getByLabel('Email')).toHaveValue(originalEmail);
  });
});

test.describe('Preferences tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expect(page.locator('#preferences-form')).toBeVisible();
  });

  const theme = (page: Page) => page.getByRole('radiogroup', { name: 'Theme' });
  const weightUnit = (page: Page) => page.getByRole('radiogroup', { name: 'Default Weight Unit' });
  const distanceUnit = (page: Page) =>
    page.getByRole('radiogroup', { name: 'Default Distance Unit' });
  const effortType = (page: Page) =>
    page.getByRole('radiogroup', { name: 'Default Effort Rating Type' });
  const oneRepMax = (page: Page) =>
    page.getByRole('switch', { name: 'Show estimated one-rep max (e1RM)' });

  const THEME_LABELS = { light: 'Light', dark: 'Dark' } as const;
  const WEIGHT_LABELS = { lbs: 'lbs', kg: 'kg' } as const;
  const DISTANCE_LABELS = { meters: 'm', kilometers: 'km', miles: 'mi' } as const;
  const EFFORT_LABELS = { rpe: 'RPE', rir: 'RIR' } as const;

  // Each picked value is whichever one the account does NOT currently have,
  // so these tests don't depend on what the account's settings happen to be.
  function differentFrom(current: UserSettings): UserSettings {
    return {
      theme: current.theme === 'dark' ? 'light' : 'dark',
      weightUnit: current.weightUnit === 'lbs' ? 'kg' : 'lbs',
      distanceUnit: current.distanceUnit === 'meters' ? 'kilometers' : 'meters',
      effortType: current.effortType === 'rpe' ? 'rir' : 'rpe',
      showOneRepMax: !current.showOneRepMax,
    };
  }

  async function expectFormMatches(page: Page, settings: UserSettings) {
    await expect(
      theme(page).getByRole('radio', { name: THEME_LABELS[settings.theme], exact: true })
    ).toBeChecked();
    await expect(
      weightUnit(page).getByRole('radio', { name: WEIGHT_LABELS[settings.weightUnit], exact: true })
    ).toBeChecked();
    await expect(
      distanceUnit(page).getByRole('radio', {
        name: DISTANCE_LABELS[settings.distanceUnit],
        exact: true,
      })
    ).toBeChecked();
    await expect(
      effortType(page).getByRole('radio', { name: EFFORT_LABELS[settings.effortType] })
    ).toBeChecked();
    if (settings.showOneRepMax) {
      await expect(oneRepMax(page)).toBeChecked();
    } else {
      await expect(oneRepMax(page)).not.toBeChecked();
    }
  }

  async function selectSettings(page: Page, settings: UserSettings) {
    await theme(page)
      .getByRole('radio', { name: THEME_LABELS[settings.theme], exact: true })
      .check({ force: true });
    await weightUnit(page)
      .getByRole('radio', { name: WEIGHT_LABELS[settings.weightUnit], exact: true })
      .check({ force: true });
    await distanceUnit(page)
      .getByRole('radio', { name: DISTANCE_LABELS[settings.distanceUnit], exact: true })
      .check({ force: true });
    await effortType(page)
      .getByRole('radio', { name: EFFORT_LABELS[settings.effortType] })
      .check({ force: true });
    if (settings.showOneRepMax) {
      await oneRepMax(page).check({ force: true });
    } else {
      await oneRepMax(page).uncheck({ force: true });
    }
  }

  test('form loads with the account\u2019s current settings', async ({ page, request }) => {
    await expectFormMatches(page, await getUserSettingsViaApi(request));
  });

  test('Save/Cancel are disabled until the form is dirty', async ({ page, request }) => {
    const current = await getUserSettingsViaApi(request);

    await expect(saveButton(page)).toBeDisabled();
    await expect(cancelButton(page)).toBeDisabled();

    await selectSettings(page, differentFrom(current));
    await expect(saveButton(page)).toBeEnabled();
    await expect(cancelButton(page)).toBeEnabled();

    await cancelButton(page).click();
    await expectFormMatches(page, current);
    await expect(saveButton(page)).toBeDisabled();
    await expect(cancelButton(page)).toBeDisabled();
  });

  test('saving preferences persists them', async ({ page, request }) => {
    const changed = differentFrom(await getUserSettingsViaApi(request));

    await selectSettings(page, changed);
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => SETTINGS_PATCH_URL.test(res.url()) && res.request().method() === 'PATCH'
      ),
      saveButton(page).click(),
    ]);
    expect(response.ok()).toBeTruthy();
    await expect(page.getByText('Your preferences have been updated.')).toBeVisible();

    expect(await getUserSettingsViaApi(request)).toEqual(changed);

    await page.reload();
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expectFormMatches(page, changed);
  });

  test('theme only takes effect once Save is clicked', async ({ page, request }) => {
    const current = await getUserSettingsViaApi(request);
    const other = current.theme === 'dark' ? 'light' : 'dark';
    const html = page.locator('html');

    await expect(html).toHaveClass(new RegExp(`\\b${current.theme}\\b`));

    await theme(page)
      .getByRole('radio', { name: THEME_LABELS[other], exact: true })
      .check({ force: true });
    // Unsaved: the rendered theme must not have changed yet.
    await expect(html).toHaveClass(new RegExp(`\\b${current.theme}\\b`));

    await Promise.all([
      page.waitForResponse(
        (res) => SETTINGS_PATCH_URL.test(res.url()) && res.request().method() === 'PATCH'
      ),
      saveButton(page).click(),
    ]);
    await expect(html).toHaveClass(new RegExp(`\\b${other}\\b`));
  });
});

test.describe('Security tab (validation only)', () => {
  // This tab is only ever exercised up to its validation and confirmation
  // modal - no test may confirm a password change. The "current password"
  // used below is deliberately fake, so even an accidental confirm would
  // just be rejected by the API as an incorrect current password.
  const FAKE_CURRENT_PASSWORD = 'not-the-real-password';

  test.beforeEach(async ({ page }) => {
    await page.getByRole('tab', { name: 'Security' }).click();
    await expect(page.locator('#password-change-form')).toBeVisible();
  });

  async function fillPasswords(
    page: Page,
    values: { current?: string; next?: string; confirm?: string }
  ) {
    const form = page.locator('#password-change-form');
    if (values.current !== undefined) {
      await form.getByLabel('Current Password', { exact: true }).fill(values.current);
    }
    if (values.next !== undefined) {
      await form.getByLabel('New Password', { exact: true }).fill(values.next);
    }
    if (values.confirm !== undefined) {
      await form.getByLabel('Confirm New Password', { exact: true }).fill(values.confirm);
    }
  }

  test('Save is disabled while any field is empty', async ({ page }) => {
    // The Save button stays disabled until all three fields have a value, so
    // an empty submission - and with it the "Password is required." errors -
    // can't be triggered from the UI.
    await expect(saveButton(page)).toBeDisabled();

    await fillPasswords(page, { current: FAKE_CURRENT_PASSWORD, next: 'newpassword1' });
    await expect(saveButton(page)).toBeDisabled();

    await fillPasswords(page, { confirm: 'newpassword1' });
    await expect(saveButton(page)).toBeEnabled();
  });

  test('rejects a new password that is too short', async ({ page }) => {
    const form = page.locator('#password-change-form');

    await fillPasswords(page, { current: FAKE_CURRENT_PASSWORD, next: 'abc', confirm: 'abc' });
    await saveButton(page).click();

    await expect(form.getByText('Password must be at least 6 characters.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('rejects a new password that is too long', async ({ page }) => {
    const form = page.locator('#password-change-form');
    const tooLong = 'a'.repeat(101);

    await fillPasswords(page, { current: FAKE_CURRENT_PASSWORD, next: tooLong, confirm: tooLong });
    await saveButton(page).click();

    await expect(form.getByText('Password must be 100 characters or less.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('shows an error when the new password and confirmation do not match', async ({ page }) => {
    const form = page.locator('#password-change-form');

    await fillPasswords(page, {
      current: FAKE_CURRENT_PASSWORD,
      next: 'newpassword1',
      confirm: 'different123',
    });
    await saveButton(page).click();

    await expect(form.getByText('Passwords do not match.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Save stays disabled while an error is showing and re-enables once it is fixed', async ({
    page,
  }) => {
    const form = page.locator('#password-change-form');

    await fillPasswords(page, { current: FAKE_CURRENT_PASSWORD, next: 'abc', confirm: 'abc' });
    await saveButton(page).click();
    await expect(form.getByText('Password must be at least 6 characters.')).toBeVisible();
    await expect(saveButton(page)).toBeDisabled();

    await fillPasswords(page, { next: 'newpassword1', confirm: 'newpassword1' });
    await expect(form.getByText('Password must be at least 6 characters.')).toHaveCount(0);
    await expect(saveButton(page)).toBeEnabled();
  });

  test('Cancel clears the form', async ({ page }) => {
    const form = page.locator('#password-change-form');

    await fillPasswords(page, { current: FAKE_CURRENT_PASSWORD, next: 'abc', confirm: 'abc' });
    await saveButton(page).click();
    await expect(form.getByText('Password must be at least 6 characters.')).toBeVisible();

    await cancelButton(page).click();

    await expect(form.getByLabel('Current Password', { exact: true })).toHaveValue('');
    await expect(form.getByLabel('New Password', { exact: true })).toHaveValue('');
    await expect(form.getByLabel('Confirm New Password', { exact: true })).toHaveValue('');
    await expect(form.getByText('Password must be at least 6 characters.')).toHaveCount(0);
    await expect(saveButton(page)).toBeDisabled();
  });

  test('a valid submission opens the confirmation modal', async ({ page }) => {
    await fillPasswords(page, {
      current: FAKE_CURRENT_PASSWORD,
      next: 'newpassword1',
      confirm: 'newpassword1',
    });
    await saveButton(page).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Confirm Password Change')).toBeVisible();
    await expect(dialog.getByText('You will be logged out on all devices.')).toBeVisible();

    // Never confirm - see "Password change caveat" in the test plan.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
  });
});
