---
phase: 08-linked-invoicing-delivery
plan: 04
subsystem: api
tags: [resend, react-pdf, invoices, email, drizzle]

# Dependency graph
requires:
  - phase: 08-linked-invoicing-delivery
    provides: generateInvoicePdfBuffer() shared PDF helper (08-01), sendEmail() attachments option (08-01)
provides:
  - Best-effort invoice-PDF email delivery on the draft->sent transition (INVOICE-11)
  - Server-side 422 no_client_email guard blocking Mark Sent when clientEmail is null (INVOICE-12)
  - POST /api/admin/invoices/[id]/resend route — re-emails the current PDF with no status mutation (INVOICE-13)
  - InvoiceStatusActions Resend + Revert to Draft buttons replacing Unpublish, plus a distinct no-email prompt
affects: [08-05-client-invoice-history]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Best-effort side-effect after an atomic DB write: the numbering UPDATE commits first, then PDF+email happens outside that statement so a Resend outage can never roll back the committed sent state"
    - "vi.mock('resend', () => ({ Resend: vi.fn(function () {...}) })) — the mock factory MUST use a `function` (not an arrow) so vitest can invoke it via `new Resend()`; arrow functions throw 'is not a constructor' under vitest's mock invocation"

key-files:
  created:
    - src/app/api/admin/invoices/[id]/resend/route.ts
  modified:
    - src/app/api/admin/invoices/[id]/status/route.ts
    - src/app/api/admin/invoices/[id]/status/route.test.ts
    - src/app/api/admin/invoices/[id]/resend/route.test.ts
    - src/components/forms/InvoiceStatusActions.tsx

key-decisions:
  - "Fixed the plan's vi.mock('resend', () => ({ Resend: vi.fn(() => ({...})) })) snippet to use a function expression instead of an arrow function inside vi.fn(), since vitest invokes the mock via `new Resend(...)` and arrow functions cannot be constructors — the arrow form fails at runtime with 'is not a constructor' even though it type-checks fine."
  - "Added clientEmail: 'numbering-test@example.com' to the pre-existing gapless-numbering DB test's invoice insert (status/route.test.ts) so the new INVOICE-12 guard doesn't turn its draft->sent PATCH into a 422; all its other assertions (200, fiscalYear, sequenceNumber) are unchanged."

requirements-completed: [INVOICE-11, INVOICE-12, INVOICE-13]

duration: 12min
completed: 2026-07-04
---

# Phase 8 Plan 4: Linked Invoicing Delivery Summary

**Mark Sent now emails the invoice PDF as a Resend attachment after the atomic numbering UPDATE (best-effort, never rolls back the sent state), is blocked server-side with 422 `no_client_email` when there's no client email, and the old single "Unpublish" button on sent invoices is replaced by "Resend" (re-email, no status change) and "Revert to Draft" (the old sent→draft, clears the number).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-04T20:32:00+02:00 (approx.)
- **Completed:** 2026-07-04T20:36:08+02:00
- **Tasks:** 3/3
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- Status route's draft→sent branch now guards on `!inv.clientEmail` (422 `no_client_email`) BEFORE the gapless-numbering UPDATE runs, then, immediately after that UPDATE commits, re-fetches the invoice + line items, generates the PDF via `generateInvoicePdfBuffer`, and calls `sendEmail()` with the PDF as an attachment — numbering SQL itself untouched.
- New `POST /api/admin/invoices/[id]/resend` route: `requireAdmin()`-first, 404 if missing, 409 if not `sent`, 422 if no client email, otherwise re-emails the current PDF with zero status mutation (no `.update(invoices).set({ status ... })` anywhere in the route).
- `InvoiceStatusActions.tsx`: sent invoices show Mark Paid + Resend + Revert to Draft (Unpublish removed). Mark Sent's 422 `no_client_email` and Resend's 422 `no_client_email` both surface a distinct "add a client email first" message, separate from the generic error/409 paths.
- Updated `status/route.test.ts`'s pre-existing gapless-numbering DB test to insert a `clientEmail` so it still asserts 200 under the new guard, and added a mocked-db 422 test plus a DB-gated `it.todo` for the email-attachment assertion.
- Filled the Wave 0 stub `resend/route.test.ts` with real 401/400 non-DB guard tests; kept the 404/409/422/ok DB-gated cases as `it.todo`.

## Task Commits

Each task was committed atomically:

1. **Task 1: status route — no-email guard (422) + email-on-send** - `d55308b` (feat)
2. **Task 2: resend route — re-email current PDF, no status change** - `51bab5b` (feat)
3. **Task 3: InvoiceStatusActions — Resend + Revert to Draft + no-email prompt** - `b555d4b` (feat)

_Note: no TDD tasks in this plan — all three were single-commit `auto` tasks._

## Files Created/Modified
- `src/app/api/admin/invoices/[id]/status/route.ts` - added `clientEmail` to the select, INVOICE-12 422 guard at the top of the draft→sent branch, best-effort `generateInvoicePdfBuffer` + `sendEmail` call immediately after the numbering UPDATE
- `src/app/api/admin/invoices/[id]/status/route.test.ts` - `vi.mock("resend")` (function-form), new mocked-db 422 test, `clientEmail` added to the pre-existing numbering DB test's insert, new `it.todo` for the email-attachment DB case
- `src/app/api/admin/invoices/[id]/resend/route.ts` - new POST route: auth-first, 404/409/422 guards, re-emails the current PDF, no status change
- `src/app/api/admin/invoices/[id]/resend/route.test.ts` - filled Wave 0 stub's 401/400 non-DB tests; DB-gated cases remain `it.todo`
- `src/components/forms/InvoiceStatusActions.tsx` - `patch()` gains a 422 `no_client_email` branch with a distinct message; new `resend()` handler; sent-block buttons changed from Mark Paid + Unpublish to Mark Paid + Resend + Revert to Draft

## Decisions Made
- Fixed the plan's `vi.mock("resend", () => ({ Resend: vi.fn(() => ({...})) }))` snippet (present in both this plan's test instructions and the pre-existing 08-01 Wave-0 stub) to use a `function` expression instead of an arrow function — vitest invokes the mocked `Resend` with `new`, and arrow functions can't be constructors, so the arrow form threw `TypeError: ... is not a constructor` at runtime the moment `src/lib/email.ts` did `new Resend(...)`. Applied the same fix to both `status/route.test.ts` and `resend/route.test.ts`.
- Kept the pre-existing gapless-numbering DB test's other assertions (200, fiscalYear, sequenceNumber) completely unchanged, only adding `clientEmail` to its insert, per the plan's explicit instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed the `vi.mock("resend", ...)` constructor pattern in both status and resend route test files**
- **Found during:** Task 1 (running `npx vitest run` after adding `vi.mock("resend", () => ({ Resend: vi.fn(() => ({...})) }))` exactly as specified in the plan)
- **Issue:** `resend`'s mocked `Resend` class was an arrow function inside `vi.fn(...)`. `src/lib/email.ts` calls `new Resend(process.env.RESEND_API_KEY)` at module load — arrow functions can never be used as constructors, so every test in the file failed with `TypeError: () => ({...}) is not a constructor`, even the unrelated 401 test (since `route.ts` imports `@/lib/email` at module scope, `new Resend()` runs during module load, before any test-specific logic).
- **Fix:** Changed `vi.fn(() => ({...}))` to `vi.fn(function () { return {...}; })` in both `status/route.test.ts` (new mock, added this plan) and `resend/route.test.ts` (pre-existing 08-01 stub, corrected when filling in its real tests this plan).
- **Files modified:** `src/app/api/admin/invoices/[id]/status/route.test.ts`, `src/app/api/admin/invoices/[id]/resend/route.test.ts`
- **Verification:** `npx vitest run` — all 9 status-route tests + both resend-route non-DB tests pass; full suite green (134 passed, 48 skipped, 19 todo).
- **Committed in:** `d55308b` (status route test fix), `51bab5b` (resend route test fix)

---

**Total deviations:** 1 auto-fixed (1 bug fix, same root cause applied in two files)
**Impact on plan:** Necessary correctness fix for the test mocks to actually run rather than error out at import time; no scope creep, no production code affected (test-only).

## Issues Encountered
None beyond the mock-constructor issue documented above.

## User Setup Required

None - no external service configuration required. `RESEND_API_KEY` was already a required env var from prior phases; no new env vars introduced.

## Next Phase Readiness

- INVOICE-11/12/13 are fully delivered: Mark Sent emails the PDF (best-effort, after the committed number), is blocked with a distinct prompt when there's no client email, and sent invoices offer Resend + Revert to Draft.
- `npx tsc --noEmit` clean; full `npx vitest run` suite green (134 passed, 48 skipped, 19 todo).
- Manual verification (per 08-VALIDATION, under `netlify dev`, real Resend send + inbox check) not performed in this automated execution — recommended before considering INVOICE-11 fully verified end-to-end in a live environment.
- 08-05 (client invoice history) has no dependency on this plan's specific routes/UI beyond the shared PDF/email infra already in place from 08-01 — no blockers.

---
*Phase: 08-linked-invoicing-delivery*
*Completed: 2026-07-04*

## Self-Check: PASSED

- FOUND: src/app/api/admin/invoices/[id]/resend/route.ts
- FOUND: src/app/api/admin/invoices/[id]/status/route.ts
- FOUND: src/components/forms/InvoiceStatusActions.tsx
- FOUND commit: d55308b
- FOUND commit: 51bab5b
- FOUND commit: b555d4b
