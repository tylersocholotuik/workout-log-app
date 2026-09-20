# Workout CRUD Flow

**Spec file:** [`tests/workout.spec.ts`](../tests/workout.spec.ts)
**Project(s):** `chromium`, `firefox`, `webkit`
**Preconditions:** Authenticated (reuses storage state from the `setup` project)

## Purpose

Covers the full workout lifecycle — creating, editing, saving, and deleting a
workout, including exercise/set management, per-user access control, and
persistence into workout history.

## Scenarios

### Entry point

- **shows create/load options for a brand-new workout** — navigate to
  `/workout/new-workout` via the "Workout" nav link → "Create New Workout"
  and "Load Existing Workout" buttons are shown, no workout form yet.
- **"Load Existing Workout" navigates to history** — click "Load Existing
  Workout" → redirected to `/history`.
- **new workout loads with sensible defaults** — click "Create New Workout"
  → title defaults to "[yyyy-mm-dd] Workout", date defaults to today, no
  exercises are present.

### Workout details

- **cannot save an empty title** — open "Edit Details", clear the title,
  click Save → "Title is required." shown, modal stays open.
- **valid details are applied to the page** — set title, date (e.g.
  yesterday), and notes, Save → page header/date/notes reflect the new
  values, modal closes.

  > The title/notes over-length errors ("Title must be 50 characters or
  > less.", "Notes must be 250 characters or less.") aren't included here —
  > both inputs have a native `maxLength`, so the UI never lets you type past
  > the limit in the first place. That logic belongs in a component test.

### Exercises

- **exercise list loads** — click "Add Exercise" → modal opens with a
  non-empty exercise list.
- **search filters the exercise list** — type "bench press" in the search
  box → only matching exercises (case-insensitive) remain.
- **adding an exercise creates a card with one empty set** — select an
  exercise, click Add → a card with that exercise's name appears, containing
  exactly one set row.
- **creating a brand-new exercise adds it to the list and workout** — in the
  Select Exercise modal, switch to "create new," enter a unique name, Create
  → success toast with an "Add" action; clicking it adds the new exercise to
  the workout.
- **duplicate exercise names are rejected** — try to create a new exercise
  using an existing exercise's name → "Exercise name '<name>' already
  exists." shown.
- **exercise can be swapped** — open the exercise card's actions menu →
  "Change exercise" → select a different exercise → card header updates to
  the new exercise, sets are preserved.
- **exercise can be removed** — open the actions menu → "Delete exercise" →
  card is removed from the workout.
- **exercise history is viewable** — open the actions menu → "Exercise
  history" → modal opens showing past performances (or "You have not
  performed this exercise before." if none exist).

### Sets

- **sets can be added** — click "Add Set" on a card → a new empty set row
  appears.
- **sets can be removed** — click the delete icon on a set row → that row is
  removed.
- **invalid characters are rejected in Weight/Reps/RPE** — attempt to type a
  non-numeric character into each input → the character is not accepted
  (representative check only — exhaustive regex boundary cases belong in a
  component test).
- **estimated one-rep max is calculated and displayed** — enter a
  Weight/Reps/RPE combination within the eligible range (reps 1-10, RPE ≥ 6)
  → "e1RM: <value>" appears under the set rows.

### Weight unit & notes

- **weight unit can be switched between lbs and kg** — open the exercise's
  Options popover, toggle the unit → the selected unit persists after
  saving.
- **exercise notes are saved** — type in the exercise's Notes field, blur,
  save → notes persist after reload.

### Saving

- **creating a workout succeeds** — fill in details plus at least one
  exercise/set, click "Save Workout" → "Workout saved!" toast, URL changes
  from `/workout/new-workout` to `/workout/<GUID>`.
- **editing an existing workout succeeds** — load a previously saved
  workout, change a field, Save → "Workout saved!" toast, change is
  persisted on reload.

### Updating a saved workout (soft-delete)

The backend soft-deletes removed exercises/sets rather than hard-deleting
them, and that's already covered by backend unit tests. These scenarios just
confirm the frontend doesn't keep showing (or resurrect) something the user
removed.

- **removing an exercise from a saved workout persists after reload** — load
  a saved workout with 2+ exercises, delete one via the actions menu, Save,
  then reload the page → the deleted exercise's card is gone, the remaining
  exercise(s) and their sets are unchanged.
- **removing a set from a saved workout persists after reload** — load a
  saved workout where an exercise has 2+ sets, delete one set row, Save,
  then reload the page → the deleted set is gone, the remaining set's
  weight/reps/RPE are unchanged.

### Deleting / cancelling

- **cancelling an unsaved workout resets the page** — on a new, unsaved
  workout, click "Cancel Workout", confirm in the modal → form resets to a
  fresh new-workout state.
- **deleting a saved workout removes it** — load a saved workout, click
  "Delete Workout", confirm in the modal → "'<title>' was deleted" toast,
  redirected to `/workout/new-workout`, workout no longer appears in
  history.

### Authorization

- **cannot view another user's workout** — navigate directly to another
  user's `workoutId` → "Oops! This is someone else's workout!" message is
  shown instead of the workout form.

### History persistence

- **saved workout is retrievable by ID** — after creating a workout, reload
  `/workout/<id>` directly → the same title/date/notes/exercises/sets are
  shown (verifies persistence independent of any other data in the
  account).
- **saved workout appears in history** — after creating a workout with a
  unique title, go to `/history`, filter the date range to include the
  workout's date → the unique title is visible in the list. Don't assert
  total list length, since other workouts may already exist in the shared
  test account.

## Test data & cleanup

- Workouts created during these tests should get a unique, timestamped
  title so they can be reliably found on the history page regardless of
  what else exists in the account.
- Any test that creates a workout should delete it afterward
  (`test.afterEach`, via the UI's delete flow or a direct
  `DELETE /api/workouts/{id}` call) to avoid polluting the shared test
  account's history across runs.