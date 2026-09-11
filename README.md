# Workout Log Web Application

This application allows a user to enter their workout data and save it to view or update at a later date. It also includes a one-rep max calculator page that calculates your one-rep max based on the weight, reps, and RPE (Rate of Perceived Exertion) of a set you performed in the past. A table is displayed showing the estimated weight you can lift between 1-10 reps at RPE 6-10. View the deployed website at [https://workoutlogapp.vercel.app](https://workoutlogapp.vercel.app).

If you would like to test this application without creating an account, you may use the Test User account.

Email: workoutlogtestuser@gmail.com
<br>
Password: testuserpassword

Please be respectful and do not save anything inappropriate in the notes sections on this account.

## Running Locally

This project is split into two parts: a .NET Web API backend ([`/backend`](/backend)) and a Next.js frontend ([`/frontend`](/frontend)). You'll need a local Postgres database, the backend running, and the frontend running.

### 1. Database (Postgres)

The backend just needs a connection string to any Postgres database. The easiest way to get one locally is with Docker, using the `docker-compose.yml` included in this repo:

```bash
cd backend
docker compose up -d
```

This starts a Postgres 16 container listening on `localhost:5432` with database `workout_log_dev` and username/password `postgres`/`postgres` (see `backend/docker-compose.yml` if you want to change these).

You don't have to use Docker &mdash; any reachable Postgres instance works, including a free-tier hosted database (e.g. [Neon](https://neon.tech/)).

### 2. Backend (.NET Web API)

Requires the [.NET 10 SDK](https://dotnet.microsoft.com/download).

1. From `backend/WorkoutLogAPI/WorkoutLogAPI`, set your local configuration using [.NET user secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) (this keeps your connection string and JWT signing key out of source control):

```bash
cd backend/WorkoutLogAPI/WorkoutLogAPI
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=workout_log_dev;Username=postgres;Password=postgres"
dotnet user-secrets set "Jwt:SecretKey" "any-random-string-at-least-32-characters-long"
```

Password reset and account emails can be sent either through [Brevo](https://www.brevo.com/)'s SMTP relay or through Brevo's transactional email REST API. **The API is required in production** because Render's free tier blocks outbound SMTP traffic entirely &mdash; SMTP connections will simply time out or fail to connect. For local development, either option works, so you can pick whichever is more convenient.

If you're working on email-related functionality, create a free Brevo account, then set up **one** of the two options below.

**Option A: Brevo API (matches production, recommended)**

1. Generate an API key from your Brevo account (Settings &rarr; SMTP & API &rarr; API Keys).
2. Set it as a user secret:

```bash
dotnet user-secrets set "Brevo:ApiKey" "your-brevo-api-key"
```

3. In your Brevo account, go to **Settings &rarr; Security** and make sure IP address authorization is **disabled** (or your current IP is whitelisted). Brevo can restrict API key usage to specific authorized IPs; since Render's free tier doesn't provide a static outbound IP (and most home internet connections have IPs that rotate periodically too), this restriction will intermittently reject valid requests if left enabled. Disabling it is safe since the API key itself is still required to authenticate.
4. Leave `Smtp:EnableSmtp` as `false` (the default) in `appsettings.Development.json`.

**Option B: SMTP relay (local development only)**

1. Generate an SMTP key from your Brevo account and set it as user secrets:

```bash
dotnet user-secrets set "Smtp:Username" "your-brevo-smtp-login"
dotnet user-secrets set "Smtp:Password" "your-brevo-smtp-key"
```

2. Set `Smtp:EnableSmtp` to `true` in `appsettings.Development.json`.

For either option, update the non-secret `FromEmail` value in `appsettings.Development.json` to a verified sender address on your Brevo account.

A Brevo account is only required for testing email functionality (e.g. password reset). If you aren't working on email-related changes, you can safely leave the Brevo/SMTP secrets unset &mdash; the app will still run, and any attempt to send an email will simply fail and be logged rather than crash the request.

2. Run the API:

```bash
dotnet run
```

On startup (in the Development environment only), the API automatically applies any pending EF Core migrations and seeds the database with the stock exercise list, so no manual migration or seed step is needed. The API listens on `http://localhost:5258` by default.

In Development, an interactive [Scalar](https://github.com/scalar/scalar) API reference is also available at `http://localhost:5258/scalar/v1`, generated from the API's OpenAPI document. It lists every endpoint with its request/response schemas and lets you send test requests straight from the browser &mdash; a quicker alternative to the `.http` file below for exploring what's available.

#### appsettings.json reference

A few non-secret settings live directly in `appsettings.json`/`appsettings.Development.json` rather than user secrets, since they aren't sensitive but do need to change per environment:

| Setting | Purpose |
| --- | --- |
| `Cors:AllowedOrigins` | Array of origins allowed to call the API (with credentials). Must include the frontend's URL exactly &mdash; `http://localhost:3000` for local dev, and the deployed frontend's URL (e.g. `https://workoutlogapp.vercel.app`) in production. **Update this when deploying to a new frontend URL**, or requests from the frontend will be blocked by CORS. |
| `Jwt:TokenExpirationInMinutes` | How long a freshly issued JWT is valid for before it must be renewed or the user must log in again. |
| `Jwt:RefreshThresholdInMinutes` | Sliding expiration window: once an authenticated request comes in with less than this many minutes left on its token, the API silently issues a replacement token (returned via the `X-Refreshed-Token` response header) so active users aren't logged out mid-session. Should stay comfortably smaller than `TokenExpirationInMinutes`. |
| `Smtp:Host` / `Smtp:Port` | Brevo's SMTP relay address/port. These don't need to change between environments. |
| `Smtp:EnableSmtp` | Toggles which email delivery path is used: `true` sends via SMTP, `false` (default) sends via the Brevo REST API. Must be `false` in production since Render's free tier blocks outbound SMTP. |
| `Smtp:FromEmail` / `Smtp:FromName` | The sender address/name emails (password reset, etc.) are sent from. `FromEmail` must be a verified sender on the configured Brevo account. |
| `Brevo:BaseUrl` | Brevo's transactional email API endpoint. Doesn't need to change between environments. |
| `PasswordReset:TokenExpirationInMinutes` | How long a password reset link/token stays valid after being requested. |

`Smtp:Username`/`Smtp:Password` and `Brevo:ApiKey` are set via user secrets instead, since they're sensitive &mdash; see the Brevo setup note above.



### 3. Frontend (Next.js)

1. Install dependencies from the `frontend` directory: `npm install`
2. Copy `.env.local.example` to `.env.local`. The default value already points at the backend's local URL:

```
NEXT_PUBLIC_API_URL=http://localhost:5258
```

3. Run `npm run dev`. Open a web browser and enter `localhost:3000` in the address bar.

### 4. Trying the API directly (optional)

[`backend/WorkoutLogAPI/WorkoutLogAPI/WorkoutLogAPI.http`](/backend/WorkoutLogAPI/WorkoutLogAPI/WorkoutLogAPI.http) has a ready-to-run request for every backend endpoint (register, login, exercises, workouts, etc.), useful for testing the API without going through the frontend. It works with Rider's built-in HTTP Client or VS Code's [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension.

These requests rely on variables (e.g. `{{Base_Url}}`) defined in a `http-client.env.json` file, which isn't committed to the repo since it holds real credentials/tokens. Create `backend/WorkoutLogAPI/WorkoutLogAPI/http-client.env.json` with the following shape:

```json
{
  "local": {
    "Base_Url": "http://localhost:5258",
    "email": "your-account-email@example.com",
    "Password": "your-account-password",
    "Access_Token": "paste-a-JWT-here-after-logging-in",
    "Workout_Id": "paste-a-workout-id-here",
    "Exercise_Id": "paste-an-exercise-id-here"
  }
}
```

`"local"` is the environment name shown in your editor's HTTP client &mdash; select it before sending requests. `Access_Token` isn't filled in automatically: run the login request in `WorkoutLogAPI.http` first, then copy the `token` value from the response into `Access_Token` so the rest of the requests can authenticate. `Workout_Id`/`Exercise_Id` are just for convenience with the `{id}`-based requests &mdash; grab real values from a create/list response, or edit the URL inline instead.

See the comments at the top of `WorkoutLogAPI.http` for more detail.

## Pages

### Workout Page

![Image of workout page](/frontend/public/img/workout_dark.webp)

When a new workout is started, the title is defaulted to \[Today's Date YYYY-MM-dd\] Workout, the date is defaulted to today, and there is an optional section for overal workout notes.

The 'Add Exercise' button opens a modal that shows a list of pre-loaded exercises, and has tabs for user-created exercises and new exercise creation. Once an exercise is selected or a new exercise is created, it can be added to the workout.

The exercise card has an options button that allows you to change the weight unit from lbs to kg, and a switch to show or hide the estimated one-rep max. An actions button beside the exercise title allows you to change the exercise, view your history of performing that exercise, or delete the exercise. The inputs include a notes section \(useful for set and rep targets\), and weight, reps, and RPE. All of these inputs have rules enforced by regex patterns, and on mobile devices, the numeric keyboard with a decimal is opened \(**Weight:** 0-9999, only 0 or 5 after the decimal. **Reps:** 0-9999, whole numbers. **RPE:** 0-10, 0 or 5 after the decimal.\). Each set has a delete button, and sets can be added with the 'Add set' button. If there are any sets present between 1-10 reps at RPE 6-10, the estimated one-rep max will be calculated based on your best set is and displayed below the sets grid.

Once you are finished inputting your workout data, it can be saved by pressing the 'Save Workout' button, and this same button will update existing workouts. If it is a new, unsaved workout, there is a cancel button, and existing workouts have a delete button that will soft-delete the workout and remove it from the workout history view.

### History Page

![Image of history page](/frontend/public/img/history_dark.webp)

The history page displays all of the logged in user's saved workouts in a card including the title, date, notes, and a list of exercises performed. The 'View/Edit' link will open the workout on the workout page.

The workouts can be filtered by date range, and grouped by month or week.

### Calculator Page

![Image of calculator page](/frontend/public/img/calculator_dark.webp)

The calculator page allows you to enter the weight, reps, and RPE values for a set you have performed, and it will calculate your estimated one-rep max, along with a table of estimated weights you can lift between 1-10 reps at RPE 6-10. The input rules are slightly different on this page. Reps must be between 1-10, and RPE must be between 6-10. If you are interested in how this calculation is done and are curious about RPE, you can read [this article](https://fiftyonestrong.com/rpe/). If you are interested in how I did these calculations programatically, see [/utils/calculator/calc-functions.ts](/utils/calculator/calc-functions.ts).

### Login/Sign up Page

![Image of login page](/frontend/public/img/login.webp)

Users have the option to login or sign up with an email address and password. The sign up page requires an email address, password, first/last name, and an optional display name. Authentication is handled by the .NET backend using bcrypt-hashed passwords and JWTs. If there is no logged in user, navigating to the workout or history pages will redirect the user to this page. The home page and calculator pages do not require authentication because they do not display or save any user data.

**Note:** Image is outdated. Login with Magic Link is no longer available.

## Tech Stack

### Frontend

-   Next.js
-   React
-   Typescript
-   HeroUI
-   Tailwind CSS

### Backend

-   .NET Web API
-   Entity Framework Core \(Npgsql provider\)
-   Postgres
-   JWT authentication with bcrypt-hashed passwords
-   OpenAPI + Scalar for interactive API documentation

## Future Improvements

-   Add an account management page to update information and change password.
-   Add a page to view and edit user-created exercises.
-   Add an analytics page with charts to monitor exercise progress over time (one-rep max, tonnage, total reps, volume, etc.)
-   Add a user dashboard showing recent workouts and options to show progress charts for selected exercises.
-   Add an option to export workouts to an Excel file.
-   Autosave workouts as they are being created or updated.

## Known Bugs/Issues

-   Some components do not have a great user experience on mobile. The virtual keyboard pushes up the exercise selection modal making it difficult to see your search results while typing.
-   The one-rep max calculation sometimes differs by 1 lbs/kg due to floating point precision. This is not a huge issue since this is an estimate, and 1 lbs/kg is almost negligible since most weights in commercial gyms are not precise.
