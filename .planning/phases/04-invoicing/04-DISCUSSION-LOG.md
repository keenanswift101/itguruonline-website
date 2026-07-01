# Phase 4: Invoicing — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 04 — Invoicing
**Areas discussed:** PDF generation approach, Invoice line item structure, Invoice creation flow, Invoice numbering format

---

## PDF Generation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| @react-pdf/renderer | JSX/React invoice components rendered server-side in Route Handler. No headless browser, no system deps, works on Netlify serverless. One npm install. | ✓ |
| pdfmake | JSON document definition API, server-side capable. Less intuitive for table layouts. No JSX. | |

**User's choice:** @react-pdf/renderer

---

## Invoice Line Item Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Description + Qty + Unit Price | Three fields per line. Line total = qty × unit price. Invoice total = SUM. Standard for accountants. | ✓ |
| Description + Amount only | Two fields — owner types the final amount directly. Simpler but less flexible. | |

**User's choice:** Description + Qty + Unit Price

---

## Invoice Creation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Free-text client + manual line items | Simple form: client name (free text), email (optional), billing address (optional), due date, then line items. No CRM linkage. | ✓ |
| Link to CRM record first | Pick a registration/enquiry from CRM to pre-fill client info. Tighter data linkage but more complex. | |

**User's choice:** Free-text client info — no CRM FK

---

## Invoice Numbering Format

| Option | Description | Selected |
|--------|-------------|----------|
| INV-YYYY-NNN (year-prefixed, resets annually) | Common SA business format. DB stores fiscal_year + sequence_number. Number assigned at Sent transition. | ✓ |
| INV-NNN (plain sequential, never resets) | Simpler DB (single integer). No year context visible. | |

**User's choice:** INV-YYYY-NNN, year-prefixed

---

## Claude's Discretion

- Exact DB schema column names and types
- PDF visual design (logo placement, client block, line items table, bank details footer)
- Status badge color palette on the list and detail pages
- Whether `sent→draft` transition retains or clears the assigned invoice number
- Line item sort_order UX (move up/down buttons vs bare sort_order)
- Money display format on PDF (`R99` vs `R 99.00`)

## Deferred Ideas

- CRM record linkage deferred to later phase
- Recurring auto-generation covered by Phase 5 (AUTOMATE-03)
- Online payment link on PDF deferred to v2+
- PDF list export out of scope; CSV sufficient per INVOICE-07
