# Contributing to workout-log-app

Thanks for your interest in this project! This is primarily a solo/portfolio
project, but suggestions, bug reports, and pull requests are welcome. This
guide covers the conventions to follow when contributing.

## Before you start

Skim the relevant docs in [`docs/`](docs) before making changes so your
contribution fits the existing patterns rather than introducing a new one:

| If you're touching... | Read |
| --- | --- |
| The database/EF Core models | [`docs/database-design.md`](docs/database-design.md) |
| Backend (Controllers/Services/DTOs) | [`docs/backend-architecture.md`](docs/backend-architecture.md), [`docs/api-reference.md`](docs/api-reference.md) |
| Frontend (pages/components) | [`docs/frontend-architecture.md`](docs/frontend-architecture.md) |
| Deployment/hosting config | [`docs/infrastructure.md`](docs/infrastructure.md), [`docs/ci-cd.md`](docs/ci-cd.md) |

For local setup, see [`docs/development-guide.md`](docs/development-guide.md).

## Branching & commits

- Branch off `main`, open a PR back into `main`.
- **Conventional Commits** are preferred for commit messages and PR titles,
  e.g. `feat: add exercise history filter`, `fix: correct 1RM rounding at
  RPE 10`, `docs: update API reference for admin endpoint`,
  `refactor: extract set validation into a shared helper`. This isn't
  enforced by CI today, but keeping to it makes history easier to scan and
  keeps the door open for automated changelog/release tooling later.
- Keep PRs focused on one change/feature where reasonably possible.

## Every PR: update the changelog

Add an entry under the **`[Unreleased]`** section at the top of
[`CHANGELOG.md`](CHANGELOG.md), following the existing
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format already used
throughout the file:

- Use the standard categories as needed: `Added`, `Changed`, `Fixed`,
  `Removed`, `Deprecated`, `Security`.
- Write one bullet per notable change, in the same style as existing
  entries (past tense, specific enough to know what changed and why without
  re-reading the diff — e.g. "Added `DELETE /api/admin/workouts`
  (`AdminController`), which hard-deletes all workouts... belonging to a
  user by email.").
- Skip the changelog for changes with no user- or developer-facing effect
  (typo fixes in comments, CI tweaks with no behavior change, etc.) — use
  judgment.
- Don't assign a version number or move anything out of `[Unreleased]`
  yourself; that happens at release time.

## Cutting a release

Deployment happens automatically on every merge to `main`, so cutting a
release is really just a changelog bookkeeping step and isn't tied to when
a deploy happens.

- Contributors keep adding entries to `[Unreleased]` in every PR as described
  above.
- After a set of changes has been deployed, the project admin moves the
  `[Unreleased]` entries into a new dated version section (e.g. `[1.4.0] -
  2025-01-01`) and pushes that commit directly to `main`, bypassing the
  normal PR process.

## Backend changes

Follow the layering described in
[`backend-architecture.md`](docs/backend-architecture.md#layering-controller--service--dbcontext):
Controllers handle HTTP concerns only, Services own business logic/DB
access, and any new request/response shape gets its own DTO record in
`DTOs/` (with a `FromX` mapping factory if it wraps an entity).

- **New services or endpoints:** add unit tests (`WorkoutLogAPI.Tests/Services`)
  for the new business logic, and integration tests
  (`WorkoutLogAPI.Tests/Integration`) covering the new endpoint's happy path
  and its main error responses (validation, not found, unauthorized, etc.).
- **Changes to existing behavior:** update the existing tests that cover
  it if the change is significant enough to affect their expected outcome
  (a pure refactor with no behavior change usually doesn't need test
  changes, just confirmation the existing tests still pass).
- Before opening a PR, run the full suite from `backend/WorkoutLogAPI` and
  make sure everything passes:

  ```bash
  dotnet test
  ```

  (See [`development-guide.md`](docs/development-guide.md#5-running-backend-tests)
  — integration tests need Docker running, since they use Testcontainers.)

## Frontend changes

Use HeroUI components and Tailwind utility classes for UI/styling — reach
for custom CSS/components only when HeroUI genuinely can't do what you need,
to keep the UI visually consistent (see
[`frontend-architecture.md`](docs/frontend-architecture.md#uistyling-conventions)).

- **New features/flows:** add a test plan under
  [`playwright-tests/test-plans/`](playwright-tests/test-plans) (copy
  `TEMPLATE.md`) before writing the spec, then implement the spec itself —
  see the
  [test development workflow](playwright-tests/README.md#test-development-workflow)
  for the full loop, including the `/develop-playwright-test` prompt.
- **Changes to existing features:** update the corresponding test plan and
  spec if the change affects existing scenarios (e.g. a changed field,
  button, or flow) so they don't silently drift out of sync with the app.
- Before opening a PR, from `frontend/`:

  ```bash
  npm run lint
  npm run build
  ```

  and, with both the backend and frontend running locally, run the
  Playwright suite from `playwright-tests/`:

  ```bash
  npm test
  ```

  Make sure everything passes before opening the PR — this applies whether
  your change touched the frontend, the backend, or both, since either can
  break end-to-end behavior.

## Documentation

Documentation updates belong in the **same PR** as the code change that
makes them necessary, not a follow-up PR. Docs written while the change is
fresh in your head are far more likely to be accurate than docs written
later from a diff, and a separate "docs PR" tends to get deprioritized and
never happen. The one exception is a standalone documentation
overhaul/addition that isn't tied to a specific code change — that's
reasonably its own PR.

Once your change is working and tested, check whether it needs a
documentation update before opening the PR:

- New/changed API endpoint or DTO shape → [`docs/api-reference.md`](docs/api-reference.md)
- New/changed table, column, or relationship → [`docs/database-design.md`](docs/database-design.md)
- New/changed backend pattern, middleware, or config setting →
  [`docs/backend-architecture.md`](docs/backend-architecture.md),
  [`docs/development-guide.md`](docs/development-guide.md)
- New/changed page, component pattern, or dependency →
  [`docs/frontend-architecture.md`](docs/frontend-architecture.md)
- New/changed deploy step, environment, or secret →
  [`docs/ci-cd.md`](docs/ci-cd.md), [`docs/infrastructure.md`](docs/infrastructure.md)
- New/changed user-facing page or feature worth showing off →
  the [Pages section](README.md#pages) of `README.md`, including a
  screenshot if it's visual

Not every PR touches documentation — plenty of changes (bug fixes,
refactors, test-only changes) don't describe anything these docs cover. Use
judgment, but default to updating docs in the same PR when in doubt.

## Pull request checklist

Opening a PR pre-fills a checklist (from
[`.github/pull_request_template.md`](.github/pull_request_template.md))
covering the points above — commit style, changelog, tests, manual
verification, and documentation. Work through it before requesting review.

CI (see [`docs/ci-cd.md`](docs/ci-cd.md)) re-runs backend/frontend checks
automatically on every PR, but running them locally first saves round-trips
waiting on CI.
