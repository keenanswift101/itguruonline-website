---
phase: 10-quotations
plan: 05
subsystem: ui
tags: [react, nextjs, tailwind, quotations, clients, forms]

# Dependency graph
requires:
  - phase: 10-quotations
    provides: "10-01: quotationInput/formatQuotationNumber/quotation-status (STATUS_BADGE, EXPIRED_BADGE, isExpired); 10-03: POST/PUT /api/admin/quotations[/[id]] routes"
  - phase: 08-linked-invoicing-delivery
    provides: "ClientPicker.tsx + getClientsForPicker() + InvoiceForm.tsx pattern to mirror"
provides:
  - "QuotationForm.tsx — create/edit quotation form reusing ClientPicker unmodified, with a required Valid Until field replacing Due Date (QUOTE-01)"
  - "New Quotation page (/admin/quotations/new) rendering QuotationForm with picker clients"
  - "Quotations list page (/admin/quotations) — status filter (draft/sent/accepted/declined), status + Expired badges, per-row PDF download link (QUOTE-06)"
  - "AdminSidebar Quotations nav entry (between Invoices and Automations)"
affects: [10-06-quotation-status-detail-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "QuotationForm is a structural mirror of InvoiceForm (same ClientPicker reuse, same clientId-only-set-in-handleClientSelect rule, same 201-redirect/409/422 handling), swapping dueDate->validUntil and the invoice endpoint for the quotation endpoint"
    - "Quotations list page mirrors the invoices list page but adds a second per-row action (PDF download anchor) alongside View, and swaps CSV export for nothing (not scoped for quotations)"

key-files:
  created:
    - src/components/forms/QuotationForm.tsx
    - src/app/admin/quotations/new/page.tsx
    - src/app/admin/quotations/page.tsx
  modified:
    - src/components/admin/AdminSidebar.tsx

key-decisions: []

patterns-established: []

requirements-completed: [QUOTE-01, QUOTE-06]

# Metrics
duration: ~10min
completed: 2026-07-05
---

# Phase 10 Plan 05: Quotation Form + List UI Summary

**QuotationForm (InvoiceForm mirror with a required Valid Until field), the New Quotation page, and a Quotations list page with status filter + Expired badge + per-row PDF download, plus the AdminSidebar Quotations nav entry**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-05T17:10:00Z (approx, session start)
- **Completed:** 2026-07-05T17:20:08Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `QuotationForm.tsx` reuses `ClientPicker` unmodified for client auto-fill (name/email/billingAddress), keeps the "only `handleClientSelect` sets `clientId`" rule from `InvoiceForm`, replaces the invoice's Due Date field with a required Valid Until date, and posts to `/api/admin/quotations` (create, 201 → redirect to `/admin/quotations/[id]`) or `PUT /api/admin/quotations/[id]` (edit, stays + `router.refresh()`)
- New Quotation page (`/admin/quotations/new`) gates on `requireAdmin()`, fetches `getClientsForPicker()` server-side, and renders `QuotationForm` inside the same card layout as the invoice new page
- Quotations list page (`/admin/quotations`) filters by `draft`/`sent`/`accepted`/`declined` via `?status=`, shows the `STATUS_BADGE` plus an `EXPIRED_BADGE` when `isExpired(q.status, q.validUntil)` is true, and adds a per-row "PDF" anchor to `/api/admin/quotations/{id}/pdf` alongside "View" (no CSV export, per plan — quotations don't need it)
- `AdminSidebar.tsx` gets a `Quotations` nav entry inserted between `Invoices` and `Automations`

## Task Commits

Each task was committed atomically:

1. **Task 1: QuotationForm.tsx (create/edit, reuses ClientPicker, Valid Until field)** - `0d1bc91` (feat)
2. **Task 2: New Quotation page + Quotations list page + sidebar nav entry** - `78a9e32` (feat)

**Plan metadata:** (pending) - docs: complete plan

## Files Created/Modified
- `src/components/forms/QuotationForm.tsx` - create/edit form; ClientPicker reuse, Valid Until field, POST/PUT to quotation routes, "Create Quotation"/"Save Changes" labels, "Quotation Total:" summary
- `src/app/admin/quotations/new/page.tsx` - requireAdmin-gated new-quotation page, fetches `getClientsForPicker()`, renders `QuotationForm`
- `src/app/admin/quotations/page.tsx` - quotations list: `FILTERABLE_STATUSES`, status/Expired badges, Reference/Client/Valid Until/Total/Status/Actions columns, View + PDF links per row
- `src/components/admin/AdminSidebar.tsx` - added `{ href: "/admin/quotations", label: "Quotations" }` between Invoices and Automations

## Decisions Made
None - followed plan as specified. Structural choices (mirroring InvoiceForm/invoices list page exactly, dropping CSV export) were explicitly directed by the plan, not independent decisions.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their acceptance criteria (grep checks for `validUntil`, zero `dueDate` occurrences, zero bracket-form `text-[var(...)]` usage, `FILTERABLE_STATUSES`, `formatQuotationNumber(q.id)`, the PDF href template, `isExpired(q.status, q.validUntil)`, and the sidebar entry) on the first attempt.

## Issues Encountered

None. `npx tsc --noEmit` was clean after each task; full `npx vitest run` (161 passed, 48 skipped, 45 todo) stayed green after both tasks. A pre-existing, out-of-scope `deno.lock` diff (unrelated dependency drift from earlier sessions — `pg`, `@react-pdf/renderer`, `@netlify/functions`, `@types/ws` entries) was present in `git status` throughout this plan; left untouched per the scope-boundary rule since it wasn't caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- QUOTE-01 (create, form half) and QUOTE-06 (list/filter/download) are now genuinely complete end-to-end: schema+libs (10-01) + PDF (10-02) + CRUD backend (10-03) + this plan's form/list UI.
- 10-06 (quotation-status-detail-ui) can now build the detail/edit page and status-transition actions (send/accept/decline/convert) on top of the routes from 10-01/10-03/10-04 and the list/new pages built here — the detail page's "View" link (`/admin/quotations/{id}`) is already wired from the list page and just needs its target page built.
- No blockers.

---
*Phase: 10-quotations*
*Completed: 2026-07-05*

## Self-Check: PASSED

- FOUND: src/components/forms/QuotationForm.tsx
- FOUND: src/app/admin/quotations/new/page.tsx
- FOUND: src/app/admin/quotations/page.tsx
- FOUND: src/components/admin/AdminSidebar.tsx (modified)
- FOUND commit: 0d1bc91
- FOUND commit: 78a9e32
