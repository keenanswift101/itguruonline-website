---
phase: 05-scheduled-automation
plan: 03
subsystem: api
tags: [nextjs-route-handler, vitest, admin-auth, automation]

# Dependency graph
requires:
  - phase: 05-02
    provides: runEnquiryReminderJob, runInvoiceReminderJob, runRecurringBillingJob (shared automation job modules)
provides:
  - POST /api/admin/automations/[job]/run — admin-authenticated manual trigger endpoint for any of the three automation jobs (AUTOMATE-04)
  - @netlify/functions devDependency (Config type support for Plan 05-04 scheduled functions)
affects: [05-04, 05-05, 05-06]

# Tech tracking
tech-stack:
  added: ["@netlify/functions (devDependency)"]
  patterns:
    - "Thin API route wrappers over shared job modules — route handler contains only auth/validation/dispatch, zero business logic"
    - "vi.mock('resend') alongside auto-mocking modules that transitively import src/lib/email.ts, to avoid the real Resend constructor's 'Missing API key' error during automocking (automock still loads the real module graph to introspect exports before replacing them with vi.fn() stubs)"

key-files:
  created:
    - src/app/api/admin/automations/[job]/run/route.ts
  modified:
    - src/app/api/admin/automations/[job]/run/route.test.ts
    - package.json
    - package-lock.json

key-decisions:
  - "vi.mock('resend') added to route.test.ts (not in the plan's literal code sample) — required because auto-mocking the three job modules with vi.mock(path) (no factory) still loads their real module graph first to introspect exports, which transitively hits src/lib/email.ts's module-scope `new Resend(process.env.RESEND_API_KEY)` and throws in the test environment where no API key is set."

patterns-established:
  - "Automation job modules remain the single source of truth for business logic; this route and 05-04's Netlify Scheduled Functions are both thin wrappers with identical dispatch logic, differing only in triggeredBy value and auth mechanism"

requirements-completed: [AUTOMATE-04]

# Metrics
duration: ~3min
completed: 2026-07-04
---

# Phase 05 Plan 03: Admin Manual Trigger Route Summary

**POST /api/admin/automations/[job]/run — admin-only manual trigger endpoint dispatching to the three shared automation job modules, so any reminder/billing job can be run on-demand from the dev branch without waiting for a scheduled-function deploy.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-04T06:20:58Z
- **Completed:** 2026-07-04T06:23:32Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- `@netlify/functions` installed as a devDependency, unblocking the `Config` type import needed by Plan 05-04's Netlify Scheduled Functions
- `POST /api/admin/automations/[job]/run` created: `requireAdmin()` called first (401 before any params/DB access), validates `job` against a `VALID_JOBS` const (404 for anything else), dispatches to `runEnquiryReminderJob` / `runInvoiceReminderJob` / `runRecurringBillingJob` with `{ triggeredBy: "manual" }`, returns `{ ok: true, summary }` on success or `{ ok: false, error }` with 500 on job-function throw
- Wave 0's `it.todo()` stubs in `route.test.ts` replaced with 6 real tests: 401 (no session), 404 (unknown job), 200 for each of the 3 jobs (asserting both the response body and that `triggeredBy: "manual"` was passed), and 500 (job throws)
- `npx vitest run src/app/api/admin/automations/` passes (6/6); `npx tsc --noEmit` clean; full project suite (`npx vitest run`) still green (119 passed, 47 skipped, 3 todo)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @netlify/functions devDependency** - `b44faf1` (chore)
2. **Task 2: Create admin trigger route + fill in unit tests** - `4651028` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/app/api/admin/automations/[job]/run/route.ts` - Admin trigger route: requireAdmin() -> VALID_JOBS check -> dispatch to job module -> JSON response
- `src/app/api/admin/automations/[job]/run/route.test.ts` - 6 unit tests (was 5 `it.todo()` stubs); adds `vi.mock("resend")` beyond the plan's literal sample
- `package.json` / `package-lock.json` - `@netlify/functions` added as devDependency

## Decisions Made
- Added `vi.mock("resend")` to the test file, which the plan's code sample didn't include. Without it, automocking `@/lib/automation/enquiry-reminder` (etc.) still imports the real module first to introspect its exports, which transitively executes `src/lib/email.ts`'s module-scope `new Resend(process.env.RESEND_API_KEY)` — throwing "Missing API key" in the test environment. This mirrors the exact same `vi.mock("resend")` pattern already used in the 05-02 job-module test files, so it's consistent with established project convention rather than a new pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added vi.mock("resend") to route.test.ts**
- **Found during:** Task 2 (filling in route.test.ts)
- **Issue:** Running the plan's literal test file as written failed all 6 tests with "Error: Missing API key. Pass it to the constructor `new Resend(\"re_123\")`" — `vi.mock("@/lib/automation/enquiry-reminder")` (and the other two job-module mocks) are automocks with no factory, so Vitest still loads the real module graph to introspect its shape before replacing exports with `vi.fn()`. That real module graph includes `src/lib/email.ts`, which constructs a real `Resend` client at module scope and throws when `RESEND_API_KEY` is unset (as it is in the test environment).
- **Fix:** Added `vi.mock("resend")` (auto-mock, no factory) alongside the existing job-module mocks — this replaces the `Resend` class with an automocked stub whose constructor doesn't run the real "missing key" validation, unblocking the module graph load. Matches the identical pattern already used in `src/lib/automation/enquiry-reminder.test.ts` etc. from Plan 05-02.
- **Files modified:** src/app/api/admin/automations/[job]/run/route.test.ts
- **Verification:** `npx vitest run src/app/api/admin/automations/` — 6/6 pass; full suite `npx vitest run` still green afterward
- **Committed in:** 4651028 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Necessary to make the plan's specified tests runnable at all in this project's test environment (no `RESEND_API_KEY` set for unit tests). No scope creep — no new files, no architectural change, just one added `vi.mock()` line matching an already-established project pattern.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required. The route is reachable at `/api/admin/automations/[job]/run` on any deploy (dev or main) once the owner is logged into the admin portal; no admin UI button wired to it yet (out of scope for this plan — Plan 05-05/05-06 per the roadmap own the admin UI surface).

## Next Phase Readiness
- The three job modules now have two call sites established: this manual trigger route (05-03) and Plan 05-04's Netlify Scheduled Functions (not yet built) — both are thin wrappers with no duplicated business logic
- `@netlify/functions` is now available for 05-04's `Config` type import
- No blockers for 05-04

---
*Phase: 05-scheduled-automation*
*Completed: 2026-07-04*

## Self-Check: PASSED

`src/app/api/admin/automations/[job]/run/route.ts` verified present on disk. Both task commits (`b44faf1`, `4651028`) verified present in `git log`. `npx vitest run src/app/api/admin/automations/` passes (6/6). `npx tsc --noEmit` exits clean. Full project suite `npx vitest run` still green (119 passed, 47 skipped, 3 todo).
