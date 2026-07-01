# Phase 4: Invoicing — Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 adds a complete invoice lifecycle to the admin dashboard. The owner creates invoices manually with free-text client info and line items, tracks them through Draft → Sent → Paid, downloads them as PDF, and exports the list as CSV. No payment gateway — clients pay via existing manual EFT. IT-Guru is NOT VAT-registered; all invoices use plain "Invoice" labeling.

**In scope:**
- `invoices` + `invoice_line_items` DB tables
- Admin `/admin/invoices` list page (create button, filter by status, CSV export)
- Admin `/admin/invoices/[id]` detail page (edit Draft, mark Sent/Paid, download PDF)
- `GET /api/admin/invoices/[id]/pdf` — server-side PDF generation via `@react-pdf/renderer`
- `GET /api/admin/invoices/csv` — CSV export
- `PATCH /api/admin/invoices/[id]/status` — status transitions
- `PUT /api/admin/invoices/[id]` — full invoice + line items update (Draft only)
- `POST /api/admin/invoices` — create new invoice (starts as Draft)

**Out of scope:** Payment gateway, online payment links, client-facing invoice portal, recurring auto-generation (Phase 5), CRM record linkage (deferred to later).

</domain>

<decisions>
## Implementation Decisions

### PDF Generation
- **D-01:** PDF generation uses **`@react-pdf/renderer`** — one new npm package. Invoice layout is written as React/JSX components and rendered server-side in a Next.js Route Handler (`GET /api/admin/invoices/[id]/pdf`). No headless browser, no system dependencies — works on Netlify serverless. Available for all invoice statuses: Draft PDFs show "DRAFT" in the header and no invoice number; Sent/Paid PDFs show the assigned INV-YYYY-NNN number. Response: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="Invoice-INV-2026-001.pdf"`.

### Invoice Line Item Structure
- **D-02:** Line items use a **three-field model: description + quantity + unit price**. Each line item is a row in `invoice_line_items` table: `description TEXT`, `quantity SMALLINT` (min 1, default 1), `unit_price_rands INTEGER` (rand, not cents — matches existing pricing convention), `line_total_rands INTEGER` (stored: `quantity × unit_price_rands`, updated on save). Invoice total (`total_rands INTEGER`) is stored denormalized on the `invoices` row = `SUM(line_total_rands)`, recomputed on every save. The UI auto-sums line totals and invoice total client-side as the owner types; the API recomputes server-side before writing.

### Invoice Creation Flow
- **D-03:** Free-text client info — no CRM foreign key, no picker. Create form fields: **client name** (required), **client email** (optional, shown on PDF), **billing address** (optional, textarea, shown on PDF), **issue date** (defaults to today), **due date** (required). Line items below with "Add Item" button — each row has description, qty, unit price, auto-calculated total. One-page form (not multi-step). Saving creates a Draft invoice. Line items added inline on the same form.

### Invoice Numbering
- **D-04:** Format **`INV-YYYY-NNN`** — e.g. INV-2026-001. DB stores `fiscal_year INT` + `sequence_number INT` separately (both NULL while Draft). Number is **assigned at the Draft → Sent transition**, NOT at creation. This maintains gapless numbering: deleted Drafts never consume a number. Assignment uses a **single atomic UPDATE with correlated subquery** via `db.execute(sql\`...\`)` on the existing `@netlify/neon` HTTP driver — `FOR UPDATE` row locking is NOT used (the HTTP driver cannot hold locks across a round-trip; see RESEARCH.md Section 2). The pattern: `UPDATE invoices SET status='sent', fiscal_year=$year, sequence_number=(SELECT COALESCE(MAX(sequence_number),0)+1 FROM invoices WHERE fiscal_year=$year) WHERE id=$id AND status='draft'`. Safe for single-admin at READ COMMITTED isolation. No `ws`, no `Pool`, no `@neondatabase/serverless` WebSocket client needed. Formatted at display/PDF time as `INV-{fiscal_year}-{sequence_number.toString().padStart(3, '0')}`. Draft invoices display "DRAFT" in place of the invoice number on both the detail page and the PDF.
- **D-05 (hard constraint from REQUIREMENTS.md):** Invoices use plain **"Invoice"** labeling — never "Tax Invoice", never VAT fields, never "Total incl. VAT". The PDF header text is "Invoice" (when Sent/Paid) or "Draft Invoice" (when Draft). This is a non-negotiable SARS compliance rule.

### Status Flow
- **D-06:** Status column is `VARCHAR(8)`: `'draft'` | `'sent'` | `'paid'`. **Overdue** is computed at read time — it is NOT a stored status value. A record is overdue when: `status IN ('sent') AND due_date < CURRENT_DATE`. The UI shows an "Overdue" badge in red on the list and detail pages when this condition is met. Status transitions allowed: `draft→sent` (assigns number), `sent→draft` (unpublish — clears fiscal_year/sequence_number to release the gap, or retains the number — Claude's discretion), `sent→paid` (records `paid_at` timestamp), `paid→sent` (undo — clears `paid_at`).
- **D-07:** Only **Draft invoices are editable** (INVOICE-02). Sent and Paid invoices show read-only views in the admin UI. The edit form is only rendered/accessible for status = 'draft'. This is enforced both client-side (conditional form render) and server-side (`PUT /api/admin/invoices/[id]` returns 409 if status != 'draft').

### Export
- **D-08:** Export (INVOICE-07) is **CSV only** — same pattern as CRM-07 (Phase 2). PDF list export is out of scope. CSV columns: `Invoice #`, `Client Name`, `Client Email`, `Issue Date`, `Due Date`, `Total (R)`, `Status`, `Paid At`. A `GET /api/admin/invoices/csv` route with `requireAdmin()` and `Content-Disposition: attachment; filename="invoices.csv"`.

### Mark as Paid
- **D-09:** INVOICE-05 is satisfied by `PATCH /api/admin/invoices/[id]/status` with body `{status:'paid'}`. Records `paid_at = NOW()`. The "Mark Paid" button appears only on Sent invoices (and Overdue ones, since Overdue is computed from Sent). No payment gateway; clients pay via manual EFT — the admin marks paid after confirming receipt.

### Claude's Discretion
- Exact DB column names and types (follow existing schema conventions from Phases 1–3)
- Admin invoice list columns: Invoice #, Client Name, Due Date, Total, Status, Actions
- PDF visual design: IT-Guru logo/name at top-right, "Invoice" / "Draft Invoice" heading, client block top-left, line items table, sub-total/total, bank details in footer, "Thank you for your business" sign-off
- Status badge colors: draft=gray, sent=cobalt blue, paid=green, overdue=red — consistent with site neon accent palette
- Whether `sent→draft` retains or clears the invoice number (recommend clear — re-sending re-assigns a new number to avoid confusing clients)
- Error handling for duplicate status transitions
- Whether the PDF includes a "Due" vs "Paid" stamp visual treatment

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Layer
- `src/lib/db/schema.ts` — Extend with `invoices` and `invoice_line_items` tables (follow Drizzle patterns from Phases 1–3)
- `src/lib/db/index.ts` — Lazy proxy DB client; import `db` from here
- `drizzle.config.ts` — Migration output path: `netlify/database/migrations/`
- Existing migration: `netlify/database/migrations/0000_living_mastermind.sql` (Phase 1), `0001_pricing_tables.sql` (Phase 3) — new migration is `0002_invoices.sql`

### Admin Auth Pattern
- `src/lib/auth.ts` — `requireAdmin()` must be called first in every new admin server component and API route
- `src/app/admin/layout.tsx` — Sidebar shell (Phase 2); Invoices link listed with `// Phase 4` comment — activate it

### Pricing Convention
- `src/lib/db/schema.ts` — `INTEGER` type for all money values (rands, not cents) — established in Phase 3 (`price_rands INTEGER`). Match this convention in invoice tables.

### Design System
- `CLAUDE.md` — All binding constraints: Tailwind v4 syntax, bg-image.jpg, btn-metallic/btn-glass, server components by default, `requireAdmin()` first

### Requirements
- `.planning/REQUIREMENTS.md` — INVOICE-01 through INVOICE-07 (all must be covered)

### Security Constraints
- No "Tax Invoice" wording anywhere (INVOICE-03, SARS compliance)
- `requireAdmin()` on ALL admin routes and API routes
- `PUT /api/admin/invoices/[id]` must return 409 if status != 'draft' (write-lock enforcement)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db/schema.ts` + `src/lib/db/index.ts` — Drizzle ORM patterns (serial, varchar, text, boolean, integer, timestamp) — extend, don't replace
- `src/lib/auth.ts` — `requireAdmin()` — identical pattern for all new admin pages/routes
- `src/lib/csrf.ts` — `isTrustedOrigin()` — optional defense-in-depth on state-mutation routes
- Phase 2 CRM CSV export (`GET /api/admin/crm/csv`) — copy the csvEscape helper and response headers pattern for the invoice CSV route
- Phase 3 `PATCH /api/admin/pricing/*` routes — copy the `requireAdmin()` + JSON parse + 401/422 pattern

### New Dependency
- `@react-pdf/renderer` — install via `npm install @react-pdf/renderer`. Used only in the PDF route handler server-side. Not imported in any `"use client"` component.

### Established Patterns
- Admin server components: `async function Page()`, `await requireAdmin()` first, `export const dynamic = "force-dynamic"`
- `"use client"` only for interactive components (status dropdown, line item editor, add-item button)
- Money display: `R{price}` (integer, no decimals) — established pattern on Services page. Invoices may need `R {price.toFixed(2)}` for formal invoice presentation — Claude's discretion.
- `router.refresh()` after mutations to revalidate server component data

### Integration Points
- `/admin/invoices` is a new route under the existing admin layout (sidebar + bg-image.jpg already provided by layout)
- New API routes under `/api/admin/invoices/`
- `@react-pdf/renderer` renders in Route Handler (not in page component); no server/client boundary issues since PDF rendering stays server-only

</code_context>

<specifics>
## Specific Ideas

- The invoice PDF footer should include IT-Guru's bank details (EFT) since clients pay manually. Bank details are static text hardcoded in the PDF component (no DB needed) — the owner can update them via code if they change banks.
- Issue date defaults to today (server-side `new Date()`) but is editable on the Draft form. Due date has no default — the owner must choose.
- The invoice list should show a computed "Overdue" badge in red when applicable, alongside the stored status badge. Two badges for overdue: "Sent" (gray-blue) + "Overdue" (red) is cleaner than replacing the status label.
- Line items should support re-ordering (sort_order column) — but drag-and-drop is out of scope; simple "move up / move down" buttons or just ordered by sort_order on save.
- Delete Draft: the owner should be able to delete a Draft invoice (soft or hard delete — hard delete is simpler and safe since Drafts have no number assigned).
- The CSV export should export the currently-filtered list if filters are applied, not always all invoices. Pass filter params as query string to the CSV route.

</specifics>

<deferred>
## Deferred Ideas

- CRM record linkage (invoice → registration/enquiry FK) — deferred to later phase when invoice volume justifies it
- Recurring auto-generation — Phase 5 (AUTOMATE-03)
- Online payment link on invoice PDF — v2+ (out of scope per REQUIREMENTS.md)
- PDF list export — out of scope; CSV is sufficient per INVOICE-07
- `sent→draft` number retention debate — Claude's discretion (recommend: clear number, re-assign fresh number on re-send)
- Multi-line bank details configurability — hardcoded in PDF component is sufficient for now

</deferred>

---

*Phase: 04-invoicing*
*Context gathered: 2026-07-01*
