---
phase: 08-linked-invoicing-delivery
plan: 01
subsystem: database
tags: [drizzle, postgres, resend, react-pdf, invoices, clients]

# Dependency graph
requires:
  - phase: 06-clients-entity-crm-integration
    provides: clients table + getClients()/getClientById() query conventions
provides:
  - invoices.client_id nullable FK (migration 0006, additive-only)
  - invoiceInput.clientId (optional, null/undefined = one-off invoice)
  - generateInvoicePdfBuffer() shared PDF helper (src/lib/invoice-pdf.tsx)
  - sendEmail() attachments option (first attachment support in the codebase)
  - getClientsForPicker() + ClientPickerOption type
  - Wave 0 test stubs for the resend route and the PDF helper
affects: [08-02-linking-routes, 08-03-picker-ui, 08-04-send-resend-revert, 08-05-client-invoice-history]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared PDF-buffer helper (generateInvoicePdfBuffer) as single source of truth for both download and future email-attachment paths"
    - "sendEmail() attachments threaded through as an optional field, preserving the existing fire-and-forget Promise<void> contract"

key-files:
  created:
    - src/lib/invoice-pdf.tsx
    - src/app/api/admin/invoices/[id]/resend/route.test.ts
    - src/lib/invoice-pdf.test.ts
    - netlify/database/migrations/0006_invoice_client_link.sql
  modified:
    - src/lib/db/schema.ts
    - src/lib/invoices.ts
    - src/app/api/admin/invoices/[id]/pdf/route.tsx
    - src/lib/email.ts
    - src/lib/client-query.ts
    - src/lib/client-types.ts

key-decisions:
  - "Migration 0006 generated via drizzle-kit (not hand-written) to guarantee constraint-naming/style parity with 0005; verified additive-only (ADD COLUMN + ADD CONSTRAINT, no DROP)"
  - "invoice-pdf.tsx uses .tsx extension (not .ts) since it renders JSX directly"

requirements-completed: [INVOICE-09, INVOICE-10, INVOICE-11]

duration: 12min
completed: 2026-07-04
---

# Phase 8 Plan 1: Linked Invoicing Foundation Summary

**Nullable `invoices.client_id` FK (migration 0006) + shared `generateInvoicePdfBuffer` helper + `sendEmail` attachments option + `getClientsForPicker` query — zero user-facing behaviour change, all downstream Phase 8 work builds on these four contracts.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-04T20:05:00+02:00 (approx.)
- **Completed:** 2026-07-04T20:12:00+02:00
- **Tasks:** 3/3
- **Files modified:** 10 (4 created, 6 modified)

## Accomplishments
- Added `invoices.clientId` nullable FK to `clients.id` (`ON DELETE SET NULL`) via drizzle-kit-generated migration `0006_invoice_client_link.sql` — additive only, no DROP/backfill, verified against 0005's exact style
- Extracted `renderToBuffer(<InvoiceDocument/>)` out of the pdf download route into `src/lib/invoice-pdf.tsx`'s `generateInvoicePdfBuffer()`, now the single source of truth the download route calls (and 08-04's send/resend paths will reuse)
- Extended `sendEmail()` with an optional `attachments` field, threaded straight into `resend.emails.send()` without changing its `Promise<void>` fire-and-forget contract or BCC logic
- Added `getClientsForPicker()` + `ClientPickerOption` (id/name/email/company/physicalAddress/postalAddress) for the INVOICE-09 searchable client picker
- Added 2 Wave 0 test stubs: `resend/route.test.ts` (NETLIFY_DB_URL-gated, `next/headers` + `resend` mocked) and `invoice-pdf.test.ts`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add invoices.clientId + generate migration 0006 + extend invoiceInput** - `53a8749` (feat)
2. **Task 2: Shared PDF helper + refactor pdf route + sendEmail attachments** - `d0733cd` (feat)
3. **Task 3: getClientsForPicker query + ClientPickerOption type + Wave 0 test stubs** - `42f58d6` (feat)

_Note: no TDD tasks in this plan — all three were single-commit `auto` tasks._

## Files Created/Modified
- `src/lib/db/schema.ts` - added `invoices.clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" })`
- `netlify/database/migrations/0006_invoice_client_link.sql` - `ALTER TABLE invoices ADD COLUMN client_id integer` + FK constraint (additive-only, no DROP)
- `netlify/database/migrations/meta/_journal.json` / `meta/0006_snapshot.json` - drizzle-kit generated tracking files
- `src/lib/invoices.ts` - `invoiceInput.clientId: z.number().int().positive().nullable().optional()`
- `src/lib/invoice-pdf.tsx` - new `generateInvoicePdfBuffer(invoice, lineItems): Promise<Buffer>` helper
- `src/app/api/admin/invoices/[id]/pdf/route.tsx` - now calls `generateInvoicePdfBuffer` instead of `renderToBuffer` directly; `Uint8Array` Response wrap unchanged
- `src/lib/email.ts` - `SendEmailOptions.attachments?: { filename: string; content: Buffer | string }[]`, threaded into the Resend call
- `src/lib/client-query.ts` - new `getClientsForPicker()` query
- `src/lib/client-types.ts` - new `ClientPickerOption` interface
- `src/app/api/admin/invoices/[id]/resend/route.test.ts` - Wave 0 stub for INVOICE-13's resend route
- `src/lib/invoice-pdf.test.ts` - Wave 0 stub for the shared PDF helper

## Decisions Made
- Generated migration 0006 via `npm run db:generate` rather than hand-writing it, to exactly match drizzle-kit's own constraint-naming convention (`invoices_client_id_clients_id_fk`) — confirmed it ran without needing a live DB connection (diffs the local meta snapshot only), and confirmed the output contains zero DROP statements before proceeding.
- Kept `invoice-pdf.tsx` (not `.ts`) since it directly renders `<InvoiceDocument .../>` JSX.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. (Migration 0006 will auto-apply on the next `main` deploy per existing Netlify Database convention; no manual `netlify database migrations apply` was run against a live DB in this plan, per the plan's explicit instruction not to.)

## Next Phase Readiness

- `invoices.clientId`, `generateInvoicePdfBuffer`, `sendEmail`'s `attachments` option, and `getClientsForPicker`/`ClientPickerOption` are all in place for 08-02 (linking routes), 08-03 (picker UI), 08-04 (send/resend/revert), and 08-05 (client invoice history) to build against directly.
- No blockers. `npx tsc --noEmit` clean; full `npx vitest run` suite green (131 passed, 48 skipped, 20 todo — including the 2 new Wave 0 stub files).

---
*Phase: 08-linked-invoicing-delivery*
*Completed: 2026-07-04*

## Self-Check: PASSED

- FOUND: src/lib/invoice-pdf.tsx
- FOUND: netlify/database/migrations/0006_invoice_client_link.sql
- FOUND: src/app/api/admin/invoices/[id]/resend/route.test.ts
- FOUND: src/lib/invoice-pdf.test.ts
- FOUND commit: 53a8749
- FOUND commit: d0733cd
- FOUND commit: 42f58d6
