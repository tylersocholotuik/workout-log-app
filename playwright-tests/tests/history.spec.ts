import { test, expect, request, Page, Locator } from '@playwright/test';

import { storageStateFor } from '../playwright.config';
import {
  uniqueTitle,
  workoutIdFromUrl,
  deleteWorkoutViaApi,
  startNewWorkout,
  addExercise,
  editWorkoutDetails,
  saveWorkout,
} from './helpers';

// Forces the whole file onto a single worker so the shared fixture set below
// is built exactly once (fullyParallel could otherwise split this file's
// tests across workers, each running its own beforeAll/afterAll).
test.describe.configure({ mode: 'serial' });

interface FixtureWorkout {
  title: string;
  date: Date;
  exercise: string;
  id: string;
}

const fixtures: FixtureWorkout[] = [];

function daysAgo(n: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

// Day 10 avoids month-length edge cases (e.g. Feb 30).
function monthsAgo(n: number, day = 10): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() - n, day);
}

// Mirrors WorkoutList.tsx's month-group label exactly, so tests can assert
// on the real computed heading text instead of guessing/hardcoding it.
function monthGroupLabel(date: Date): string {
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long' });
}

// Mirrors WorkoutList.tsx's week-group label (Sunday-Saturday) exactly.
function weekGroupLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (d: Date) =>
    d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  return `${format(start)} - ${format(end)}`;
}

function historyCard(page: Page, title: string): Locator {
  return page
    .getByRole('heading', { name: title, exact: true })
    .locator('xpath=ancestor::div[.//a[normalize-space(text())="View/Edit"]][1]');
}

async function openFilterPopover(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Filtering/Grouping' }).click();
  return page.getByRole('dialog');
}

// The popover marks the rest of the page aria-hidden while open, so cards
// behind it are unreachable via getByRole until it's closed.
async function closePopover(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function setDateRangeFilter(dialog: Locator, start: Date, end: Date) {
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const startDay = String(start.getDate()).padStart(2, '0');
  const startYear = String(start.getFullYear());
  await dialog.getByRole('spinbutton', { name: 'month, Start Date' }).click();
  await dialog.page().keyboard.type(`${startMonth}${startDay}${startYear}`);

  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');
  const endYear = String(end.getFullYear());
  await dialog.getByRole('spinbutton', { name: 'month, End Date' }).click();
  await dialog.page().keyboard.type(`${endMonth}${endDay}${endYear}`);
}

async function selectGroupBy(dialog: Locator, option: 'None' | 'Month' | 'Week') {
  await dialog.getByRole('radio', { name: option }).click();
}

test.beforeAll(async ({ browser }, testInfo) => {
  // Creates 4 workouts sequentially - on a slow staging round-trip this can
  // run well past the default per-test timeout.
  testInfo.setTimeout(120_000);

  const context = await browser.newContext({
    storageState: storageStateFor(testInfo.project.name),
  });
  const page = await context.newPage();

  const plan: Omit<FixtureWorkout, 'id'>[] = [
    { title: uniqueTitle('History This Week'), date: new Date(), exercise: 'Ab Wheel' },
    { title: uniqueTitle('History Two Weeks Ago'), date: daysAgo(14), exercise: 'Back Extension' },
    { title: uniqueTitle('History Last Month'), date: monthsAgo(1), exercise: 'Deadlift' },
    { title: uniqueTitle('History Two Months Ago'), date: monthsAgo(2), exercise: 'Pull-Up' },
  ];

  for (const item of plan) {
    await startNewWorkout(page);
    const notes = item.title === plan[0].title ? 'History fixture notes' : undefined;
    await editWorkoutDetails(page, { title: item.title, date: item.date, notes });
    await addExercise(page, item.exercise);
    await saveWorkout(page);
    fixtures.push({ ...item, id: workoutIdFromUrl(page) });
  }

  await context.close();
});

test.afterAll(async () => {
  const context = await request.newContext();
  for (const fixture of fixtures) {
    await deleteWorkoutViaApi(context, fixture.id);
  }
  await context.dispose();
});

test.describe('Viewing history', () => {
  test('history page loads existing workouts', async ({ page }) => {
    await page.goto('/history');

    for (const fixture of fixtures) {
      await expect(historyCard(page, fixture.title)).toBeVisible();
    }
  });

  test('workout card shows correct summary info', async ({ page }) => {
    const fixture = fixtures[0];
    await page.goto('/history');

    const card = historyCard(page, fixture.title);
    await expect(card).toBeVisible();
    await expect(card.getByText('History fixture notes')).toBeVisible();
    await expect(card.getByText(fixture.exercise)).toBeVisible();
  });

  test('"View/Edit" navigates to the workout', async ({ page }) => {
    const fixture = fixtures[0];
    await page.goto('/history');

    await historyCard(page, fixture.title).getByRole('link', { name: 'View/Edit' }).click();

    await expect(page).toHaveURL(`/workout/${fixture.id}`);
    await expect(page.getByRole('heading', { name: fixture.title })).toBeVisible();
  });
});

test.describe('Filtering by date range', () => {
  test('default date range covers every workout', async ({ page }) => {
    await page.goto('/history');
    const dialog = await openFilterPopover(page);

    // Confirm the picker actually pre-populated a range (not empty) rather
    // than checking cards here - the popover marks them aria-hidden while open.
    await expect(
      dialog.getByRole('spinbutton', { name: 'year, Start Date' })
    ).not.toHaveText('');
    await closePopover(page);

    for (const fixture of fixtures) {
      await expect(historyCard(page, fixture.title)).toBeVisible();
    }
  });

  test('narrowing the range filters the list', async ({ page }) => {
    const target = fixtures[2]; // "History Last Month"
    await page.goto('/history');
    const dialog = await openFilterPopover(page);

    await setDateRangeFilter(dialog, target.date, target.date);
    await closePopover(page);

    await expect(historyCard(page, target.title)).toBeVisible();
    for (const other of fixtures.filter((f) => f !== target)) {
      await expect(historyCard(page, other.title)).toHaveCount(0);
    }
  });

  test('a range with no matches shows "No Workouts"', async ({ page }) => {
    await page.goto('/history');
    const dialog = await openFilterPopover(page);

    // A modest offset is enough to miss every fixture (oldest is ~2 months
    // back) - a much larger jump (e.g. +5 years) makes the date picker
    // unstable to interact with in some browsers.
    const noMatchStart = new Date();
    noMatchStart.setDate(noMatchStart.getDate() + 90);
    const noMatchEnd = new Date(noMatchStart);
    noMatchEnd.setDate(noMatchEnd.getDate() + 1);

    await setDateRangeFilter(dialog, noMatchStart, noMatchEnd);
    await closePopover(page);

    await expect(page.getByText('No Workouts')).toBeVisible();
    for (const fixture of fixtures) {
      await expect(historyCard(page, fixture.title)).toHaveCount(0);
    }
  });

  test('"Reset" restores the full range', async ({ page }) => {
    const target = fixtures[2];
    await page.goto('/history');
    const dialog = await openFilterPopover(page);

    await setDateRangeFilter(dialog, target.date, target.date);
    await dialog.getByRole('button', { name: 'Reset' }).click();
    await closePopover(page);

    for (const fixture of fixtures) {
      await expect(historyCard(page, fixture.title)).toBeVisible();
    }
  });
});

test.describe('Grouping', () => {
  test('grouping by month', async ({ page }) => {
    const lastMonth = fixtures[2];
    const twoMonthsAgo = fixtures[3];
    await page.goto('/history');
    const dialog = await openFilterPopover(page);

    await selectGroupBy(dialog, 'Month');
    await closePopover(page);

    await expect(
      page.getByRole('heading', { name: monthGroupLabel(lastMonth.date), exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: monthGroupLabel(twoMonthsAgo.date), exact: true })
    ).toBeVisible();
    await expect(historyCard(page, lastMonth.title)).toBeVisible();
    await expect(historyCard(page, twoMonthsAgo.title)).toBeVisible();
  });

  test('grouping by week', async ({ page }) => {
    const lastMonth = fixtures[2];
    await page.goto('/history');
    const dialog = await openFilterPopover(page);

    await selectGroupBy(dialog, 'Week');
    await closePopover(page);

    await expect(
      page.getByRole('heading', { name: weekGroupLabel(lastMonth.date), exact: true })
    ).toBeVisible();
    await expect(historyCard(page, lastMonth.title)).toBeVisible();
  });

  test('switching back to "None" removes grouping', async ({ page }) => {
    const lastMonth = fixtures[2];
    await page.goto('/history');
    let dialog = await openFilterPopover(page);

    await selectGroupBy(dialog, 'Month');
    await closePopover(page);
    await expect(
      page.getByRole('heading', { name: monthGroupLabel(lastMonth.date), exact: true })
    ).toBeVisible();

    dialog = await openFilterPopover(page);
    await selectGroupBy(dialog, 'None');
    await closePopover(page);

    await expect(
      page.getByRole('heading', { name: monthGroupLabel(lastMonth.date), exact: true })
    ).toHaveCount(0);
    await expect(historyCard(page, lastMonth.title)).toBeVisible();
  });
});
