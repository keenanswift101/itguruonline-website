---
phase: 06-clients-entity-crm-integration
plan: 04
subsystem: api
tags: [drizzle, postgres, withTxDb, next-app-router, vitest]

# Dependency graph
requires:
  - phase: 06-01
    provides: "clients table (schema.ts), convertedClientId FK column on clientRegistrations/contactEnquiries, Wave 0 convert/route.test.ts stub"
provides:
  - "POST /api/admin/crm/[id]/convert — atomic withTxDb transaction that inserts a clients row and stamps converted_client_id on the source lead"
  - "ConvertButton client component — Convert to Client / View Client, wired into the CRM detail page"
  - "Idempotency guard: re-converting an already-converted lead returns 409, checked inside the transaction"
affects: [06-05, phase-07-tickets, phase-08-linked-invoicing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Convert-from-lead is the phase's only two-table atomic write, following the exact withTxDb + tx.transaction() shape from invoices/route.ts POST (select-check -> insert -> update, all inside one tx)"
    - "AlreadyConvertedError thrown inside the transaction (not pre-checked outside it) to race-proof idempotency, mirroring the Phase 4 invoice draft-lock pattern"
    - "ConvertButton mirrors NoteForm.tsx's client-component fetch+router pattern; renders a static 'View Client' link (no fetch) when already converted rather than a disabled button"

key-files:
  created:
    - src/app/api/admin/crm/[id]/convert/route.ts
    - src/components/admin/crm/ConvertButton.tsx
  modified:
    - src/app/api/admin/crm/[id]/convert/route.test.ts
    - src/app/admin/crm/[id]/page.tsx

key-decisions:
  - "Non-DB guard test for an unparseable id also asserts 401 (not 404) — requireAdmin() runs before parseCrmId(), so an unauthenticated request never reaches the id-parse branch. Matches the established guard-order convention from crm/[id]/notes/route.test.ts and 06-02's client routes."
  - "Lead status field is left untouched by convert — only convertedClientId is stamped, per 06-RESEARCH.md's explicit call to not conflate the lead lifecycle (new/contacted/in_progress/completed) with conversion."

patterns-established:
  - "Convert-from-lead atomic write: select-with-idempotency-check -> insert child entity -> update parent back-link, all inside one withTxDb(tx => tx.transaction(...)) call, with a typed sentinel error class (AlreadyConvertedError) thrown inside the tx and caught after to map to the correct HTTP status."

requirements-completed: [CLIENT-02]

# Metrics
duration: 15min
completed: 2026-07-04
---

# Phase 06 Plan 04: Convert-from-Lead (CLIENT-02) Summary

**POST /api/admin/crm/[id]/convert — a single withTxDb transaction that inserts a `clients` row (mapped from either a registration or an enquiry) and stamps `converted_client_id` back on the lead, plus a ConvertButton wired into the CRM detail page that shows "Convert to Client" or "View Client".**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-04T17:05:00Z
- **Completed:** 2026-07-04T17:20:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `POST /api/admin/crm/[id]/convert` created: a single `withTxDb((db) => db.transaction(...))` call selects the lead, checks `convertedClientId` for idempotency, inserts the mapped `clients` row, and stamps `convertedClientId` back on the lead — all inside one transaction, matching the exact shape of `invoices/route.ts`'s POST handler.
- Field mapping matches 06-RESEARCH.md exactly: registration -> `${firstName} ${surname}`.trim() / cellPhone / physicalAddress / postalAddress / source=`from_registration`; enquiry -> name / email / phone ?? "" / source=`from_enquiry`. Both stamp `sourceRecordType`/`sourceRecordId` for back-reference.
- Idempotency: `AlreadyConvertedError` is thrown *inside* the transaction (not a pre-check outside it) when `convertedClientId` is already set, caught after and mapped to a 409 response — race-proof, mirroring the Phase 4 invoice draft-lock pattern the plan called for.
- `ConvertButton.tsx` created (client component): POSTs to the convert route, redirects to `/admin/clients/[id]` on success (201), shows a static "View Client" link once `convertedClientId` is already set (no fetch needed), and surfaces a "Already converted." message + `router.refresh()` on a 409 response.
- Wired into `src/app/admin/crm/[id]/page.tsx` next to `StatusSelect`, passing `record.convertedClientId ?? null` (both lead tables carry this column since 06-01).
- Filled the Wave 0 test stub's non-DB guards: 401 for an unauthenticated request with a valid-shaped id, and 401 for an unauthenticated request with an unparseable id (since `requireAdmin()` fires before `parseCrmId()`, both cases short-circuit to 401 — matches the established guard-order convention). DB-gated mapping/idempotency `it.todo()` blocks were left untouched under `describeIfDb`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert route + test** - `71e2af3` (feat)
2. **Task 2: ConvertButton + wire into CRM detail page** - `98c0655` (feat)

**Plan metadata:** (pending — this commit)

_Note: No TDD tasks in this plan (routes/component built directly per the plan's exact code, then guard tests filled in); both commits are single-pass feat._

## Files Created/Modified
- `src/app/api/admin/crm/[id]/convert/route.ts` - `POST` handler: single `withTxDb` transaction, dual field-mapping (registration/enquiry -> client), `AlreadyConvertedError` -> 409, `NOT_FOUND` -> 404
- `src/app/api/admin/crm/[id]/convert/route.test.ts` - filled non-DB guards (401 for both a valid-shaped and an unparseable id) replacing `it.todo()` placeholders; DB-gated mapping/idempotency tests left as `it.todo()` under `describeIfDb`
- `src/components/admin/crm/ConvertButton.tsx` - client component: "Convert to Client" button (POST + redirect) or "View Client" link, 409 handling
- `src/app/admin/crm/[id]/page.tsx` - imports and renders `ConvertButton` next to `StatusSelect`, passing `recordType`/`recordId`/`convertedClientId`

## Decisions Made
- Confirmed and followed the plan's guard-order convention verbatim: since `requireAdmin()` is checked before `parseCrmId()`, the "unparseable id" guard test asserts 401, not 404 — matching 06-02's established pattern for this codebase.
- No architectural deviations — plan executed exactly as written, including leaving the lead's `status` field untouched by convert.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. No new migration needed (schema already has `clients` + `convertedClientId` from 06-01).

## Next Phase Readiness
- `POST /api/admin/crm/[id]/convert` and `ConvertButton` are stable; 06-05 (client edit UI / detail page) can rely on `client.id` returned by this route for redirect targets.
- `converted_client_id` idempotency guard is race-proof (checked inside the transaction), so Phase 7/8 can safely assume a lead is never double-converted.
- Full DB-gated mapping/idempotency assertions remain `it.todo()` (require a live session + DB) — flagged as pre-existing Wave 0 scope, not a gap introduced by this plan; manual verification via `netlify dev` recommended before the phase gate per the plan's own verification step 5.
- No blockers for 06-05.

---
*Phase: 06-clients-entity-crm-integration*
*Completed: 2026-07-04*

## Self-Check: PASSED

All 4 files verified present on disk (route.ts, route.test.ts, ConvertButton.tsx, crm/[id]/page.tsx); both task commits (71e2af3, 98c0655) verified present in git log.
