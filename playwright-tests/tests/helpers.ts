import { expect, Page, Locator, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const API_URL = process.env.API_URL || 'http://localhost:5258';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE_URL);

// The auth cookie is only ever valid for whichever origin the app itself
// used to log in. Locally, the frontend calls the backend directly (see
// NEXT_PUBLIC_API_URL in lib/api/*.ts), so the cookie is scoped to API_URL.
// On staging/production, requests are same-origin and Next.js proxies them
// to the backend (see rewrites() in next.config.ts), so the cookie is only
// valid for the frontend's own origin (BASE_URL) there. Calling the raw
// backend origin directly on staging silently fails auth (401) because the
// cookie's domain never matches - this was the root cause of test workouts
// never getting cleaned up on staging.
const AUTHENTICATED_API_URL = isLocal ? API_URL : BASE_URL;

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

// The backend only allows one in-progress workout per account at a time, so
// workout.spec.ts and history.spec.ts (the only two files that create
// workouts) can't safely run concurrently against the shared test account -
// one worker's in-progress workout can get picked up (or conflict with)
// another's, regardless of how many browser projects/workers Playwright is
// using. `test.describe.configure({ mode: 'serial' })` only pins a *single*
// file to one worker; it does nothing to stop a *different* file's tests
// running at the same time on another worker. This cross-process file lock
// (acquired in each file's top-level `beforeAll`, released in `afterAll`)
// makes the two files mutually exclusive no matter how the suite is invoked.
const ACCOUNT_LOCK_PATH = path.join(__dirname, '..', '.account.lock');
// A crashed/interrupted run could leave the lock file behind forever -
// treat it as abandoned after this long so a later run isn't stuck forever.
const ACCOUNT_LOCK_STALE_MS = 3 * 60 * 1000;
// With up to 3 local browser projects each running both files, as many as 6
// file-runs can be queued on this one lock - long enough for all of them to
// take their turn.
const ACCOUNT_LOCK_WAIT_MS = 10 * 60 * 1000;
// Playwright kills a beforeAll hook that runs longer than the test timeout
// (30-60s by default here) regardless of this module's own wait loop - the
// caller must raise the hook's own timeout via `testInfo.setTimeout(...)`
// before awaiting `acquireAccountLock()`, or a long wait here gets cut short
// by that unrelated default long before `ACCOUNT_LOCK_WAIT_MS` is reached.
export const ACCOUNT_LOCK_HOOK_TIMEOUT_MS = ACCOUNT_LOCK_WAIT_MS + 30_000;

export async function acquireAccountLock(): Promise<void> {
  const deadline = Date.now() + ACCOUNT_LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.writeFileSync(ACCOUNT_LOCK_PATH, String(Date.now()), { flag: 'wx' });
      return;
    } catch (e) {
      if (!(e instanceof Error) || (e as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw e;
      }
      try {
        const heldSince = Number(fs.readFileSync(ACCOUNT_LOCK_PATH, 'utf-8'));
        if (Date.now() - heldSince > ACCOUNT_LOCK_STALE_MS) {
          fs.unlinkSync(ACCOUNT_LOCK_PATH);
          continue;
        }
      } catch {
        // Lock file vanished between the failed write and this read (another
        // worker just released it) - loop around and try to acquire again.
      }
      if (Date.now() > deadline) {
        throw new Error(
          'Timed out waiting for the shared test account lock (another worker/file may be stuck holding it).'
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

export function releaseAccountLock(): void {
  try {
    fs.unlinkSync(ACCOUNT_LOCK_PATH);
  } catch {
    // Already released/missing - nothing to do.
  }
}

export async function deleteWorkoutViaApi(request: APIRequestContext, id: string | undefined) {
  if (!id || id === 'new-workout') return;
  const res = await request.delete(`${AUTHENTICATED_API_URL}/api/workouts/${id}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  // Cleanup runs in test teardown/fixtures - don't throw and mask the
  // test's real outcome, but do make failures visible instead of silently
  // leaking data.
  if (!res.ok()) {
    console.warn(`deleteWorkoutViaApi: failed to delete workout ${id} (${res.status()})`);
  }
}

// Clicking "Create New Workout" now autosaves a real workout immediately
// (no explicit "Save" step) and the app navigates from /workout/new-workout
// to /workout/<id>. Pass `trackWorkout` (from the `trackWorkout` fixture) so
// the created workout is always cleaned up, even for tests that never touch
// it again beyond this call.
export async function startNewWorkout(
  page: Page,
  trackWorkout?: (id: string | undefined) => void
): Promise<string> {
  // A freshly created context's very first navigation (e.g. in
  // history.spec.ts's beforeAll, via browser.newContext()) occasionally
  // throws a transient error on Firefox/WebKit - seen as
  // NS_BINDING_ABORTED, "interrupted by another navigation", and sometimes
  // just an opaque "<unknown error>" - not a real navigation failure (a
  // second attempt always succeeds). Retry once on any error rather than
  // failing the whole test/hook over it.
  try {
    await page.goto('/workout/new-workout');
  } catch {
    await page.goto('/workout/new-workout');
  }

  // Register both listeners before clicking - the GET refetch below can
  // follow the POST's response quickly enough to be missed if we started
  // listening for it only after awaiting the POST.
  const [createResponse] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/workouts') && res.request().method() === 'POST'
    ),
    page.waitForResponse(
      (res) => /\/api\/workouts\/[^/?]+$/.test(res.url()) && res.request().method() === 'GET'
    ),
    page.getByRole('button', { name: 'Create New Workout' }).click(),
  ]);
  expect(createResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/workout\/(?!new-workout)[^/]+$/);

  const id = workoutIdFromUrl(page);
  trackWorkout?.(id);

  // Creating a workout still shows a one-time "Workout saved!" toast (later
  // autosaves are silent) - dismiss it via its real close button so it
  // doesn't sit over buttons near the bottom of the page for several seconds.
  await expect(page.getByText('Workout saved!').first()).toBeVisible();
  await page.getByRole('button', { name: 'closeButton' }).first().click();

  return id;
}

// The exercise card's "Actions"/"exercise options" icon buttons (Dropdown and
// Popover triggers wrapped in a Tooltip) don't reliably open on a plain
// .click() in this component library - a hover + manual mousedown/up does.
export async function pressIconTrigger(locator: Locator) {
  await locator.hover();
  await locator.page().mouse.down();
  await locator.page().waitForTimeout(50);
  // Re-hover before releasing - a layout shift during the wait (e.g. a
  // sibling card's autosave re-render) can move this button, and a mouseup
  // at the stale down-position lands on whatever is there now instead,
  // silently dropping the click rather than opening the dropdown.
  await locator.hover();
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

// There's no explicit "Save" button for ordinary edits anymore - changes are
// autosaved after a short debounce. Wrap the action that makes the edit (not
// just await it beforehand) so the response listener is guaranteed to be
// registered before the request fires - otherwise a fast local round-trip
// can complete before a listener set up *after* the action ever attaches,
// and this would then hang until the test timeout.
export async function waitForAutosave(page: Page, action: () => Promise<void>): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => /\/api\/workouts\/[^/?]+$/.test(res.url()) && res.request().method() === 'PUT'
    ),
    action(),
  ]);
  expect(response.ok()).toBeTruthy();
}

// Clicks "Finish Workout" and waits for the finish request to complete.
// Only valid while the workout is still in progress - a workout that's
// already finished shows "Finish Editing" instead, which just navigates to
// /history without calling this endpoint (see completeWorkout in
// [workoutId].tsx).
export async function finishWorkout(page: Page) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => /\/finish$/.test(res.url()) && res.request().method() === 'PATCH'
    ),
    page.getByRole('button', { name: 'Finish Workout' }).click(),
  ]);
  expect(response.ok()).toBeTruthy();
}
