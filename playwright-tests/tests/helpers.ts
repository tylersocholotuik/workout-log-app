import { expect, Page, Locator, APIRequestContext } from '@playwright/test';

export const API_URL = process.env.API_URL || 'http://localhost:5258';

export function uniqueTitle(label: string) {
  return `E2E ${label} ${Date.now()}`;
}

export function workoutIdFromUrl(page: Page): string {
  const match = page.url().match(/\/workout\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Could not extract workoutId from URL: ${page.url()}`);
  }
  return match[1];
}

export async function deleteWorkoutViaApi(request: APIRequestContext, id: string | undefined) {
  if (!id || id === 'new-workout') return;
  await request.delete(`${API_URL}/api/workouts/${id}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
}

export async function startNewWorkout(page: Page) {
  await page.goto('/workout/new-workout');
  await page.getByRole('button', { name: 'Create New Workout' }).click();
}

// The exercise card's "Actions"/"exercise options" icon buttons (Dropdown and
// Popover triggers wrapped in a Tooltip) don't reliably open on a plain
// .click() in this component library - a hover + manual mousedown/up does.
export async function pressIconTrigger(locator: Locator) {
  await locator.hover();
  await locator.page().mouse.down();
  await locator.page().waitForTimeout(50);
  await locator.page().mouse.up();
}

export function exerciseCard(page: Page, exerciseName: string): Locator {
  return page
    .getByRole('heading', { name: exerciseName, exact: true })
    .locator('xpath=ancestor::div[.//button[normalize-space(text())="Add Set"]][1]');
}

export async function addExercise(page: Page, exerciseName: string) {
  await page.getByRole('button', { name: 'Add Exercise' }).click();
  await page.getByPlaceholder('Search exercises...').fill(exerciseName);
  await page.getByRole('row', { name: exerciseName, exact: true }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  // Wait out the modal's close animation - interacting with the page while
  // it's still closing can race with React and silently drop input.
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

export async function fillSet(
  card: Locator,
  values: { weight?: string; reps?: string; rpe?: string },
  setIndex = 0
) {
  if (values.weight !== undefined) {
    await card.getByRole('textbox', { name: 'weight' }).nth(setIndex).fill(values.weight);
  }
  if (values.reps !== undefined) {
    await card.getByRole('textbox', { name: 'reps' }).nth(setIndex).fill(values.reps);
  }
  if (values.rpe !== undefined) {
    await card.getByRole('textbox', { name: 'rpe' }).nth(setIndex).fill(values.rpe);
  }
  // blur to trigger the row's onBlur save handler
  await card.getByRole('textbox', { name: 'rpe' }).nth(setIndex).blur();
}

export async function setWorkoutDate(dialog: Locator, date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());

  await dialog.getByRole('spinbutton', { name: 'month, Date*' }).click();
  await dialog.page().keyboard.type(`${month}${day}${year}`);
}

export async function editWorkoutDetails(
  page: Page,
  values: { title?: string; date?: Date; notes?: string }
) {
  await page.getByRole('button', { name: 'Edit Details' }).click();
  const dialog = page.getByRole('dialog');

  if (values.title !== undefined) {
    await dialog.getByLabel('Workout Title').fill(values.title);
  }
  if (values.date !== undefined) {
    await setWorkoutDate(dialog, values.date);
  }
  if (values.notes !== undefined) {
    await dialog.getByLabel('Notes').fill(values.notes);
  }

  await dialog.getByRole('button', { name: 'Save' }).click();
}

export async function saveWorkout(page: Page) {
  // Wait for the actual save request to complete rather than the toast text -
  // toasts stack, and under real network latency a stale toast from a
  // previous save can still be on screen when the next save's request is
  // still in flight, making the toast an unreliable completion signal.
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes('/api/workouts') &&
        ['POST', 'PUT'].includes(res.request().method())
    ),
    page.getByRole('button', { name: 'Save Workout' }).click(),
  ]);
  expect(response.ok()).toBeTruthy();
  await expect(page.getByText('Workout saved!').first()).toBeVisible();
  // Dismiss it via its real close button - it renders bottom-center and can
  // otherwise sit on top of (and swallow clicks meant for) page buttons
  // underneath for several seconds.
  await page.getByRole('button', { name: 'closeButton' }).first().click();
}

// After creating a workout, the app client-side navigates to the new URL and
// refetches it, which resets local state to the just-saved server data. If a
// test edits the workout again before that refetch resolves, the stale
// response can silently overwrite the edit. Wait for the known title to
// (re)appear so we know the refetch has settled before editing further.
export async function waitForCreateToSettle(page: Page, title: string) {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}
