# Login Form Validation

**Spec file:** [`tests/unauthenticated/login.spec.ts`](../tests/unauthenticated/login.spec.ts)
**Project:** `unauthenticated`
**Preconditions:** None — starts logged out, no dependency on `setup`

## Purpose

Covers client- and server-side validation errors on the login form
(`#password-login-form` on `/login`). Kept out of the authenticated
projects since `AuthProvider` redirects already-signed-in users away from
`/login`.

## Scenarios

- **shows required field errors when submitted empty** — submit with no
  input → "Email is required.", "Password is required." shown under their
  respective fields.
- **shows an error for invalid credentials** — submit a non-existent
  email/password combo → "Invalid email or password" shown, stays on
  `/login`.
- **rejects a malformed email address** — submit an invalid email format →
  API rejects it, "Invalid email address" shown under the inputs, stays on
  `/login`.
