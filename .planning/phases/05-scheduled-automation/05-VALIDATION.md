---
phase: 5
slug: scheduled-automation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-01
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-T1 | 01 | 0 | AUTOMATE-01,02,03 | schema | `npx tsc --noEmit` | n/a | ⬜ pending |
| 5-01-T2 | 01 | 0 | AUTOMATE-01,02,03 | integration | migration SQL file check | n/a | ⬜ pending |
| 5-01-T3 | 01 | 0 | all | wave0 | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 5-02-T1 | 02 | 0 | AUTOMATE-01 | unit | `npx vitest run src/lib/automation/enquiry-reminder.test.ts` | ❌ W0 | ⬜ pending |
| 5-02-T2 | 02 | 0 | AUTOMATE-02 | unit | `npx vitest run src/lib/automation/invoice-reminder.test.ts` | ❌ W0 | ⬜ pending |
| 5-02-T3 | 02 | 0 | AUTOMATE-03 | unit | `npx vitest run src/lib/automation/recurring-billing.test.ts` | ❌ W0 | ⬜ pending |
| 5-03-T1 | 03 | 1 | AUTOMATE-04 | unit | `npx vitest run src/app/api/admin/automations` | ❌ W0 | ⬜ pending |
| 5-04-T1 | 04 | 1 | AUTOMATE-01,02,03 | type | `npx tsc --noEmit` | n/a | ⬜ pending |
| 5-05-T1 | 05 | 2 | AUTOMATE-04 | type | `npx tsc --noEmit` | n/a | ⬜ pending |
| 5-05-T2 | 05 | 2 | AUTOMATE-03 | type | `npx tsc --noEmit` | n/a | ⬜ pending |
| 5-06-T1 | 06 | 2 | AUTOMATE-01,02 | type | `npx tsc --noEmit` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

These test files must be created (even as stubs with `it.todo()`) before the implementation tasks they guard:

- [ ] `src/lib/automation/enquiry-reminder.test.ts` — enquiry reminder: dedup with last_reminded_at, selects stale records correctly, sends email to ambrose@it-guru.co.za only (AUTOMATE-01)
- [ ] `src/lib/automation/invoice-reminder.test.ts` — invoice reminder: selects overdue invoices, dedup with last_reminded_at, sends email to ambrose@it-guru.co.za only (AUTOMATE-02)
- [ ] `src/lib/automation/recurring-billing.test.ts` — recurring billing: ON CONFLICT DO NOTHING idempotency, correct billing_period_start (1st of month), creates Draft status invoices (AUTOMATE-03)
- [ ] `src/app/api/admin/automations/[job]/run/route.test.ts` — trigger endpoint: 401 without session, 404 for unknown job name, 200 + summary for valid job (AUTOMATE-04)

**Test gate pattern (established in Phase 1, MUST use exactly):**
```typescript
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;
```

**Unit test pattern for job modules (mocked dependencies):**
```typescript
// src/lib/automation/enquiry-reminder.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest"
vi.mock("@/lib/db/index")
vi.mock("resend")

describe("runEnquiryReminderJob", () => {
  it.todo("sends reminder email for each stale enquiry")
  it.todo("skips enquiries already reminded today (last_reminded_at = CURRENT_DATE)")
  it.todo("sends to ambrose@it-guru.co.za not enquiry email")
  it.todo("updates last_reminded_at after sending")
})
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scheduled function runs on published deploy (not dev branch) | AUTOMATE-01,02,03 | Netlify platform — only fires on production deploys | Merge to main, check Netlify Functions logs for execution after scheduled window |
| Run Now button triggers job and shows result inline | AUTOMATE-04 | Browser UI interaction | Visit /admin/automations, click Run Now for enquiry-reminder, confirm result summary updates |
| Recurring billing creates Draft invoice visible in /admin/invoices | AUTOMATE-03 | End-to-end flow across phases | Create a billing schedule, trigger recurring-billing via Run Now, confirm Draft invoice appears |
| Reminder email arrives at ambrose@it-guru.co.za only | AUTOMATE-01,02 | Live email delivery check | Create a stale enquiry, run enquiry-reminder job, confirm email arrives at ambrose@it-guru.co.za and NOT at enquiry submitter's email |
| site_settings threshold fields editable from pricing settings page | AUTOMATE-01,02 | Browser UI | Visit /admin/pricing (settings section), edit enquiry_stale_days field, confirm blur-save works |

---

## Nyquist Auditor Checklist

- [ ] `POST /api/admin/automations/[job]/run` returns 401 without session cookie
- [ ] `POST /api/admin/automations/[job]/run` returns 404 for unknown job name (not in VALID_JOBS)
- [ ] `POST /api/admin/automations/[job]/run` returns 200 with result summary for valid job
- [ ] Enquiry reminder job skips records with `last_reminded_at = CURRENT_DATE`
- [ ] Enquiry reminder job sends email to `ambrose@it-guru.co.za` not to the enquiry submitter's email
- [ ] Invoice reminder job skips invoices with `last_reminded_at = CURRENT_DATE`
- [ ] Recurring billing inserts invoice with `status = 'draft'`, `billing_period_start = 1st of current month`
- [ ] Recurring billing second run returns 0 inserted (ON CONFLICT DO NOTHING idempotency)
- [ ] Netlify Scheduled Functions use `.mts` extension and v2 export format
- [ ] All three Netlify functions call shared logic from `src/lib/automation/[job].ts`
- [ ] `automation_runs` row written after each job execution (success or error)

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING file references
- [ ] No watch-mode flags in test commands
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter when all boxes checked

**Approval:** pending
