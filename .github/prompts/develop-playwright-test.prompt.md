---
description: "Implement a Playwright spec file from an approved test-plans/*.md file in playwright-tests/"
agent: "agent"
argument-hint: "test-plans/<name>.md, plus any extra context"
---

# Develop a Playwright test from an approved test plan

The developer has approved a test plan in `playwright-tests/test-plans/` and
wants the corresponding spec implemented. They'll tell you which plan file
(and may give you extra context - e.g. specific test data to use, a second
test account, or scope changes). If they haven't named a file, ask which one.

## Before writing any test code

1. Read the referenced `test-plans/<name>.md` in full.
2. Read [playwright-tests/tests/helpers.ts](../../playwright-tests/tests/helpers.ts)
   - reuse existing helpers (`uniqueTitle`, `startNewWorkout`, `addExercise`,
     `saveWorkout`, `editWorkoutDetails`, `deleteWorkoutViaApi`,
     `pressIconTrigger`, `exerciseCard`, etc.) instead of reimplementing them.
     Add new *reusable* helpers there, not duplicated per spec file.
3. Read the actual frontend component(s) the plan covers (under
   `frontend/pages/` and `frontend/components/`) to find real labels, button
   text, roles, and structure. **Do not guess selectors** - a plan describes
   behavior, not implementation, so the exact strings/roles have to come from
   the real source.
4. Check [playwright-tests/playwright.config.ts](../../playwright-tests/playwright.config.ts)
   for which project(s)/folder the new spec belongs in (e.g. files under
   `tests/unauthenticated/` don't depend on the `setup-<browser>` projects or
   get `storageState`).

## Known component-library quirks (check these before assuming a bug)

These were confirmed against `@heroui/react` **2.7.8** (check
`frontend/package.json` for the version actually installed right now). If
that major version has changed since - e.g. a migration to HeroUI v3 - treat
everything below as a **hypothesis to re-verify, not a fact**: component
internals, ARIA roles, and interaction patterns can all change between major
versions. Confirm a quirk still reproduces (write a quick throwaway
diagnostic test, per the "Writing and verifying" section below) before
relying on its workaround; if something's changed, update this list (and
tell the developer) rather than silently carrying old workarounds forward or
silently assuming they're gone.

- **Icon-only Dropdown/Popover triggers wrapped in a `Tooltip`** (e.g. an
  "Actions" menu or an options popover) don't reliably open with a plain
  `.click()`. Use hover + `page.mouse.down()` + a short `waitForTimeout(50)` +
  `page.mouse.up()` instead. See `pressIconTrigger()` in `helpers.ts`.
- **Modals/popovers mark the rest of the page `aria-hidden` while open** -
  `getByRole` locators for anything behind them report "not found" (not
  "hidden") even though it's still visually there. Close the modal/popover
  (Escape, or the real close/confirm button) before asserting on the main
  page content.
- **Right after a modal-closing click, interacting with the page (e.g.
  `.fill()`) can race the close animation** and silently produce empty
  values. Wait for `expect(page.getByRole('dialog')).toHaveCount(0)` first.
- **Scoping one instance of a repeated component** (e.g. one card among
  several): there's no stable `data-testid`, so scope via an XPath ancestor
  search from a unique heading/label to a distinguishing descendant, e.g.
  `page.getByRole('heading', { name, exact: true }).locator('xpath=ancestor::div[.//button[normalize-space(text())="Add Set"]][1]')`.
- **HeroUI DatePicker/DateRangePicker**: click the target segment
  (`getByRole('spinbutton', { name: 'month, ...' })`, substring-match the
  "Start Date"/"End Date" part if it's a range) then
  `page.keyboard.type('MMDDYYYY')` - segments auto-advance. Keep test dates
  within a modest range of "today" (tens/hundreds of days) - multi-year jumps
  have made the picker unstable to interact with in Firefox.
- **Toasts stack and render bottom-center**, which can intercept clicks on
  buttons in that same area. Don't rely on toast text as a "did the action
  finish" signal for anything you're about to act on next - wait on the real
  network response instead (`page.waitForResponse(...)`, see `saveWorkout()`
  in `helpers.ts`). If you do need to dismiss one, use its real close button
  (`getByRole('button', { name: 'closeButton' })`) - `force: true` on a click
  does NOT help, it only skips Playwright's own pre-checks, not real
  browser hit-testing.
- Accessible names can appear to go missing from an ARIA snapshot dump when a
  *different* modal is open in the background (aria-hidden). Don't conclude
  an element lacks an aria-label from that alone - check with nothing else
  open.
- Saving a workout with the app's default auto-generated title
  (`[date] Workout`) can collide with another workout of the same title+date
  even after the first was soft-deleted (a real backend quirk). Always give
  test-created workouts a unique title via `uniqueTitle()`.
- For a shared, `beforeAll`-built fixture (read-only tests against common
  data, like `history.spec.ts`), add
  `test.describe.configure({ mode: 'serial' })` even if the tests don't need
  ordering - it keeps the file on one worker so `beforeAll` doesn't run
  multiple times under `fullyParallel: true`.

If you hit something new and non-obvious, note it for the developer so it
can be added to the project's known-quirks notes - don't silently work
around it without mentioning it.

## Writing and verifying the spec

1. Write the spec file, following the structure/naming of existing specs in
   `playwright-tests/tests/`.
2. Run it against the **local** dev servers, not staging, while iterating:
   ```bash
   cd playwright-tests
   BASE_URL=http://localhost:3000 API_URL=http://localhost:5258 npx playwright test tests/<file> --project=chromium --reporter=list
   ```
   (Frontend and backend must already be running locally - start them if
   they aren't.)
3. **Actually run it - don't just write code and call it done.** When a test
   fails, read the real error (accessibility snapshot in the failure's
   `error-context.md`, or a screenshot if that's not enough) and fix the
   real cause. If a locator's behavior is unclear, write a small throwaway
   diagnostic test to inspect the live page (screenshot, `page.content()`,
   accessibility snapshot) rather than guessing repeatedly - delete it once
   you have your answer.
4. Once it's green on `chromium`, run the full local suite for that file
   (all browser projects) to catch cross-browser differences.
5. Clean up: delete any throwaway diagnostic test files, and
   `rm -rf test-results playwright-report` before finishing.
6. If the plan's scope turned out to need adjusting while implementing
   (a scenario wasn't testable as written, a selector assumption was wrong,
   etc.), update `test-plans/<name>.md` to match reality and say so.

Optionally, the Playwright MCP server (configured in this workspace's
`.vscode/mcp.json`) can drive a real browser directly - useful for
confirming real selectors/accessibility structure while drafting, before
writing `getByRole(...)` calls by hand.

Don't verify against staging unless asked - that's a separate, slower step
the developer does deliberately once the local run is solid.
