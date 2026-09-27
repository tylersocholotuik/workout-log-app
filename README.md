# Workout Log Web Application

This application allows a user to enter their workout data and save it to view or update at a later date. It also includes a one-rep max calculator page that calculates your one-rep max based on the weight, reps, and RPE (Rate of Perceived Exertion) of a set you performed in the past. A table is displayed showing the estimated weight you can lift between 1-10 reps at RPE 6-10. View the deployed website at [https://workoutlogapp.vercel.app](https://workoutlogapp.vercel.app).

If you would like to test this application without creating an account, you may use the Test User account.

Email: workoutlogtestuser@gmail.com
<br>
Password: testuserpassword

Please be respectful and do not save anything inappropriate in the notes sections on this account.

## Getting Started

This project is split into two parts: a .NET Web API backend ([`/backend`](/backend)) and a Next.js frontend ([`/frontend`](/frontend)). You'll need a local Postgres database, the backend running, and the frontend running:

```bash
# 1. Database - starts a local Postgres 16 container
cd backend && docker compose up -d

# 2. Backend - requires the .NET 10 SDK
cd WorkoutLogAPI/WorkoutLogAPI
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=workout_log_dev;Username=postgres;******"
dotnet user-secrets set "Jwt:SecretKey" "any-random-string-at-least-32-characters-long"
dotnet run   # listens on http://localhost:5258

# 3. Frontend - in a separate terminal, from /frontend
npm install
cp .env.local.example .env.local
npm run dev   # open http://localhost:3000
```

**See [`docs/development-guide.md`](docs/development-guide.md) for the full walkthrough** &mdash; email/password-reset (Brevo) setup, the `appsettings.json` configuration reference, and testing the API directly via the included `.http` file.

## Documentation

More in-depth write-ups live in [`docs/`](docs):

| Document | Covers |
| --- | --- |
| [`development-guide.md`](docs/development-guide.md) | Full local setup instructions. |
| [`database-design.md`](docs/database-design.md) | Postgres schema, entity-relationship diagram, and design rationale. |
| [`backend-architecture.md`](docs/backend-architecture.md) | ASP.NET Core project structure, request pipeline, and authentication design. |
| [`api-reference.md`](docs/api-reference.md) | Endpoint-by-endpoint API reference. |
| [`frontend-architecture.md`](docs/frontend-architecture.md) | Next.js project structure, data flow, and UI/styling conventions. |
| [`infrastructure.md`](docs/infrastructure.md) | Hosting topology across Render, Vercel, and Neon. |
| [`ci-cd.md`](docs/ci-cd.md) | GitHub Actions pipeline: tests, staging/production deploys, E2E tests. |
| [`playwright-tests/README.md`](playwright-tests/README.md) | Running and writing end-to-end tests. |

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

The calculator page allows you to enter the weight, reps, and RPE values for a set you have performed, and it will calculate your estimated one-rep max, along with a table of estimated weights you can lift between 1-10 reps at RPE 6-10. The input rules are slightly different on this page. Reps must be between 1-10, and RPE must be between 6-10. If you are interested in how this calculation is done and are curious about RPE, you can read [this article](https://fiftyonestrong.com/rpe/).

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
