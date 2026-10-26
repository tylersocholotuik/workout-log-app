import { test, expect } from './fixtures';
import {
  uniqueTitle,
  deleteWorkoutViaApi,
  startNewWorkout,
  pressIconTrigger,
  exerciseCard,
  addExercise,
  fillSet,
  applyTargetToSets,
  editWorkoutDetails,
  waitForAutosave,
  finishWorkout,
  acquireAccountLock,
  releaseAccountLock,
  ACCOUNT_LOCK_HOOK_TIMEOUT_MS,
} from './helpers';

// Tests in this file share one Playwright test account and its workout
// history, so keep them serial to avoid cross-test interference. This
// matters even more now that the backend only allows one in-progress
// workout per user at a time - see "Test data & cleanup" in
// test-plans/workout.md.
test.describe.configure({ mode: 'serial' });

// history.spec.ts also creates/finishes workouts on this same account, so a
// file-level lock keeps the two files from running at the same time too -
// `serial` mode above only pins *this* file to one worker, it doesn't stop a
// different file running concurrently on another worker/project.
test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(ACCOUNT_LOCK_HOOK_TIMEOUT_MS);
  await acquireAccountLock();
});

test.afterAll(() => {
  releaseAccountLock();
});

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

  test('new workout loads with sensible defaults and is saved immediately', async ({
    page,
    trackWorkout,
  }) => {
    await startNewWorkout(page, trackWorkout);

    const today = new Date().toLocaleDateString('en-CA', { dateStyle: 'short' });
    await expect(
      page.getByRole('heading', { name: `${today} Workout` })
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(0);
    await expect(page).toHaveURL(/\/workout\/(?!new-workout)[^/]+$/);
  });

  test('returning to /workout/new-workout with an in-progress workout resumes it', async ({
    page,
    trackWorkout,
  }) => {
    const workoutId = await startNewWorkout(page, trackWorkout);

    await page.goto('/workout/new-workout');

    await expect(page).toHaveURL(`/workout/${workoutId}`);
    await expect(page.getByRole('button', { name: 'Create New Workout' })).toHaveCount(0);
  });
});

test.describe('Workout details', () => {
  test('cannot save an empty title', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await page.getByRole('button', { name: 'Edit Details' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Workout Title').fill('');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText('Title is required.')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('valid details are applied to the page', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);

    const title = uniqueTitle('Details');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await waitForAutosave(page, () =>
      editWorkoutDetails(page, {
        title,
        date: yesterday,
        notes: 'Test workout notes',
      })
    );

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('Test workout notes')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Exercises', () => {
  test('exercise list loads', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await page.getByRole('button', { name: 'Add Exercise' }).click();

    await expect(page.getByRole('row', { name: 'Ab Wheel', exact: true })).toBeVisible();
  });

  test('search filters the exercise list', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
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

  test('adding an exercise creates a card with one empty set', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));

    const card = exerciseCard(page, 'Ab Wheel');
    await expect(card).toBeVisible();
    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveCount(1);
  });

  test('creating a brand-new exercise adds it to the list and workout', async ({
    page,
    trackWorkout,
  }) => {
    const exerciseName = uniqueTitle('Custom Exercise');
    await startNewWorkout(page, trackWorkout);

    await page.getByRole('button', { name: 'Add Exercise' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByRole('button', { name: 'Create New' }).click();
    await drawer.getByLabel('Exercise Name').fill(exerciseName);
    await drawer.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByText(`Exercise '${exerciseName}' was created!`)).toBeVisible();

    // Verify it through the normal select flow rather than the toast's inline
    // action, which is harder to scope reliably. Scope to the Select
    // Exercise drawer so its "Add" button isn't ambiguous with the
    // still-open creation toast's own inline "Add" action (the toast is an
    // alertdialog, not a dialog, so this scoping also lets us skip dismissing
    // it first).
    await drawer.getByRole('button', { name: 'Back' }).click();
    await drawer.getByPlaceholder('Search exercises...').fill(exerciseName);
    await drawer.getByRole('row', { name: exerciseName, exact: true }).click();
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Add', exact: true }).click());

    await expect(exerciseCard(page, exerciseName)).toBeVisible();
  });

  test('duplicate exercise names are rejected', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await page.getByRole('button', { name: 'Add Exercise' }).click();
    await page.getByRole('button', { name: 'Create New' }).click();
    await page.getByLabel('Exercise Name').fill('Ab Wheel');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(
      page.getByText("An exercise with this name already exists.")
    ).toBeVisible();
  });

  test('exercise can be swapped', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));

    await pressIconTrigger(
      exerciseCard(page, 'Ab Wheel').getByRole('button', { name: 'Actions', exact: true })
    );
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Change exercise' }).click();

    await page.getByPlaceholder('Search exercises...').fill('Back Extension');
    await page.getByRole('row', { name: 'Back Extension', exact: true }).click();
    await waitForAutosave(page, () => page.getByRole('button', { name: 'Update' }).click());

    await expect(exerciseCard(page, 'Back Extension')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ab Wheel', exact: true })).toHaveCount(0);
  });

  test('exercise can be removed', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));

    await pressIconTrigger(
      exerciseCard(page, 'Ab Wheel').getByRole('button', { name: 'Actions', exact: true })
    );
    await expect(page.getByRole('menu')).toBeVisible();
    await waitForAutosave(page, () => page.getByRole('menuitem', { name: 'Delete exercise' }).click());

    await expect(page.getByRole('heading', { name: 'Ab Wheel', exact: true })).toHaveCount(0);
  });

  test('exercise history is viewable', async ({ page, trackWorkout }) => {
    const exerciseName = uniqueTitle('History Exercise');
    await startNewWorkout(page, trackWorkout);
    await page.getByRole('button', { name: 'Add Exercise' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByRole('button', { name: 'Create New' }).click();
    await drawer.getByLabel('Exercise Name').fill(exerciseName);
    await drawer.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText(`Exercise '${exerciseName}' was created!`)).toBeVisible();
    // Scope to the Select Exercise drawer so its "Add" button isn't ambiguous
    // with the still-open creation toast's own inline "Add" action - lets us
    // skip dismissing the toast first.
    await drawer.getByRole('button', { name: 'Back' }).click();
    await drawer.getByPlaceholder('Search exercises...').fill(exerciseName);
    await drawer.getByRole('row', { name: exerciseName, exact: true }).click();
    // Wait for this add's own autosave to settle - otherwise a later
    // waitForAutosave() (for filling a set, below) can resolve on this PUT
    // instead of the real edit if it's still in flight on a slower browser.
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Add', exact: true }).click());
    // Wait out the drawer's close animation - opening the Actions dropdown
    // underneath while it's still closing can make the dropdown unstable to
    // click (Firefox in particular).
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await pressIconTrigger(
      exerciseCard(page, exerciseName).getByRole('button', { name: 'Actions', exact: true })
    );
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Exercise history' }).click();

    await expect(
      page.getByText('You have not performed this exercise before.')
    ).toBeVisible();
    await page.keyboard.press('Escape');
    // Wait out the modal's close animation - interacting with the set row's
    // inputs immediately after can race the close and silently drop values.
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // fill and persist a set, then reload so the history query refetches and
    // picks up this (now-saved) instance of the exercise - the backend's
    // exercise history doesn't exclude the workout currently being edited.
    await waitForAutosave(page, () =>
      fillSet(exerciseCard(page, exerciseName), { weight: '100', reps: '5', effortRating: '8' })
    );
    await page.reload();

    await pressIconTrigger(
      exerciseCard(page, exerciseName).getByRole('button', { name: 'Actions', exact: true })
    );
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Exercise history' }).click();

    await expect(page.getByText('@ RPE 8')).toBeVisible();
  });
});

test.describe('Sets', () => {
  test('sets can be added', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await waitForAutosave(page, () => card.getByRole('button', { name: 'Add Set' }).click());

    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveCount(2);
  });

  test('sets can be removed', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');
    await waitForAutosave(page, () => card.getByRole('button', { name: 'Add Set' }).click());

    await waitForAutosave(page, () => card.getByRole('button', { name: 'delete set' }).first().click());

    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveCount(1);
  });

  test('invalid characters are rejected in Weight/Reps/effort rating', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await card.getByRole('textbox', { name: 'weight' }).pressSequentially('abc');
    await expect(card.getByRole('textbox', { name: 'weight' })).toHaveValue('');
  });

  test('estimated one-rep max is calculated and displayed', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await waitForAutosave(page, () => fillSet(card, { weight: '250', reps: '8', effortRating: '9' }));

    await expect(card.getByText(/e1RM:/)).toBeVisible();
  });
});

test.describe('Set targets', () => {
  test('a target can be applied to specific sets', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');
    await waitForAutosave(page, () => card.getByRole('button', { name: 'Add Set' }).click());

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await waitForAutosave(page, () => applyTargetToSets(page, [1]));
    await drawer.getByRole('textbox', { name: 'Min Reps' }).fill('8');
    await drawer.getByRole('textbox', { name: 'Max Reps' }).fill('10');
    await drawer.getByRole('textbox', { name: 'Min RPE' }).fill('7');
    await drawer.getByRole('textbox', { name: 'Max RPE' }).fill('8');
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Close', exact: true }).click());
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(card.getByText('Target: 8-10')).toBeVisible();
    await expect(card.getByText('Target: 7-8')).toBeVisible();
    // the second set wasn't selected, so it stays untouched
    await expect(card.getByRole('textbox', { name: 'reps' }).nth(1)).toHaveValue('');
  });

  test('"Apply to all" covers every set, including ones added later', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await drawer.getByRole('textbox', { name: 'Min Reps' }).fill('5');
    await waitForAutosave(page, () => drawer.getByRole('checkbox', { name: 'Apply to all' }).click());
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Close', exact: true }).click());
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(card.getByText('Target: >= 5')).toBeVisible();

    await waitForAutosave(page, () => card.getByRole('button', { name: 'Add Set' }).click());

    await expect(card.getByText('Target: >= 5')).toHaveCount(2);
  });

  test('adding a second target claims the remaining sets', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');
    await waitForAutosave(page, () => card.getByRole('button', { name: 'Add Set' }).click());

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await waitForAutosave(page, () => applyTargetToSets(page, [1]));
    await drawer.getByRole('textbox', { name: 'Min Reps' }).fill('8');
    await waitForAutosave(page, () => drawer.getByRole('textbox', { name: 'Min Reps' }).blur());

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await page.getByRole('button', { name: 'Apply to Sets' }).last().click();
    await expect(page.getByRole('option', { name: '1', exact: true })).toBeDisabled();
    await waitForAutosave(page, async () => {
      await page.getByRole('option', { name: '2', exact: true }).click();
      await page.getByText('Set Targets', { exact: true }).click();
    });
    // wait out the popover's own close animation (slower on WebKit) so the
    // Escape press below (meant for the TargetsDrawer) isn't instead
    // consumed by this still-closing nested popover.
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.getByRole('textbox', { name: 'Min Reps' }).last().fill('3');
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Close', exact: true }).click());
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(card.getByText('Target: >= 8')).toBeVisible();
    await expect(card.getByText('Target: >= 3')).toBeVisible();
  });

  test('removing a target clears it from its sets', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    let drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await drawer.getByRole('textbox', { name: 'Min Reps' }).fill('5');
    await waitForAutosave(page, () => drawer.getByRole('checkbox', { name: 'Apply to all' }).click());
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Close', exact: true }).click());
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(card.getByText('Target: >= 5')).toBeVisible();

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    drawer = page.getByRole('dialog');
    // Remove Target is the only remaining mutation here - once it clears the
    // last target row, closing the (now-empty) drawer has nothing left to
    // commit, so unlike other tests the Close click triggers no further
    // autosave to wait for.
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Remove Target' }).click());
    await drawer.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(card.getByText(/Target:/)).toHaveCount(0);
  });

  test('a value outside its target range is visually flagged', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await drawer.getByRole('textbox', { name: 'Min Reps' }).fill('8');
    await waitForAutosave(page, () => drawer.getByRole('checkbox', { name: 'Apply to all' }).click());
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Close', exact: true }).click());
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await waitForAutosave(page, async () => {
      await card.getByRole('textbox', { name: 'reps' }).fill('5');
      await card.getByRole('textbox', { name: 'reps' }).blur();
    });

    await expect(card.getByRole('textbox', { name: 'reps' })).toHaveClass(/text-danger/);
  });

  test('"Show Targets" hides/shows the target descriptions', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await drawer.getByRole('textbox', { name: 'Min Reps' }).fill('5');
    await waitForAutosave(page, () => drawer.getByRole('checkbox', { name: 'Apply to all' }).click());
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Close', exact: true }).click());
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(card.getByText('Target: >= 5')).toBeVisible();

    await pressIconTrigger(card.getByRole('button', { name: 'exercise options' }));
    await page.getByRole('switch', { name: 'Show Targets' }).click();
    await page.keyboard.press('Escape');

    await expect(card.getByText('Target: >= 5')).toHaveCount(0);

    await pressIconTrigger(card.getByRole('button', { name: 'exercise options' }));
    await page.getByRole('switch', { name: 'Show Targets' }).click();
    await page.keyboard.press('Escape');

    await expect(card.getByText('Target: >= 5')).toBeVisible();
  });

  test('targets persist after reload', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await pressIconTrigger(card.getByRole('button', { name: 'Actions', exact: true }));
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Set targets' }).click();
    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Add Target' }).click();
    await drawer.getByRole('textbox', { name: 'Min Reps' }).fill('8');
    await drawer.getByRole('textbox', { name: 'Max Reps' }).fill('10');
    await waitForAutosave(page, () => drawer.getByRole('checkbox', { name: 'Apply to all' }).click());
    await waitForAutosave(page, () => drawer.getByRole('button', { name: 'Close', exact: true }).click());
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.reload();

    await expect(exerciseCard(page, 'Ab Wheel').getByText('Target: 8-10')).toBeVisible();
  });
});

test.describe('Weight unit, effort rating type, & notes', () => {
  test('weight unit can be switched between lbs and kg', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await pressIconTrigger(card.getByRole('button', { name: 'exercise options' }));
    await waitForAutosave(page, () => page.getByRole('radio', { name: 'kg' }).click());
    await page.keyboard.press('Escape');

    await page.reload();
    await expect(exerciseCard(page, 'Ab Wheel').getByText('kg')).toBeVisible();
  });

  test('effort rating type can be switched between RPE and RIR', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');
    await waitForAutosave(page, () => fillSet(card, { weight: '100', reps: '5', effortRating: '8' }));

    await expect(card.getByText('RPE', { exact: true })).toBeVisible();

    await pressIconTrigger(card.getByRole('button', { name: 'exercise options' }));
    await waitForAutosave(page, () => page.getByRole('radio', { name: 'RIR' }).click());
    await page.keyboard.press('Escape');

    // RIR = 10 - ceil(RPE) => 10 - ceil(8) = 2
    await expect(card.getByText('RIR', { exact: true })).toBeVisible();
    await expect(card.getByRole('textbox', { name: 'effort rating' })).toHaveValue('2');

    await page.reload();
    const reloadedCard = exerciseCard(page, 'Ab Wheel');
    await expect(reloadedCard.getByText('RIR', { exact: true })).toBeVisible();
    await expect(reloadedCard.getByRole('textbox', { name: 'effort rating' })).toHaveValue('2');
  });

  test('exercise notes are saved', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    await waitForAutosave(page, async () => {
      await card.getByRole('textbox', { name: 'Notes' }).fill('Felt strong today');
      await card.getByRole('textbox', { name: 'Notes' }).blur();
    });

    await page.reload();
    await expect(
      exerciseCard(page, 'Ab Wheel').getByText('Felt strong today')
    ).toBeVisible();
  });
});

test.describe('Autosave & finishing', () => {
  test('edits are autosaved', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    // Let addExercise's own autosave settle first - otherwise its still-in-flight
    // PUT can be the one waitForAutosave below happens to catch (any PUT
    // resolving during the click matches), making the test believe the "Add
    // Set" edit persisted when it was really just the earlier one.
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');

    // The "Saving..." indicator shows for a fixed 500ms regardless of how
    // long the save itself takes, and the autosave request doesn't even fire
    // until a 300ms debounce elapses - against staging's real network
    // latency the response can arrive well after that 500ms window already
    // closed, so check for the indicator right after triggering the edit
    // instead of after awaiting its response (which reliably passed locally
    // but failed every time in CI/staging for exactly this reason).
    const saveResponse = page.waitForResponse(
      (res) => /\/api\/workouts\/[^/?]+$/.test(res.url()) && res.request().method() === 'PUT'
    );
    await card.getByRole('button', { name: 'Add Set' }).click();
    await expect(page.getByText('Saving...')).toBeVisible();
    expect((await saveResponse).ok()).toBeTruthy();

    await page.reload();
    await expect(exerciseCard(page, 'Ab Wheel').getByRole('textbox', { name: 'weight' })).toHaveCount(2);
  });

  test('an edit made right before navigating away is not lost', async ({
    page,
    trackWorkout,
  }) => {
    const workoutId = await startNewWorkout(page, trackWorkout);
    const title = uniqueTitle('Flush On Navigate');

    await page.getByRole('button', { name: 'Edit Details' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Workout Title').fill(title);

    // Save, then immediately navigate away - before the 300ms autosave
    // debounce would normally fire - and confirm routeChangeStart's flush
    // actually completes the save rather than just discarding the edit.
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => /\/api\/workouts\/[^/?]+$/.test(res.url()) && res.request().method() === 'PUT'
      ),
      (async () => {
        await dialog.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await page.getByRole('link', { name: 'Workout', exact: true }).click();
      })(),
    ]);
    expect(response.ok()).toBeTruthy();

    // Load the workout directly (bypassing the new-workout/active-workout
    // redirect) to confirm the flushed edit actually persisted.
    await page.goto(`/workout/${workoutId}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  });

  test('cannot finish a workout with no exercises', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);

    await page.getByRole('button', { name: 'Finish Workout' }).click();

    await expect(
      page.getByText('Cannot finish a workout with no exercises.')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/workout\/(?!new-workout)[^/]+$/);
    await expect(page.getByRole('button', { name: 'Finish Workout' })).toBeVisible();
  });

  test('finishing a workout', async ({ page, trackWorkout }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));

    await finishWorkout(page);

    await expect(page.getByText('Workout finished!')).toBeVisible();
    await expect(page).toHaveURL('/history');
  });

  test('finishing an already-finished workout with no edits just navigates away', async ({
    page,
    trackWorkout,
  }) => {
    const workoutId = await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    await finishWorkout(page);
    await expect(page).toHaveURL('/history');

    await page.goto(`/workout/${workoutId}`);
    await expect(page.getByRole('button', { name: 'Finish Editing' })).toBeVisible();

    await page.getByRole('button', { name: 'Finish Editing' }).click();

    await expect(page).toHaveURL('/history');
    await expect(page.getByText('Workout finished!')).toHaveCount(0);
    await expect(page.getByText('Confirm Workout Update')).toHaveCount(0);
  });

  test('editing a finished workout requires an explicit save', async ({
    page,
    trackWorkout,
  }) => {
    const workoutId = await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    await finishWorkout(page);
    await expect(page).toHaveURL('/history');

    await page.goto(`/workout/${workoutId}`);
    const card = exerciseCard(page, 'Ab Wheel');
    await card.getByRole('textbox', { name: 'Notes' }).fill('Should not autosave');
    await card.getByRole('textbox', { name: 'Notes' }).blur();

    // Give the normal debounce (300ms) + "Saving..." indicator window (500ms)
    // time to elapse - no indicator appearing confirms no autosave request
    // was ever sent for this edit, unlike an in-progress workout's edits.
    await expect(page.getByText('Saving...')).toHaveCount(0);
    await page.waitForTimeout(1000);
    await expect(page.getByText('Saving...')).toHaveCount(0);

    await page.reload();
    await expect(
      exerciseCard(page, 'Ab Wheel').getByText('Should not autosave')
    ).toHaveCount(0);
  });

  test('confirmation modal when updating a finished workout', async ({
    page,
    trackWorkout,
  }) => {
    const workoutId = await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    await finishWorkout(page);
    await expect(page).toHaveURL('/history');

    await page.goto(`/workout/${workoutId}`);
    const card = exerciseCard(page, 'Ab Wheel');
    await card.getByRole('textbox', { name: 'Notes' }).fill('Added after finishing');
    await card.getByRole('textbox', { name: 'Notes' }).blur();

    await page.getByRole('button', { name: 'Finish Editing' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Confirm Workout Update')).toBeVisible();

    // Cancel first - the edit should stay unsaved and the user on the page.
    // (Checked via the textbox's live value, not getByText - HeroUI's
    // Textarea only re-renders its DOM text content on mount, so a
    // post-interaction value only shows up in the `value` property until a
    // reload/remount happens.)
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(`/workout/${workoutId}`);
    await expect(card.getByRole('textbox', { name: 'Notes' })).toHaveValue('Added after finishing');

    // Confirming instead actually saves the edit and navigates away.
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => /\/api\/workouts\/[^/?]+$/.test(res.url()) && res.request().method() === 'PUT'
      ),
      (async () => {
        await page.getByRole('button', { name: 'Finish Editing' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
      })(),
    ]);
    expect(response.ok()).toBeTruthy();

    await expect(page.getByText('Workout saved!')).toBeVisible();
    await expect(page).toHaveURL('/history');

    await page.goto(`/workout/${workoutId}`);
    await expect(
      exerciseCard(page, 'Ab Wheel').getByText('Added after finishing')
    ).toBeVisible();
  });
});

test.describe('Updating a saved workout (exercise/set removal)', () => {
  test('removing an exercise from a saved workout persists after reload', async ({
    page,
    trackWorkout,
  }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    await waitForAutosave(page, () => addExercise(page, 'Back Extension'));

    await pressIconTrigger(
      exerciseCard(page, 'Ab Wheel').getByRole('button', { name: 'Actions', exact: true })
    );
    await expect(page.getByRole('menu')).toBeVisible();
    await waitForAutosave(page, () => page.getByRole('menuitem', { name: 'Delete exercise' }).click());

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Ab Wheel', exact: true })).toHaveCount(0);
    await expect(exerciseCard(page, 'Back Extension')).toBeVisible();
  });

  test('removing a set from a saved workout persists after reload', async ({
    page,
    trackWorkout,
  }) => {
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    const card = exerciseCard(page, 'Ab Wheel');
    await waitForAutosave(page, () => card.getByRole('button', { name: 'Add Set' }).click());
    await waitForAutosave(page, () => fillSet(card, { weight: '100', reps: '10', effortRating: '8' }));
    const secondSetWeight = card.getByRole('textbox', { name: 'weight' }).nth(1);
    await waitForAutosave(page, async () => {
      await secondSetWeight.fill('200');
      await secondSetWeight.blur();
    });

    await waitForAutosave(page, () => card.getByRole('button', { name: 'delete set' }).first().click());

    await page.reload();
    const reloadedCard = exerciseCard(page, 'Ab Wheel');
    await expect(reloadedCard.getByRole('textbox', { name: 'weight' })).toHaveCount(1);
    await expect(reloadedCard.getByRole('textbox', { name: 'weight' })).toHaveValue('200');
  });
});

test.describe('Deleting', () => {
  test('deleting a workout removes it', async ({ page, trackWorkout }) => {
    const title = uniqueTitle('To Delete');
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => editWorkoutDetails(page, { title }));

    await page.getByRole('button', { name: 'Delete Workout' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText(`'${title}' was deleted`)).toBeVisible();
    await expect(page).toHaveURL('/workout/new-workout');
    await expect(page.getByRole('button', { name: 'Create New Workout' })).toBeVisible();
  });
});

test.describe('Authorization', () => {
  test('cannot view another user\u2019s workout', async ({ page, browser }) => {
    test.skip(
      !process.env.SECOND_TEST_USER_EMAIL || !process.env.SECOND_TEST_USER_PASSWORD,
      'Requires SECOND_TEST_USER_EMAIL/SECOND_TEST_USER_PASSWORD for a second test account.'
    );

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    let otherWorkoutId: string | undefined;

    try {
      await otherPage.goto('/login');
      const loginForm = otherPage.locator('#password-login-form');
      await loginForm.getByLabel('Email').fill(process.env.SECOND_TEST_USER_EMAIL!);
      await loginForm
        .getByLabel('Password', { exact: true })
        .fill(process.env.SECOND_TEST_USER_PASSWORD!);
      await otherPage.getByRole('button', { name: 'Login' }).click();
      await expect(otherPage).toHaveURL('/');

      otherWorkoutId = await startNewWorkout(otherPage);

      await page.goto(`/workout/${otherWorkoutId}`);
      await expect(
        page.getByText('Oops! This is someone else\u2019s workout!')
      ).toBeVisible();
    } finally {
      // Must delete via the other account's own session - the primary
      // account's request context would get a 403 (not the owner).
      await deleteWorkoutViaApi(otherPage.request, otherWorkoutId);
      await otherContext.close();
    }
  });
});

test.describe('History persistence', () => {
  test('saved workout is retrievable by ID', async ({ page, trackWorkout }) => {
    const title = uniqueTitle('Retrievable');
    const workoutId = await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => editWorkoutDetails(page, { title, notes: 'Retrieval check notes' }));
    await waitForAutosave(page, () => addExercise(page, 'Ab Wheel'));
    await waitForAutosave(page, () =>
      fillSet(exerciseCard(page, 'Ab Wheel'), { weight: '135', reps: '5', effortRating: '7' })
    );

    await page.goto(`/workout/${workoutId}`);

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('Retrieval check notes')).toBeVisible();
    await expect(exerciseCard(page, 'Ab Wheel')).toBeVisible();
  });

  test('saved workout appears in history', async ({ page, trackWorkout }) => {
    const title = uniqueTitle('History Visible');
    await startNewWorkout(page, trackWorkout);
    await waitForAutosave(page, () => editWorkoutDetails(page, { title }));

    await page.goto('/history');

    await expect(page.getByText(title)).toBeVisible();
  });
});
