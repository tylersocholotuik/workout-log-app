# Home Page (Authenticated)

**Spec file:** [`tests/home.spec.ts`](../tests/home.spec.ts)
**Projects:** `chromium`, `firefox`, `webkit`
**Preconditions:** Authenticated (reuses storage state from the `setup` project)

## Purpose

Smoke test proving the saved auth state is actually reused — navigating
straight to `/` without logging in should already show a signed-in nav.

## Scenarios

- **home page shows signed-in nav** — go to `/`, expect the "User Actions"
  menu trigger to be visible (rather than a "Login" link).
