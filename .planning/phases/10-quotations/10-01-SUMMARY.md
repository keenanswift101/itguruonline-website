---
phase: 10-quotations
plan: 01
subsystem: database
tags: [drizzle, postgres, zod, vitest, quotations]

# Dependency graph
requires:
  - phase: 08-linked-invoicing-delivery
    provides: "invoices/invoiceLineItems schema shape + computeTotals/lineItemInput to extract"
provides:
  - "quotations + quotation_line_items tables (migration 0007)"
  - "billing-shared.ts (computeTotals + lineItemInput, shared by invoices and quotations)"
  - "quotations.ts (quotationInput zod schema + formatQuotationNumber)"
  - "quotation-status.ts (ALLOWED_TRANSITIONS + STATUS_BADGE + isExpired)"
  - "Wave 0 test stubs for all 6 quotation routes + quotation-pdf helper"
affects: [10-02-quotation-pdf, 10-03-quotation-crud-backend, 10-04-quotation-delivery-convert, 10-05-quotation-form-list-ui, 10-06-quotation-status-detail-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared generic helpers extracted to a neutral module (billing-shared.ts) rather than one sibling importing from the other"
    - "Reference number derived directly from serial PK (QUO-{id}) instead of a second gapless-numbering sequence, since quotations are not a SARS fiscal document"

key-files:
  created:
    - src/lib/billing-shared.ts
    - src/lib/quotations.ts
    - src/lib/quotation-status.ts
    - src/lib/quotations.test.ts
    - src/lib/quotation-status.test.ts
    - src/lib/quotation-pdf.test.ts
    - src/app/api/admin/quotations/route.test.ts
    - "src/app/api/admin/quotations/[id]/route.test.ts"
    - "src/app/api/admin/quotations/[id]/status/route.test.ts"
    - "src/app/api/admin/quotations/[id]/resend/route.test.ts"
    - "src/app/api/admin/quotations/[id]/convert/route.test.ts"
    - "src/app/api/admin/quotations/[id]/pdf/route.test.ts"
    - netlify/database/migrations/0007_quotations.sql
  modified:
    - src/lib/db/schema.ts
    - src/lib/invoices.ts

key-decisions:
  - "quotations.status is varchar(10) not varchar(8) — avoids the tight-fit risk invoices' varchar(8) has for 'accepted'/'declined' (both exactly 8 chars)"
  - "accepted is a terminal status (no outgoing transitions) so QUOTE-05's future convert-to-invoice idempotency guarantee stays simple"
  - "Did NOT mark QUOTE-01/QUOTE-04 complete in REQUIREMENTS.md — this plan only builds Wave 0 foundation (schema, libs, test stubs), not the actual create-quotation route or status-transition-enforcing route that deliver those requirements end-to-end (mirrors the 06-01/08-01 correction pattern already established in STATE.md)"

patterns-established:
  - "Sibling tables/libs, not shared polymorphic entities — quotations mirrors invoices structurally but is a fully separate table/lib pair"
  - "Wave 0 test stubs use it.todo + describeIfDb(NETLIFY_DB_URL) gate + function-form vi.mock('resend') so later plans fill behavior without re-deriving the auth/mock scaffolding"

requirements-completed: []

# Metrics
duration: 16min
completed: 2026-07-05
---

# Phase 10 Plan 01: Quotations Foundation Summary

**quotations + quotation_line_items tables (migration 0007), billing-shared.ts extraction, quotations.ts/quotation-status.ts libs, and 9 test files (2 real unit test suites + 7 Wave 0 stubs) — no user-facing behaviour change, invoice tests still green**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-05T11:46:04+02:00 (first commit)
- **Completed:** 2026-07-05T12:02:11+02:00 (last commit)
- **Tasks:** 3
- **Files modified:** 15 (2 modified, 13 created)

## Accomplishments
- Added `quotations` + `quotation_line_items` tables via additive-only migration `0007_quotations.sql` (CREATE TABLE + ADD CONSTRAINT only, no DROP), generated with `drizzle-kit generate` for constraint-naming parity with `0006`
- Extracted `computeTotals`/`lineItemInput` out of `src/lib/invoices.ts` into a neutral `src/lib/billing-shared.ts`, re-exported from `invoices.ts` so every existing importer (including `src/app/api/admin/invoices/route.ts` and its tests) keeps working unchanged
- Created `src/lib/quotations.ts` (`quotationInput` zod schema requiring `validUntil`, `formatQuotationNumber`) and `src/lib/quotation-status.ts` (`ALLOWED_TRANSITIONS` with `accepted` terminal, `STATUS_BADGE`, `isExpired`)
- Created real green unit tests for both new libs plus 7 Wave 0 test stubs (6 route stubs + 1 PDF-helper stub) that collect green now and are ready for 10-02..10-06 to fill in

## Task Commits

Each task was committed atomically:

1. **Task 1: Add quotations + quotationLineItems tables + generate migration 0007** - `e11674b` (feat)
2. **Task 2: Extract billing-shared.ts + create quotations.ts + quotation-status.ts** - `5b5afb1` (feat)
3. **Task 3: Real unit tests for the new libs + Wave 0 route/pdf test stubs** - `801371a` (test)

**Plan metadata:** (pending) - docs: complete plan

## Files Created/Modified
- `src/lib/db/schema.ts` - added `quotations` + `quotationLineItems` pgTable definitions at end of file
- `netlify/database/migrations/0007_quotations.sql` - additive CREATE TABLE + FK constraints for both new tables
- `src/lib/billing-shared.ts` - `computeTotals` + `lineItemInput` extracted from invoices.ts (generic, shared)
- `src/lib/invoices.ts` - deleted local `computeTotals`/`lineItemInput` definitions, re-exports both from `billing-shared.ts`
- `src/lib/quotations.ts` - `quotationInput` zod schema + `formatQuotationNumber(id)`
- `src/lib/quotation-status.ts` - `ALLOWED_TRANSITIONS`, `STATUS_BADGE`, `EXPIRED_BADGE`, `isExpired`
- `src/lib/quotations.test.ts` - real unit tests for `formatQuotationNumber` + `quotationInput`
- `src/lib/quotation-status.test.ts` - real unit tests for `ALLOWED_TRANSITIONS`/`STATUS_BADGE`/`isExpired`
- `src/lib/quotation-pdf.test.ts` - `it.todo` stub for the future `generateQuotationPdfBuffer`
- `src/app/api/admin/quotations/route.test.ts` - POST create stub (401/400 guards + 3 DB-gated todos)
- `src/app/api/admin/quotations/[id]/route.test.ts` - PUT/DELETE stub
- `src/app/api/admin/quotations/[id]/status/route.test.ts` - PATCH status stub
- `src/app/api/admin/quotations/[id]/resend/route.test.ts` - POST resend stub
- `src/app/api/admin/quotations/[id]/convert/route.test.ts` - POST convert stub
- `src/app/api/admin/quotations/[id]/pdf/route.test.ts` - GET pdf-download stub

## Decisions Made
- `quotations.status` uses `varchar(10)` (not `varchar(8)` like invoices) — "accepted"/"declined" are exactly 8 chars, leaving zero headroom; 10 removes that whole class of risk for free.
- `accepted` is a terminal status in `ALLOWED_TRANSITIONS` (no outgoing transitions) so a future convert-to-invoice operation (QUOTE-05, later plan) can rely on "converted" meaning permanent.
- Did not run `requirements mark-complete` for QUOTE-01/QUOTE-04 this plan — only the schema/libs/test-stub foundation was built here, not the actual owner-facing create/status-transition routes those requirements describe. Left both unchecked in REQUIREMENTS.md, matching the correction pattern already logged for 06-01 and 08-01 in STATE.md (foundation-only plans shouldn't claim requirement completion).

## Deviations from Plan

None - plan executed exactly as written. `db:generate` succeeded on the first try (no DROP statements, no fallback hand-write needed).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration `0007` will auto-apply on the next Netlify deploy of `main` (per existing migration convention); no local `db:push`/`db:migrate` was run, consistent with the plan's instruction.

## Next Phase Readiness

- `quotations`/`quotationLineItems` schema, `quotationInput`/`formatQuotationNumber`, and `ALLOWED_TRANSITIONS`/`STATUS_BADGE`/`isExpired` are all in place and typechecked — 10-02 (PDF), 10-03 (CRUD backend), 10-04 (delivery/convert), 10-05 (form/list UI), and 10-06 (status actions/detail UI) can all build directly against these.
- All 6 route test stubs + the PDF-helper stub are scaffolded with the correct auth-mock/resend-mock/describeIfDb conventions already in place — later plans only need to replace `it.todo` bodies with real assertions and add the actual route/component files.
- No blockers. `npx tsc --noEmit` and `npx vitest run` (full suite) are both green.

---
*Phase: 10-quotations*
*Completed: 2026-07-05*

## Self-Check: PASSED

All created files verified present on disk; all 3 task commit hashes (e11674b, 5b5afb1, 801371a) verified present in git log.
