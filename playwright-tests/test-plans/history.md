# Workout History

**Spec file:** [`tests/history.spec.ts`](../tests/history.spec.ts)
**Project(s):** `chromium`, `firefox`, `webkit` (local only - see [workout.md](workout.md) re: webkit + staging)
**Preconditions:** Authenticated (reuses storage state from the `setup-<browser>` project)

## Purpose

Covers viewing, filtering by date range, and grouping on `/history`. Unlike
`workout.spec.ts`, these tests are read-only against a shared fixture set of
workouts rather than each test creating/deleting its own - see **Test data &
cleanup** below.

## Scenarios

### Viewing history

- **history page loads existing workouts** — go to `/history` → a card is
  shown for each fixture workout, newest first.
- **workout card shows correct summary info** — a known fixture workout's
  card shows its title, full formatted date, notes (if any were set), and a
  list item for each of its exercises.
- **"View/Edit" navigates to the workout** — click "View/Edit" on a known
  workout's card → navigates to `/workout/<id>` showing that workout.

### Filtering by date range

- **default date range covers every workout** — open the "Filtering/Grouping"
  popover → the date range picker defaults to [oldest fixture workout's date,
  newest fixture workout's date]; all fixture workouts are visible.
- **narrowing the range filters the list** — set the date range to only
  include one fixture workout's date → only that workout's card is shown,
  the others disappear.
- **a range with no matches shows "No Workouts"** — set the date range to a
  period with none of the fixture workouts in it → "No Workouts" message is
  shown, no cards.
- **"Reset" restores the full range** — after narrowing, click "Reset" → all
  fixture workouts reappear.

### Grouping

- **grouping by month** — select "Month" → workouts are grouped under
  headings matching their month and year (e.g. "September 2026"); each
  group only contains workouts from that month.
- **grouping by week** — select "Week" → workouts are grouped under headings
  representing their Sunday-Saturday week range; each group only contains
  workouts from that week.
- **switching back to "None" removes grouping** — after grouping by
  month/week, select "None" → cards return to a flat, ungrouped grid (no
  section headings).

## Test data & cleanup

The filtering/grouping behavior can't be verified with only one workout, and
this page doesn't mutate anything, so instead of the per-test create/delete
pattern used in `workout.spec.ts`, this file builds one shared fixture set
of workouts in a `test.beforeAll` and deletes them all in a `test.afterAll`:

- At least 4 workouts, spanning **3+ distinct weeks across 2+ distinct
  months**, so both "group by week" and "group by month" produce multiple,
  clearly distinct groups.
- Each fixture workout gets a unique, recognizable title (e.g.
  `E2E History <label> <timestamp>`) and at least one distinct exercise, so
  scenarios can assert on a *specific* known workout rather than just a
  count.
- Since these tests only read data, they can run in parallel with each other
  (no need for the `serial` mode used in `workout.spec.ts`) as long as the
  fixture is fully created before any test starts.
- Dates are set via the workout details modal's date picker (same
  `setWorkoutDate` pattern already used in `workout.spec.ts`), not crafted
  via a raw API payload, to stay consistent with how the rest of the suite
  builds test data.
