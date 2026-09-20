# Auth Setup

**Spec file:** [`tests/auth.setup.ts`](../tests/auth.setup.ts)
**Project:** `setup`
**Preconditions:** `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` set (see [.env.example](../.env.example))

## Purpose

Not a user-facing flow — logs in once with the dedicated Playwright test
account and saves the authenticated session to `playwright/.auth/user.json`.
The `chromium`/`firefox`/`webkit` projects depend on this and reuse the saved
state, so authenticated tests never have to log in themselves.

## Scenarios

- **authenticate** — fill email/password on `/login`, submit, land on `/`,
  save storage state.
