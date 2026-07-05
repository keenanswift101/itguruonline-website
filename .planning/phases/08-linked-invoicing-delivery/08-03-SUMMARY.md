---
phase: 08-linked-invoicing-delivery
plan: 03
subsystem: ui
tags: [react, nextjs, tailwind, invoices, clients, listbox]

# Dependency graph
requires:
  - phase: 08-linked-invoicing-delivery (08-01)
    provides: getClientsForPicker() query + ClientPickerOption type
  - phase: 08-linked-invoicing-delivery (08-02)
    provides: POST/PUT invoice routes accepting and persisting clientId
provides:
  - "ClientPicker.tsx — searchable custom-listbox component (button + role=listbox + search input + click-outside), mirroring CountryCodeSelect"
  - "InvoiceForm.tsx wired with the picker: selecting a client auto-fills clientName/clientEmail/billingAddress and sets clientId; manual field edits do not unlink"
  - "Invoice new/edit pages fetch getClientsForPicker() server-side and pass it (plus initialClientId on edit) to InvoiceForm"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom searchable listbox pattern (ClientPicker) generalizes CountryCodeSelect's button+listbox+click-outside shape with an added client-side search input and a null-representing 'one-off' option"

key-files:
  created:
    - src/components/forms/ClientPicker.tsx
  modified:
    - src/components/forms/InvoiceForm.tsx
    - src/app/admin/invoices/new/page.tsx
    - src/app/admin/invoices/[id]/page.tsx

key-decisions:
  - "clientId state initializes from an optional initialClientId prop (null default) so InvoiceForm works unchanged for the create path (no prop) and the edit path (pre-selected link)"
  - "Editing clientName/clientEmail/billingAddress after picking a client does NOT clear clientId — only handleClientSelect touches clientId, matching the plan's locked decision that manual edits keep the link"

requirements-completed: [INVOICE-09, INVOICE-10]

duration: 6min
completed: 2026-07-05
---

# Phase 8 Plan 3: Client Picker UI Summary

**Searchable custom-listbox `ClientPicker` (button + `role="listbox"` + search input, no native `<select>`) wired into `InvoiceForm` for auto-fill + `clientId` linking, with both invoice pages now passing `getClientsForPicker()` server-side — completes INVOICE-09's user-facing half.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-05T06:25:30Z
- **Completed:** 2026-07-05T06:30:52Z
- **Tasks:** 3/3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Built `ClientPicker.tsx`, a `"use client"` searchable custom listbox mirroring `CountryCodeSelect`'s button + click-outside + `role="listbox"` pattern, with an added search input and a retained "One-off / no stored client" (`null`) option
- Wired `ClientPicker` into `InvoiceForm.tsx`: new `clientId` state (seeded from `initialClientId`), a `handleClientSelect` handler that auto-fills `clientName`/`clientEmail`/`billingAddress` on selection, and `clientId` now sent as the first key in the POST/PUT JSON body
- Both invoice pages (`new/page.tsx`, `[id]/page.tsx`) now fetch `getClientsForPicker()` server-side and pass `clients` (plus `initialClientId={inv.clientId}` on the draft-edit page) down to `InvoiceForm`

## Task Commits

Each task was committed atomically:

1. **Task 1: ClientPicker.tsx searchable listbox** - `27bf5cd` (feat)
2. **Task 2: Wire ClientPicker into InvoiceForm + thread clientId** - `1f1231d` (feat)
3. **Task 3: Pass client list + initialClientId from the invoice pages** - `f51c2c3` (feat)

_Note: no TDD tasks in this plan — all three were single-commit `auto` tasks._

## Files Created/Modified
- `src/components/forms/ClientPicker.tsx` - new searchable custom-listbox component; `role="listbox"`, client-side filter on name/email/company, "One-off / no stored client" null option
- `src/components/forms/InvoiceForm.tsx` - added `clients`/`initialClientId` props, `clientId` state, `handleClientSelect` auto-fill handler, renders `ClientPicker` above the Client Name field when a client list is supplied, `clientId` added to the request body
- `src/app/admin/invoices/new/page.tsx` - fetches `getClientsForPicker()`, passes `clients` to `InvoiceForm`
- `src/app/admin/invoices/[id]/page.tsx` - fetches `getClientsForPicker()`, passes `clients` + `initialClientId={inv.clientId}` to `InvoiceForm` in the draft-edit branch only; read-only display branch unchanged

## Decisions Made
- `clientId` is only ever set inside `handleClientSelect` (never inside `handleFieldChange`), so editing an auto-filled name/email/address keeps the link — matches the plan's locked decision
- Picker render condition is `clients && clients.length > 0`, so an empty client list (no clients created yet) gracefully falls back to the original free-text-only form with no picker rendered

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Full `npx tsc --noEmit` and `npx vitest run` both passed on the first attempt for every task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- INVOICE-09 and INVOICE-10 are now genuinely complete end-to-end (schema/query from 08-01, routes from 08-02, picker UI from this plan).
- Phase 8 (linked-invoicing-delivery) is now fully complete: 08-01, 08-02, 08-03, 08-04, 08-05 all done.
- `npx tsc --noEmit` clean; full `npx vitest run` suite green (134 passed, 48 skipped, 27 todo).
- Manual verification (per 08-VALIDATION) — creating an invoice under `netlify dev`, picking a client, confirming auto-fill and persisted `client_id` — was not run in this session; recommended before considering INVOICE-09/10 fully validated in production.

---
*Phase: 08-linked-invoicing-delivery*
*Completed: 2026-07-05*

## Self-Check: PASSED

- FOUND: src/components/forms/ClientPicker.tsx
- FOUND: src/components/forms/InvoiceForm.tsx
- FOUND: src/app/admin/invoices/new/page.tsx
- FOUND: src/app/admin/invoices/[id]/page.tsx
- FOUND commit: 27bf5cd
- FOUND commit: 1f1231d
- FOUND commit: f51c2c3
