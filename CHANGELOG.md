# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions are tagged once per release and apply to the monorepo as a whole
(frontend and backend share a single version number), even when a given
release only changes one of the two projects. This is a git-tag-and-changelog
convention only — `frontend/package.json` and the backend `.csproj` are
intentionally left alone and are not bumped alongside releases, since editing
either would touch files inside a deploy-triggering path (Vercel's Ignored
Build Step / Render's build context) and cause a rebuild with no actual code
change behind it.

## [Unreleased]

### Fixed

- Fixed the "Apply to all" checkbox in the "Set targets" drawer intermittently failing to stay
  checked (or unchecked) on mobile browsers (iOS Safari and Chrome), requiring several taps to
  stick. The underlying state was always correct; a mobile WebKit quirk around controlled
  checkboxes was preventing the checked visual from repainting. The checkbox now remounts
  whenever its value changes, forcing the repaint.

## [1.10.0] - 2026-10-25

### Added

- Added optional target rep and effort ranges per set (`targetRepsMin/Max`, `targetEffortMin/Max`),
  editable in bulk across multiple sets via a new "Set targets" drawer on the exercise card.
- Added colour-coded reps/effort values in the sets table (red/green for reps, amber for effort)
  when actual values fall outside their set's target range.

### Changed

- Production deploys no longer require `e2e-staging` to pass (they still wait for it to finish);
  the required reviewer on the `production` environment decides based on the E2E results.
- Removed the non-functional "Upload Playwright report" step from `deploy.yml` (the `line`
  reporter doesn't generate an HTML report, so there was nothing to upload).
- Refactored exercise-card target/effort-type state into a new `WorkoutExerciseContext` /
  `WorkoutExerciseProvider` to avoid prop-drilling into `SetsTableRow`/`TargetsDrawer`.

## [1.9.1] - 2026-10-24

### Fixed

- Fixed `SyncSets` reusing an existing set's identity for brand-new sets (submitted with `id: 0`)
  when more than one new set was added to the same exercise in a single save request, causing only
  one of them to actually persist.
- Added explicit `.OrderBy(Id)` to the `Exercises`/`Sets` query includes in `WorkoutService`, since
  SQL/EF Core do not guarantee row order without it; previously sets/exercises could come back in an
  unstable order.
- Fixed a stale-state bug in `SetsTableRow` where the `weight` and `reps` inputs weren't resynced
  when their underlying `set` prop changed, so deleting a set (which shifts the remaining sets'
  indices) made it look like the last set was always the one removed, regardless of which delete
  button was pressed.

## [1.9.0] - 2026-10-12

### Added

- Added a reusable `ConfirmationModal` component (`frontend/components/shared/ConfirmationModal.tsx`),
  replacing the one-off `DeleteWorkoutModal` and `LogoutModal`.

### Changed

- Autosave is now disabled once a workout is finished, since persisting every edit automatically no
  longer makes sense when an editing mistake can no longer be undone. Edits to a finished workout must
  now be saved manually via the 'Finish Editing' button, which shows a confirmation modal before saving.
- `UpdateWorkout` now hard-deletes exercises/sets removed from a workout while it's still unfinished,
  instead of soft-deleting them; soft-delete is still used once a workout has been finished so its
  history is preserved. `DeleteWorkout` follows the same rule: an unfinished workout is now hard-deleted
  entirely, while a finished workout continues to be soft-deleted.
- Updated `docs/api-reference.md` and `docs/database-design.md` to document the new
  finished/unfinished-dependent delete behavior, and updated the README's workout page description to
  reflect autosave and the new manual-save/confirmation flow for finished workouts.

### Fixed

- Fixed a bug where navigating from a finished workout straight into starting a new workout could load
  the previously viewed workout's stale data, causing autosave to fail with a duplicate title/date error.
- Fixed a race condition where a pending autosave timer could still fire after a workout was deleted,
  sending an update request for the now-deleted workout and surfacing a "Workout Not Found" error toast.

## [1.8.0] - 2026-10-12

### Added

- Added support for logging effort as RIR (Reps in Reserve) as an alternative to RPE. A new
  `workout_exercises.effort_type` column (`rpe`/`rir`, default `rpe`) determines which scale applies
  to every set on that exercise, since switching scales mid-exercise doesn't make sense (mirrors the
  existing per-exercise `weight_unit` design).
- Added an RPE/RIR toggle to the exercise card and the 1RM calculator; toggling converts any entered
  value to the equivalent rating and updates the calculator's data table to show a single, correctly
  labeled column instead of both scales side by side.
- Added `IValidatableObject`-based validation on `WorkoutExerciseDto` to enforce effort-rating
  range/step rules (0.5 steps for RPE, whole numbers for RIR) that depend on the exercise's
  `effortType`, replacing the old single-scale `RpeRangeAttribute`.
- Added shared `handleInputChange`/`stripLeadingZeros`/`sanitizeDisplayValues` helpers
  (`utils/inputHandlers.ts`) for numeric input validation and blur-time cleanup, used by both the
  workout editor and the calculator.

### Changed

- Renamed `sets.rpe` to `sets.effort_rating` (backend, frontend types/factories, and API payloads)
  to reflect that the column now holds either an RPE or RIR value.
- Updated the calculator and exercise-history display to show the active effort-rating type
  (RPE or RIR) instead of assuming RPE.

## [1.7.0] - 2026-10-11

### Added

- Added a `SelectExerciseDrawer.tsx` component to replace `SelectExerciseModal.tsx`. 
  This new component provides a better user experience on mobile devices by avoiding issues with the virtual keyboard pushing up the modal.

### Changed

- Updated `[workoutId].tsx` to use the new `SelectExerciseDrawer` instead of the old modal.
- Improved the search algorithm in the Select Exercise Drawer to ignore the order of the words in the 
  filter value. For example, "inc bench" will now match "Bench Press (Incline)".

### Removed

- Removed the `SelectExerciseModal.tsx` component.

## [1.6.0] - 2026-10-10

### Added

- Added a nullable `FinishedAt` column to `Workouts` (with a backfill
  migration), marking whether a workout is finished or still in progress.
- Added `GET /api/workouts/active` and `PATCH /api/workouts/{id}/finish`
  endpoints, `WorkoutService.GetActiveWorkout`/`FinishWorkout`, and
  `ActiveWorkoutExistsException`/`DuplicateWorkoutException` to prevent
  starting a second workout while one is already in progress.
- Added `finishedAt` to `WorkoutDto` and the frontend `Workout` type/factory.
- Added `getActiveWorkout`/`finishWorkout` API calls.
- Added autosave to the workout editor: edits are debounced and saved
  automatically, in-progress workouts resume automatically when returning
  to `/workout/new-workout`, and a "Saving..." indicator shows while a save
  is pending.
- Added an "In Progress" chip to `WorkoutCard` for unfinished workouts.

### Changed

- `GetUserWorkouts` and the `["workouts"]` query cache now sort in-progress
  workouts first, ahead of the date-based sort.
- Replaced ad hoc error handling in `lib/api/auth.ts`/`exercises.ts` with
  `throwApiError`.
- Refactored integration test HTTP helpers to share a single `SendAsync`
  method.
- Documented the active/finish workout endpoints and the frontend autosave
  architecture across `api-reference.md`, `backend-architecture.md`,
  `database-design.md`, and `frontend-architecture.md`.

### Removed

- Removed the `CaculatorModal.tsx` component as it is no longer required on the workout page.
  Now that the workout editor is autosaving, the one-rep max calculator can be used directly on the Calculator page without losing any unsaved edits.
- Removed the 1RM Calculator button from the `[workoutId].tsx` page.


## [1.5.4] - 2026-10-08

### Fixed

- Fixed flashing of stale workout data on the History page when navigating back to it after adding,
  editing, or deleting a workout. The mutations in `[workoutId].tsx` previous invalidated the `workouts` query cache,
  but this would not take effect until the next render of the History page, so the old data would flash briefly before the query refetched.
  Now, the `workouts` query is updated directly with `queryClient.setQueryData` after a successful mutation, so the History page sees the new data immediately.
- Sorted the exercises in the Select Exercise Modal after creating a new exercise, 
  so the newly created exercise appears in the list in alphabetical order instead of at the bottom.

## [1.5.3] - 2026-10-08

### Fixed

- Fixed mobile menu not closing when clicking a link in `NavBar.tsx`. This started after 
  using the Next.js router for navigation in `<HeroUIProvider>` instead of plain anchor tags.
  Plain anchor tags caused a full page reload, which reset the mobile menu state. Now that the Next.js router is used, 
  the mobile menu state persists across navigation, so it needs to be closed manually when a link is clicked.

## [1.5.2] - 2026-10-05

### Changed

- Updated the `<HeroUIProvider>` to use the Next.js router for navigation. The default 
  `<Link>` behaviour uses plain anchor tags, which caused full page reloads and lost the 
  TanStack Query cache on navigation.
- Updated `WorkoutList.tsx` to compute the default date range on every render instead of only once on mount, 
  so new workouts are not filtered out of the list now that the page doesn't reload on navigation.

## [1.5.1] - 2026-10-04

### Added

- Added `@tanstack/react-query` and a shared `QueryClient`
  (`frontend/lib/queryClient.ts`) with a global error toast for failed
  queries/mutations (opt-out via `meta: { skipGlobalErrorToast: true }`)
  and a retry policy that skips retrying 4xx errors.
- Added an `ApiError` class and `throwApiError` helper
  (`lib/api/apiErrors.ts`) for status-aware errors. `getWorkout` now
  throws `ApiError` (`status: 403`) for another user's workout instead of
  returning `null`.

### Changed

- Migrated frontend data fetching from manual `useEffect`/`fetch` to
  TanStack Query (`useQuery`/`useMutation`) across `AuthProvider`,
  `history.tsx`, `login.tsx`, `SelectExerciseModal`, `ExerciseCard`,
  `ForgotPasswordModal`/`reset-password.tsx`, and the workout editor
  (`workout/[workoutId].tsx`).
- `AuthProvider.refreshUser` now accepts an optional, already-known `User`
  (e.g. from a login/register response) to write directly into the query
  cache, avoiding a redundant `GET /api/auth/me`.
- `WorkoutList.tsx` now derives its filtered workout list from props on
  each render instead of copying it into state, so it no longer goes
  stale after the underlying query refetches.
- Updated `docs/frontend-architecture.md` to document the TanStack Query
  migration (query-key conventions, cache-update patterns, global error
  handling).

### Fixed

- Fixed a brief flash of stale/default workout content before the "not
  your workout" (403) page appeared on `workout/[workoutId].tsx`.
- Fixed deleting a workout showing a spurious "Workout not found" error
  toast right after the delete success toast, caused by clearing its
  query cache entry while still actively observed.
- Fixed the "duplicate exercise name" error showing twice (toast + inline
  field message) when creating an exercise with an existing name.

## [1.5.0] - 2026-10-04

### Added

- Added `Microsoft.Extensions.Diagnostics.HealthChecks` and
  `Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore` packages
  and registered an EF Core `DbContext` health check (tagged `"ready"`) in
  `Program.cs`.
- Added `GET /healthz/live` — runs no checks, confirming only that the
  process is up and responding. Used by Render to gate traffic to new
  instances.
- Added `GET /healthz/ready` — runs the tagged `DbContext` check to confirm
  real Postgres connectivity. Used by the Playwright E2E `global-setup.ts`
  to wait for staging to be fully ready before tests start.

### Removed

- Removed the `GET /health-check` endpoint, replaced by `/healthz/live` and
  `/healthz/ready`.

### Changed

- Updated `global-setup.ts`, `deploy.yml`, and
  `.github/actions/render-deploy/action.yml` to reference `/healthz/live`/
  `/healthz/ready` instead of the removed `/health-check` endpoint.
- Updated `docs/api-reference.md`, `docs/backend-architecture.md`, and
  `playwright-tests/README.md` to document the new health check endpoints.

## [1.4.0] - 2026-09-26

### Added

- Added `DELETE /api/admin/workouts` (`AdminController`), which hard-deletes all
  workouts (and their exercises/sets) belonging to a user by email. Used to clean up
  Playwright E2E test data after each staging run.
- Added `WorkoutService.HardDeleteUserWorkouts`, to support the new admin endpoint.
- Added an `AdminOnly` authorization policy in `Program.cs` requiring the JWT's
  `is_admin` claim, applied to `AdminController`.
- Gated the endpoint behind a new `AdminEndpoints:HardDeleteTestWorkoutsEnabled`
  config flag (`false` in `appsettings.json`/production, `true` in
  `appsettings.Development.json`) so it can be disabled in production. Returns 404
  when disabled.
- Added `.github/actions/hard-delete-test-workouts` composite action to clean up
  test workouts created by the Playwright E2E tests.
- Added integration tests (`AdminControllerTests`,
  `AdminControllerEndpointDisabledTests`) and a `WorkoutServiceTests` unit test for
  `HardDeleteUserWorkouts`.

### Changed

- Updated the `WorkoutService.DeleteWorkout` method to soft-delete exercises and sets along with the workout.
  It previously only soft-deleted the workout itself, leaving orphaned exercises and sets behind.
- Updated the associated `WorkoutServiceTests` to verify that exercises and sets are soft-deleted.

### Fixed

- Added a `Promote` step to the `.github/actions/vercel-deploy/action.yml` composite action to ensure
  the deployment is promoted to production after a successful merge to `main`. Previously, the action only deployed to
  production but did not promote the deployment, which caused the production URL to point to an older version of the app.

## [1.3.0] - 2026-09-26

### Changed

- Updated home page images in `frontend/public/img` to reflect current Select Exercise Modal and Exercise Card styling.
- Changed the login/register redirect from the home page to the new workout page (`/workout/new-workout`).
- Updated the `auth.setup.ts` Playwright test to expect the new workout page URL after login.

## [1.2.0] - 2026-09-25

### Added

- Added 3 custom validation attributes: `RepsRangeAttribute`, `WeightRangeAttribute`, and `RpeRangeAttribute`
  in `WorkoutLogAPI/Validation` to enforce valid ranges for reps, weight, and RPE values in workout exercises.

### Fixed

- Fixed `deploy-production-backend`/`deploy-production-frontend` in
  `deploy.yml` being silently skipped even when their own conditions
  (`backend_changed`/`frontend_changed`) were true. Their `if:` lacked a
  status check function, so GitHub's implicit default `success()` check
  walked the *entire* upstream dependency chain - including `e2e-staging`'s
  own needs (`deploy-staging-backend`/`deploy-staging-frontend`) - and saw
  the routine, expected skip of whichever staging side didn't change,
  causing production deploys to skip too. Added `always()` plus an explicit
  `needs.e2e-staging.result == 'success'` check, mirroring the pattern
  `e2e-staging` already used for the same reason.

## [1.1.4] - 2026-09-24

### Added

- Added `playwright-tests/scripts/cleanup-test-data.ts` (`npm run
  cleanup:test-data`), a standalone safety net that logs in as the test
  account and deletes any leftover `E2E `-prefixed workouts - useful after
  an interrupted test run, or to periodically confirm staging is clean.
- Added a GitHub Actions CI/CD pipeline (`.github/workflows/`): `ci.yml`
  (reusable) runs backend tests and frontend lint/build, each skipped
  automatically when its respective `backend/**`/`frontend/**` path didn't
  change; `pr-checks.yml` runs these on every pull request; `deploy.yml`
  runs on merge to `main`, deploying whichever side(s) changed to the
  staging Render service/Vercel project (pinned to the merge commit via the
  `render-deploy`/`vercel-deploy` composite actions in `.github/actions/`),
  running the Playwright E2E suite against staging, then deploying to
  production behind a required reviewer approval on a `production` GitHub
  Environment. See `docs/ci-cd.md` for full details.

### Fixed

- Fixed Playwright E2E test workouts never getting cleaned up when run
  against staging - every `deleteWorkoutViaApi` call was silently failing
  with a 401. The auth cookie is scoped to whichever origin the app used to
  log in: on staging that's the frontend's own origin (Next.js proxies
  `/api/*` to the backend there), not the backend's raw domain, so calling
  the backend directly never sent the cookie. Test cleanup now targets the
  same origin the app itself would use (`tests/helpers.ts`). Also replaced
  the "delete as the last line of the test body" pattern - which skipped
  cleanup entirely whenever an earlier assertion failed - with a
  `trackWorkout` fixture (`tests/fixtures.ts`) whose teardown always runs,
  and fixed `history.spec.ts`'s `afterAll` cleanup, which used a request
  context with no auth state at all.
- Fixed `UpdateWorkout` not actually catching a renamed/redated workout that
  collides with another workout.
- Fixed duplicate title/date checks in `CreateWorkout` and `UpdateWorkout`
  blocking on soft-deleted workouts, so a new or renamed workout could no
  longer reuse the title and date of a previously deleted one.
- Fixed `POST /api/workouts` and `PUT /api/workouts/{id}` returning a
  generic 500 for a duplicate title/date instead of a `409 Conflict` with a
  clear error message.

## [1.1.3] - 2026-09-20

### Added

- Added an end-to-end Playwright test suite (`playwright-tests/`) covering
  authentication, workout creation/editing/deletion (including soft-delete
  behavior for removed exercises/sets), workout history filtering and
  grouping, the one-rep max calculator, and login/register form validation.
  Tests run against Chromium, Firefox, and WebKit locally; WebKit is
  excluded when targeting a non-local (e.g. staging) environment due to a
  cross-site cookie limitation. Includes a `README.md` covering setup,
  running tests locally or against staging, and a test-plan-first
  development workflow (`test-plans/`).
- Added the Playwright MCP server to this workspace's VS Code configuration
  (`.vscode/mcp.json`) and a `/develop-playwright-test` Copilot prompt file
  (`.github/prompts/`) that encodes the test suite's conventions and known
  component-library quirks, for implementing new Playwright specs from an
  approved test plan.

### Fixed

- Fixed users on iOS being redirected straight back to the login page
  after authenticating, whenever they navigated to a protected page (e.g.
  `/history`) - reproducible in both Safari and Chrome on iOS, but not on
  any desktop browser. Since the frontend (Vercel) and backend (Render)
  are served from different domains, the `HttpOnly` auth cookie was a
  cross-site cookie, which iOS Safari and Chrome-for-iOS (both built on
  WebKit) block by default via Intelligent Tracking Prevention. The
  frontend now proxies `/api/*` requests to the backend through its own
  origin via a Next.js rewrite (`next.config.ts`, configured with a new
  server-side `BACKEND_API_URL` environment variable), making the auth
  cookie first-party in every environment so it can use `SameSite=Lax`
  instead of `SameSite=None`. `NEXT_PUBLIC_API_URL` is no longer required
  in staging/production - it now defaults to same-origin automatically
  whenever the app is running in a production build.
- Fixed a "your"/"you" typo in the home page's tagline.
- Fixed a typo in the History page's "Filtering/Grouping" popover trigger
  button (previously read "Filering/Grouping").
- Fixed a typo ("exisiting" → "existing") in the footer's disclaimer text.

## [1.1.2] - 2026-09-19

### Added

- Added a `WorkoutLogAPI.Tests` xUnit project covering the most important
  backend logic: authentication and account lockout, JWT generation/
  revocation/refresh, password reset, and workout/exercise service business
  rules.
- Added an integration test suite (`WorkoutLogAPI.Tests/Integration`) that runs
  the API in-process against a real, ephemeral PostgreSQL instance
  (via Testcontainers) and exercises the auth, exercise, and workout
  controllers end-to-end over HTTP.

### Fixed

- Fixed `WorkoutService` not soft-deleting a removed exercise's `Set` rows
  along with the exercise itself, which could leave orphaned, non-deleted
  sets behind after a workout update.
- Fixed `GET /api/workouts/{id}` returning a 500 error instead of a 403 when
  requested for a workout belonging to another user. `WorkoutService` now
  distinguishes a missing workout (404) from one owned by a different user
  (403), and the frontend workout page was updated to detect the 403
  response directly instead of relying on an unauthenticated client-side
  `userId` comparison that no longer applied once the API stopped returning
  other users' workout data.

### Changed

- Marked `EmailService.SendEmailAsync` as `virtual` so it can be mocked in
  unit tests; no behavior change.

## [1.1.1] - 2026-09-13

### Fixed

- Workout dates were stored and transmitted as UTC timestamps, which could
  cause a workout saved late at night to display or be grouped under the
  wrong calendar day depending on the user's timezone. Workout dates are
  now handled as plain calendar dates end-to-end, removing any dependency
  on time-of-day or timezone conversion.

### Changed

- Changed `Workout.Date` from `DateTime` (`timestamp with time zone`) to
  `DateOnly` (`date`) in the database schema and the `WorkoutDto`/
  `ExerciseHistoryDto` API contracts. Existing workout dates were backfilled
  by re-interpreting their stored UTC instants in the Alberta timezone they
  were originally created in.
- Changed the frontend `Workout.date` type from `Date` to a `YYYY-MM-DD`
  string, and added `frontend/utils/workoutDate.ts` with shared helpers for
  parsing, formatting, and comparing workout dates.

## [1.1.0] - 2026-09-13

### Security

- Migrated JWT auth storage from a JS-readable cookie to a backend-set
  `HttpOnly` cookie, eliminating the token as an XSS exfiltration target.
  Cross-site request forgery is mitigated via strict CORS, a required
  custom `X-Requested-With` header on all state-changing requests, and
  environment-aware cookie flags (`SameSite=Lax`/`Secure=false` in
  development, `SameSite=None`/`Secure=true` in production).

### Changed

- Extracted user registration and login business logic out of
  `AuthController` and into `AuthService`, keeping the controller focused
  on HTTP concerns (status codes, cookie issuance).

### Removed

- `frontend/lib/api/tokenStorage.ts` file that contained cookie helper functions.
  Cookies are now issued and read by the backend.

## [1.0.0] - 2026-09-12

This is the first formally tracked release. The project predates this
changelog, so earlier history (including the original Node.js backend) is
not itemized here — this entry describes the state of the app as of this tag.

### Added

- ASP.NET Core 10 Web API backend, replacing the original Node.js backend.
- JWT-based authentication with refresh tokens, sliding expiration, and
  server-side revocation on logout.
- Password reset flow with transactional email delivery via the Brevo API.
- Workout and exercise logging endpoints backed by PostgreSQL via EF Core.
- Next.js 16 frontend with HeroUI components.
- Docker-based deployment pipeline for the backend on Render, including a
  `/health` endpoint for platform health checks.
- Database migrations and idempotent seed data for local/dev environments.

[Unreleased]: https://github.com/tylersocholotuik/workout-log-app/compare/v1.10.0...HEAD
[1.10.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.10.0
[1.9.1]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.9.1
[1.9.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.9.0
[1.8.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.8.0
[1.7.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.7.0
[1.6.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.6.0
[1.5.4]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.5.4
[1.5.3]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.5.3
[1.5.2]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.5.2
[1.5.1]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.5.1
[1.5.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.5.0
[1.4.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.4.0
[1.3.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.3.0
[1.2.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.2.0
[1.1.4]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.4
[1.1.3]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.3
[1.1.2]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.2
[1.1.1]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.1
[1.1.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.0
[1.0.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.0.0
