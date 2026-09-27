# Frontend architecture

This document describes how the Next.js frontend
(`frontend/`) is put together: stack, project layout, rendering/auth model,
and UI/styling conventions. For the backend API it talks to, see
[`backend-architecture.md`](backend-architecture.md) and
[`api-reference.md`](api-reference.md).

## Stack

- **Next.js 16** using the **Pages Router**.
- **React 19**.
- **TypeScript**, strict mode.
- **HeroUI v2** (`@heroui/react`) — the component library providing all
  interactive UI (forms, modals, navbar, tables, toasts, etc.).
- **Tailwind CSS v3** — utility classes + HeroUI's Tailwind plugin
  (`heroui()` in `tailwind.config.ts`) for styling/theming.
- **next-themes** — light/dark mode, persisted and synced with the `class`
  strategy Tailwind's `darkMode: "class"` expects.
- **framer-motion** — peer dependency required by HeroUI's animated
  components (accordions, modals, etc.); not used directly in app code.
- **@iconify/react** — icon set used throughout via `<Icon icon="..." />`.

> **Version note:** HeroUI is on **v2** and Tailwind is on **v3** — each one
> major version behind latest. When looking up docs or examples, make sure
> you're referencing the **v2 HeroUI docs** (https://www.heroui.com/docs,
> select v2) and **Tailwind v3 docs** (https://v3.tailwindcss.com/), since class names, config shape, and APIs
> differ from v3 HeroUI / v4 Tailwind. See
> [Dependency version strategy](#dependency-version-strategy) below for why,
> and what would be involved in upgrading.

## Project layout

```
frontend/
├── pages/            # Routes (Pages Router: file path = URL path)
│   ├── _app.tsx      # Global providers (HeroUI, theme, auth), NavBar
│   ├── _document.tsx # HTML document shell
│   ├── index.tsx     # Landing page
│   ├── login.tsx     # Combined login/signup page
│   ├── history.tsx   # Workout history list
│   ├── calculator.tsx
│   ├── reset-password.tsx
│   └── workout/[workoutId].tsx  # Workout editor (dynamic route)
├── components/         # UI components, grouped by feature folder
│   ├── auth/           # AuthProvider, forgot-password modal
│   ├── calculator/     # 1RM calculator form + RPE table
│   ├── history/        # Workout history list/card
│   ├── workout/        # Workout editor: exercise cards, sets table, modals
│   └── *.tsx           # Shared: NavBar, Footer, DarkModeSwitch, LogoutModal
├── lib/
│   ├── api/           # fetch wrappers per backend resource (auth, workouts, exercises)
│   └── factories/     # "empty object" constructors for new Workout/Exercise/Set
├── types/             # Shared TypeScript interfaces, mirroring backend DTOs
├── utils/             # Pure helper functions (date formatting, 1RM math)
├── icons/             # Hand-written SVG icon components
├── styles/globals.css # Tailwind directives + minor global overrides
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.ts     # Reverse-proxy rewrite for the backend API (see below)
```

## Data flow: API client layer

All backend calls go through `lib/api/*.ts`, one file per resource
(`auth.ts`, `workouts.ts`, `exercises.ts`), which all share a common
`apiFetch` wrapper (`lib/api/client.ts`):

- Adds the `X-Requested-With` CSRF header the backend's CSRF middleware
  requires on every mutating request (see
  [backend-architecture.md](backend-architecture.md#csrf-protection)).
- Sets `credentials: "include"` so the `HttpOnly` auth cookie is sent.
- On a `401` response, redirects the whole page to `/login` — except for
  the auth endpoints themselves (login/register/forgot/reset/me), which
  need to handle a `401` as normal data, not a global redirect trigger.

Each resource file resolves the API base URL the same way:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5258');
```

- **Locally**, `NEXT_PUBLIC_API_URL` points directly at the backend
  (`http://localhost:5258`) — frontend and backend run on different ports
  but the browser calls the backend directly.
- **In staging/production**, `NEXT_PUBLIC_API_URL` is left unset, so calls
  are made relative to the frontend's own origin (empty string prefix).
  `next.config.ts` then rewrites `/api/:path*` to the real backend URL
  (`BACKEND_API_URL`, a server-side-only env var) so the browser only ever
  talks to one origin. This is required to keep the auth cookie
  same-origin/first-party, since iOS Safari and Chrome-for-iOS (WebKit)
  block third-party cookies by default even with `SameSite=None; Secure` —
  see the comments in `next.config.ts` and
  `JwtService.BuildAuthCookieOptions` in the backend.
- Errors are normalized with `extractErrorMessage` (`lib/api/apiErrors.ts`),
  which understands the three response shapes the ASP.NET backend can
  return: `{ error: string }` (hand-written controller errors), ASP.NET's
  automatic `ValidationProblemDetails` (`{ title, errors: { Field: [...] } }`
  from `[ApiController]` model binding), and a bare `{ title }` fallback.

## Authentication (`AuthProvider`)

`components/auth/AuthProvider.tsx` wraps the whole app (in `_app.tsx`,
inside the theme provider) and exposes `useAuth()`:

- On mount and on every route change, it calls `GET /api/auth/me` to
  determine the current user. Since the auth cookie is `HttpOnly`, the
  frontend can't read it directly — asking the backend "who am I?" is how
  it learns whether the visitor is signed in.
- If the check comes back with no user and the route is one of the
  `protectedPages` (currently `/history` and `/workout/[workoutId]`), it
  redirects to `/login`.
- `refreshUser()` is called right after a successful login/register so the
  navbar/UI update immediately without waiting for the next route change.
- `logout()` calls the backend logout endpoint (which revokes the token
  server-side), clears local user state, and redirects to `/login`.

Route protection is handled client-side inside `AuthProvider` rather than
with a `middleware.ts` route guard. An `isLoading` flag lets consumers
(e.g. `NavBar`) avoid flashing the wrong content (like a "Login" link)
while the initial `/api/auth/me` check is still in flight.

## Rendering model

Pages are client-rendered: each page fetches its own data (workouts,
exercises, current user) after mount via `useEffect` + the `lib/api/*`
functions, showing a HeroUI `<Spinner>` via `isLoading` state while
waiting. This keeps the data-fetching pattern consistent across every
page. Since every data-bearing page requires authentication anyway,
server-rendering that data ahead of time wouldn't gain much — a
straightforward future enhancement would be adopting
`getServerSideProps` (or the App Router) for pages that would benefit
from a faster first paint.

The one recurring exception is theme-dependent UI (`index.tsx`,
`DarkModeSwitch`): since `next-themes` can't know the real theme during
server rendering, these components track a local `mounted` flag and only
render theme-specific output after the client mounts, avoiding a
hydration mismatch.

## State management

State is handled with plain React primitives (`useState` + Context) at
three scopes, without a dedicated state-management library:

- **App-wide:** `AuthContext` (current user) via `AuthProvider`.
- **Page-wide:** `WorkoutContext` in `pages/workout/[workoutId].tsx` — the
  workout being edited is `useState` at the page level and shared with
  every nested exercise/set component via context, since the whole
  workout tree is saved as one unit (see
  [backend-architecture.md](backend-architecture.md) on whole-tree
  `PUT` updates).
- **Local:** component-level `useState` for form inputs and per-field
  validation errors (e.g. `login.tsx` tracks a separate error string per
  field rather than a single form-level error object).

## Types & factories

`types/` mirrors the backend's DTOs (`Workout`, `WorkoutExercise`, `Set`,
`Exercise`, `User`, plus request/response shapes for auth), giving the
frontend compile-time safety against the shapes the API actually returns.
`lib/factories/` provides `createEmptyWorkout()` /
`createEmptyWorkoutExercise()` / `createEmptySet()` used when starting a
new workout or adding a new exercise/set — centralizing default values
(e.g. today's date, `weightUnit: "lbs"`) in one place instead of
duplicating object literals across components.

## Validation

Form validation rules are implemented independently on both sides: the
backend DTOs enforce the source-of-truth rules
(`Validation/WeightRangeAttribute.cs` etc., see
[backend-architecture.md](backend-architecture.md)), and the frontend
mirrors the same rules for a responsive UX — e.g.
`SetsTableRow.handleWeightChange` uses a regex plus a numeric check to
block keystrokes that would produce an invalid weight (not 0–9999, not in
steps of 0.5) before the value is even committed to state, and `login.tsx`
does manual required-field/length checks before calling the API. The
comments in the frontend validation code explicitly reference which
backend rule they're mirroring, which is a handy pattern if this ever
grows into a shared validation schema (e.g. Zod) down the line.

## UI/styling conventions

- **HeroUI components** are used directly wherever possible
  (`Button`, `Input`, `Form`, `Modal`, `Navbar`, `Table`, `Tabs`,
  `useDisclosure` for modal open/close state, `addToast` for
  notifications) rather than building custom equivalents.
- **Tailwind utility classes** handle layout/spacing directly in JSX,
  keeping styling co-located with markup. `styles/globals.css` is
  minimal: just the three `@tailwind` directives plus a couple of global
  overrides (hiding number input spin buttons).
- **Dark mode** uses `next-themes`'s `class` strategy
  (`attribute="class"` in `_app.tsx`, `darkMode: "class"` in
  `tailwind.config.ts`), defaulting to dark (`defaultTheme="dark"`).
  Theme-specific images (e.g. the landing page screenshots) ship as
  separate light/dark `.webp` assets swapped based on `resolvedTheme`,
  rather than using CSS filters.
- **Icons** come from two sources: `@iconify/react`'s `<Icon icon="..." />`
  for most icons (loaded by name from Iconify's icon sets), and a handful
  of hand-written SVG components in `icons/` for icons used adjacent to
  HeroUI form controls (e.g. `DeleteIcon`, `EditIcon`).

## Dependency notes

- `@supabase/supabase-js` is listed as a dependency in `package.json` but
  isn't imported anywhere in the codebase — it's a leftover from an
  earlier iteration of the project and can be removed next time you're
  touching dependencies.

## Dependency version strategy

- **HeroUI stays on v2 indefinitely.** HeroUI v3 is a substantial rewrite
  (component APIs and styling approach changed significantly enough that
  migrating would mean effectively re-implementing most of the UI layer).
  Given the size of that effort relative to the benefit, this project is
  expected to remain on HeroUI v2 for the foreseeable future. Always
  consult the **v2** HeroUI documentation, not the current default (v3)
  docs.
- **Tailwind v3 → v4 is a plausible future upgrade**, but it's gated on
  HeroUI: HeroUI's own Tailwind v4 support starts at **HeroUI v2.8.0**
  (this project is currently on v2.7.8), so upgrading Tailwind first would
  break HeroUI's styling. The realistic path is: upgrade HeroUI to
  `>=2.8.0` (still v2, so no rewrite required) first, then upgrade
  Tailwind to v4 and migrate `tailwind.config.ts` to v4's CSS-based config.
