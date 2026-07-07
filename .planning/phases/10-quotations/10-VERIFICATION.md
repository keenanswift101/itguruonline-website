---
phase: 10-quotations
verified: 2026-07-07T00:00:00Z
status: passed
score: 6/6 must-haves verified
---

# Phase 10: Quotations Verification Report

**Phase Goal:** Owner can create, send, and track quotations the same way as invoices — with client linking, PDF, and email delivery — and convert an accepted quotation into a draft invoice in one click.
**Verified:** 2026-07-07
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Owner can create a quotation with a client (picker or free-text), line items, and a "valid until" date | ✓ VERIFIED | `src/components/forms/QuotationForm.tsx` reuses `ClientPicker` (auto-fill), required `validUntil` field with client-side validation; `POST /api/admin/quotations` (`src/app/api/admin/quotations/route.ts`) validates via `quotationInput`, checks `clientId` existence, computes totals server-side, writes quotation + line items atomically via `withTxDb`. Live-verified end-to-end by owner (client picker auto-fill confirmed). |
| 2 | Owner can edit and delete a draft quotation | ✓ VERIFIED | `PUT`/`DELETE /api/admin/quotations/[id]/route.ts` — draft-only write lock re-checked inside the transaction (`EditLockError`, 409 on non-draft), full replace of fields + line items on PUT, FK-cascade delete of line items on DELETE. Detail page (`[id]/page.tsx`) renders `QuotationForm` in edit mode when `status === "draft"`. Live-verified: draft edit/save works. |
| 3 | Marking a quotation Sent emails the quotation PDF (labeled "Quotation", no SARS invoice number) to the client; blocked with a prompt if no client email | ✓ VERIFIED | `PATCH /api/admin/quotations/[id]/status/route.ts`: blocks `target === "sent"` with 422 `no_client_email` when `clientEmail` is null (checked before any write); on success, commits status then emails `generateQuotationPdfBuffer` output via `sendEmail` with subject/body referencing `QUO-####`. `QuotationDocument.tsx` renders "Draft Quotation"/"Quotation" heading (no invoice number, no PAID stamp, no bank/EFT footer — validity/terms footer instead). Live-verified by owner: real Resend email received with "Quotation" PDF attached. |
| 4 | Owner can move a quotation through draft → sent → accepted / declined and see its status | ✓ VERIFIED | `quotation-status.ts` `ALLOWED_TRANSITIONS`: draft→sent, sent→accepted/declined/draft, declined→sent, accepted→[] (terminal). Status route enforces this server-side (409 on disallowed transition). `QuotationStatusActions.tsx` renders the correct button set per status (Mark Sent/Delete on draft; Mark Accepted/Declined/Resend/Revert on sent; Mark Sent on declined; Convert/View Invoice on accepted). `STATUS_BADGE` + `EXPIRED_BADGE` rendered on list and detail pages. Live-verified: full lifecycle walked (Sent → Accepted → Convert). |
| 5 | Owner can convert an accepted quotation into a draft invoice, carrying over the client and line items, in one click | ✓ VERIFIED | `POST /api/admin/quotations/[id]/convert/route.ts`: 409 if not accepted (`InvalidStateError`), 409 on second convert (`AlreadyConvertedError` thrown inside the tx, checked via `convertedInvoiceId != null` before the state check — race-proof idempotency), inserts a new `invoices` row (status defaults to draft) + copied line items (30-day due date) via `withTxDb`, stamps `quotations.convertedInvoiceId`. `QuotationStatusActions.convert()` POSTs and redirects to `/admin/invoices/${id}` on 201; shows "View Invoice" link once converted. Live-verified: created draft invoice #36 carrying client + line items, 30-day due; re-convert correctly blocked with 409. |
| 6 | Owner can list all quotations, filter by status, and download a quotation PDF | ✓ VERIFIED | `src/app/admin/quotations/page.tsx`: lists all quotations newest-first, `FILTERABLE_STATUSES` filter via `?status=`, status + Expired badges, "PDF" link per row → `/api/admin/quotations/[id]/pdf`. `GET` route (`pdf/route.tsx`) requires admin first, streams `generateQuotationPdfBuffer` output as `application/pdf` with `Quotation-QUO-####.pdf` filename (`new Uint8Array(buffer)` wrap). |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/schema.ts` (quotations + quotationLineItems) | Tables with correct columns, no fiscal/paid fields | ✓ VERIFIED | `quotations` has `id`, `clientId` (nullable FK, set null), `clientName`, `clientEmail`, `billingAddress`, `issueDate`, `validUntil`, `status varchar(10) default 'draft'`, `totalRands`, `convertedInvoiceId` (nullable FK → invoices, set null), timestamps. No `fiscal_year`/`sequence_number`/`paid_at`. |
| `netlify/database/migrations/0007_quotations.sql` | Additive-only migration | ✓ VERIFIED | Two `CREATE TABLE` + 3 `ALTER TABLE ... ADD CONSTRAINT`. Zero `DROP` statements. |
| `src/lib/billing-shared.ts` | Shared `computeTotals`/`lineItemInput` | ✓ VERIFIED | Exported; `invoices.ts` re-exports both, existing invoice tests remain green (161 passed / 48 skipped / 45 todo, full suite). |
| `src/lib/quotations.ts` | `quotationInput` + `formatQuotationNumber` | ✓ VERIFIED | `formatQuotationNumber(id)` → `QUO-0001` style; `quotationInput` requires `validUntil`. |
| `src/lib/quotation-status.ts` | `ALLOWED_TRANSITIONS`, `STATUS_BADGE`, `isExpired` | ✓ VERIFIED | `accepted: []` terminal confirmed; badges for all 4 statuses + `EXPIRED_BADGE`. |
| `src/components/pdf/QuotationDocument.tsx` | Sibling PDF doc, no invoice number/bank details | ✓ VERIFIED | Heading "Draft Quotation"/"Quotation", `QUO-{id}` reference, Valid Until date, validity/terms footer, zero `BANK_OPTIONS`/PAID-stamp references. |
| `src/lib/quotation-pdf.tsx` | `generateQuotationPdfBuffer` | ✓ VERIFIED | Single source of truth, reused by download route, status route (send), and resend route. |
| `src/app/api/admin/quotations/route.ts` | POST create | ✓ VERIFIED | `quotationInput.safeParse`, clientId existence check, `withTxDb` atomic insert, status defaults to draft (never set explicitly). |
| `src/app/api/admin/quotations/[id]/route.ts` | PUT/DELETE draft-only | ✓ VERIFIED | `EditLockError`/409 pattern, status re-checked inside the WHERE and inside the tx. |
| `src/app/api/admin/quotations/[id]/status/route.ts` | PATCH transitions + email | ✓ VERIFIED | `ALLOWED_TRANSITIONS` enforcement, `no_client_email` 422 guard, best-effort email after commit, zero numbering side-effect. |
| `src/app/api/admin/quotations/[id]/resend/route.ts` | Re-email, no status change | ✓ VERIFIED | 409 if not sent, 422 no email, zero `update(quotations)` calls. |
| `src/app/api/admin/quotations/[id]/convert/route.ts` | Convert to draft invoice | ✓ VERIFIED | `AlreadyConvertedError`/`InvalidStateError` inside tx, 30-day due date, `convertedInvoiceId` stamped. |
| `src/app/api/admin/quotations/[id]/pdf/route.tsx` | GET PDF download | ✓ VERIFIED | `requireAdmin` first, `Uint8Array` wrap, `Quotation-QUO-####.pdf` filename. |
| `src/components/forms/QuotationForm.tsx` | Create/edit form | ✓ VERIFIED | Reuses `ClientPicker` unmodified, `validUntil` field (zero `dueDate` references), posts to quotation routes. |
| `src/components/forms/QuotationStatusActions.tsx` | Lifecycle + convert buttons | ✓ VERIFIED | Correct button set per status; convert redirects to new invoice or shows "View Invoice". |
| `src/app/admin/quotations/page.tsx` | List + filter + PDF link | ✓ VERIFIED | `FILTERABLE_STATUSES`, badges + Expired, PDF/View links per row. |
| `src/app/admin/quotations/new/page.tsx` | New quotation page | ✓ VERIFIED | Renders `QuotationForm` with `getClientsForPicker()` clients, `requireAdmin` gating. |
| `src/app/admin/quotations/[id]/page.tsx` | Detail/edit page | ✓ VERIFIED | Edits via `QuotationForm` on draft, read-only view otherwise, badge + Expired + Download PDF + `QuotationStatusActions`. |
| `src/components/admin/AdminSidebar.tsx` | Quotations nav entry | ✓ VERIFIED | `{ href: "/admin/quotations", label: "Quotations" }` between Invoices and Automations. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `schema.ts` quotations | invoices | `convertedInvoiceId` FK | ✓ WIRED | `convertedInvoiceId: integer("converted_invoice_id").references(() => invoices.id, { onDelete: "set null" })` present; used as idempotency anchor in convert route. |
| `invoices.ts` | `billing-shared.ts` | re-export | ✓ WIRED | `computeTotals`/`lineItemInput` re-exported; zero local re-definitions in `invoices.ts`. |
| `quotations/[id]/pdf/route.tsx` | `quotation-pdf.tsx` | `generateQuotationPdfBuffer` | ✓ WIRED | Called directly, single source of truth also reused by status/resend routes. |
| `QuotationDocument.tsx` | `quotations.ts` | `formatQuotationNumber` | ✓ WIRED | Reference rendered via `formatQuotationNumber(quotation.id)`. |
| `quotations/route.ts` | `billing-shared.ts` | `computeTotals` | ✓ WIRED | Server-computed totals, client input never trusted. |
| `quotations/[id]/route.ts` | quotations table | draft-only write lock | ✓ WIRED | `eq(quotations.status, "draft")` repeated in WHERE + re-checked inside tx. |
| `QuotationForm.tsx` | `quotations/route.ts` | `fetch POST/PUT` | ✓ WIRED | `fetch("/api/admin/quotations", ...)` / `fetch(\`/api/admin/quotations/${quotationId}\`, ...)`. |
| `quotations/page.tsx` | `quotations/[id]/pdf/route.tsx` | Download link | ✓ WIRED | `href={`/api/admin/quotations/${q.id}/pdf`}` present per row. |
| `QuotationStatusActions.tsx` | `quotations/[id]/convert/route.ts` | `fetch POST /convert` | ✓ WIRED | On 201 redirects to `/admin/invoices/${id}`; on 409 shows "already converted" + refreshes. |
| `quotations/[id]/page.tsx` | `QuotationForm.tsx` | conditional render on draft | ✓ WIRED | `q.status === "draft" ? <QuotationForm .../> : <read-only view>`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `quotations/page.tsx` list | `rows` | `db.select().from(quotations)...` (optionally filtered) | Yes — real DB query, `orderBy(desc(quotations.createdAt))` | ✓ FLOWING |
| `quotations/[id]/page.tsx` detail | `q`, `lineItems`, `clients` | `db.select()` on quotations/quotationLineItems + `getClientsForPicker()` | Yes — real DB queries | ✓ FLOWING |
| Status route email attachment | `pdfBuffer` | `generateQuotationPdfBuffer(updated, lineItems)` fed by post-commit `db.select()` | Yes — regenerated from the freshly-committed row, not stale/static | ✓ FLOWING |
| Convert route new invoice | `invoice` | Copied field-by-field from the fetched `q` row + `lineItems` inside the same tx | Yes — real values carried over, not hardcoded | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full quotation lifecycle (create → sent email → accept → convert → re-convert blocked) | Owner-run manual walkthrough (`netlify dev`) per 10-06 Task 3 checkpoint | Owner typed "approved" 2026-07-07 after confirming create, edit, PDF labeling, send email (received + BCC), resend, accept/decline, convert (draft invoice #36, 30-day due), re-convert 409, list filters + Expired badge | ✓ PASS |
| `npx tsc --noEmit` | full typecheck | Exits 0, no errors | ✓ PASS |
| `npx vitest run` | full suite | 42 files passed / 2 skipped, 161 tests passed / 48 skipped (DB-gated) / 45 todo (DB-gated) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|------------|--------------|--------|----------|
| QUOTE-01 | 10-01, 10-03, 10-05 | Create quotation (picker/free-text, line items, valid-until) | ✓ SATISFIED | `QuotationForm.tsx` + `POST /api/admin/quotations` |
| QUOTE-02 | 10-03, 10-06 | Edit/delete a draft quotation | ✓ SATISFIED | `PUT`/`DELETE [id]/route.ts` + detail page edit mode + `QuotationStatusActions` Delete button |
| QUOTE-03 | 10-01, 10-02, 10-04 | Mark Sent emails PDF (labeled Quotation, no SARS number), blocked without email | ✓ SATISFIED | `status/route.ts` no_client_email guard + email-on-send; `QuotationDocument.tsx` heading/no invoice number. Live-verified email delivery. |
| QUOTE-04 | 10-01, 10-04, 10-06 | Status lifecycle draft→sent→accepted/declined | ✓ SATISFIED | `ALLOWED_TRANSITIONS` + `QuotationStatusActions` per-status buttons. Live-verified. |
| QUOTE-05 | 10-01, 10-04, 10-06 | Convert accepted quotation to draft invoice, one click | ✓ SATISFIED | `convert/route.ts` + `QuotationStatusActions.convert()`. Live-verified (invoice #36 created, re-convert blocked). |
| QUOTE-06 | 10-02, 10-05 | List, filter by status, download PDF | ✓ SATISFIED | `quotations/page.tsx` + `pdf/route.tsx` |

**Note:** `.planning/REQUIREMENTS.md` currently shows QUOTE-03/04/05 as unchecked (`[ ]`) and "Pending" in the traceability table — this is a **stale documentation lag**, not a code gap. All three plans (10-01, 10-04, 10-06) that deliver these requirements are complete with green tests and an owner-approved live end-to-end checkpoint (10-06 Task 3, approved 2026-07-07). Code-level verification above confirms all three are fully implemented and wired. Recommend updating REQUIREMENTS.md checkboxes/traceability table to Complete in a follow-up doc-sync commit — this does not block phase completion since the actual functionality is verified working.

### Anti-Patterns Found

None. No TODO/FIXME/PLACEHOLDER/"not implemented" comments found in any of the 18 phase-10 production files. No stub handlers, no hardcoded-empty data flowing to render, no orphaned wiring.

### Human Verification Required

None outstanding. The phase's designated human-verify checkpoint (10-06 Task 3 — full lifecycle: create, edit, PDF labeling, send email + no-email prompt, resend, accept/decline, convert + re-convert-blocked, list filters/Expired badge) was already run and approved by the owner on 2026-07-07, with additional confirmation this session (real Resend email received at keenanswift101@gmail.com, draft invoice #36 created on convert).

### Gaps Summary

No gaps. All 6 observable truths verified against actual code (not just SUMMARY claims), all artifacts pass all 4 verification levels (exist, substantive, wired, data-flowing), all key links wired, `npx tsc --noEmit` clean, full `npx vitest run` green (161 passed / 48 skipped / 45 todo), and the owner has live-verified the complete end-to-end lifecycle including real email delivery and invoice conversion. The only finding is a cosmetic documentation-sync issue in REQUIREMENTS.md (QUOTE-03/04/05 checkboxes not yet ticked) which does not reflect an implementation gap.

---

*Verified: 2026-07-07*
*Verifier: Claude (gsd-verifier)*
