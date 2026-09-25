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

[Unreleased]: https://github.com/tylersocholotuik/workout-log-app/compare/v1.1.3...HEAD
[1.1.3]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.3
[1.1.2]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.2
[1.1.1]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.1
[1.1.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.0
[1.0.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.0.0
