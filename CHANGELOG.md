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

[Unreleased]: https://github.com/tylersocholotuik/workout-log-app/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.2
[1.1.1]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.1
[1.1.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.1.0
[1.0.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.0.0
