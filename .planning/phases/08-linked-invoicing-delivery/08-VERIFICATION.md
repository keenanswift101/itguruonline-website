---
phase: 08-linked-invoicing-delivery
verified: 2026-07-05T09:00:00Z
status: passed
score: 6/6 must-haves verified
---

# Phase 8: Linked Invoicing & Delivery Verification Report

**Phase Goal:** Owner can create an invoice tied to a stored client (auto-filled) while free-text one-off invoicing stays supported, email the invoice PDF to the client on send, and see a client's invoice history.
**Verified:** 2026-07-05
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Owner can pick a stored client from a searchable listbox when creating/editing an invoice, auto-filling name/email/address and linking `client_id` | ✓ VERIFIED | `src/components/forms/ClientPicker.tsx` (custom `role="listbox"` + search input, no native `<select>`); `InvoiceForm.tsx` `handleClientSelect` auto-fills `clientName`/`clientEmail`/`billingAddress` and sends `clientId` in the POST/PUT body; `src/app/admin/invoices/new/page.tsx` and `[id]/page.tsx` pass `getClientsForPicker()` + `initialClientId={inv.clientId}` server-side |
| 2 | Free-text one-off invoicing (no stored client) remains fully valid | ✓ VERIFIED | `invoiceInput.clientId` is `nullable().optional()`; POST/PUT routes do `clientId: data.clientId ?? null`; picker renders a retained "One-off / no stored client" option that sets `clientId=null`; existing pre-08 invoices (`client_id` NULL) are unaffected by an additive-only migration |
| 3 | An invoice referencing an unknown `clientId` is rejected cleanly (422), not a raw FK-violation 500 | ✓ VERIFIED | Both `route.ts` (POST) and `[id]/route.ts` (PUT) run a `db.select` existence check before the write and return `{ error: "Validation failed.", fields: { clientId: ["Client not found."] } }` at 422 |
| 4 | Marking an invoice Sent emails the invoice PDF as a Resend attachment to the client email | ✓ VERIFIED (also live-tested this session) | `status/route.ts` draft→sent branch calls `generateInvoicePdfBuffer(updated, lineItems)` then `sendEmail({ ..., attachments: [{ filename, content: pdfBuffer }] })` immediately after the atomic numbering UPDATE. Live-verified: a real invoice was created, marked Sent, and the PDF arrived via Resend at a real inbox this session. |
| 5 | Mark Sent is blocked (422 `no_client_email`) when there is no client email, with a distinct owner-facing prompt (not a generic error) | ✓ VERIFIED (also live-tested this session) | `status/route.ts` guards `if (!inv.clientEmail) return NextResponse.json({ error: "no_client_email" }, { status: 422 })` BEFORE the numbering UPDATE; `InvoiceStatusActions.tsx` `patch()` checks `body.error === "no_client_email"` and sets a distinct "add a client email first" message. Live-verified: an invoice with no client email returned 422 `no_client_email` and was blocked. |
| 6 | On a sent invoice, Resend (re-email, no status change) and Revert to Draft replace the old single Unpublish button | ✓ VERIFIED | `InvoiceStatusActions.tsx` sent-block renders Mark Paid + Resend (`onClick={resend}` → POST `/resend`) + Revert to Draft (`onClick={() => patch("draft")}`); `grep -c 'Unpublish'` returns 0; `resend/route.ts` has zero `.set({ status` calls (verified: no status mutation), returns 409 if not sent / 422 if no email / 200 + re-email otherwise |
| 7 | Owner can see a client's invoice history on the client detail page | ✓ VERIFIED | `getClientInvoices(clientId)` in `client-query.ts` selects `invoices` by `eq(invoices.clientId, clientId)` ordered `desc(createdAt)`; `/admin/clients/[id]/page.tsx` renders an "Invoices" Card with each invoice linking to `/admin/invoices/{id}`, friendly "No invoices yet." empty state present |

**Score:** 7/7 truths verified (mapped to 6 must-have requirement IDs)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/schema.ts` | `invoices.clientId` nullable FK to `clients.id` | ✓ VERIFIED | Line 147: `clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" })` |
| `netlify/database/migrations/0006_invoice_client_link.sql` | Additive-only ALTER + FK constraint | ✓ VERIFIED | Contains only `ADD COLUMN "client_id" integer` + `ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE set null`; zero `DROP` statements; journal tagged `0006_invoice_client_link` |
| `src/lib/invoices.ts` | `invoiceInput.clientId` optional/nullable | ✓ VERIFIED | `clientId: z.number().int().positive().nullable().optional()` |
| `src/lib/invoice-pdf.tsx` | Shared `generateInvoicePdfBuffer` helper | ✓ VERIFIED | Exports the function; consumed by pdf download route, status route (send email), and resend route — single source of truth confirmed (no other `renderToBuffer` call sites in the invoice routes) |
| `src/lib/email.ts` | `sendEmail` attachments option | ✓ VERIFIED | `attachments?: { filename: string; content: Buffer | string }[]` threaded via `...(attachments ? { attachments } : {})` into the Resend call; `Promise<void>` contract and BCC logic unchanged |
| `src/lib/client-query.ts` | `getClientsForPicker()` + `getClientInvoices()` | ✓ VERIFIED | Both exported; `getClientsForPicker` returns id/name/email/company/physicalAddress/postalAddress; `getClientInvoices` filters `eq(invoices.clientId, clientId)`, orders newest-first, maps through `formatInvoiceNumber` |
| `src/lib/client-types.ts` | `ClientPickerOption` + `ClientInvoiceSummary` | ✓ VERIFIED | Both interfaces present with the expected shapes |
| `src/app/api/admin/invoices/route.ts` (POST) | Threads `clientId`, existence check | ✓ VERIFIED | `clientId: data.clientId ?? null` in insert; 422 existence guard present |
| `src/app/api/admin/invoices/[id]/route.ts` (PUT) | Threads edited `clientId`, existence check | ✓ VERIFIED | Identical guard + `clientId: data.clientId ?? null` in the draft-only update; draft-lock (409) intact |
| `src/app/api/admin/invoices/[id]/status/route.ts` | 422 no-email guard + email-on-send after numbering UPDATE | ✓ VERIFIED | Guard precedes the gapless-numbering SQL (which is untouched — `SELECT COALESCE(MAX(sequence_number)` present exactly once); email call is best-effort, occurs after the UPDATE commits |
| `src/app/api/admin/invoices/[id]/resend/route.ts` | POST re-emails current PDF, no status mutation | ✓ VERIFIED | `requireAdmin()` first; 404/409/422 guards; zero `.set({ status` calls; ends with `{ ok: true }`, no state change |
| `src/components/forms/InvoiceStatusActions.tsx` | Resend + Revert to Draft replace Unpublish; distinct no-email prompt | ✓ VERIFIED | Both buttons present; `Unpublish` string count = 0; `no_client_email` handled distinctly in both `patch()` and `resend()` |
| `src/components/forms/ClientPicker.tsx` | Custom searchable listbox (not native select) | ✓ VERIFIED | `role="listbox"`, button+panel+click-outside pattern mirroring `CountryCodeSelect`; zero `<select>`/`<option>` elements; client-side filter on name/email/company; retained "One-off / no stored client" null option |
| `src/components/forms/InvoiceForm.tsx` | Wires picker, threads `clientId`, keeps link on manual edits | ✓ VERIFIED | `clientId` state seeded from `initialClientId`; only `handleClientSelect` mutates `clientId` (not `handleFieldChange`); `clientId` is the first key in the JSON request body |
| `src/app/admin/invoices/new/page.tsx` / `[id]/page.tsx` | Server-side `getClientsForPicker()` + `initialClientId` on edit | ✓ VERIFIED | Both call `getClientsForPicker()`; edit page additionally passes `initialClientId={inv.clientId}` in the draft branch only |
| `src/app/admin/clients/[id]/page.tsx` | Invoices Card + Phase 7 tickets seam | ✓ VERIFIED | `getClientInvoices(client.id)` called; "Invoices" Card rendered between Edit Details and Notes with links + "No invoices yet." empty state; explicit `Phase 7` comment seam present for a sibling Tickets Card |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `pdf/route.tsx` | `invoice-pdf.tsx` | `generateInvoicePdfBuffer(invoice, lineItems)` | ✓ WIRED | Direct call, no `renderToBuffer` import remaining in the route |
| `status/route.ts` | `invoice-pdf.tsx` + `email.ts` | `generateInvoicePdfBuffer` → `sendEmail({ attachments })` | ✓ WIRED | Called immediately after the numbering `db.execute`, using freshly re-selected invoice + line items |
| `resend/route.ts` | `invoice-pdf.tsx` + `email.ts` | Same pattern, no status change | ✓ WIRED | Confirmed no `.update(invoices).set({ status` present anywhere in the file |
| `InvoiceStatusActions.tsx` | `/api/admin/invoices/[id]/resend` | `resend()` → `fetch(..., { method: "POST" })` | ✓ WIRED | 422/`no_client_email` distinctly handled client-side |
| `InvoiceForm.tsx` | `ClientPicker.tsx` | Renders picker, `onSelect={handleClientSelect}` | ✓ WIRED | Auto-fill + `clientId` state set on select |
| `InvoiceForm.tsx` | `/api/admin/invoices` (POST/PUT) | Request body carries `clientId` | ✓ WIRED | `clientId` is the first key of the `JSON.stringify({...})` body |
| `invoices/route.ts` / `[id]/route.ts` | `clients` table | Pre-write existence `SELECT` | ✓ WIRED | Both routes run the identical guard before the transactional write |
| `new/page.tsx` / `[id]/page.tsx` | `client-query.ts` | `getClientsForPicker()` called server-side | ✓ WIRED | Passed as `clients` prop to `InvoiceForm` |
| `clients/[id]/page.tsx` | `client-query.ts` | `getClientInvoices(client.id)` | ✓ WIRED | Rendered in the Invoices Card with links to `/admin/invoices/{id}` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| Client detail page Invoices Card | `clientInvoices` | `getClientInvoices(client.id)` → real `SELECT ... WHERE client_id = $1` against Postgres | Yes | ✓ FLOWING |
| InvoiceForm picker | `clients` prop | `getClientsForPicker()` → real `SELECT` from `clients` table | Yes | ✓ FLOWING |
| Status/resend route email | PDF attachment bytes | `generateInvoicePdfBuffer(updated/inv, lineItems)` fed with freshly-queried DB rows (not static/mock) | Yes | ✓ FLOWING — additionally confirmed via a real live send this session (Resend delivered the PDF to a real inbox) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Mark Sent emails PDF to client (live, this session) | Created invoice with a real client email → PATCH status=sent under `netlify dev` | Resend email received with PDF attachment; owner confirmed receipt | ✓ PASS |
| Mark Sent blocked with no client email (live, this session) | PATCH status=sent on an invoice with no clientEmail | 422 `{ error: "no_client_email" }` returned, transition blocked | ✓ PASS |
| Full test suite | `npx vitest run` | 33 files passed, 134 passed / 48 skipped (DB-gated, no `NETLIFY_DB_URL` in this run) / 27 todo | ✓ PASS |
| Typecheck | `npx tsc --noEmit` | Exit 0, no errors | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| INVOICE-09 | 08-01, 08-02, 08-03 | Create invoice via searchable client picker, auto-fill + link `client_id` | ✓ SATISFIED | `ClientPicker.tsx` + `InvoiceForm.tsx` wiring + POST/PUT persistence, confirmed above |
| INVOICE-10 | 08-01, 08-02, 08-03 | Free-text one-off invoicing stays supported, existing invoices remain valid | ✓ SATISFIED | Nullable `clientId`, additive migration, "One-off" picker option |
| INVOICE-11 | 08-01, 08-04 | Mark Sent emails the invoice PDF to the client | ✓ SATISFIED | Verified in code + live-tested this session |
| INVOICE-12 | 08-04 | Blocked (422) + prompted when no client email | ✓ SATISFIED | Verified in code + live-tested this session |
| INVOICE-13 | 08-04 | Resend + Revert to Draft replace Unpublish | ✓ SATISFIED | Verified in code, `Unpublish` string fully removed |
| CLIENT-06 | 08-05 | Client detail page shows linked invoices AND tickets (history view) | ⚠ PARTIAL BY DESIGN (not a gap) | Invoices half fully delivered (`getClientInvoices` + Invoices Card); tickets half explicitly and correctly deferred to Phase 7 (tickets table does not exist yet). This split was a deliberate scope decision documented in 08-05-SUMMARY.md and the roadmap sequencing (Phase 7 = tickets), not an incomplete implementation of Phase 8's own goal. |

No orphaned requirements: all 6 requirement IDs (INVOICE-09 through INVOICE-13, CLIENT-06) are claimed across the five 08-0x plan frontmatters and REQUIREMENTS.md maps all of them to Phase 8.

**Note on REQUIREMENTS.md staleness:** the requirement checkboxes (lines 31-35) correctly show `[x]` for all five INVOICE-09..13 requirements, matching the final code state after 08-03/08-04 completed them. However, the Traceability table (lines 78, 84, 86) still shows "In Progress" for CLIENT-06, INVOICE-09, and INVOICE-11 — these are stale notes left over from intermediate plans (08-01/08-02) that were superseded by later plans (08-03/08-04/08-05) completing the same requirement. This is a documentation-freshness issue, not a code gap; the checkboxes (the authoritative markers) are correct.

### Anti-Patterns Found

None. Scanned all 16 phase-modified files for TODO/FIXME/placeholder comments, empty handlers, hardcoded empty-array returns, and console.log-only implementations — none found. No stray `[var(--...)]` bracket-form Tailwind tokens in any new component (`ClientPicker.tsx`, client detail page) — canonical `text-(--...)` form used throughout.

### Human Verification Required

None outstanding. The two most safety-critical behaviors for this phase — email-on-send delivery and the no-client-email block — were already live-tested end-to-end this session against a real Resend send and a real inbox, not just unit-tested. Visual/UX polish of the ClientPicker (search feel, keyboard nav) is a minor residual item an owner could sanity-check at their leisure but does not block phase completion.

### Gaps Summary

No gaps found. All 6 requirement IDs for this phase (INVOICE-09 through INVOICE-13, CLIENT-06) are implemented, wired, and — for the two highest-risk behaviors (email delivery, no-email block) — live-verified against real infrastructure this session. CLIENT-06 is intentionally partial (invoices half only) by explicit design, with tickets deferred to Phase 7 per the roadmap; this is documented as a deliberate scope split, not an unmet goal for Phase 8.

---
_Verified: 2026-07-05_
_Verifier: Claude (gsd-verifier)_
