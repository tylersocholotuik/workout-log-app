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
  `/workout/new-workout` via the "Workout" nav link, with no in-progress
  workout already active → "Create New Workout" and "Load Existing
  Workout" buttons are shown, no workout form yet.
- **"Load Existing Workout" navigates to history** — click "Load Existing
  Workout" → redirected to `/history`.
- **new workout loads with sensible defaults and is saved immediately** —
  click "Create New Workout" → title defaults to "[yyyy-mm-dd] Workout",
  date defaults to today, no exercises are present, and the URL updates
  from `/workout/new-workout` to `/workout/<GUID>` once the workout is
  autosaved - there's no explicit "Save" step for this, the backend record
  is created as soon as the button is clicked.
- **returning to `/workout/new-workout` with an in-progress workout
  resumes it** — with an unfinished workout already created (e.g. left
  over from a previous visit that never clicked "Finish Workout"),
  navigate to `/workout/new-workout` → automatically redirected to
  `/workout/<that workout's id>` with its data loaded, skipping the
  create/load prompt entirely.

### Workout details

- **cannot save an empty title** — open "Edit Details", clear the title,
  click Save → "Title is required." shown, modal stays open.
- **valid details are applied to the page** — set title, date (e.g.
  yesterday), and notes, Save → page header/date/notes reflect the new
  values, modal closes. This "Save" only closes the details modal and
  commits the change to local workout state; persisting it to the backend
  happens via autosave (see **Autosave & finishing** below), not an
  explicit top-level save action.

  > The title/notes over-length errors ("Title must be 50 characters or
  > less.", "Notes must be 250 characters or less.") aren't included here —
  > both inputs have a native `maxLength`, so the UI never lets you type past
  > the limit in the first place. That logic belongs in a component test.

### Exercises

- **exercise list loads** — click "Add Exercise" → drawer opens with a
  non-empty exercise list.
- **search filters the exercise list** — type "bench press" in the search
  box → only matching exercises (case-insensitive) remain.
- **adding an exercise creates a card with one empty set** — select an
  exercise, click Add → a card with that exercise's name appears, containing
  exactly one set row.
- **creating a brand-new exercise adds it to the list and workout** — in the
  Select Exercise drawer, switch to "create new," enter a unique name, Create
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
  performed this exercise before." if none exist), with each past set's
  effort rating labeled RPE or RIR to match whatever type that historical
  exercise instance used.

### Sets

- **sets can be added** — click "Add Set" on a card → a new empty set row
  appears.
- **sets can be removed** — click the delete icon on a set row → that row is
  removed.
- **invalid characters are rejected in Weight/Reps/effort rating** — attempt
  to type a non-numeric character into each input → the character is not
  accepted (representative check only — exhaustive regex boundary cases
  belong in a component test).
- **estimated one-rep max is calculated and displayed** — enter a
  Weight/Reps/effort rating combination within the eligible range (reps
  1-10, and RPE ≥ 6 or RIR ≤ 4 depending on the exercise's effort rating
  type) → "e1RM: <value>" appears under the set rows.

  > Note: unlike the calculator page, a set row's effort rating input isn't
  > restricted to the e1RM-eligible range — RPE accepts 0-10 in steps of
  > 0.5, and RIR accepts 0-10 as a whole number. Values outside the eligible
  > range (e.g. RPE 5, RIR 6) are accepted but simply excluded from the
  > e1RM calculation.

### Set targets

Targets (a rep range and/or effort rating range) are set in bulk via the
"Set targets" drawer rather than per-set inputs, so a single target can
cover several sets at once.

- **a target can be applied to specific sets** — open the exercise's
  actions menu → "Set targets" → in the drawer, enter min/max reps and
  min/max effort rating, select one set from "Apply to Sets", close the
  drawer → that set's row shows a "Target: <range>" description under its
  Reps and effort inputs; other sets are unaffected.
- **"Apply to all" covers every set, including ones added later** — check
  "Apply to all" on a target → every existing set shows the target
  description; click "Add Set" afterward → the new set inherits the same
  target automatically.
- **adding a second target claims the remaining sets** — with one target
  already applied to some sets, click "Add Target", enter different
  values, and apply it to the remaining set(s) → each set shows its own
  target's range, and sets already claimed by the first target aren't
  selectable for the second.
- **removing a target clears it from its sets** — click "Remove Target" on
  a target row → the row disappears and the sets it covered no longer show
  a target description.
- **a value outside its target range is visually flagged** — enter reps
  below a set's target minimum → the Reps input is shown in a different
  color (representative check only; the full red/green/amber color rules
  for reps vs. effort rating belong in a component test).
- **"Show Targets" hides/shows the target descriptions** — in the
  exercise's Options popover, toggle "Show Targets" off → the
  "Target: ..." descriptions under Reps/effort rating disappear; toggle it
  back on → they reappear.
- **targets persist after reload** — set a target, wait for the autosave
  to complete (or navigate away to flush it), reload the page → the same
  target values and set assignments are still shown.

### Weight unit, effort rating type, & notes

- **weight unit can be switched between lbs and kg** — open the exercise's
  Options popover, toggle the unit → the selected unit persists after
  saving.
- **effort rating type can be switched between RPE and RIR** — open the
  exercise's Options popover, select "RIR" in the Effort Rating Type radio
  group → the sets table's column header changes from "RPE" to "RIR", and
  any effort rating already entered on that exercise's sets is
  automatically converted (e.g. RPE 8 → RIR 2) and reflected in the set
  rows; the new type and converted values persist after saving.
- **exercise notes are saved** — type in the exercise's Notes field, blur
  → autosave persists the change; notes are still present after reload.

### Autosave & finishing

There's no explicit "Save Workout" button for an in-progress workout - edits
persist automatically. See
[frontend-architecture.md](../../docs/frontend-architecture.md) for the full
debounce/flush design; these scenarios only need to check the observable
behavior. Autosave only applies while a workout is unfinished - once it's
finished, edits are no longer saved automatically and require an explicit
save (see below).

- **edits are autosaved** — add an exercise/set, or change an exercise's
  notes/weight unit → a brief "Saving..." indicator appears, and the
  change is still present after a page reload (no toast is shown for a
  routine autosave).
- **an edit made right before navigating away is not lost** — make an
  edit, then immediately click a nav link (before the autosave debounce
  would normally fire) → navigating away flushes the pending save, so the
  edit is persisted (verified by reloading or revisiting the workout).
- **cannot finish a workout with no exercises** — on a workout with no
  exercises added, click "Finish Workout" → "Cannot finish a workout with
  no exercises." warning toast shown, the workout stays unfinished (still
  on the workout page, button still reads "Finish Workout", no `PATCH
  /finish` request is sent).
- **finishing a workout** — add at least one exercise, click "Finish
  Workout" → "Workout finished!" toast, redirected to `/history`, and the
  workout no longer shows an "In Progress" chip there.
- **finishing an already-finished workout with no edits just navigates
  away** — load a previously finished workout without changing anything,
  the action button reads "Finish Editing"; click it → redirected to
  `/history` with no "Workout finished!" toast and no confirmation modal
  (there's nothing new to save).
- **editing a finished workout requires an explicit save** — load a
  previously finished workout, make an edit (e.g. add a set, change
  notes) → no "Saving..." indicator appears and no autosave request is
  sent; the edit only exists in local state until explicitly saved.
- **confirmation modal when updating a finished workout** — on a
  previously finished workout, make an edit, then click "Finish Editing"
  → "Confirm Workout Update" modal appears asking whether to save changes
  to a finished workout; clicking "Save" persists the edit (`PUT
  /api/workouts/{id}`), shows a "Workout saved!" toast, and redirects to
  `/history`. Clicking "Cancel" instead closes the modal without saving -
  the edit remains unsaved and the user stays on the workout page.

### Updating a saved workout (exercise/set removal)

The backend reconciles exercises/sets missing from a `PUT` payload by
removing them - hard-deleted while the workout is still unfinished (e.g.
during autosave), soft-deleted once it's finished - and that distinction is
already covered by backend unit tests. Playwright can't tell a hard delete
from a soft delete (both just make the row disappear from the API/UI), so
these scenarios only confirm the frontend doesn't keep showing
(or resurrect) something the user removed from an in-progress workout.

- **removing an exercise from a saved workout persists after reload** — load
  a saved workout with 2+ exercises, delete one via the actions menu, wait
  for the autosave to complete (or navigate away to flush it immediately),
  then reload the page → the deleted exercise's card is gone, the remaining
  exercise(s) and their sets are unchanged.
- **removing a set from a saved workout persists after reload** — load
  a saved workout where an exercise has 2+ sets, delete one set row, wait
  for the autosave to complete (or navigate away to flush it immediately),
  then reload the page → the deleted set is gone, the remaining set's
  weight/reps/RPE are unchanged.

### Deleting

Every workout - including one just created via "Create New Workout" - is
persisted to the backend immediately (see **Entry point** above), so there
is no separate "cancel an unsaved workout" flow anymore; the action button
is always labeled "Delete Workout", which opens the shared
`ConfirmationModal` component (also used for the finished-workout update
confirmation above).

- **deleting a workout removes it** — click "Delete Workout", confirm in
  the modal → "'<title>' was deleted" toast, redirected to
  `/workout/new-workout`, workout no longer appears in history. This
  applies whether the workout is still in progress or already finished -
  the backend hard-deletes an unfinished workout and soft-deletes a
  finished one, but that distinction isn't observable via Playwright, so
  it isn't covered here (see backend unit tests instead).

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
  account's history across runs. This now applies even to tests that only
  click "Create New Workout" and never click "Finish Workout" - the
  backend record is created immediately via autosave, not just on an
  explicit save/finish action.
- The backend only allows one in-progress (unfinished) workout per user at
  a time, and visiting `/workout/new-workout` doesn't create a second one
  if an unfinished workout already exists - it loads the existing one
  instead (see **Entry point**). Each test must finish or delete any
  workout it leaves in progress before the next test runs, which is part
  of why this suite runs with Playwright's `serial` mode (contrast with
  the read-only suite in [history.md](history.md)).