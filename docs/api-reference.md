# API reference

A reference for the REST API exposed by `backend/WorkoutLogAPI`. For how the
backend is put together internally, see
[`backend-architecture.md`](backend-architecture.md). For interactive,
always-up-to-date docs generated straight from the code, run the API locally
and open `/scalar` (Development only) — this document is a hand-maintained
companion that's easier to skim/link to and covers things Scalar doesn't
(auth headers, cookies, error shapes).

## Base URL & authentication

- All routes are prefixed with `/api` except `/health-check`.
- Auth is a JWT stored in an `HttpOnly` cookie (`workout_auth_token`), set
  automatically by `login`/`register`/`refresh`. There is no separate
  bearer-token flow for browser clients — just send requests with
  credentials included (`fetch(..., { credentials: "include" })`).
- **Every state-changing request** (anything other than `GET`/`HEAD`/
  `OPTIONS`) must include an `X-Requested-With` header (any non-empty
  value) or it's rejected with `403` before it reaches auth/controller
  logic. This is CSRF protection, not authentication — see
  [backend-architecture.md](backend-architecture.md#csrf-protection).
- Endpoints marked 🔒 require a valid, non-revoked token for the cookie's
  user. Endpoints marked 🔒👑 additionally require the token's `is_admin`
  claim to be `true`.
- Error responses are generally `{ "error": "<message>" }`. A few
  legacy/simple endpoints return a plain string or `{ "message": "..." }`
  on success — see each endpoint below.

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create an account, set the auth cookie, return the new user. |
| POST | `/login` | — | Authenticate, set the auth cookie, return the user. |
| POST | `/logout` | 🔒 | Revoke the current token (`jti`) and clear the auth cookie. |
| GET | `/me` | 🔒 | Return the currently authenticated user. |
| POST | `/forgot-password` | — | Email a password reset link if the address is registered. Always `200` — doesn't reveal whether the email exists. |
| POST | `/reset-password` | — | Consume a reset token and set a new password. |

#### `POST /register`

Request body:
```json
{
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "displayName": "Jane D.",
  "password": "at-least-6-characters"
}
```
`displayName` is optional (≤ 25 chars). `email` ≤ 255 chars; `firstName`/
`lastName` ≤ 50 chars; `password` 6–100 chars.

- `200 OK` → `{ "user": UserDto }` (see [Shared DTOs](#shared-dtos))
- `400 Bad Request` → `{ "error": "A user with this email already exists" }`

#### `POST /login`

Request body: `{ "email": string, "password": string }`

- `200 OK` → `{ "user": UserDto }`
- `401 Unauthorized` → invalid credentials, **or** account locked after 5
  failed attempts (message explains the lockout and to reset the password)

#### `POST /logout` 🔒

- `200 OK` → `{ "message": "Logged out successfully" }`
- `400 Bad Request` → no/invalid token cookie present

#### `GET /me` 🔒

- `200 OK` → `UserDto`
- `401 Unauthorized` / `404 Not Found` if the token's user no longer exists

#### `POST /forgot-password`

Request body: `{ "email": string }`

- Always `200 OK` → `{ "message": "Password reset email sent successfully" }`
  regardless of whether the email is registered (prevents user enumeration).
  The reset link is only actually emailed if the account exists; it expires
  after `PasswordReset:TokenExpirationInMinutes` (default 15 min) and is
  single-use.

#### `POST /reset-password`

Request body: `{ "newPassword": string, "token": string }` (`newPassword`
6–100 chars, `token` is the value from the emailed reset link)

- `200 OK` → `{ "message": "Password has been reset successfully" }`
- `400 Bad Request` → `{ "error": "Invalid or expired password reset token." }`

## Workouts — `/api/workouts` (all endpoints 🔒)

Every endpoint scopes results to the authenticated user; a workout owned by
another user is never returned (`404`/`403`, never another user's data).

| Method | Path | Description |
|---|---|---|
| GET | `/` | List the current user's workouts (not deleted), newest date first, with exercises and sets included. |
| GET | `/{id}` | Get one workout by ID, including its exercises and sets. |
| GET | `/exercise-history/{exerciseId}` | All past logged instances of one exercise across the user's workouts, newest first — powers the "exercise history" view. |
| POST | `/` | Create a workout (with nested exercises/sets in one request). |
| PUT | `/{id}` | Replace a workout's fields and reconcile its exercises/sets against the payload (missing ones are soft-deleted). |
| DELETE | `/{id}` | Soft-delete a workout and all of its exercises/sets. |

#### `GET /`, `GET /{id}`

- `200 OK` → `WorkoutDto` or `WorkoutDto[]`
- `GET /{id}`: `404 Not Found` if missing/deleted;
  `403 Forbidden` → `{ "error": "You do not have access to this workout" }`
  if it belongs to another user

#### `GET /exercise-history/{exerciseId}`

- `200 OK` → `ExerciseHistoryDto[]`, e.g.:
```json
[
  {
    "notes": "Felt strong",
    "weightUnit": "lbs",
    "workout": { "date": "2026-09-20" },
    "sets": [ { "id": 1, "weight": 135, "reps": 5, "rpe": 8, "exerciseId": 7 } ]
  }
]
```

#### `POST /`, `PUT /{id}`

Request body: `WorkoutDto` (see [Shared DTOs](#shared-dtos)). On create,
`id` is ignored (server-generated); on update, nested exercises/sets
without an `id` are treated as new, and any exercise/set from the current
workout missing from the payload is soft-deleted.

- `200 OK` (`PUT`) / `200 OK` with `Location` header (`POST`) → `WorkoutDto`
- `409 Conflict` → `{ "error": "A workout with the same title and date already exists" }`
  (title + date must be unique per user among non-deleted workouts)

#### `DELETE /{id}`

- `204 No Content`

## Exercises — `/api/exercises` (all endpoints 🔒)

The exercise catalog is shared: system exercises (seeded, visible to every
user) plus any custom exercises the current user has created.

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all exercises visible to the user (system + own custom), alphabetical, excluding deleted. |
| GET | `/{id}` | Get one exercise by ID (must be a system exercise or owned by the user). |
| POST | `/` | Create a custom exercise owned by the current user. |

#### `POST /`

Request body: `{ "name": string }` (≤ 100 chars, required)

- `201 Created` → `ExerciseDto`
- Duplicate names (case-insensitive, against system + the user's own
  exercises) currently surface as a generic `500` rather than a `409` —
  worth tightening if you touch this endpoint.

## Admin — `/api/admin` (all endpoints 🔒👑)

| Method | Path | Description |
|---|---|---|
| DELETE | `/workouts` | Hard-delete **all** workouts (and their exercises/sets) for a given user, by email. |

Only enabled when the `AdminEndpoints:HardDeleteTestWorkoutsEnabled`
configuration flag is `true` (development/staging only — disabled in
production). Returns `404 Not Found` if the flag is off, regardless of the
caller's admin status. Used exclusively to clean up state between
Playwright E2E test runs against the shared Test User account.

Request body: `{ "email": string }` → `204 No Content` on success, `404`
if no user has that email.

## Health check — `/health-check`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health-check` | — | Confirms the process is up **and** can reach Postgres. Used by Render to gate traffic to new instances. |

- `200 OK` → `{ "status": "healthy" }`
- `503 Service Unavailable` → DB unreachable

Not under `/api`, not subject to CSRF/auth middleware, and intentionally
excluded from `MapControllers()` so it isn't versioned as part of the
public API surface.

## Shared DTOs

These are the JSON shapes referenced above (see
`backend/WorkoutLogAPI/WorkoutLogAPI/DTOs/` for the exact C# records and
validation attributes).

**`UserDto`**
```json
{
  "id": "guid",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "displayName": "Jane D.",
  "isAdmin": false
}
```

**`ExerciseDto`**
```json
{ "id": 7, "name": "Barbell Bench Press", "userId": null }
```
`userId: null` = system exercise; otherwise the owning user's ID.

**`WorkoutDto`**
```json
{
  "id": "guid",
  "title": "Push Day",
  "userId": "guid",
  "date": "2026-09-20",
  "notes": "optional, \u2264 250 chars",
  "exercises": [ /* WorkoutExerciseDto */ ]
}
```

**`WorkoutExerciseDto`**
```json
{
  "id": 12,
  "notes": "optional, \u2264 100 chars",
  "weightUnit": "lbs",
  "exerciseId": 7,
  "workoutId": "guid",
  "exercise": { /* ExerciseDto */ },
  "sets": [ /* SetDto */ ]
}
```
`weightUnit` is `"lbs"` or `"kg"`.

**`SetDto`**
```json
{ "id": 1, "weight": 135, "reps": 5, "rpe": 8, "exerciseId": 12 }
```
Despite the name, `exerciseId` here is the parent `workout_exercises.id`
(see [database-design.md](database-design.md#table-reference)).
Validation: `weight` 0–9999 in steps of 0.5, `reps`/`rpe` have their own
range checks (`Validation/RepsRangeAttribute.cs`, `RpeRangeAttribute.cs`);
all three fields are nullable.

**`ExerciseHistoryDto`**
```json
{
  "notes": "string?",
  "weightUnit": "lbs",
  "workout": { "date": "2026-09-20" },
  "sets": [ /* SetDto */ ]
}
```
