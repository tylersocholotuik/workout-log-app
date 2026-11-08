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
- **exercise type filter narrows the list** — expand the "Exercise Types"
  accordion above the search box (all four types are checked by default)
  and uncheck all but one type (e.g. leave only "Distance/Time" checked) →
  only exercises of the remaining checked type(s) are shown; re-checking a
  type brings its exercises back.
- **adding an exercise creates a card with one empty set** — select an
  exercise, click Add → a card with that exercise's name appears, containing
  exactly one set row whose fields match the exercise's type (see
  **Exercise types** below).
- **creating a brand-new exercise adds it to the list and workout** — in the
  Select Exercise drawer, switch to "create new," enter a unique name,
  choose an Exercise Type from the dropdown (Weight/Reps, Weight/Time,
  Weight/Distance, or Distance/Time — defaults to Weight/Reps), Create →
  success toast with an "Add" action; clicking it adds the new exercise to
  the workout with a card matching the chosen type.
- **duplicate exercise names are rejected** — try to create a new exercise
  using an existing exercise's name → "Exercise name '<name>' already
  exists." shown.
- **exercise can be swapped** — open the exercise card's actions menu →
  "Change exercise" → select a different exercise of the *same* type → card
  header updates to the new exercise, sets are preserved. Swapping to an
  exercise of a *different* type instead resets every set on the card to
  empty (its old set data may not apply to the new type) and resets the
  weight/distance unit to the new type's defaults.
- **exercise can be removed** — open the actions menu → "Delete exercise" →
  card is removed from the workout.
- **exercise history is viewable** — open the actions menu → "Exercise
  history" → modal opens showing past performances (or "You have not
  performed this exercise before." if none exist); each past set's
  description matches the historical exercise's type (e.g. "135 lbs x 8
  reps @ RPE 8" for `reps`, "500 m @ RPE 6" for `distance`, "0:45 @ RPE 7"
  for `time`, "1.5 km, 10:00 @ RPE 5" for `cardio`), with effort rating
  labeled RPE or RIR to match whatever type that historical exercise
  instance used.

### Exercise types

Every exercise has one of four types, fixed at creation (see **Exercises**
above), which determines which fields appear on its sets, targets, and
history:

| Type (label) | Set fields | Weight unit | Distance unit |
| --- | --- | --- | --- |
| `reps` (Weight/Reps) | Weight, Reps | lbs/kg | — |
| `time` (Weight/Time) | Weight, Duration (mm:ss) | lbs/kg | — |
| `distance` (Weight/Distance) | Weight, Distance | lbs/kg | m/km/mi |
| `cardio` (Distance/Time) | Distance, Duration (mm:ss) | — | m/km/mi |

Every type also has an effort rating (RPE or RIR) field and column.

- **set rows and column headers match the exercise's type** — add one
  exercise of each type (e.g. a `reps` exercise like "Bench Press", a
  `time` exercise like "Plank", a `distance` exercise like "Farmers Walk",
  and a `cardio` exercise like "Running") → each card's column headers and
  set inputs match the table above - a `cardio` exercise has no Weight
  input (its first column is Distance instead), and `time`/`cardio`
  exercises show a single Duration input split into minutes and seconds
  rather than Weight/Distance's single numeric field.
- **invalid characters are rejected across set input types** — attempt to
  type a non-numeric character into the Weight, Reps, Distance, Duration,
  and effort rating inputs (whichever apply to the exercise's type) → the
  character is not accepted (representative check only — exhaustive regex
  boundary cases belong in a component test).
- **RIR is only available as an effort rating type for `reps` exercises**
  — in the Options popover for a `time`, `distance`, or `cardio` exercise,
  there's no Effort Rating Type control at all (effort rating is always
  RPE); for a `reps` exercise it's present and still toggles RPE/RIR (see
  **Weight unit, distance unit, effort rating type, & notes** below).
- **weight/distance unit controls match the type** — in the Options
  popover, `reps`/`time`/`distance` exercises show a Weight Unit toggle
  (lbs/kg); `distance`/`cardio` exercises also show a Distance Unit toggle
  (m/km/mi); a `cardio` exercise has no Weight Unit toggle at all (it has
  no weight field).

### Sets

- **sets can be added** — click "Add Set" on a card → a new empty set row
  appears.
- **sets can be removed** — click the delete icon on a set row → that row is
  removed.
- **estimated one-rep max is calculated and displayed for `reps`
  exercises** — on a `reps` exercise, enter a Weight/Reps/effort rating
  combination within the eligible range (reps 1-10, and RPE ≥ 6 or RIR ≤ 4
  depending on the exercise's effort rating type) → "e1RM: <value>" appears
  under the set rows. `time`, `distance`, and `cardio` exercises never show
  an e1RM (their Options popover doesn't even offer the "Show e1RM" toggle
  — see **Exercise types** above).

  > Note: unlike the calculator page, a set row's effort rating input isn't
  > restricted to the e1RM-eligible range — RPE accepts 0-10 in steps of
  > 0.5, and RIR accepts 0-10 as a whole number. Values outside the eligible
  > range (e.g. RPE 5, RIR 6) are accepted but simply excluded from the
  > e1RM calculation.

### Set targets

Targets (a reps/distance/duration range depending on the exercise's type,
and/or an effort rating range) are set in bulk via the "Set targets" drawer
rather than per-set inputs, so a single target can cover several sets at
once. Which range field(s) appear in the drawer depends on the exercise's
type - Min/Max Reps for `reps`, Min/Max Distance for `distance`, Min/Max
Duration (mm:ss) for `time`, and both Min/Max Distance and Min/Max Duration
for `cardio` - every type also gets a Min/Max effort rating field (labelled
RPE or RIR to match the exercise's effort type). Rather than a per-row text
description, a set's assigned target is surfaced as a small target icon
next to the relevant column's header (Reps/Distance/Duration, and effort
rating); hovering or clicking it opens a tooltip listing the range per
group of sets, e.g. "Set 1: 8-10", "Sets 2-4: >= 5".

- **a target can be applied to specific sets** — open a `reps` exercise's
  actions menu → "Set targets" → in the drawer, enter min/max reps and
  min/max effort rating, select one set from "Apply to Sets", close the
  drawer → the target icon next to the Reps and effort rating column
  headers shows a tooltip with that set's range (e.g. "Set 1: 8-10"); sets
  not covered by any target aren't included in the tooltip.
- **"Apply to all" covers every set, including ones added later** — check
  "Apply to all" on a target → the tooltip shows one line covering every
  existing set; click "Add Set" afterward → the new set inherits the same
  target automatically and is included in that line.
- **adding a second target claims the remaining sets** — with one target
  already applied to some sets, click "Add Target", enter different
  values, and apply it to the remaining set(s) → the tooltip shows a
  separate line per target's sets and range, and sets already claimed by
  the first target aren't selectable for the second.
- **removing a target clears it from its sets** — click "Remove Target" on
  a target row → the row disappears and the target icon's tooltip no
  longer lists the sets it covered (the icon disappears entirely once no
  target remains for that column).
- **a value outside its target range is visually flagged** — enter reps
  below a set's target minimum → the Reps input is shown in a different
  color (representative check only; the full red/green/amber color rules
  for reps/distance/duration vs. effort rating belong in a component
  test).
- **"Show Targets" hides/shows the target icons** — in the exercise's
  Options popover, toggle "Show Targets" off → the target icons next to
  the column headers disappear; toggle it back on → they reappear.
- **targets persist after reload** — set a target, wait for the autosave
  to complete (or navigate away to flush it), reload the page → the same
  target values and set assignments are still shown in the tooltip.
- **non-`reps` exercises get distance/duration targets instead of reps**
  — open a `cardio` exercise's "Set targets" drawer → Min/Max Distance and
  Min/Max Duration fields are shown instead of Min/Max Reps; apply a
  distance and duration target to a set → the target icons next to the
  Distance and Duration column headers both show that set's respective
  range (representative check only — `time` and `distance` exercises
  follow the same pattern with just one of the two fields).

### Weight unit, distance unit, effort rating type, & notes

- **weight unit can be switched between lbs and kg** — open the exercise's
  Options popover, toggle the unit → the selected unit persists after
  saving. Not shown for `cardio` exercises, which have no weight field
  (see **Exercise types** above).
- **distance unit can be switched between m/km/mi** — on a `distance` or
  `cardio` exercise, open the Options popover, toggle the Distance Unit
  radio group → the selected unit persists after saving and is reflected
  next to the Distance input. Not shown for `reps` or `time` exercises,
  which have no distance field.
- **effort rating type can be switched between RPE and RIR (`reps`
  exercises only)** — open a `reps` exercise's Options popover, select
  "RIR" in the Effort Rating Type radio group → the sets table's column
  header changes from "RPE" to "RIR", and any effort rating already
  entered on that exercise's sets is automatically converted (e.g. RPE 8 →
  RIR 2) and reflected in the set rows; the new type and converted values
  persist after saving. `time`, `distance`, and `cardio` exercises have no
  Effort Rating Type control at all - their effort rating is always RPE.
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