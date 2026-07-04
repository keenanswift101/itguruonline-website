---
phase: 05-scheduled-automation
plan: 01
subsystem: database
tags: [drizzle, postgres, vitest, migrations, schema]

# Dependency graph
requires:
  - phase: 04-invoicing
    provides: invoices and invoiceLineItems tables that this plan extends with recurring-billing/reminder columns
provides:
  - billingSchedules and automationRuns Drizzle tables
  - invoices.billingScheduleId / billingPeriodStart / lastRemindedAt columns + invoices_recurring_unique constraint
  - contactEnquiries.lastRemindedAt column
  - 0004_automation.sql migration (DDL + site_settings seed for reminder cadence thresholds)
  - Wave 0 vitest stub files for all four Phase 5 automation jobs/route
affects: [05-02, 05-03, 05-04, 05-05, 05-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "describeIfDb gate pattern (const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip) for integration-only test blocks"
    - "it.todo() Wave 0 stub scaffolding filled in by later plans in the same phase"

key-files:
  created:
    - netlify/database/migrations/0004_automation.sql
    - src/lib/automation/enquiry-reminder.test.ts
    - src/lib/automation/invoice-reminder.test.ts
    - src/lib/automation/recurring-billing.test.ts
    - src/app/api/admin/automations/[job]/run/route.test.ts
  modified:
    - src/lib/db/schema.ts
    - netlify/database/migrations/meta/_journal.json

key-decisions:
  - "Migration numbered 0004_automation.sql, not 0003 as the plan assumed -- 0003_invoices.sql already exists on disk from Phase 4"
  - "Renamed drizzle-kit's random generated slug (0004_slow_talon) to 0004_automation for consistency with existing descriptive migration filenames"
  - "Test stub describeIfDb gates use NETLIFY_DB_URL, not the plan's literal NETLIFY_DATABASE_URL -- matches this project's actual runtime env var and the already-completed 18-file project-wide fix"

patterns-established:
  - "billingSchedules defined before invoices in schema.ts so the FK thunk resolves at runtime"
  - "Recurring-billing idempotency enforced at the DB layer via invoices_recurring_unique(billing_schedule_id, billing_period_start)"

requirements-completed: [AUTOMATE-01, AUTOMATE-02, AUTOMATE-03, AUTOMATE-04]

# Metrics
duration: ~10min
completed: 2026-07-04
---

# Phase 05 Plan 01: Schema & Wave 0 Test Scaffolding Summary

**Extended Drizzle schema with billingSchedules/automationRuns tables plus recurring-billing/reminder columns on invoices and contact_enquiries, generated the 0004_automation.sql migration, and scaffolded 4 Wave 0 vitest stub files for the rest of Phase 5.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-04T08:00:00+02:00 (approx)
- **Completed:** 2026-07-04T08:05:24+02:00
- **Tasks:** 3
- **Files modified:** 8 (2 modified, 6 created)

## Accomplishments
- `billingSchedules` and `automationRuns` tables added to `src/lib/db/schema.ts`, with `invoices` extended (billingScheduleId FK, billingPeriodStart, lastRemindedAt, invoices_recurring_unique constraint) and `contactEnquiries` extended (lastRemindedAt)
- `netlify/database/migrations/0004_automation.sql` generated via `drizzle-kit generate` and verified to contain both CREATE TABLEs, all 4 ALTER TABLE column additions, both FK constraints, the unique constraint, and the `site_settings` seed INSERT (enquiry_stale_days=7, invoice_overdue_reminder_days=1) with ON CONFLICT DO NOTHING
- 4 Wave 0 test stub files created with `it.todo()` scaffolding (25 todo tests total) so plans 05-02 through 05-05 have test files ready to fill in

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schema.ts with new tables and column additions** - `4af5f6f` (feat)
2. **Task 2: Generate Phase 5 migration and append seed DML** - `5492b55` (feat)
3. **Task 3: Create Wave 0 test stub files** - `e8f4304` (test)
4. **Deviation fix: describeIfDb env var correction** - `a7dae07` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/lib/db/schema.ts` - Added billingSchedules, automationRuns tables; extended invoices and contactEnquiries
- `netlify/database/migrations/0004_automation.sql` - Phase 5 DDL + site_settings seed
- `netlify/database/migrations/meta/0004_snapshot.json` - drizzle-kit schema snapshot (generated)
- `netlify/database/migrations/meta/_journal.json` - migration journal entry (tag renamed to 0004_automation)
- `src/lib/automation/enquiry-reminder.test.ts` - Wave 0 stub for AUTOMATE-01
- `src/lib/automation/invoice-reminder.test.ts` - Wave 0 stub for AUTOMATE-02
- `src/lib/automation/recurring-billing.test.ts` - Wave 0 stub for AUTOMATE-03
- `src/app/api/admin/automations/[job]/run/route.test.ts` - Wave 0 stub for AUTOMATE-04

## Decisions Made
- Migration filename bumped to `0004_automation.sql` (plan assumed `0003_automation.sql`, but `0003_invoices.sql` already exists from Phase 4 on this branch)
- Renamed drizzle-kit's auto-generated slug/tag (`slow_talon`) to `automation` for consistency with the project's existing descriptive migration names
- Test stub `describeIfDb` gates use `NETLIFY_DB_URL` instead of the plan's literal `NETLIFY_DATABASE_URL` text, matching this project's actual runtime env var convention

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration renumbered from 0003 to 0004**
- **Found during:** Task 2 (generate migration)
- **Issue:** Plan instructed creating `0003_automation.sql`, but `netlify/database/migrations/0003_invoices.sql` already exists (Phase 4 was executed on this branch, unlike the plan's fallback assumption that Phases 3-4 might not exist yet)
- **Fix:** Let `drizzle-kit generate` auto-assign the next sequence number (0004), then renamed the output file and journal tag from the random slug to `0004_automation.sql` for naming consistency
- **Files modified:** netlify/database/migrations/0004_automation.sql, netlify/database/migrations/meta/_journal.json, netlify/database/migrations/meta/0004_snapshot.json
- **Verification:** `npx tsc --noEmit` clean; file contents manually diffed against the plan's required DDL statements (all present)
- **Committed in:** 5492b55 (Task 2 commit)

**2. [Rule 1 - Bug] Test stub env var corrected to NETLIFY_DB_URL**
- **Found during:** Task 3 (test stub creation), caught before finalizing based on this session's critical project constraints
- **Issue:** The plan's literal code block specified `process.env.NETLIFY_DATABASE_URL` for the `describeIfDb` gate. This project's actual Netlify Database env var is `NETLIFY_DB_URL` — the legacy name is never set in any environment (this exact bug caused a real production outage earlier this session and was already fixed across 18 other test files project-wide per STATE.md).
- **Fix:** Changed all 4 new stub files to gate on `process.env.NETLIFY_DB_URL` instead
- **Files modified:** src/lib/automation/enquiry-reminder.test.ts, src/lib/automation/invoice-reminder.test.ts, src/lib/automation/recurring-billing.test.ts, src/app/api/admin/automations/[job]/run/route.test.ts
- **Verification:** `npx vitest run` still passes (23 passed/4 skipped test files, 25 todo)
- **Committed in:** a7dae07 (separate fix commit, after Task 3's `e8f4304`)

---

**Total deviations:** 2 auto-fixed (1 blocking/naming, 1 bug/correctness)
**Impact on plan:** Both fixes necessary for correctness and consistency with existing project conventions. No scope creep — no new tables, columns, or files beyond what the plan specified.

## Issues Encountered
- `npm run lint` (`next lint`) fails with an unrelated "Invalid project directory" CLI error — pre-existing, out of scope for this plan (not caused by any file this plan touched); not fixed per scope boundary rules.

## User Setup Required
None - no external service configuration required. The migration file (0004_automation.sql) has not been applied to any database yet; per plan instructions, only the file was generated (no `db:push`/`db:migrate` run). Application happens at deploy time per the project's existing migration-application process.

## Next Phase Readiness
- Schema, migration, and all 4 Wave 0 test stubs are in place for plans 05-02 through 05-06 to build the actual job implementations and route handler against
- `billingSchedules` → `hostingPackages` FK and `invoices` → `billingSchedules` FK + `invoices_recurring_unique` constraint are ready for the recurring-billing job (05-0x) to rely on for idempotency
- No blockers for subsequent Phase 5 plans

---
*Phase: 05-scheduled-automation*
*Completed: 2026-07-04*

## Self-Check: PASSED

All created files verified present on disk; all 4 task commits (`4af5f6f`, `5492b55`, `e8f4304`, `a7dae07`) verified present in git log.
