---
phase: 10-quotations
plan: 02
subsystem: pdf
tags: [react-pdf, drizzle, vitest, quotations, pdf]

# Dependency graph
requires:
  - phase: 10-quotations
    provides: "quotations/quotationLineItems schema + formatQuotationNumber (10-01)"
provides:
  - "pdf-shared.ts (shared react-pdf StyleSheet + formatRands, imported by both InvoiceDocument and QuotationDocument)"
  - "QuotationDocument.tsx (sibling PDF document labeled Quotation, QUO-{id} reference, Valid Until, validity/terms footer)"
  - "generateQuotationPdfBuffer (single source of truth for quotation PDF bytes, src/lib/quotation-pdf.tsx)"
  - "GET /api/admin/quotations/[id]/pdf download route"
affects: [10-04-quotation-delivery-convert, 10-05-quotation-form-list-ui, 10-06-quotation-status-detail-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared react-pdf StyleSheet + formatRands extracted to a neutral pdf-shared.ts module, imported whole (never spread/merged) by sibling PDF documents — matches the billing-shared.ts pattern already established in 10-01"
    - "Quotation PDF footer replaces bank/EFT details with validity/terms text (proposal, not a payment request)"

key-files:
  created:
    - src/components/pdf/pdf-shared.ts
    - src/components/pdf/QuotationDocument.tsx
    - src/lib/quotation-pdf.tsx
  modified:
    - src/components/pdf/InvoiceDocument.tsx
    - src/lib/quotation-pdf.test.ts
    - "src/app/api/admin/quotations/[id]/pdf/route.tsx (created)"
    - "src/app/api/admin/quotations/[id]/pdf/route.test.ts"

key-decisions:
  - "Did not run requirements mark-complete for QUOTE-03/QUOTE-06 — this plan only builds the PDF generation + download-route building block; QUOTE-03 also needs the sent-email flow (10-04) and QUOTE-06 also needs the list/filter UI (10-05/10-06). Mirrors the 06-01/08-01/10-01 correction pattern already logged in STATE.md."

patterns-established:
  - "pdf-shared.ts: single source of truth for react-pdf StyleSheet + formatRands, imported whole by every PDF document sibling — never spread/merge individual style keys (Pitfall 6)"

requirements-completed: []

# Metrics
duration: 20min
completed: 2026-07-05
---

# Phase 10 Plan 02: Quotation PDF Stack Summary

**Extracted shared react-pdf StyleSheet/formatRands into pdf-shared.ts (invoice PDF renders identically), added QuotationDocument.tsx + generateQuotationPdfBuffer + the GET quotation PDF download route — the building block 10-04's email-on-send and 10-05/10-06's UI will both reuse**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-05T12:35:05+02:00 (first commit)
- **Completed:** 2026-07-05T12:55:34+02:00 (last commit)
- **Tasks:** 3
- **Files modified:** 7 (2 modified, 5 created)

## Accomplishments
- Extracted the entire react-pdf `StyleSheet.create({...})` object + color constants + `formatRands` out of `InvoiceDocument.tsx` into `src/components/pdf/pdf-shared.ts`; `InvoiceDocument` now imports both and renders byte-identically (existing invoice-pdf + pdf-route tests stay green)
- Created `QuotationDocument.tsx` as a structural sibling of `InvoiceDocument` — labeled "Quotation"/"Draft Quotation", shows the `QUO-{id}` reference (via `formatQuotationNumber`) + Valid Until date, and a validity/terms footer instead of bank/EFT details (no PAID stamp, no invoice number — a quotation isn't yet a payment request)
- Created `src/lib/quotation-pdf.tsx` exporting `generateQuotationPdfBuffer(quotation, lineItems)`, the single source of truth `renderToBuffer` wrapper that 10-04's send/resend paths will reuse
- Wired `GET /api/admin/quotations/[id]/pdf` mirroring the invoice PDF route exactly: `requireAdmin()` first, `new Uint8Array(buffer)` BodyInit wrap, `Quotation-QUO-{id}.pdf` filename
- Filled the two Wave-0 test stubs from 10-01: `quotation-pdf.test.ts` now asserts a real non-empty `%PDF-` buffer; the pdf route test's non-DB guards (401 no session, 400 non-numeric id) are real assertions, with the DB-gated "returns application/pdf" case left as `it.todo` per plan instruction

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract pdf-shared.ts and refactor InvoiceDocument** - `6b4e8f4` (refactor)
2. **Task 2: QuotationDocument + quotation-pdf helper + fill pdf-helper test** - `b2168da` (feat)
3. **Task 3: GET quotation PDF download route + fill its test** - `d3c9c7e` (feat)

**Plan metadata:** (pending) - docs: complete plan

## Files Created/Modified
- `src/components/pdf/pdf-shared.ts` - shared react-pdf `StyleSheet` (page/header/table/footer styles) + color constants (`NAVY`/`COBALT`/`MUTED`/`BORDER`) + `formatRands`, imported by both PDF documents
- `src/components/pdf/InvoiceDocument.tsx` - removed local StyleSheet/formatRands/color-const definitions, imports them from `pdf-shared.ts` instead; renders identically
- `src/components/pdf/QuotationDocument.tsx` - sibling PDF document: heading (`Draft Quotation`/`Quotation`), `QUO-{id}` reference, Issue Date + Valid Until, line-items table, validity/terms footer (no bank details, no PAID stamp, no invoice number)
- `src/lib/quotation-pdf.tsx` - `generateQuotationPdfBuffer(quotation, lineItems)`, single source of truth for quotation PDF bytes
- `src/lib/quotation-pdf.test.ts` - replaced `it.todo` with a real assertion (non-empty Buffer, `%PDF-` magic header)
- `src/app/api/admin/quotations/[id]/pdf/route.tsx` - GET download route: `requireAdmin()` → fetch quotation + line items → `generateQuotationPdfBuffer` → `Uint8Array` wrap → `application/pdf` response
- `src/app/api/admin/quotations/[id]/pdf/route.test.ts` - filled non-DB guard tests (401, 400); DB "returns application/pdf" case left as gated `it.todo`

## Decisions Made
- Did not mark QUOTE-03/QUOTE-06 complete in REQUIREMENTS.md — this plan delivers only the PDF-generation + download-route building block that both requirements depend on, not their full owner-facing behavior (QUOTE-03 needs the sent-email flow from 10-04; QUOTE-06 needs the list/filter UI from 10-05/10-06). Left both unchecked/"Pending", consistent with the 06-01/08-01/10-01 correction pattern already logged in STATE.md.
- Followed Pitfall 6 from 10-RESEARCH.md exactly: `QuotationDocument` imports the entire shared `styles` object as-is and only varies which JSX elements render (no PAID stamp, no bank-details block, Valid Until instead of Due Date) — never spreads/merges individual style keys.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `generateQuotationPdfBuffer` is exported and ready for 10-04 (send/resend email attachment) to reuse verbatim.
- `GET /api/admin/quotations/[id]/pdf` is ready for 10-05/10-06's list/detail UI to link to.
- `npx tsc --noEmit` and `npx vitest run` (full suite: 145 passed, 48 skipped, 56 todo) are both green.
- No blockers for 10-03 (quotation CRUD backend) or 10-04 (delivery/convert).

---
*Phase: 10-quotations*
*Completed: 2026-07-05*

## Self-Check: PASSED

All created files verified present on disk; all 3 task commit hashes (6b4e8f4, b2168da, d3c9c7e) verified present in git log.
