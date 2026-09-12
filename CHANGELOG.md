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

[Unreleased]: https://github.com/tylersocholotuik/workout-log-app/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tylersocholotuik/workout-log-app/releases/tag/v1.0.0
