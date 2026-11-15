# Home Page (Authenticated)

**Spec file:** [`tests/home.spec.ts`](../tests/home.spec.ts)
**Projects:** `chromium`, `firefox`, `webkit`
**Preconditions:** Authenticated (reuses storage state from the `setup` project)

## Purpose

Smoke test proving the saved auth state is actually reused — navigating
straight to `/` without logging in should already show a signed-in nav.
The navbar has no direct Login/Logout links; both live behind the user
menu trigger ("User Actions"), whose dropdown offers "Login" when signed
out and "Account"/"Logout" when signed in.

## Scenarios

- **home page shows signed-in nav** — go to `/`, expect the "User Actions"
  menu trigger to be visible, then open it → "Account" and "Logout" menu
  items are shown and there is no "Login" item (which is what a signed-out
  visitor would see).
