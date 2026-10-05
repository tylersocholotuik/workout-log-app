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
- **TanStack Query v5** (`@tanstack/react-query`) — server-state caching,
  fetching, and mutations for all API data (see
  [Data fetching & server state](#data-fetching--server-state-tanstack-query)
  below).

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
│   ├── factories/     # "empty object" constructors for new Workout/Exercise/Set
│   └── queryClient.ts # Shared TanStack Query client + global error/retry config
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
- `apiErrors.ts` also exports an `ApiError` class (`Error` + a `status`
  field) and a `throwApiError(res, fallback)` helper, for call sites that
  need to branch on the HTTP status rather than just the message - e.g.
  `getWorkout` throws `ApiError` so the workout page can distinguish a
  `403` (someone else's workout) from any other failure.

## Data fetching & server state (TanStack Query)

All server data (workouts, exercises, the current user) is fetched and
cached through **TanStack Query** rather than ad hoc `useEffect` + `fetch`.
A single shared `QueryClient` (`lib/queryClient.ts`) is provided at the
root via `QueryClientProvider` in `_app.tsx`.

**Query keys** are plain arrays matching the resource, e.g. `["workouts"]`
(the history list), `["workout", workoutId]` (a single workout),
`["exercises"]`, `["currentUser"]`. Reads use `useQuery`; writes use
`useMutation`.

**Global error handling** lives in `lib/queryClient.ts`:
- `QueryCache`/`MutationCache` both have an `onError` that shows a generic
  error toast (`addToast`) for any query/mutation failure, so individual
  components don't need to each wire up their own failure toast.
- A query/mutation can opt out via `meta: { skipGlobalErrorToast: true }`
  when it already renders its own dedicated error UI (e.g.
  `SelectExerciseModal`'s create-exercise mutation shows the error inline
  on the name field, so the global toast would just duplicate it).
  `QueryCache.onError` also skips the toast specifically for a `403`
  `ApiError`, since the workout page renders a dedicated "not your
  workout" view for that case instead.
- `defaultOptions.queries.retry` skips TanStack's default retry-with-backoff
  for any 4xx `ApiError` (a client error like a 403/404 won't succeed on
  retry), while still retrying other failures up to 3 times.

**Mutations and cache updates**: rather than reflexively calling
`invalidateQueries` (which triggers a network refetch) after every
mutation, most mutations write the response directly into the cache with
`queryClient.setQueryData` when the response already contains the full
updated object - e.g. creating an exercise appends it to the `["exercises"]`
cache, saving a workout writes the updated `Workout` into
`["workout", workoutId]`. `invalidateQueries`/`removeQueries` are used
instead when a query's data is now wrong or gone rather than "fixed
in-place" - e.g. deleting a workout removes its own `["workout", id]`
cache entry (deferred until after navigating away, since removing it while
a component is still actively observing that key triggers an immediate
refetch of a now-404ing resource) and invalidates `["workouts"]` so the
history list picks up the deletion next time it's viewed.

**Local draft state still exists alongside the cache** where a page needs
to let the user make in-progress edits before saving - see
`WorkoutContext` below. The pattern is: seed local state from the query's
`data` once it arrives (via a `useEffect`, since this is populating
independently-mutable local state from an external source, not deriving a
value), then keep local edits in that state until a save mutation
succeeds, at which point both the local state and the query cache are
updated together so they never disagree.

## Authentication (`AuthProvider`)

`components/auth/AuthProvider.tsx` wraps the whole app (in `_app.tsx`,
inside the theme provider) and exposes `useAuth()`:

- Fetches the current user via `useQuery(["currentUser"], fetchCurrentUser)`
  (`GET /api/auth/me`). Since the auth cookie is `HttpOnly`, the frontend
  can't read it directly — asking the backend "who am I?" is how it learns
  whether the visitor is signed in.
- On every route change, a `useEffect` calls the query's own `refetch()`
  (re-verifying auth, e.g. after the cookie expired) and redirects to
  `/login` if it comes back with no user and the route is one of the
  `protectedPages` (currently `/history` and `/workout/[workoutId]`). This
  is one of the few `useEffect`s that's still appropriate under TanStack
  Query: it's an imperative side effect (navigation) triggered by a route
  change, not a data-fetching concern that Query would otherwise replace.
- `refreshUser(updatedUser?)` takes an *optional* `User | null`. Login/
  register already return the fresh `User` in their response, so passing
  it writes straight into the `["currentUser"]` cache via
  `queryClient.setQueryData` - avoiding a redundant `GET /api/auth/me`
  round trip. Called with no arguments, it falls back to
  `invalidateQueries` so the next read refetches from the server (used
  when there's no already-known `User` object on hand).
- `logout()` calls the backend logout endpoint (which revokes the token
  server-side), clears the `["currentUser"]` cache to `null`, and
  redirects to `/login`.

Route protection is handled client-side inside `AuthProvider` rather than
with a `middleware.ts` route guard. The query's own `isLoading` flag lets
consumers (e.g. `NavBar`) avoid flashing the wrong content (like a "Login"
link) while the initial `/api/auth/me` check is still in flight.

## Rendering model

Pages are client-rendered: each page fetches its own data (workouts,
exercises, current user) via TanStack Query's `useQuery`, showing a HeroUI
`<Spinner>` while the query's `isLoading` is `true`. This keeps the
data-fetching pattern consistent across every page. Since every
data-bearing page requires authentication anyway, server-rendering that
data ahead of time wouldn't gain much — a straightforward future
enhancement would be adopting `getServerSideProps` (or the App Router) for
pages that would benefit from a faster first paint.

The one recurring exception is theme-dependent UI (`index.tsx`,
`DarkModeSwitch`): since `next-themes` can't know the real theme during
server rendering, these components track a local `mounted` flag and only
render theme-specific output after the client mounts, avoiding a
hydration mismatch.

## State management

State is handled with plain React primitives (`useState` + Context) for
anything that isn't server data, alongside TanStack Query for everything
that is, at three scopes:

- **App-wide:** the current user lives in TanStack Query's cache
  (`["currentUser"]`), exposed app-wide via `AuthContext`/`AuthProvider`.
- **Page-wide:** `WorkoutContext` in `pages/workout/[workoutId].tsx` - the
  workout being edited is `useState` at the page level (seeded from the
  `["workout", workoutId]` query once it loads) and shared with every
  nested exercise/set component via context, since the whole workout tree
  is saved as one unit (see [backend-architecture.md](backend-architecture.md)
  on whole-tree `PUT` updates). This local draft is necessary because the
  workout is mutated in-place by the user (adding exercises/sets) before
  being saved - it can't just be the query's `data` directly, since a
  background refetch should never silently clobber in-progress edits.
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
