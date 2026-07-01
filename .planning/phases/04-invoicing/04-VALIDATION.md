---
phase: 4
slug: invoicing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

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
| 4-01-T1 | 01 | 1 | INVOICE-01, INVOICE-02 | schema | `npx tsc --noEmit` | n/a | ⬜ pending |
| 4-01-T2 | 01 | 1 | INVOICE-01 | integration | migration SQL file check | n/a | ⬜ pending |
| 4-01-T3 | 01 | 1 | INVOICE-06 | smoke | `npx vitest run src/app/api/admin/invoices/test-pdf/route.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-T1 | 02 | 1 | INVOICE-01 | unit | `npx vitest run src/app/api/admin/invoices/route.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-T2 | 02 | 1 | INVOICE-02 | unit | `npx vitest run src/app/api/admin/invoices/[id]/route.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-T1 | 03 | 1 | INVOICE-03, INVOICE-04, INVOICE-05 | unit+int | `npx vitest run src/app/api/admin/invoices/[id]/status/route.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-T2 | 03 | 1 | INVOICE-06 | unit+smoke | `npx vitest run src/app/api/admin/invoices/[id]/pdf/route.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-T3 | 03 | 1 | INVOICE-07 | unit | `npx vitest run src/app/api/admin/invoices/csv/route.test.ts` | ❌ W0 | ⬜ pending |
| 4-04-T1 | 04 | 2 | INVOICE-01, INVOICE-04, INVOICE-07 | type | `npx tsc --noEmit` | n/a | ⬜ pending |
| 4-05-T1 | 05 | 2 | INVOICE-02, INVOICE-04, INVOICE-05, INVOICE-06 | type | `npx tsc --noEmit` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

These test files must be created (even as stubs with `it.todo()`) before the implementation tasks they guard:

- [ ] `src/app/api/admin/invoices/route.test.ts` — POST create: 401 without session, 422 missing fields, 400 bad JSON (INVOICE-01)
- [ ] `src/app/api/admin/invoices/[id]/route.test.ts` — PUT update: 401 without session, 409 if status != 'draft' (INVOICE-02)
- [ ] `src/app/api/admin/invoices/[id]/status/route.test.ts` — PATCH status: 401 without session, 409 duplicate transition, paid_at set on paid transition (INVOICE-03, INVOICE-04, INVOICE-05)
- [ ] `src/app/api/admin/invoices/[id]/pdf/route.test.ts` — GET PDF: 401 without session + DB-gated renderToBuffer smoke test (INVOICE-06)
- [ ] `src/app/api/admin/invoices/csv/route.test.ts` — GET CSV: 401 without session, correct Content-Type and column headers (INVOICE-07)
- [ ] `src/app/api/admin/invoices/test-pdf/route.test.ts` — smoke test: trivial `<Document>` renders without "PDFDocument is not a constructor" error

**Test gate pattern (established in Phase 1, MUST use exactly):**
```typescript
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF visual design: "Invoice" heading (not "Tax Invoice"), no VAT fields, correct line items table | INVOICE-03, INVOICE-05, INVOICE-06 | Requires visual review of downloaded PDF | Download PDF for a Sent invoice, confirm heading reads "Invoice INV-YYYY-NNN", no VAT row, line item totals match |
| Draft PDF shows "Draft Invoice" with no invoice number | INVOICE-03 | Visual review | Download PDF for a Draft invoice, confirm heading reads "Draft Invoice" with no number |
| Invoice list shows Overdue badge for overdue sent invoices | INVOICE-04 | Requires browser + date state | Create a Sent invoice with yesterday's due date, confirm "Overdue" badge appears in red |
| Create invoice form auto-sums line totals | INVOICE-01 | Client-side JS interaction | Add 2 line items, verify line totals and invoice total update as you type |
| CSV export downloads correctly | INVOICE-07 | Requires browser | Click Export CSV on the invoice list, open downloaded file, verify columns match spec |
| Mark Paid records paid_at and shows Paid badge | INVOICE-05 | Requires browser flow | Open Sent invoice, click "Mark Paid", verify status badge updates and paid_at shown |

---

## Nyquist Auditor Checklist

- [ ] `POST /api/admin/invoices` returns 401 without session cookie
- [ ] `POST /api/admin/invoices` returns 422 with missing required fields
- [ ] `PUT /api/admin/invoices/[id]` returns 409 when invoice status is not 'draft'
- [ ] `PATCH /api/admin/invoices/[id]/status` returns 401 without session
- [ ] `PATCH /api/admin/invoices/[id]/status` sets `fiscal_year` and `sequence_number` when transitioning draft → sent
- [ ] `PATCH /api/admin/invoices/[id]/status` sets `paid_at` when transitioning → paid
- [ ] `GET /api/admin/invoices/[id]/pdf` returns 401 without session
- [ ] `GET /api/admin/invoices/csv` returns 401 without session
- [ ] `GET /api/admin/invoices/csv` returns Content-Type: text/csv
- [ ] renderToBuffer smoke test passes without "PDFDocument is not a constructor" error

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING file references
- [ ] No watch-mode flags in test commands
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter when all boxes checked

**Approval:** pending
