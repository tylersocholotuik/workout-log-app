# Playwright Tests

End-to-end tests for workout-log-app, covering auth, workout CRUD, history,
and the calculator page.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Install Playwright's browser binaries (one-time, or after a Playwright
   version bump):

   ```bash
   npx playwright install
   ```

3. Copy [.env.example](.env.example) to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   - `BASE_URL` / `API_URL` default to local dev servers (`localhost:3000` /
     `localhost:5258`). Point them at a staging deployment instead if you
     want to test against it.
   - `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` are a dedicated Playwright test
     account. Create this account in whichever environment you're pointing
     at (it doesn't need to be a "real" user). In CI, these come from GitHub
     Environment secrets instead of a `.env` file.

`.env` is gitignored - never commit real credentials.

## Running tests

For a local run, start the frontend (`npm run dev` in `frontend/`) and
backend (`dotnet run` in `backend/WorkoutLogAPI/WorkoutLogAPI/`) yourself
first - Playwright doesn't start them for you. Then, from this folder:

```bash
npm test
```

Common variations:

```bash
# One spec file
npx playwright test tests/workout.spec.ts

# One browser project
npx playwright test --project=chromium

# One test by name
npx playwright test -g "editing an existing workout succeeds"

# Point at staging for this run only, without editing .env
BASE_URL=https://your-staging-url API_URL=https://your-staging-api npx playwright test
```

### Local vs. staging

- **Locally**, all three browser projects (`chromium`, `firefox`, `webkit`)
  run against `localhost`.
- **Against staging**, `webkit` is automatically excluded (see
  [playwright.config.ts](playwright.config.ts)) - it doesn't reliably send
  the auth cookie once the frontend and backend are on different domains, a
  Playwright/WebKit limitation, not an app bug.
- Staging round-trips are slower, so `expect.timeout` and the overall test
  `timeout` are both higher when `BASE_URL` isn't `localhost`. If you still
  hit timeouts against a cold Render free-tier backend, re-run - the first
  request after a period of inactivity can take a while to wake it up
  (`global-setup.ts` already waits on `/health-check` before tests start, but
  that only confirms the process/DB are up, not that every endpoint is warm).

### Viewing results

```bash
npx playwright show-report
```

## Project structure

```
tests/
  auth.setup.ts             # logs in once per browser, saves storage state
  helpers.ts                # shared helpers (createWorkout, saveWorkout, etc.)
  workout.spec.ts           # workout CRUD (authenticated)
  history.spec.ts           # history page filtering/grouping (authenticated)
  home.spec.ts              # smoke test that auth state is reused
  unauthenticated/
    login.spec.ts           # login form validation
    register.spec.ts        # register form validation
    calculator.spec.ts      # calculator page (no auth, no backend calls)
test-plans/
  TEMPLATE.md                # copy this for a new flow's test plan
  *.md                       # one file per flow, written before its spec
```

Shared test helpers live in `tests/helpers.ts` - add new reusable steps there
instead of duplicating them per spec file.

## Test development workflow

New tests are planned before they're written. The loop is:

1. **Write (or update) a test plan** in `test-plans/`, one file per user
   flow. Copy [test-plans/TEMPLATE.md](test-plans/TEMPLATE.md) for a new
   flow - it has the sections every plan follows (spec file, project(s),
   preconditions, purpose, and a flat scenario list in
   `**name** — action → expected outcome` form).
   - Keep scenarios at the *behavior* level (what a user does, what they see)
     - not implementation detail like exact selectors or button text. Those
     get figured out while writing the spec, by reading the actual component
     source.
   - Don't try to exhaustively test client-side input validation/regex
     boundaries here - a component/unit test is the right place for that
     (there isn't one set up in this repo yet). E2E scenarios should cover
     one or two representative cases per input, not every edge case.
   - **When a feature changes**, update its existing test-plan file (and the
     corresponding spec afterwards) rather than letting them drift out of
     sync with the app.
2. **Review the plan** yourself before any test code gets written - it's
   much cheaper to correct scope/scenarios in a markdown file than in
   finished Playwright code.
3. **Hand the approved plan to GitHub Copilot** to implement the spec file.
   Use the [`/develop-playwright-test`](../.github/prompts/develop-playwright-test.prompt.md)
   prompt rather than just describing the task in your own words - a plain
   "please implement `test-plans/<name>.md`" works fine in a chat session
   that already has a lot of accumulated context (e.g. one that wrote
   several other specs first), but a **fresh chat session has none of
   that**. The prompt file bakes in the project's conventions (reuse
   `helpers.ts`, read the real component source instead of guessing
   selectors, known HeroUI/React Aria quirks, running against local dev
   servers and iterating on real failures instead of just writing code and
   stopping) so results are consistent regardless of what the chat already
   knows. In the Chat view, type `/develop-playwright-test` and name the
   plan file (plus any extra context, like specific test data to use).
4. Once you're happy with a spec locally, it's worth a run against staging
   too (see [Local vs. staging](#local-vs-staging)) - some things (cross-site
   cookies, real network latency, a live database) only surface there.

### Using the Playwright MCP server

Copilot can drive a real browser directly (navigate, click, inspect the
accessibility tree, take screenshots) via the Playwright MCP server, which is
useful for reproducing the exact DOM/accessibility structure a new test needs
instead of guessing at selectors.

It's already configured for this workspace in
[.vscode/mcp.json](../.vscode/mcp.json):

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

To use it:

1. Open the Extensions view (⇧⌘X) and make sure MCP servers are enabled, or
   open the Chat view and look for the `playwright` server under **MCP
   Servers** in the tools picker.
2. The first time it's used, VS Code will prompt you to trust the server -
   confirm this to let it start (it launches a real, controllable browser).
3. Ask Copilot to use it directly, e.g. "Use the Playwright MCP server to
   open `/history` and show me the accessibility tree" - useful when
   drafting a new spec and you want to confirm real selectors before writing
   `getByRole(...)` calls by hand.

This is a separate thing from the `@playwright/test` npm package used to
actually *run* the test suite - the MCP server is a development aid for
exploring the app while writing tests, not something the tests themselves
depend on.

## Known quirks

A running list of non-obvious things about this app/component library that
affect how tests have to be written (icon buttons needing a
hover+mousedown dance instead of `.click()`, modals/popovers marking the
background `aria-hidden`, the WebKit + staging cookie limitation, etc.) is
kept in this workspace's repo-scoped agent memory rather than duplicated
here - ask Copilot if you're not sure why a test does something unusual.

Most of these are specific to the currently-installed `@heroui/react`
version (see `frontend/package.json`). If/when this app migrates to HeroUI
v3, don't assume they still apply - they'll need to be re-verified (and the
notes updated) against the new version rather than carried forward as-is.
