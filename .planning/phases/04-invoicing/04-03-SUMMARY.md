---
phase: 04-invoicing
plan: 03
subsystem: api
tags: [invoicing, pdf, react-pdf, csv, drizzle, neon, gapless-numbering, sars]

# Dependency graph
requires:
  - phase: 04-invoicing plan 01
    provides: invoices + invoice_line_items schema, renderToBuffer smoke-test route, Wave 0 test stubs
  - phase: 04-invoicing plan 02
    provides: formatInvoiceNumber/computeTotals/zod schemas (src/lib/invoices.ts), POST/PUT/DELETE route patterns
provides:
  - PATCH /api/admin/invoices/[id]/status — server-side transition map + atomic gapless INV numbering + mark paid
  - InvoiceDocument.tsx — react-pdf invoice document (SARS-safe plain "Invoice" labeling)
  - GET /api/admin/invoices/[id]/pdf — downloadable application/pdf (route.tsx, renderToBuffer)
  - GET /api/admin/invoices/csv — filterable CSV export with exact D-08 column spec
affects: [04-04 invoice list UI, 04-05 invoice detail UI, 05 automation (overdue reminders read status/paid_at)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gapless numbering: single atomic UPDATE with correlated MAX(sequence_number)+1 subquery via db.execute(sql``) on neon-http — no FOR UPDATE, no WebSocket Pool"
    - "PDF route as route.tsx with renderToBuffer + new Response(new Uint8Array(buffer)) BodyInit wrap"
    - "Mocked-db chain (where/orderBy thenable) in vitest for always-run CSV format tests"

key-files:
  created:
    - src/app/api/admin/invoices/[id]/status/route.ts
    - src/components/pdf/InvoiceDocument.tsx
    - src/app/api/admin/invoices/[id]/pdf/route.tsx
    - src/app/api/admin/invoices/csv/route.ts
  modified:
    - src/app/api/admin/invoices/[id]/status/route.test.ts
    - src/app/api/admin/invoices/[id]/pdf/route.test.ts
    - src/app/api/admin/invoices/csv/route.test.ts

key-decisions:
  - "sent→draft clears fiscal_year/sequence_number (D-06 recommendation) — re-sending assigns a fresh number so clients never see a reused one"
  - "Duplicate transitions (e.g. sent→sent) return 409 via the same allowed-transition map — no special-case handling"
  - "PDF is light/white A4 (printable) with navy + cobalt #00aaff accents rather than the site's dark theme"
  - "Bank footer values are bracketed placeholders — owner must fill real EFT details in InvoiceDocument.tsx before sending live invoices"

patterns-established:
  - "Transition map as Record<string, status[]> checked server-side before any write — never trust client status"
  - "csvEscape helper duplicated locally per route (Phase 2 CRM-07 precedent) rather than shared lib"

requirements-completed: [INVOICE-03, INVOICE-04, INVOICE-05, INVOICE-06, INVOICE-07]

# Metrics
duration: 8min
completed: 2026-07-02
---

# Phase 4 Plan 03: Status Transitions + PDF + CSV Summary

**PATCH status route with atomic gapless INV-YYYY-NNN numbering, SARS-safe react-pdf invoice download, and filterable CSV export — all 401-guarded and test-covered.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-02T07:04:42Z
- **Completed:** 2026-07-02T07:12:30Z
- **Tasks:** 3/3
- **Files modified:** 7

## Accomplishments

- Gapless invoice numbering (INVOICE-03): `draft→sent` assigns `fiscal_year` + `sequence_number` in one atomic `UPDATE ... SET sequence_number = (SELECT COALESCE(MAX(sequence_number),0)+1 ...)` statement on the neon-http driver — deleted drafts never consume a number, no FOR UPDATE, no WebSocket Pool.
- Full status lifecycle (INVOICE-04/05): allowed-transition map enforced server-side; `sent→paid` records `paid_at`, `paid→sent` clears it, `sent→draft` unpublishes and clears the number; anything else (including duplicates) is 409.
- Downloadable PDF (INVOICE-06): `InvoiceDocument.tsx` (StyleSheet-only, Helvetica, PAID stamp, EFT bank footer) rendered via `renderToBuffer` in `route.tsx`, returned as `application/pdf` attachment with status-aware filename.
- CSV export (INVOICE-07): exact D-08 header row, RFC 4180 escaping, `?status=` filter, `attachment; filename="invoices.csv"`.
- All three Wave 0 stub test files converted to real tests: 33 passing, 11 DB-gated (skip without `NETLIFY_DATABASE_URL` — established project gate), 0 `it.todo` remaining across the phase's route tests.

## The Allowed-Transition Map (exact, for 04-05 UI buttons)

```typescript
const ALLOWED_TRANSITIONS: Record<string, InvoiceStatus[]> = {
  draft: ["sent"],          // assigns gapless number
  sent:  ["paid", "draft"], // paid records paid_at; draft clears number
  paid:  ["sent"],          // undo — clears paid_at
};
// Anything else → 409 { error: "Invalid status transition." }
```

## InvoiceDocument Prop Shape (for 04-05 "Download PDF" linkage)

The PDF route (`GET /api/admin/invoices/[id]/pdf` — **file is `route.tsx`**, it contains JSX) loads everything itself; the UI only needs to link/`window.open` the URL. The component props, should anything else ever render it:

```typescript
interface InvoiceDocumentProps {
  invoice: {
    clientName: string;
    clientEmail: string | null;
    billingAddress: string | null;
    issueDate: string;   // YYYY-MM-DD
    dueDate: string;     // YYYY-MM-DD
    status: string;      // 'draft' | 'sent' | 'paid'
    fiscalYear: number | null;
    sequenceNumber: number | null;
    totalRands: number;  // INTEGER rands
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceRands: number;
    lineTotalRands: number;
  }>;
}
```

Filename: `Draft-Invoice.pdf` for drafts, else `Invoice-INV-{year}-{NNN}.pdf`.

## Final CSV Column Order (exact)

```
Invoice #,Client Name,Client Email,Issue Date,Due Date,Total (R),Status,Paid At
```

`Invoice #` renders `DRAFT` for unnumbered drafts via `formatInvoiceNumber`; `Paid At` is ISO 8601 or empty. `?status=draft|sent|paid` filters; any other value returns all rows.

## SARS Compliance Confirmation

`grep -rni "tax invoice|incl. vat" src/components/pdf src/app/api/admin/invoices` returns **nothing**, and `grep -ni "vat" src/components/pdf/InvoiceDocument.tsx` returns **nothing**. PDF heading is exactly `"Invoice"` (sent/paid) or `"Draft Invoice"` (draft). No tax fields, no tax totals anywhere in any response.

## Task Commits

Each task was committed atomically:

1. **Task 1: PATCH status route (TDD)** — `b05de7b` (test: RED), `47bf726` (feat: GREEN)
2. **Task 2: InvoiceDocument + GET /pdf route** — `16e08e1` (feat)
3. **Task 3: GET /csv export route (TDD)** — `b5638d9` (test: RED), `18f6c71` (feat: GREEN)

## Files Created/Modified

- `src/app/api/admin/invoices/[id]/status/route.ts` — PATCH transitions + atomic gapless numbering + mark paid
- `src/components/pdf/InvoiceDocument.tsx` — react-pdf document (StyleSheet.create only, no Tailwind/className)
- `src/app/api/admin/invoices/[id]/pdf/route.tsx` — renderToBuffer → application/pdf attachment response
- `src/app/api/admin/invoices/csv/route.ts` — CSV export with local csvEscape + status filter
- `src/app/api/admin/invoices/[id]/status/route.test.ts` — 8 always-run tests + 3 DB-gated
- `src/app/api/admin/invoices/[id]/pdf/route.test.ts` — 401 guard + DB-gated %PDF/content-type checks
- `src/app/api/admin/invoices/csv/route.test.ts` — 4 always-run format tests + 1 DB-gated filter test

## Deviations from Plan

None - plan executed exactly as written. (Executor worktree was created from a stale base commit; reset to `dev` tip `5df3e24` before starting so Wave 1's merged schema/lib files were present — process fix, not a code deviation.)

## Known Stubs

- **`src/components/pdf/InvoiceDocument.tsx` `BANK_DETAILS` (lines ~40-45):** `[Bank Name]`, `[Account Number]`, `[Branch Code]` are bracketed placeholders. The phase context mandates hardcoded static bank details with "the owner can update them via code" — the real business account values are not in the repo and only the owner knows them. Intentional; must be filled before the first live invoice is sent. Account Name ("IT-Guru Online") and payment Reference (auto-set to the invoice number) are real/wired.

## Verification Results

- `npx vitest run src/app/api/admin/invoices` — 6 files, 33 passed, 11 skipped (DB-gated), 0 todos
- `npx tsc --noEmit` — clean
- SARS grep gate — clean (see above)
- No `FOR UPDATE`, no `ws`, no `new Pool`, no `@neondatabase` import in the status route
- `npm run lint` remains broken repo-wide (`next lint` removed in Next.js 16) — pre-existing, already logged in `deferred-items.md` from 04-02

## Next Phase Readiness

- 04-04 (list UI) and 04-05 (detail UI) can now wire status buttons, Download PDF link, and CSV export button directly to these routes.
- Owner action needed before go-live: replace bracketed EFT bank placeholder values in `InvoiceDocument.tsx`.

## Self-Check: PASSED

All 4 created route/component files exist on disk; all 5 task commits (b05de7b, 47bf726, 16e08e1, b5638d9, 18f6c71) verified in git log.
