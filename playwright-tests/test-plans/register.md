# Register Form Validation

**Spec file:** [`tests/unauthenticated/register.spec.ts`](../tests/unauthenticated/register.spec.ts)
**Project:** `unauthenticated`
**Preconditions:** None — starts logged out, no dependency on `setup`

## Purpose

Covers client- and server-side validation errors on the signup form
(`#signup-form` on the "Sign up" tab of `/login`).

## Scenarios

- **shows required field errors when submitted empty** — submit with no
  input → "Email is required.", "First name is required.", "Last name is
  required.", "Password is required." shown under their respective fields.
- **shows an error when passwords do not match** — fill valid fields but
  mismatch password/confirm password → "Passwords do not match." shown.
- **shows an error when the password is too short** — password under 6
  characters → "Password must be at least 6 characters" shown.
- **rejects a malformed email address** — submit an invalid email format →
  API rejects it, "Invalid email address" shown, stays on `/login`.
