import { test, expect } from '@playwright/test';
import {
  uniqueTitle,
  workoutIdFromUrl,
  deleteWorkoutViaApi,
  startNewWorkout,
  pressIconTrigger,
  exerciseCard,
  addExercise,
  fillSet,
  editWorkoutDetails,
  saveWorkout,
  waitForCreateToSettle,
} from './helpers';

// Tests in this file share one Playwright test account and its workout
// history, so keep them serial to avoid cross-test interference.
test.describe.configure({ mode: 'serial' });

test.describe('Entry point', () => {
  test('shows create/load options for a brand-new workout', async ({ page }) => {
    await page.goto('/workout/new-workout');

    await expect(page.getByRole('button', { name: 'Create New Workout' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load Existing Workout' })).toBeVisible();
  });

  test('"Load Existing Workout" navigates to history', async ({ page }) => {
    await page.goto('/workout/new-workout');
    await page.getByRole('button', { name: 'Load Existing Workout' }).click();

    await expect(page).toHaveURL('/history');
  });

  test('new workout loads with sensible defaults', async ({ page }) => {
    await startNewWorkout(page);

    const today = new Date().toLocaleDateString('en-CA', { dateStyle: 'short' });
    await expect(
      page.getByRole('heading', { name: `${today} Workout` })
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(0);
  });
});

test.describe('Workout details', () => {
  test('cannot save an empty title', async ({ page }) => {
    await startNewWorkout(page);
    await page.getByRole('button', { name: 'Edit Details' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Workout Title').fill('');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText('Title is required.')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('valid details are applied to the page', async ({ page }) => {
    await startNewWorkout(page);

    const title = uniqueTitle('Details');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await editWorkoutDetails(page, {
      title,
      date: yesterday,
      notes: 'Test workout notes',
    });

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('Test workout notes')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Exercises', () => {
  test('exercise list loads', async ({ page }) => {
    await startNewWorkout(page);
    await page.getByRole('button', { name: 'Add Exercise' }).click();

    await expect(page.getByRole('row', { name: 'Ab Wheel', exact: true })).toBeVisible();
  });

  test('search filters the exercise list', async ({ page }) => {
    await startNewWorkout(page);
    await page.getByRole('button', { name: 'Add Exercise' }).click();
    await page.getByPlaceholder('Search exercises...').fill('bench press');

    const rows = page.getByRole('row');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText(/bench press/i);
    }
    await expect(page.getByRole('row', { name: 'Ab Wheel', exact: true })).toHaveCount(0);
  });

  test('adding an exercise creates a card with one empty set', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');

    const card = exerciseCard(page, 'Ab Wheel');
    await expect(card).toBeVisible();
    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveCount(1);
  });

  test('creating a brand-new exercise adds it to the list and workout', async ({ page }) => {
    const exerciseName = uniqueTitle('Custom Exercise');
    await startNewWorkout(page);

    await page.getByRole('button', { name: 'Add Exercise' }).click();
    await page.getByRole('button', { name: 'Create New' }).click();
    await page.getByLabel('Exercise Name').fill(exerciseName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByText(`Exercise '${exerciseName}' was created!`)).toBeVisible();

    // Verify it through the normal select flow rather than the toast's inline
    // action, which is harder to scope reliably.
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByPlaceholder('Search exercises...').fill(exerciseName);
    await page.getByRole('row', { name: exerciseName, exact: true }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(exerciseCard(page, exerciseName)).toBeVisible();
  });

  test('duplicate exercise names are rejected', async ({ page }) => {
    await startNewWorkout(page);
    await page.getByRole('button', { name: 'Add Exercise' }).click();
    await page.getByRole('button', { name: 'Create New' }).click();
    await page.getByLabel('Exercise Name').fill('Ab Wheel');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(
      page.getByText("Exercise name 'Ab Wheel' already exists.")
    ).toBeVisible();
  });

  test('exercise can be swapped', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');

    await pressIconTrigger(
      exerciseCard(page, 'Ab Wheel').getByRole('button', { name: 'Actions', exact: true })
    );
    await page.getByRole('menuitem', { name: 'Change exercise' }).click();

    await page.getByPlaceholder('Search exercises...').fill('Back Extension');
    await page.getByRole('row', { name: 'Back Extension', exact: true }).click();
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(exerciseCard(page, 'Back Extension')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ab Wheel', exact: true })).toHaveCount(0);
  });

  test('exercise can be removed', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');

    await pressIconTrigger(
      exerciseCard(page, 'Ab Wheel').getByRole('button', { name: 'Actions', exact: true })
    );
    await page.getByRole('menuitem', { name: 'Delete exercise' }).click();

    await expect(page.getByRole('heading', { name: 'Ab Wheel', exact: true })).toHaveCount(0);
  });

  test('exercise history is viewable', async ({ page }) => {
    const exerciseName = uniqueTitle('History Exercise');
    await startNewWorkout(page);
    await page.getByRole('button', { name: 'Add Exercise' }).click();
    await page.getByRole('button', { name: 'Create New' }).click();
    await page.getByLabel('Exercise Name').fill(exerciseName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByPlaceholder('Search exercises...').fill(exerciseName);
    await page.getByRole('row', { name: exerciseName, exact: true }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await pressIconTrigger(
      exerciseCard(page, exerciseName).getByRole('button', { name: 'Actions', exact: true })
    );
    await page.getByRole('menuitem', { name: 'Exercise history' }).click();

    await expect(
      page.getByText('You have not performed this exercise before.')
    ).toBeVisible();
  });
});

test.describe('Sets', () => {
  test('sets can be added', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');
    const card = exerciseCard(page, 'Ab Wheel');

    await card.getByRole('button', { name: 'Add Set' }).click();

    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveCount(2);
  });

  test('sets can be removed', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');
    const card = exerciseCard(page, 'Ab Wheel');
    await card.getByRole('button', { name: 'Add Set' }).click();

    await card.getByRole('button', { name: 'delete set' }).first().click();

    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveCount(1);
  });

  test('invalid characters are rejected in Weight/Reps/RPE', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');
    const card = exerciseCard(page, 'Ab Wheel');

    await card.getByRole('textbox', { name: 'weight' }).pressSequentially('abc');
    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveValue('');
  });

  test('estimated one-rep max is calculated and displayed', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');
    const card = exerciseCard(page, 'Ab Wheel');

    await fillSet(card, { weight: '250', reps: '8', rpe: '9' });

    await expect(card.getByText(/e1RM:/)).toBeVisible();
  });
});

test.describe('Weight unit & notes', () => {
  test('weight unit can be switched between lbs and kg', async ({ page, request }) => {
    await startNewWorkout(page);
    await editWorkoutDetails(page, { title: uniqueTitle('Weight Unit') });
    await addExercise(page, 'Ab Wheel');
    const card = exerciseCard(page, 'Ab Wheel');

    await pressIconTrigger(card.getByRole('button', { name: 'exercise options' }));
    await page.getByRole('radio', { name: 'kg' }).click();
    await page.keyboard.press('Escape');

    await saveWorkout(page);
    const workoutId = workoutIdFromUrl(page);

    await page.reload();
    await expect(exerciseCard(page, 'Ab Wheel').getByText('kg')).toBeVisible();

    await deleteWorkoutViaApi(request, workoutId);
  });

  test('exercise notes are saved', async ({ page, request }) => {
    await startNewWorkout(page);
    await editWorkoutDetails(page, { title: uniqueTitle('Exercise Notes') });
    await addExercise(page, 'Ab Wheel');
    const card = exerciseCard(page, 'Ab Wheel');

    await card.getByRole('textbox', { name: 'Notes' }).fill('Felt strong today');
    await card.getByRole('textbox', { name: 'Notes' }).blur();

    await saveWorkout(page);
    const workoutId = workoutIdFromUrl(page);

    await page.reload();
    await expect(
      exerciseCard(page, 'Ab Wheel').getByText('Felt strong today')
    ).toBeVisible();

    await deleteWorkoutViaApi(request, workoutId);
  });
});

test.describe('Saving', () => {
  test('creating a workout succeeds', async ({ page, request }) => {
    await startNewWorkout(page);
    await editWorkoutDetails(page, { title: uniqueTitle('Create') });
    await addExercise(page, 'Ab Wheel');
    await fillSet(exerciseCard(page, 'Ab Wheel'), { weight: '100', reps: '10', rpe: '8' });

    await saveWorkout(page);

    await expect(page).toHaveURL(/\/workout\/(?!new-workout)[^/]+$/);
    const workoutId = workoutIdFromUrl(page);
    await deleteWorkoutViaApi(request, workoutId);
  });

  test('editing an existing workout succeeds', async ({ page, request }) => {
    await startNewWorkout(page);
    const originalTitle = uniqueTitle('Before Edit');
    await editWorkoutDetails(page, { title: originalTitle });
    await addExercise(page, 'Ab Wheel');
    await saveWorkout(page);
    const workoutId = workoutIdFromUrl(page);
    await waitForCreateToSettle(page, originalTitle);

    const newTitle = uniqueTitle('Edited');
    await editWorkoutDetails(page, { title: newTitle });
    await saveWorkout(page);

    await page.reload();
    await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();

    await deleteWorkoutViaApi(request, workoutId);
  });
});

test.describe('Updating a saved workout (soft-delete)', () => {
  test('removing an exercise from a saved workout persists after reload', async ({
    page,
    request,
  }) => {
    await startNewWorkout(page);
    const title = uniqueTitle('Remove Exercise');
    await editWorkoutDetails(page, { title });
    await addExercise(page, 'Ab Wheel');
    await addExercise(page, 'Back Extension');
    await saveWorkout(page);
    const workoutId = workoutIdFromUrl(page);
    await waitForCreateToSettle(page, title);

    await pressIconTrigger(
      exerciseCard(page, 'Ab Wheel').getByRole('button', { name: 'Actions', exact: true })
    );
    await page.getByRole('menuitem', { name: 'Delete exercise' }).click();
    await saveWorkout(page);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Ab Wheel', exact: true })).toHaveCount(0);
    await expect(exerciseCard(page, 'Back Extension')).toBeVisible();

    await deleteWorkoutViaApi(request, workoutId);
  });

  test('removing a set from a saved workout persists after reload', async ({
    page,
    request,
  }) => {
    await startNewWorkout(page);
    const title = uniqueTitle('Remove Set');
    await editWorkoutDetails(page, { title });
    await addExercise(page, 'Ab Wheel');
    const card = exerciseCard(page, 'Ab Wheel');
    await card.getByRole('button', { name: 'Add Set' }).click();
    await fillSet(card, { weight: '100', reps: '10', rpe: '8' });
    const secondSetWeight = card.getByRole('textbox', { name: 'weight' }).nth(1);
    await secondSetWeight.fill('200');
    await secondSetWeight.blur();
    await saveWorkout(page);
    const workoutId = workoutIdFromUrl(page);
    await waitForCreateToSettle(page, title);

    await card.getByRole('button', { name: 'delete set' }).first().click();
    await saveWorkout(page);

    await page.reload();
    const reloadedCard = exerciseCard(page, 'Ab Wheel');
    await expect(reloadedCard.getByRole('textbox', { name: 'weight' })).toHaveCount(1);
    await expect(reloadedCard.getByRole('textbox', { name: 'weight' })).toHaveValue('200');

    await deleteWorkoutViaApi(request, workoutId);
  });
});

test.describe('Deleting / cancelling', () => {
  test('cancelling an unsaved workout resets the page', async ({ page }) => {
    await startNewWorkout(page);
    await addExercise(page, 'Ab Wheel');

    await page.getByRole('button', { name: 'Cancel Workout' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('button', { name: 'Create New Workout' })).toBeVisible();
  });

  test('deleting a saved workout removes it', async ({ page }) => {
    const title = uniqueTitle('To Delete');
    await startNewWorkout(page);
    await editWorkoutDetails(page, { title });
    await addExercise(page, 'Ab Wheel');
    await saveWorkout(page);

    await page.getByRole('button', { name: 'Delete Workout' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText(`'${title}' was deleted`)).toBeVisible();
    await expect(page).toHaveURL('/workout/new-workout');
    await expect(page.getByRole('button', { name: 'Create New Workout' })).toBeVisible();
  });
});

test.describe('Authorization', () => {
  test('cannot view another user\u2019s workout', async ({ page, browser, request }) => {
    test.skip(
      !process.env.SECOND_TEST_USER_EMAIL || !process.env.SECOND_TEST_USER_PASSWORD,
      'Requires SECOND_TEST_USER_EMAIL/SECOND_TEST_USER_PASSWORD for a second test account.'
    );

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();

    await otherPage.goto('/login');
    const loginForm = otherPage.locator('#password-login-form');
    await loginForm.getByLabel('Email').fill(process.env.SECOND_TEST_USER_EMAIL!);
    await loginForm
      .getByLabel('Password', { exact: true })
      .fill(process.env.SECOND_TEST_USER_PASSWORD!);
    await otherPage.getByRole('button', { name: 'Login' }).click();
    await expect(otherPage).toHaveURL('/');

    await startNewWorkout(otherPage);
    await addExercise(otherPage, 'Ab Wheel');
    await saveWorkout(otherPage);
    const otherWorkoutId = workoutIdFromUrl(otherPage);
    await otherContext.close();

    await page.goto(`/workout/${otherWorkoutId}`);
    await expect(
      page.getByText('Oops! This is someone else\u2019s workout!')
    ).toBeVisible();

    await deleteWorkoutViaApi(request, otherWorkoutId);
  });
});

test.describe('History persistence', () => {
  test('saved workout is retrievable by ID', async ({ page, request }) => {
    const title = uniqueTitle('Retrievable');
    await startNewWorkout(page);
    await editWorkoutDetails(page, { title, notes: 'Retrieval check notes' });
    await addExercise(page, 'Ab Wheel');
    await fillSet(exerciseCard(page, 'Ab Wheel'), { weight: '135', reps: '5', rpe: '7' });
    await saveWorkout(page);
    const workoutId = workoutIdFromUrl(page);

    await page.goto(`/workout/${workoutId}`);

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('Retrieval check notes')).toBeVisible();
    await expect(exerciseCard(page, 'Ab Wheel')).toBeVisible();

    await deleteWorkoutViaApi(request, workoutId);
  });

  test('saved workout appears in history', async ({ page, request }) => {
    const title = uniqueTitle('History Visible');
    await startNewWorkout(page);
    await editWorkoutDetails(page, { title });
    await addExercise(page, 'Ab Wheel');
    await saveWorkout(page);
    const workoutId = workoutIdFromUrl(page);

    await page.goto('/history');

    await expect(page.getByText(title)).toBeVisible();

    await deleteWorkoutViaApi(request, workoutId);
  });
});
