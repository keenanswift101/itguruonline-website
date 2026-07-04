---
phase: 05-scheduled-automation
verified: 2026-07-04T11:00:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 05: Scheduled Automation Verification Report

**Phase Goal:** The system proactively reminds the owner about stale enquiries and overdue invoices, and automatically generates recurring hosting invoices on schedule, without creating duplicates.
**Verified:** 2026-07-04T11:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Owner receives a reminder email when an enquiry has had no status change/contact after a configurable number of days | ✓ VERIFIED | `src/lib/automation/enquiry-reminder.ts` reads `enquiry_stale_days` from `site_settings`, queries `contactEnquiries` where `status != 'completed'` and stale by that threshold, sends one summary email via `sendEmail()` to `ADMIN_REMINDER_EMAIL` (env-overridable, default `ambrose@it-guru.co.za`), writes `automation_runs` audit row. Live-executed this session: real Resend email sent and received by owner (screenshot-confirmed per 05-05-SUMMARY.md verification block). Threshold is owner-editable via `SiteSettingsForm` → `PATCH /api/admin/pricing/settings` (`enquiry_stale_days` key, bounded 1-365). |
| 2 | Owner receives a reminder email when an invoice is overdue | ✓ VERIFIED | `src/lib/automation/invoice-reminder.ts` reads `invoice_overdue_reminder_days`, queries `invoices` where `status='sent'` and `dueDate` past the cutoff, sends one email PER overdue invoice, updates `lastRemindedAt`, writes audit row. Live-executed: real email sent and received. Threshold owner-editable via same settings form (`invoice_overdue_reminder_days`). |
| 3 | A recurring invoice is automatically generated for each active hosting client on their billing cycle, and re-running the same job does not create a duplicate invoice for a period already billed | ✓ VERIFIED | `src/lib/automation/recurring-billing.ts` queries active `billingSchedules`, atomically inserts a Draft invoice + line item per schedule via `withTxDb`/`onConflictDoNothing()` on `invoices_recurring_unique(billing_schedule_id, billing_period_start)`. Live-executed: real draft invoice inserted (R85 Startup line item); re-run correctly returned `skipped:1`/`inserted:0` (idempotency proven live per 05-05-SUMMARY.md). |
| 4 | Each scheduled automation (reminders, recurring billing) has a manually-triggerable equivalent the owner/developer can run on demand, so it can be tested on the `dev` branch | ✓ VERIFIED | `POST /api/admin/automations/[job]/run` (`src/app/api/admin/automations/[job]/run/route.ts`) dispatches to all three shared job modules with `triggeredBy: "manual"`, gated by `requireAdmin()`, 404s on unknown job. Wired to a "Run Now" button per job card on `/admin/automations` (`RunNowButton.tsx`). All three corresponding Netlify Scheduled Functions (`netlify/functions/*.mts`) exist with correct cron schedules and call the same job modules with `triggeredBy: "scheduled"`. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/schema.ts` | `billingSchedules`, `automationRuns` tables; `invoices`/`contactEnquiries` column extensions | ✓ VERIFIED | Both tables exported; `invoices` has `billingScheduleId`, `billingPeriodStart`, `lastRemindedAt` + `invoices_recurring_unique` constraint; `contactEnquiries` has `lastRemindedAt` |
| `netlify/database/migrations/0004_automation.sql` | DDL for both new tables + 4 ALTER TABLE columns + FKs + unique constraint + seed | ✓ VERIFIED | All statements present (renumbered from plan's assumed `0003` to `0004` since `0003_invoices.sql` already existed — documented, correct deviation) |
| `src/lib/automation/enquiry-reminder.ts` | `runEnquiryReminderJob` — summary email, dedup, audit row | ✓ VERIFIED | Wired, substantive, unit-tested (6 tests), live-executed with real email send |
| `src/lib/automation/invoice-reminder.ts` | `runInvoiceReminderJob` — per-invoice email, dedup, audit row | ✓ VERIFIED | Wired, substantive, unit-tested (6 tests), live-executed with real email send |
| `src/lib/automation/recurring-billing.ts` | `runRecurringBillingJob` — idempotent draft invoice + line item | ✓ VERIFIED | Wired, substantive, unit-tested (6 tests), uses `withTxDb`/`onConflictDoNothing`, live-executed with real idempotent insert |
| `src/app/api/admin/automations/[job]/run/route.ts` | Admin trigger endpoint (AUTOMATE-04) | ✓ VERIFIED | `requireAdmin()` first, `VALID_JOBS` allowlist, `triggeredBy: "manual"`, unit-tested (6 tests: 401/404/3×200/500) |
| `netlify/functions/enquiry-reminder.mts` | Scheduled Function, daily 08:00 UTC | ✓ VERIFIED | `.mts`, v2 format, correct cron, calls `runEnquiryReminderJob({ triggeredBy: "scheduled" })`. Now covered by `tsc` (tsconfig `include` was extended to `**/*.mts` — a real gap the executor caught and fixed) |
| `netlify/functions/invoice-overdue-reminder.mts` | Scheduled Function, daily 08:00 UTC | ✓ VERIFIED | Same pattern, correct job wired |
| `netlify/functions/recurring-billing.mts` | Scheduled Function, monthly 1st 07:00 UTC | ✓ VERIFIED | `schedule: "0 7 1 * *"` confirmed |
| `src/app/admin/automations/page.tsx` | 3 job cards + Billing Schedules section | ✓ VERIFIED | `requireAdmin()` first, `dynamic = "force-dynamic"`, reads last-run from `automationRuns`, renders `RunNowButton`/`AddScheduleForm`/`DeactivateButton`, all Tailwind v4 syntax |
| `src/components/admin/RunNowButton.tsx` | Client component, POSTs to trigger route | ✓ VERIFIED | `"use client"`, fetch + loading state + inline result, `router.refresh()` on success |
| `src/app/api/admin/billing-schedules/route.ts` | GET/POST billing schedules | ✓ VERIFIED | `requireAdmin()` first, zod-validated, returns 201/422 |
| `src/app/api/admin/billing-schedules/[id]/route.ts` | PATCH billing schedule | ✓ VERIFIED | `requireAdmin()` first, zod-validated, 404 on missing row |
| `src/components/admin/AdminSidebar.tsx` | Automations link active | ✓ VERIFIED | `/admin/automations` present, unconditionally rendered (no Phase 5 comment gate remaining) |
| `src/app/admin/pricing/SiteSettingsForm.tsx` | Two new automation threshold inputs | ✓ VERIFIED | `enquiry_stale_days` / `invoice_overdue_reminder_days` fields present with correct labels, per-field blur-to-save + `SaveIndicator` pattern (adapted to the real existing component, not the plan's illustrative generic example — documented deviation) |
| `src/app/api/admin/pricing/settings/route.ts` | PATCH accepts the two new keys | ✓ VERIFIED | `ALLOWED_KEYS` + zod `PatchSchema` extended with `z.coerce.number().int().min(1).max(365)` for both keys |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `recurring-billing.ts` | `billingSchedules`/`invoices` | `onConflictDoNothing()` on `invoices_recurring_unique` | ✓ WIRED | Confirmed present; idempotency proven live (re-run → `skipped:1`) |
| `enquiry-reminder.ts` | `src/lib/email.ts` | `sendEmail({ to: ADMIN_REMINDER_EMAIL, ... })` | ✓ WIRED | `ADMIN_REMINDER_EMAIL` env-overridable, default unchanged (`ambrose@it-guru.co.za`); confirmed real send this session |
| `invoice-reminder.ts` | `src/lib/email.ts` | one `sendEmail()` per overdue invoice | ✓ WIRED | Loop confirmed; confirmed real send this session |
| `RunNowButton.tsx` | `/api/admin/automations/[job]/run` | `fetch POST` | ✓ WIRED | Confirmed in component; live-tested via admin UI (owner-approved checkpoint) |
| `route.ts` | `src/lib/auth.ts` | `requireAdmin()` called first | ✓ WIRED | Confirmed — auth check precedes params/job dispatch |
| `automations/page.tsx` | `automationRuns` | last-run-per-job query | ✓ WIRED | `orderBy(desc(ranAt))` + JS dedupe by `jobName`; renders status badge/summary/error |
| `AddScheduleForm.tsx` | `/api/admin/billing-schedules` | POST on submit | ✓ WIRED | Confirmed; live-tested (schedule id=1 created) |
| `DeactivateButton.tsx` | `/api/admin/billing-schedules/[id]` | PATCH `{ isActive: false }` | ✓ WIRED | Confirmed; live-tested |
| `SiteSettingsForm.tsx` | `/api/admin/pricing/settings` | PATCH named-field body | ✓ WIRED | Confirmed real (not plan's illustrative) pattern; both new keys present in allowlist + schema |
| Netlify Scheduled Functions | `src/lib/automation/*` | `import { runXJob } from "@/lib/automation/..."` | ✓ WIRED | All three confirmed; production execution itself cannot be verified until next `main` deploy (Netlify Scheduled Functions don't run on `dev`) — noted as deploy-time follow-up, not a gap, per the manual-trigger route already proving the underlying logic works |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `automations/page.tsx` job cards | `lastRuns[jobName]` | `db.select().from(automationRuns)` | Yes — real DB query, live-confirmed rows written by manual job runs this session | ✓ FLOWING |
| `automations/page.tsx` billing table | `schedules` | `db.select()...leftJoin(hostingPackages)` | Yes — real query; live-confirmed a real row (id=1) created and displayed | ✓ FLOWING |
| `RunNowButton` result text | `result` | `POST /api/admin/automations/[job]/run` response | Yes — live-confirmed real `{ sent, skipped }`/`{ inserted, skipped }` summaries returned | ✓ FLOWING |
| Reminder emails | stale enquiry / overdue invoice rows | live DB query in job modules | Yes — live-confirmed real Resend sends with real record data | ✓ FLOWING |

No hollow/disconnected data paths found — this phase's dynamic UI surfaces were exercised live against a real database this session, not just statically reviewed.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite regression | `npx vitest run` | 27 files, 119 passed / 47 skipped / 3 todo, 0 failed | ✓ PASS |
| Type-check (incl. `.mts` scheduled functions) | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| enquiry-reminder job (live, this session) | manual trigger via admin route | `sent:1`, real email; re-run `skipped:1` | ✓ PASS (per owner-confirmed context, not re-run in this verification pass to avoid duplicate live email sends) |
| invoice-reminder job (live, this session) | manual trigger via admin route | `sent:1`, real email | ✓ PASS (per owner-confirmed context) |
| recurring-billing job (live, this session) | manual trigger via admin route | `inserted:1` draft invoice + line item; re-run `inserted:0, skipped:1` | ✓ PASS (per owner-confirmed context) |

Note: The three live job-execution spot-checks were performed by the owner/orchestrator earlier this session against a local `netlify dev` database (per the task context) and are not re-run here to avoid sending duplicate real emails or creating duplicate DB rows outside the session's original test window. `npx tsc --noEmit` and `npx vitest run` were re-run fresh during this verification pass and both confirm a clean, unregressed state.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|--------------|----------------|--------------|--------|----------|
| AUTOMATE-01 | 05-01, 05-02, 05-04, 05-06 | Reminder when enquiry has had no status change after N days | ✓ SATISFIED | `enquiry-reminder.ts` + scheduled function + owner-configurable threshold in `SiteSettingsForm` |
| AUTOMATE-02 | 05-01, 05-02, 05-04, 05-06 | Reminder when invoice is overdue | ✓ SATISFIED | `invoice-reminder.ts` + scheduled function + owner-configurable threshold |
| AUTOMATE-03 | 05-01, 05-02, 05-04, 05-05 | Recurring invoice generation, no duplicates on re-run | ✓ SATISFIED | `recurring-billing.ts` + scheduled function + Billing Schedules CRUD UI; idempotency proven live |
| AUTOMATE-04 | 05-01, 05-03, 05-05 | Manually-triggerable equivalent of each scheduled automation | ✓ SATISFIED | `POST /api/admin/automations/[job]/run` + Run Now buttons on `/admin/automations`, all three jobs covered |

No orphaned requirements — all 4 IDs declared in plan frontmatter are also listed under "Automation" in REQUIREMENTS.md and are marked `[x]` there.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/api/admin/billing-schedules/route.ts` | 68 | `packageId: packageId ?? null` — an unrecognized/unmatched package silently stores `null` instead of returning 422 | ℹ️ Info | Non-blocking per task context; `recurring-billing.ts` already treats `null` package gracefully (defaults to R0 "Hosting Package" — no crash, no bad invoice math), so this doesn't break AUTOMATE-03. Documented in 05-05-SUMMARY.md as a known, accepted minor gap. |
| `src/lib/automation/*.test.ts` (3 files) | various | `it.todo("end-to-end: ...")` — DB-integration test bodies still stubs | ℹ️ Info | Intentional — gated behind `describeIfDb`/`NETLIFY_DB_URL` per project convention; unit-level coverage (18 real tests across the three job modules) is complete, and this session's live manual-trigger runs against a real dev database already exercised the equivalent end-to-end paths outside of vitest. |

No blocker or warning-severity anti-patterns found.

### Human Verification Required

None outstanding. The 05-05 human-verify checkpoint (admin `/admin/automations` page — job cards, Run Now, Billing Schedules CRUD) was already approved by the owner this session after live interactive testing (resume-signal: "approved", per 05-05-SUMMARY.md). Production execution of the three Netlify Scheduled Functions cannot be observed until the next real deploy to `main` (Netlify Scheduled Functions do not run on `dev` per CLAUDE.md's deployment section) — this is a deploy-time follow-up to watch function logs on first production run, not a gap in this phase's implementation, since the identical underlying job logic was already proven live via the manual-trigger route.

### Gaps Summary

No gaps. All four observable truths are verified against real code and, per this session's live-execution context, against real runtime behavior (actual emails sent, actual idempotent DB writes, actual admin-UI interaction approved by the owner). The two minor items noted above (packageId=null on unknown slug, and DB-integration test todos) are pre-acknowledged, non-blocking, and do not prevent the phase goal from being achieved.

---

*Verified: 2026-07-04T11:00:00Z*
*Verifier: Claude (gsd-verifier)*
