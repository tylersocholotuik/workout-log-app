import { test, expect, Page } from '@playwright/test';

function weightInput(page: Page) {
  return page.getByRole('textbox', { name: 'Weight' });
}

function repsInput(page: Page) {
  return page.getByRole('textbox', { name: 'Reps' });
}

// the effort rating input's accessible name toggles between "RPE" and "RIR"
// (it tracks the input's <label>), so target it by id instead of name.
function effortRatingInput(page: Page) {
  return page.locator('#effortRating');
}

function effortRatingTypeToggle(page: Page) {
  return page.getByRole('button', { name: 'effort rating type' });
}

async function fillSet(
  page: Page,
  values: { weight?: string; reps?: string; effortRating?: string }
) {
  if (values.weight !== undefined) {
    await weightInput(page).fill(values.weight);
  }
  if (values.reps !== undefined) {
    await repsInput(page).fill(values.reps);
  }
  if (values.effortRating !== undefined) {
    await effortRatingInput(page).fill(values.effortRating);
  }
  // blur to trigger display sanitization / settle state
  await effortRatingInput(page).blur();
}

function resultText(page: Page) {
  return page.locator('p.font-bold.text-xl.text-primary');
}

function noResultText(page: Page) {
  return page.getByText('Enter values above to calculate');
}

// The Reps=1 column of a row always equals the estimated one-rep max itself,
// so it's a reliable way to check the table reacts to a calculation without
// duplicating the app's e1RM formula in the test. `rowLabel` is the row's
// displayed RPE or RIR value.
function reps1CellFor(page: Page, rowLabel: string) {
  return page
    .getByRole('rowheader', { name: rowLabel, exact: true })
    .locator('xpath=following-sibling::*[@role="gridcell"][1]');
}

function rpe10Reps1Cell(page: Page) {
  return reps1CellFor(page, '10');
}

test.describe('Page load', () => {
  test('calculator page loads with an empty state', async ({ page }) => {
    await page.goto('/calculator');

    await expect(weightInput(page)).toHaveValue('');
    await expect(repsInput(page)).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'RPE' })).toHaveValue('');
    await expect(noResultText(page)).toBeVisible();
    await expect(page.getByRole('rowheader', { name: 'RPE', exact: true })).toBeVisible();
    await expect(rpe10Reps1Cell(page)).toHaveText('-');
  });
});

test.describe('Input validation', () => {
  test('weight accepts a valid value', async ({ page }) => {
    await page.goto('/calculator');
    await weightInput(page).fill('225.5');

    await expect(weightInput(page)).toHaveValue('225.5');
  });

  test('weight rejects an invalid character', async ({ page }) => {
    await page.goto('/calculator');
    await weightInput(page).pressSequentially('a');

    await expect(weightInput(page)).toHaveValue('');
  });

  test('reps is limited to 1-10', async ({ page }) => {
    await page.goto('/calculator');
    const reps = repsInput(page);

    await reps.pressSequentially('11');
    await expect(reps).toHaveValue('1');

    await reps.fill('');
    await reps.pressSequentially('10');
    await expect(reps).toHaveValue('10');
  });

  test('RPE is limited to 6-10', async ({ page }) => {
    await page.goto('/calculator');
    const effortRating = effortRatingInput(page);

    await effortRating.pressSequentially('5');
    await expect(effortRating).toHaveValue('');

    await effortRating.pressSequentially('10');
    await expect(effortRating).toHaveValue('10');
  });

  test('RIR is limited to 0-4', async ({ page }) => {
    await page.goto('/calculator');
    await effortRatingTypeToggle(page).click();
    const effortRating = effortRatingInput(page);

    await effortRating.pressSequentially('5');
    await expect(effortRating).toHaveValue('');

    await effortRating.pressSequentially('2.5');
    await expect(effortRating).toHaveValue('2');

    await effortRating.fill('');
    await effortRating.pressSequentially('4');
    await expect(effortRating).toHaveValue('4');
  });

  test('a valid RIR of 1 survives blur (the RPE-only "1" clear-on-blur quirk does not apply to RIR)', async ({
    page,
  }) => {
    await page.goto('/calculator');
    await effortRatingTypeToggle(page).click();
    const effortRating = effortRatingInput(page);

    await effortRating.pressSequentially('1');
    await effortRating.blur();

    await expect(effortRating).toHaveValue('1');
  });
});

test.describe('Calculating the estimate', () => {
  test('entering weight, reps, and an effort rating calculates the estimate', async ({
    page,
  }) => {
    await page.goto('/calculator');

    await fillSet(page, { weight: '225.5', reps: '8', effortRating: '9' });

    await expect(noResultText(page)).toHaveCount(0);
    await expect(resultText(page)).toContainText('lbs');
    await expect(page.getByRole('button', { name: 'weight unit' })).toHaveCount(2);
  });

  test('clearing any one field clears the estimate', async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', effortRating: '9' });
    await expect(noResultText(page)).toHaveCount(0);

    await effortRatingInput(page).fill('');

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

test.describe('Effort rating type (RPE/RIR)', () => {
  test('toggling the effort rating type switches between RPE and RIR', async ({ page }) => {
    await page.goto('/calculator');
    const toggle = effortRatingTypeToggle(page);

    await expect(toggle.getByText('RPE')).toHaveClass(/text-primary/);
    await expect(page.getByRole('textbox', { name: 'RPE' })).toBeVisible();

    await toggle.click();

    await expect(toggle.getByText('RIR')).toHaveClass(/text-primary/);
    await expect(page.getByRole('textbox', { name: 'RIR' })).toBeVisible();
  });

  test('switching the effort rating type converts an existing value', async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', effortRating: '8' });
    const before = await resultText(page).textContent();

    await effortRatingTypeToggle(page).click();

    // RIR = 10 - ceil(RPE) => 10 - ceil(8) = 2
    await expect(effortRatingInput(page)).toHaveValue('2');
    // round-trips (RPE 8 -> RIR 2 -> RPE 8) to the same estimate
    await expect(resultText(page)).toHaveText(before ?? '');
  });
});

test.describe("Weight unit conversion (result)", () => {
  test("toggling the result's unit converts the displayed value", async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', effortRating: '9' });

    const before = await resultText(page).textContent();
    await page.getByRole('button', { name: 'weight unit' }).last().click();
    const after = await resultText(page).textContent();

    expect(after).not.toEqual(before);
    await expect(resultText(page)).toContainText('kg');
  });

  test("changing the input's weight unit resets the result's conversion", async ({ page }) => {
    await page.goto('/calculator');
    await fillSet(page, { weight: '225.5', reps: '8', effortRating: '9' });
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

test.describe('RPE / RIR data table', () => {
  test('table reflects the calculated estimate', async ({ page }) => {
    await page.goto('/calculator');
    await expect(rpe10Reps1Cell(page)).toHaveText('-');

    await fillSet(page, { weight: '225.5', reps: '8', effortRating: '9' });

    const resultValue = (await resultText(page).textContent())?.split(' ')[0];
    await expect(rpe10Reps1Cell(page)).toHaveText(resultValue ?? '');
  });

  test("switching to RIR relabels the table's rows", async ({ page }) => {
    await page.goto('/calculator');
    await expect(page.getByRole('rowheader', { name: '10', exact: true })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: '9.5', exact: true })).toBeVisible();

    await effortRatingTypeToggle(page).click();

    // RIR = 10 - ceil(RPE); the RPE 10 row (full effort) becomes RIR 0
    await expect(page.getByRole('rowheader', { name: '0', exact: true })).toBeVisible();
    // half-step RPE rows have no whole-number RIR equivalent, so their label is blank
    await expect(page.getByRole('rowheader', { name: '9.5', exact: true })).toHaveCount(0);
    const blankLabelRow = page.getByRole('rowheader', { name: '', exact: true }).first();
    await expect(
      blankLabelRow.locator('xpath=following-sibling::*[@role="gridcell"][1]')
    ).toHaveText('-');
  });

  test('"Clear" resets the form and the table', async ({ page }) => {
    await page.goto('/calculator');
    await effortRatingTypeToggle(page).click();
    await fillSet(page, { weight: '225.5', reps: '8', effortRating: '2' });
    await expect(reps1CellFor(page, '0')).not.toHaveText('-');

    await page.getByRole('button', { name: 'Clear' }).click();

    await expect(weightInput(page)).toHaveValue('');
    await expect(repsInput(page)).toHaveValue('');
    await expect(effortRatingTypeToggle(page).getByText('RPE')).toHaveClass(/text-primary/);
    await expect(page.getByRole('textbox', { name: 'RPE' })).toHaveValue('');
    await expect(noResultText(page)).toBeVisible();
    await expect(rpe10Reps1Cell(page)).toHaveText('-');
  });
});
