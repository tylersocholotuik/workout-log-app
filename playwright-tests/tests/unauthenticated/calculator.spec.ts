import { test, expect, Page } from '@playwright/test';

async function fillSet(page: Page, values: { weight?: string; reps?: string; rpe?: string }) {
  if (values.weight !== undefined) {
    await page.getByRole('textbox', { name: 'Weight' }).fill(values.weight);
  }
  if (values.reps !== undefined) {
    await page.getByRole('textbox', { name: 'Reps' }).fill(values.reps);
  }
  if (values.rpe !== undefined) {
    await page.getByRole('textbox', { name: 'RPE' }).fill(values.rpe);
  }
  // blur to trigger removeTrailingDecimal / settle state
  await page.getByRole('textbox', { name: 'RPE' }).blur();
}

function resultText(page: Page) {
  return page.locator('p.font-bold.text-xl.text-primary');
}

function noResultText(page: Page) {
  return page.getByText('Enter values above to calculate');
}

// The RPE=10, Reps=1 table cell always equals the estimated one-rep max
// itself, so it's a reliable way to check the table reacts to a calculation
// without duplicating the app's e1RM formula in the test.
function rpe10Reps1Cell(page: Page) {
  return page
    .getByRole('rowheader', { name: '10', exact: true })
    .locator('xpath=following-sibling::*[@role="gridcell"][1]');
}

test.describe('Page load', () => {
  test('calculator page loads with an empty state', async ({ page }) => {
    await page.goto('/calculator');

    await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Reps' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'RPE' })).toHaveValue('');
    await expect(noResultText(page)).toBeVisible();
    await expect(rpe10Reps1Cell(page)).toHaveText('-');
  });
});

test.describe('Input validation', () => {
  test('weight accepts a valid value', async ({ page }) => {
    await page.goto('/calculator');
    await page.getByRole('textbox', { name: 'Weight' }).fill('225.5');

    await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('225.5');
  });

  test('weight rejects an invalid character', async ({ page }) => {
    await page.goto('/calculator');
    await page.getByRole('textbox', { name: 'Weight' }).pressSequentially('a');

    await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('');
  });

  test('reps is limited to 1-10', async ({ page }) => {
    await page.goto('/calculator');
    const reps = page.getByRole('textbox', { name: 'Reps' });

    await reps.pressSequentially('11');
    await expect(reps).toHaveValue('1');

    await reps.fill('');
    await reps.pressSequentially('10');
    await expect(reps).toHaveValue('10');
  });

  test('RPE is limited to 6-10', async ({ page }) => {
    await page.goto('/calculator');
    const rpe = page.getByRole('textbox', { name: 'RPE' });

    await rpe.pressSequentially('5');
    await expect(rpe).toHaveValue('');

    await rpe.pressSequentially('10');
    await expect(rpe).toHaveValue('10');
  });
});

test.describe('Calculating the estimate', () => {
  test('entering weight, reps, and RPE calculates the estimate', async ({ page }) => {
    await page.goto('/calculator');

    await fillSet(page, { weight: '225.5', reps: '8', rpe: '9' });

    await expect(noResultText(page)).toHaveCount(0);
    await expect(resultText(page)).toContainText('lbs');
    await expect(page.getByRole('button', { name: 'weight unit' })).toHaveCount(2);
  });

  test('clearing any one field clears the estimate', async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', rpe: '9' });
    await expect(noResultText(page)).toHaveCount(0);

    await page.getByRole('textbox', { name: 'RPE' }).fill('');

    await expect(noResultText(page)).toBeVisible();
  });
});

test.describe('Weight unit (input)', () => {
  test("toggling the input's weight unit changes the highlighted unit", async ({ page }) => {
    await page.goto('/calculator');
    const toggle = page.getByRole('button', { name: 'weight unit' }).first();

    await expect(toggle.getByText('lbs')).toHaveClass(/text-primary/);

    await toggle.click();

    await expect(toggle.getByText('kg')).toHaveClass(/text-primary/);
  });
});

test.describe("Weight unit conversion (result)", () => {
  test("toggling the result's unit converts the displayed value", async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', rpe: '9' });

    const before = await resultText(page).textContent();
    await page.getByRole('button', { name: 'weight unit' }).last().click();
    const after = await resultText(page).textContent();

    expect(after).not.toEqual(before);
    await expect(resultText(page)).toContainText('kg');
  });

  test("changing the input's weight unit resets the result's conversion", async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', rpe: '9' });
    const originalResult = await resultText(page).textContent();

    const formToggle = page.getByRole('button', { name: 'weight unit' }).first();
    const resultToggle = page.getByRole('button', { name: 'weight unit' }).last();

    // switch the input to kg (recalculates), then manually convert the
    // result back to lbs, then switch the input back to lbs - the manual
    // conversion should be discarded and the original value restored.
    await formToggle.click();
    await resultToggle.click();
    await formToggle.click();

    await expect(resultText(page)).toHaveText(originalResult ?? '');
  });
});

test.describe('RPE data table', () => {
  test('table reflects the calculated estimate', async ({ page }) => {
    await page.goto('/calculator');
    await expect(rpe10Reps1Cell(page)).toHaveText('-');

    await fillSet(page, { weight: '225.5', reps: '8', rpe: '9' });

    const resultValue = (await resultText(page).textContent())?.split(' ')[0];
    await expect(rpe10Reps1Cell(page)).toHaveText(resultValue ?? '');
  });

  test('"Clear" resets the form and the table', async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', rpe: '9' });
    await expect(rpe10Reps1Cell(page)).not.toHaveText('-');

    await page.getByRole('button', { name: 'Clear' }).click();

    await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Reps' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'RPE' })).toHaveValue('');
    await expect(noResultText(page)).toBeVisible();
    await expect(rpe10Reps1Cell(page)).toHaveText('-');
  });
});
