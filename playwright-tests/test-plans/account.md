# Account Settings

**Spec file:** [`tests/account.spec.ts`](../tests/account.spec.ts)
**Project(s):** `chromium`, `firefox`, `webkit`
**Preconditions:** Authenticated (reuses storage state from the `setup` project)

## Purpose

Covers the three tabs on `/account` - Profile, Preferences, and Security -
including client-side form validation on all three, and persistence of
profile/preference changes across reloads. Password change is only
exercised as far as its validation and confirmation step; see **Password
change caveat** below for why the flow is never actually completed. Email
change is similarly only exercised as far as its confirmation modal; see
the note under **Profile tab** below for why it's never actually
confirmed.

## Scenarios

### Profile tab (`#profile-form`)

- **shows required field errors when submitted empty** — clear Email,
  First Name, and Last Name, submit → "Email is required.", "First name is
  required.", "Last name is required." shown under their respective
  fields. Display Name is optional, so no error for it.
- **rejects a malformed email address** — enter an invalid email format,
  submit → "Invalid email address." shown.
- **rejects an over-length email** — enter a value over 255 characters,
  submit → "Email must be less than 255 characters." shown (reachable
  since, unlike Display Name below, this input has no HTML `maxLength`).
- **rejects an over-length first/last name** — enter a value over 50
  characters in either field, submit → "First name must be less than 50
  characters."/"Last name must be less than 50 characters." shown.

  > Display Name's own over-length error ("Display name must be less than
  > 25 characters.") isn't reachable here — like `title`/`notes` on the
  > workout page (see [workout.md](workout.md)), the input has a native
  > `maxLength={25}`, so the UI never lets you type past the limit.

- **Save/Cancel are disabled until the form is dirty** — on load, both
  buttons are disabled; change any field → both become enabled; Cancel
  reverts every field to its last-saved value (and clears any errors) and
  disables the buttons again.
- **Cancel also clears validation errors** — trigger a validation error
  (e.g. clear First Name, Save), click Cancel → the error disappears and
  the field is back to its saved value.
- **changing first/last/display name saves immediately** — edit one of
  these (leaving email unchanged), Save → "Your profile has been updated."
  toast, no confirmation modal, and the new value is still shown after a
  reload.
- **changing the email opens a confirmation modal** — edit Email, Save →
  "Confirm Email Change" modal appears, body text includes the new email
  address and a warning that an incorrect address won't receive
  password-reset/other notifications.
- **canceling an email change discards it** — open the email confirmation
  modal, click "Cancel" instead → modal closes and no request is sent.
  Closing the modal doesn't itself revert the form (the typed address is
  still in the field), so clicking the form's own Cancel button then
  restores the original email, which is still shown after a reload.

  > **Email change caveat:** no test in this file may click "Confirm" in
  > the email change modal, or otherwise actually submit an email change -
  > coverage stops at the modal appearing with the right content (and at
  > canceling it). This is partly a safety net (the shared test account's
  > real email must never drift from `TEST_USER_EMAIL`, which every other
  > spec file's login depends on) and partly because the account's
  > change-confirmation email goes out through a metered Brevo plan with a
  > limited monthly send quota that the real deployed app also depends on
  > - repeatedly confirming and reverting the email in CI would burn
  > through that same quota. The underlying `PATCH /api/users/me`
  > email-change path (new email persisted, confirmation sent to the old
  > address) is already covered by backend tests (`UserServiceTests`,
  > `UserControllerTests`).

  > A duplicate-email conflict (409, "A user with this email already
  > exists") isn't covered here either, for the same reason — it would
  > also need an actual email-change submission (plus a second real
  > account), and is already covered by the same backend tests.

### Preferences tab (`#preferences-form`)

All controls here are radios/a switch rather than free text, so there's no
validation to cover - these scenarios are about persistence instead.

- **form loads with the account's current settings** — open the tab →
  Theme, Default Weight Unit, Default Distance Unit, Default Effort Rating
  Type radios and the "Show estimated one-rep max (e1RM)" switch all match
  whatever `GET /api/users/me/settings` currently returns for the test
  account.
- **Save/Cancel are disabled until the form is dirty** — on load, both
  buttons are disabled; change any control → both become enabled; Cancel
  reverts every control to its last-saved value and disables the buttons
  again.
- **saving preferences persists them** — change the theme, weight unit,
  distance unit, effort rating type, and the e1RM switch, Save → "Your
  preferences have been updated." toast, and every changed value is still
  shown after a reload (re-fetch `/account`, Preferences tab).
- **theme only takes effect once Save is clicked** — select a different
  Theme radio but don't click Save yet → the app's actual rendered theme
  is unchanged; click Save → the newly-selected theme now applies
  immediately (no reload needed, since the save updates the same settings
  query cache `SettingsProvider` reads from).

  > Preferences saved here feed into defaults used elsewhere (e.g. a newly
  > added workout exercise's weight/distance unit and effort rating type -
  > see [workout.md](workout.md)), but exercising that cross-page effect
  > belongs in `workout.spec.ts`, not here.

### Security tab (`#password-change-form`) — validation only

- **Save is disabled while any field is empty** — on load, and with only
  some of the three fields filled in, Save is disabled; it only becomes
  enabled once all three have a value.

  > This means the "Password is required." errors (`validatePassword`
  > with an empty value) aren't reachable from the UI: unlike the other two
  > forms, an empty submission can't be triggered at all since Save is
  > disabled until every field has a value (and implicit submission via
  > Enter is blocked by the disabled default button). That rule belongs in
  > a component test.

- **rejects a new password that's too short** — enter a New Password under
  6 characters (with Current Password and a matching Confirm New Password
  filled in) → "Password must be at least 6 characters." shown under New
  Password.
- **rejects a new password that's too long** — enter a New Password over
  100 characters → "Password must be 100 characters or less." shown
  (reachable - this input has no HTML `maxLength` either).
- **shows an error when the new password and confirmation don't match** —
  fill all three fields with a mismatched confirmation → "Passwords do not
  match." shown under Confirm New Password.
- **Save stays disabled while an error is showing** — after a failed
  submission (e.g. a too-short new password), Save is disabled and the
  error stays visible until the user edits the offending field, at which
  point the error clears and Save re-enables (once all three fields are
  non-empty).
- **Cancel clears the form** — fill in all three fields, click Cancel →
  all three fields and any errors are cleared, Save is disabled again.
- **a valid submission opens the confirmation modal** — fill in valid,
  matching values, Save → "Confirm Password Change" modal appears, body
  warns that the user will be logged out on all devices.

  > **Password change caveat:** the test must *not* click "Confirm" in
  > this modal, call the change-password endpoint, or otherwise complete
  > the flow — doing so would actually change the shared test account's
  > password and log it out everywhere. Close the modal via "Cancel"
  > (or dismiss it) once its contents are verified, leaving the account's
  > real password untouched. No test in this file may change the
  > password, full stop.

## Test data & cleanup

This suite runs entirely against the one shared, dedicated Playwright test
account (`TEST_USER_EMAIL`) that every other authenticated spec file also
depends on (including `auth.setup.ts`, which logs in with it before every
run). That makes the Profile and Preferences scenarios above different
from the per-test create/delete pattern used for workouts - there's nothing
to delete, but the account's name, display name, and preferences *must*
end each test exactly as they started, no matter what (the account's
email is never actually changed by this suite in the first place - see
**Email change caveat** below):

- A `restoreAccount` fixture (in `fixtures.ts`, analogous to
  `trackWorkout`) snapshots the account's profile names
  (`GET /api/users/me`) and settings (`GET /api/users/me/settings`) before
  the test and restores both via direct, authenticated `PATCH` calls in
  its teardown, which always runs - even if an earlier assertion in the
  test throws. Don't rely on each test's own cleanup code reaching its
  last line, and don't restore via re-running the UI flow (e.g. retyping
  the old name and clicking Save through the form) since the UI itself may
  be what's broken. `account.spec.ts` requests it for every test via a
  `beforeEach`; any other spec that changes preferences (e.g. the
  preference-default scenarios in [workout.md](workout.md)) must request it
  too.
- Because preferences change what other specs see (new workout exercises
  default to them), `account.spec.ts` takes the same cross-process account
  lock as `workout.spec.ts`/`history.spec.ts`, so it can never overlap
  with them. Its tests are independent (no `serial` mode, which would skip
  the rest after one failure) but still pinned to one worker per file, as
  the lock requires.
- As covered above (**Email change caveat**), no test ever actually
  submits an email change, so there's nothing to restore there - the
  account's real email always stays at `TEST_USER_EMAIL`, and the fixture
  deliberately never snapshots/restores it. This is both a safety net and
  a quota concern: the account's change-confirmation email goes out
  through a metered Brevo plan shared with the real deployed app, so
  repeatedly confirming and reverting the email in CI isn't an option. As
  a second safety net, the email-modal scenarios abort any
  `PATCH /api/users/me` request at the network layer, so even an
  accidental "Confirm" can't reach the backend.
- As covered above (**Password change caveat**), the password itself is
  never part of what gets changed or restored either - the Security tab's
  scenarios stop at validation and the confirmation modal, never reaching
  an actual password change. They also use a deliberately fake "current
  password", so even an accidental confirm would just be rejected by the
  API as an incorrect current password.
