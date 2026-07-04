---
phase: 05-scheduled-automation
plan: 02
subsystem: automation
tags: [drizzle, postgres, vitest, resend, cron-jobs, transactions]

# Dependency graph
requires:
  - phase: 05-01
    provides: billingSchedules/automationRuns tables, invoices.billingScheduleId/billingPeriodStart/lastRemindedAt, contactEnquiries.lastRemindedAt, 0004_automation.sql migration, Wave 0 test stubs
provides:
  - runEnquiryReminderJob (AUTOMATE-01) — one summary email per run, deduped via lastRemindedAt
  - runInvoiceReminderJob (AUTOMATE-02) — one email per overdue invoice, deduped via lastRemindedAt
  - runRecurringBillingJob (AUTOMATE-03) — idempotent draft invoice + line item creation per active billing schedule
  - Full unit test coverage (18 tests) for all three job modules, mocked DB/email/tx
affects: [05-03, 05-04, 05-05, 05-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.hoisted() shared mock db/tx chain builders for select/from/where, insert/values, update/set/where, and a fake withTxDb(fn) => fn(fakeTxDb).transaction(tx => fn(tx)) chain for testing atomic multi-statement writes without a real database"
    - "Job modules return { sent/inserted, skipped } counts and always write an automation_runs audit row on both success and error (rethrowing after logging the error row)"

key-files:
  created:
    - src/lib/automation/enquiry-reminder.ts
    - src/lib/automation/invoice-reminder.ts
    - src/lib/automation/recurring-billing.ts
  modified:
    - src/lib/automation/enquiry-reminder.test.ts
    - src/lib/automation/invoice-reminder.test.ts
    - src/lib/automation/recurring-billing.test.ts

key-decisions:
  - "contactEnquiries has no updatedAt column in schema.ts (plan's interfaces section was wrong about this) -- staleness for AUTOMATE-01 is computed from createdAt instead"
  - "invoice-reminder.ts reuses formatInvoiceNumber from src/lib/invoices.ts rather than duplicating the plan's inline copy of that function"
  - "recurring-billing.ts wraps the invoice + line-item insert in withTxDb()/db.transaction() instead of two sequential plain db.insert() calls -- required by this project's CRITICAL constraint that multi-statement atomic writes must use withTxDb (neon-http db.transaction() throws in drizzle-orm 0.45.2), and matches the identical pattern already used in POST /api/admin/invoices"

patterns-established:
  - "Automation job modules are the single source of truth for business logic; Netlify Scheduled Functions (05-04) and the admin trigger route (05-03) will be thin wrappers calling these exported functions"
  - "ON CONFLICT DO NOTHING + a unique constraint (invoices_recurring_unique) is this project's idempotency mechanism for scheduled jobs that may run more than once for the same period"

requirements-completed: [AUTOMATE-01, AUTOMATE-02, AUTOMATE-03]

# Metrics
duration: ~20min
completed: 2026-07-04
---

# Phase 05 Plan 02: Automation Job Modules Summary

**Three shared automation job modules (stale-enquiry reminder, overdue-invoice reminder, recurring billing) with full mocked unit test coverage — all business logic centralized here for 05-03's admin trigger route and 05-04's Netlify Scheduled Functions to call as thin wrappers.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-04T08:00:00Z (approx)
- **Completed:** 2026-07-04T08:20:00Z (approx)
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 filled in from Wave 0 stubs)

## Accomplishments
- `runEnquiryReminderJob` (src/lib/automation/enquiry-reminder.ts) — reads `enquiry_stale_days` from `site_settings`, finds enquiries with `status != 'completed'` and no reminder sent today, sends ONE summary email to `ambrose@it-guru.co.za`, marks all reminded records with today's date, writes an `automation_runs` audit row
- `runInvoiceReminderJob` (src/lib/automation/invoice-reminder.ts) — reads `invoice_overdue_reminder_days`, finds `status='sent'` invoices past their due date and not yet reminded today, sends one email PER overdue invoice, updates `lastRemindedAt`, writes an audit row
- `runRecurringBillingJob` (src/lib/automation/recurring-billing.ts) — for every active `billing_schedules` row, atomically inserts a Draft invoice (never "sent") for the current month + one line item, idempotent via `onConflictDoNothing()` on `invoices_recurring_unique`, writes an audit row
- 18 real unit tests replacing the Wave 0 `it.todo()` stubs across all three test files, all using `vi.hoisted()` mock chains for `db.select/insert/update` and (for recurring-billing) a fake `withTxDb`/`db.transaction` chain — zero real DB/Resend calls
- `npx vitest run src/lib/automation/` passes (18 passed, 3 todo for DB-integration blocks); `npx tsc --noEmit` clean; full project test suite (`npx vitest run`) still green (113 passed, 47 skipped, 8 todo)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement enquiry-reminder job + fill in unit tests** - `28a623c` (feat)
2. **Task 2: Implement invoice-reminder job + fill in unit tests** - `c332920` (feat)
3. **Task 3: Implement recurring-billing job + fill in unit tests** - `8a3cda2` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/lib/automation/enquiry-reminder.ts` - AUTOMATE-01 job: summary email + dedup + audit row
- `src/lib/automation/enquiry-reminder.test.ts` - 6 unit tests (was 6 `it.todo()` stubs)
- `src/lib/automation/invoice-reminder.ts` - AUTOMATE-02 job: per-invoice email + dedup + audit row
- `src/lib/automation/invoice-reminder.test.ts` - 7 unit tests (was 6 `it.todo()` stubs)
- `src/lib/automation/recurring-billing.ts` - AUTOMATE-03 job: atomic invoice+line-item insert, idempotent via ON CONFLICT DO NOTHING
- `src/lib/automation/recurring-billing.test.ts` - 6 unit tests (was 5 `it.todo()` stubs)

## Decisions Made
- `contactEnquiries.updatedAt` does not exist in `schema.ts` (only `createdAt`) despite the plan's interfaces section listing it — staleness is computed from `createdAt` instead. This means "stale" measures time since the enquiry was first submitted, not time since its last status change; acceptable since there's currently no mechanism recording status-change timestamps, and this matches what the actual schema supports.
- `invoice-reminder.ts` imports `formatInvoiceNumber` from `src/lib/invoices.ts` instead of the plan's inline duplicate implementation — same signature, avoids two copies of invoice-number formatting logic drifting apart.
- `recurring-billing.ts`'s invoice + line-item insert is wrapped in `withTxDb((txDb) => txDb.transaction(async (tx) => {...}))` instead of two sequential plain `db.insert()` calls as literally written in the plan. This is required by this project's CRITICAL constraint (neon-http's `db.transaction()` throws in drizzle-orm 0.45.2, so any multi-statement atomic write must go through `withTxDb`) and is the same pattern already used in `POST /api/admin/invoices` for the identical invoice+line-item write. Without this, a line-item insert failure after a successful invoice insert would leave an orphaned invoice with no line item.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] contactEnquiries has no `updatedAt` column**
- **Found during:** Task 1 (enquiry-reminder implementation)
- **Issue:** The plan's `<interfaces>` section described `contactEnquiries` as having an `updatedAt` field and the provided code sample referenced `contactEnquiries.updatedAt` throughout. The actual schema (`src/lib/db/schema.ts`, confirmed against 05-01's summary) only has `createdAt` — no `updatedAt` was ever added to this table.
- **Fix:** Used `contactEnquiries.createdAt` everywhere the plan's sample used `updatedAt` (the stale-days cutoff comparison and the "days since" display calculation in the email body).
- **Files modified:** src/lib/automation/enquiry-reminder.ts
- **Verification:** `npx tsc --noEmit` clean; unit tests assert correct `daysSince` computation and cutoff filtering against `createdAt`-based mock data
- **Committed in:** 28a623c (Task 1 commit)

**2. [Rule 1 - Bug/DRY] Duplicate formatInvoiceNumber avoided**
- **Found during:** Task 2 (invoice-reminder implementation)
- **Issue:** The plan's code sample defines a local `formatInvoiceNumber` function inside `invoice-reminder.ts` that duplicates the existing, already-tested `formatInvoiceNumber` in `src/lib/invoices.ts` (identical signature and behavior).
- **Fix:** Imported and reused `formatInvoiceNumber` from `src/lib/invoices.ts` instead of re-implementing it.
- **Files modified:** src/lib/automation/invoice-reminder.ts
- **Verification:** Unit tests assert the exact `INV-2026-001`/`INV-2026-002` formatted output in email subjects
- **Committed in:** c332920 (Task 2 commit)

**3. [Rule 2 - Missing Critical] Atomic invoice + line-item write via withTxDb**
- **Found during:** Task 3 (recurring-billing implementation)
- **Issue:** The plan's provided code performed the invoice insert and the line-item insert as two independent, sequential plain `db.insert()` calls on the lazy HTTP-driver `db` export. Per this project's CRITICAL constraint (documented in `src/lib/db/tx.ts` and already applied in `POST /api/admin/invoices`), multi-statement writes that must succeed or fail together need `withTxDb`, since neon-http's `db.transaction()` throws in drizzle-orm 0.45.2. Without this, a line-item insert failure after a successful invoice insert would silently leave a Draft invoice with zero line items in the database.
- **Fix:** Wrapped the per-schedule invoice insert (with `onConflictDoNothing().returning()`) + conditional line-item insert in `withTxDb((txDb) => txDb.transaction(async (tx) => {...}))`, matching the exact pattern used in `POST /api/admin/invoices`. A `null` return from the transaction (ON CONFLICT hit) skips the line-item insert entirely, avoiding an orphaned line item on a no-op run.
- **Files modified:** src/lib/automation/recurring-billing.ts
- **Verification:** Unit tests mock a fake `withTxDb`/`db.transaction` chain; idempotency test confirms `onConflictDoNothing` short-circuits before the line-item insert is ever called (`lineItemValuesMock` assertion of `.not.toHaveBeenCalled()`)
- **Committed in:** 8a3cda2 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 bug/schema-mismatch, 1 bug/DRY, 1 missing-critical/atomicity)
**Impact on plan:** All three necessary for correctness — one fixes a nonexistent-field bug that would have crashed at runtime, one avoids duplicated logic drifting out of sync, one closes a real data-integrity gap (orphaned invoices without line items). No scope creep — no new tables, columns, or files beyond what the plan specified.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required. These job modules are not yet wired to any HTTP route or scheduled function (that's 05-03/05-04); they only run when imported and called directly, which currently only happens from the unit tests.

## Next Phase Readiness
- All three exported functions (`runEnquiryReminderJob`, `runInvoiceReminderJob`, `runRecurringBillingJob`) are ready to be called from 05-03's admin trigger route (`POST /api/admin/automations/[job]/run`) and 05-04's Netlify Scheduled Functions — both should be thin wrappers with no business logic of their own
- Each job accepts an `opts?: { triggeredBy?: string; now?: Date }` parameter — 05-03 should pass `triggeredBy: "manual"`, 05-04's scheduled functions should pass `triggeredBy: "scheduled"` (or omit it, since that's the default)
- No blockers for 05-03/05-04

---
*Phase: 05-scheduled-automation*
*Completed: 2026-07-04*

## Self-Check: PASSED

All three job module files (enquiry-reminder.ts, invoice-reminder.ts, recurring-billing.ts) verified present on disk. All three task commits (28a623c, c332920, 8a3cda2) verified present in git log. `npx vitest run src/lib/automation/` passes (18 passed, 3 todo). `npx tsc --noEmit` exits clean.
