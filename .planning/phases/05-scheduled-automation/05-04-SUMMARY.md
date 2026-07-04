---
phase: 05-scheduled-automation
plan: 04
subsystem: infra
tags: [netlify-scheduled-functions, cron, esm, tsconfig]

# Dependency graph
requires:
  - phase: 05-02
    provides: runEnquiryReminderJob, runInvoiceReminderJob, runRecurringBillingJob (shared automation job modules)
  - phase: 05-03
    provides: "@netlify/functions devDependency (Config type), thin-wrapper dispatch pattern"
provides:
  - netlify/functions/enquiry-reminder.mts — Netlify Scheduled Function, daily 08:00 UTC (AUTOMATE-01)
  - netlify/functions/invoice-overdue-reminder.mts — Netlify Scheduled Function, daily 08:00 UTC (AUTOMATE-02)
  - netlify/functions/recurring-billing.mts — Netlify Scheduled Function, monthly 1st 07:00 UTC (AUTOMATE-03)
  - tsconfig.json now includes **/*.mts so tsc actually type-checks Netlify Scheduled Functions
affects: [05-05, 05-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Netlify Scheduled Functions (.mts, v2 ESM format: default async (req: Request) => Promise<void> + export const config: Config) are thin wrappers with zero business logic, calling the same shared job modules as the admin manual-trigger route (05-03), differing only in triggeredBy value"

key-files:
  created:
    - netlify/functions/enquiry-reminder.mts
    - netlify/functions/invoice-overdue-reminder.mts
    - netlify/functions/recurring-billing.mts
  modified:
    - tsconfig.json

key-decisions:
  - "Added **/*.mts to tsconfig.json's include array — without it, npx tsc --noEmit silently skipped all three new files entirely (confirmed by injecting a deliberate type error and observing exit 0), meaning the plan's stated verification step would never have caught a real type error in these production cron entry points"

patterns-established:
  - "Any future .mts file (Netlify Scheduled Function or otherwise) is now covered by the project's tsc --noEmit typecheck, not silently skipped"

requirements-completed: [AUTOMATE-01, AUTOMATE-02, AUTOMATE-03]

# Metrics
duration: ~8min
completed: 2026-07-04
---

# Phase 05 Plan 04: Netlify Scheduled Functions Summary

**Three Netlify Scheduled Functions (.mts, v2 ESM format) wired to the shared automation job modules, plus a tsconfig fix so these production cron entry points are actually type-checked instead of silently skipped by tsc.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-04T06:24:50Z (approx, per STATE.md last session timestamp)
- **Completed:** 2026-07-04T06:28:30Z
- **Tasks:** 1
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `netlify/functions/enquiry-reminder.mts` — daily 08:00 UTC (`schedule: "0 8 * * *"`), calls `runEnquiryReminderJob({ triggeredBy: "scheduled" })`
- `netlify/functions/invoice-overdue-reminder.mts` — daily 08:00 UTC, calls `runInvoiceReminderJob({ triggeredBy: "scheduled" })`
- `netlify/functions/recurring-billing.mts` — monthly on the 1st at 07:00 UTC (`schedule: "0 7 1 * *"`), calls `runRecurringBillingJob({ triggeredBy: "scheduled" })`
- All three use the exact v2 Netlify Scheduled Functions format: default export is an async arrow function `(req: Request): Promise<void>`, plus a named `config: Config` export with the cron `schedule` string — no `[functions]` section needed in `netlify.toml` (Netlify auto-discovers `netlify/functions/`)
- Discovered and fixed a real gap in the plan's own verification step: `npx tsc --noEmit` was silently skipping all three `.mts` files because `tsconfig.json`'s `include` array only had `**/*.ts`/`**/*.tsx` patterns (verified by deliberately injecting a `string`-vs-`number` type error into `triggeredBy` and confirming `tsc` still exited 0). Added `**/*.mts` to `include`, re-confirmed the same injected error is now caught (`error TS2322`), then restored the correct code and confirmed a clean `exit 0`.
- `npx tsc --noEmit` passes (verified meaningfully this time); `npx vitest run` still green (119 passed, 47 skipped, 3 todo, 27/27 files)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create netlify/functions/ directory and three scheduled function files** - `4ad5dfe` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `netlify/functions/enquiry-reminder.mts` - Scheduled Function, daily 08:00 UTC, AUTOMATE-01 wrapper
- `netlify/functions/invoice-overdue-reminder.mts` - Scheduled Function, daily 08:00 UTC, AUTOMATE-02 wrapper
- `netlify/functions/recurring-billing.mts` - Scheduled Function, monthly 07:00 UTC on the 1st, AUTOMATE-03 wrapper
- `tsconfig.json` - Added `**/*.mts` to `include` so these files are actually type-checked

## Decisions Made
- Added `**/*.mts` to `tsconfig.json`'s `include` array (not in the plan's literal task list). Without this, the plan's own stated verification (`npx tsc --noEmit` must exit 0) was giving a false-positive pass — the files were never being parsed by tsc at all, so any real type error in a production cron entry point would ship unnoticed. Confirmed via a deliberate-error test before and after the fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig.json didn't include .mts files, making the plan's own verification step a no-op**
- **Found during:** Task 1 (verification step, running `npx tsc --noEmit` after creating the three files)
- **Issue:** `tsconfig.json`'s `include` array (`"**/*.ts"`, `"**/*.tsx"`, plus `.next` glob patterns) does not match files with a `.mts` extension. `npx tsc --noEmit` returned exit 0 immediately after file creation, which looked like a pass — but injecting a deliberate type error (`triggeredBy: 123` instead of `"scheduled"`) into one of the new files and re-running `tsc` still returned exit 0, proving the files were never actually being parsed/checked.
- **Fix:** Added `"**/*.mts"` to `tsconfig.json`'s `include` array. Re-ran the same deliberate-error test — `tsc` now correctly reported `error TS2322: Type 'number' is not assignable to type 'string'.` at the exact injected line. Restored the correct code and confirmed a clean `exit 0`.
- **Files modified:** tsconfig.json
- **Verification:** Before fix: injected type error -> `tsc` exit 0 (false pass). After fix: injected type error -> `tsc` exit 2 with correct error location; restored code -> `tsc` exit 0 (true pass). Full `npx vitest run` suite still green afterward (119 passed, 47 skipped, 3 todo).
- **Committed in:** 4ad5dfe (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking — plan's stated verification method was silently non-functional for the exact file type this plan creates)
**Impact on plan:** Necessary — without this fix, `npx tsc --noEmit` passing would never have meant what the plan's success criteria claimed it meant for these three files. No scope creep — a single one-line addition to an existing config array, no new tooling or architecture.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required. These scheduled functions only execute automatically on production (`main` branch) deploys per Netlify's platform behavior (documented in CLAUDE.md's deployment section) — they will not run on `dev`. The admin manual-trigger route from 05-03 remains the way to exercise this logic on `dev`.

## Next Phase Readiness
- All three Netlify Scheduled Functions exist and are wired to the shared job modules; on the next `main` deploy, Netlify will auto-discover `netlify/functions/` and register the cron schedules (no `netlify.toml` changes needed)
- Per CLAUDE.md's deployment section, these will only actually start firing once `dev` is merged to `main` and pushed — until then this is planned/executed but not yet "live" (same lesson PROJECT.md flagged from the Phases 1-4 outage: verify actual production execution, not just merge status, once this ships)
- Fallback path documented in the plan (relative `.js`-extension imports) was not needed — the `@/` alias resolved cleanly through `npx tsc --noEmit`; still worth watching Netlify function logs on first real deploy in case esbuild's bundler behaves differently from tsc's module resolution
- No blockers for 05-05/05-06

---
*Phase: 05-scheduled-automation*
*Completed: 2026-07-04*

## Self-Check: PASSED

All three files verified present on disk (`netlify/functions/enquiry-reminder.mts`, `netlify/functions/invoice-overdue-reminder.mts`, `netlify/functions/recurring-billing.mts`). Task commit `4ad5dfe` verified present in `git log`. `npx tsc --noEmit` exits 0 (meaningfully — confirmed via before/after injected-error test). `npx vitest run` passes (119 passed, 47 skipped, 3 todo, 27/27 files).
