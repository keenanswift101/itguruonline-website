---
phase: 08-linked-invoicing-delivery
plan: 02
subsystem: api
tags: [drizzle, postgres, zod, invoices, clients]

# Dependency graph
requires:
  - phase: 08-linked-invoicing-delivery (08-01)
    provides: invoices.clientId nullable FK column + invoiceInput.clientId zod field
provides:
  - "POST /api/admin/invoices persists clientId (or NULL for a one-off) with a pre-insert client-existence check"
  - "PUT /api/admin/invoices/[id] persists an edited clientId on draft invoices with the same existence check"
  - "Shared 422 { fields: { clientId: [\"Client not found.\"] } } response shape for an unknown clientId on both routes"
affects: [08-03-picker-ui, 08-05-client-invoice-history]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-existence guard: a plain db.select before the withTxDb write, only run when clientId != null, returning 422 rather than letting an FK violation surface as a raw 500"

key-files:
  created: []
  modified:
    - src/app/api/admin/invoices/route.ts
    - src/app/api/admin/invoices/route.test.ts
    - src/app/api/admin/invoices/[id]/route.ts
    - src/app/api/admin/invoices/[id]/route.test.ts

key-decisions:
  - "Existence check runs as a plain db.select (not inside withTxDb) since it's a pre-condition read, not part of the atomic write — matches the billing-schedules FK-existence pattern referenced in the plan"
  - "Test stubs for the new clientId DB behavior added as it.todo (not fully implemented) per the plan's explicit instruction, since the mocked-db PUT test suite intercepts db.select generically and would need a more elaborate per-call mock to differentiate the clients lookup from the invoices lookup"

requirements-completed: [INVOICE-10]
# Note: plan frontmatter listed [INVOICE-09, INVOICE-10] as requirements, but INVOICE-09's
# acceptance criteria requires the searchable client-picker UI, which lands in 08-03 —
# only the backend route half is done here. Reverted REQUIREMENTS.md's INVOICE-09 checkbox
# back to unchecked/"In Progress", matching the 08-01 correction precedent for this same
# over-broad-frontmatter pattern. INVOICE-10 (free-text one-off still works) is genuinely
# complete end-to-end after this plan.

duration: 8min
completed: 2026-07-04
---

# Phase 8 Plan 2: Invoice Route Client Linking Summary

**POST and PUT invoice routes now thread the optional `clientId` from `invoiceInput` into the existing `withTxDb` insert/update, with a pre-write `clients` existence check returning a clean 422 instead of a raw FK-violation 500 — free-text one-off invoices (clientId null/omitted) are unaffected.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-04T20:44:00+02:00 (approx.)
- **Completed:** 2026-07-04T20:52:00+02:00
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments
- `POST /api/admin/invoices` validates a supplied `clientId` against the `clients` table before the transactional insert, then threads `clientId: data.clientId ?? null` into `tx.insert(invoices).values({...})`
- `PUT /api/admin/invoices/[id]` applies the identical existence guard and threads `clientId: data.clientId ?? null` into the draft-only `tx.update(invoices).set({...})`, keeping the existing draft-lock (409) and EditLockError rollback behavior untouched
- Both routes return `{ error: "Validation failed.", fields: { clientId: ["Client not found."] } }` with a 422 status for an unknown `clientId`, mirroring the existing zod-validation error shape rather than introducing a new error format
- Extended both route test files with `it.todo(...)` stubs documenting the expected 422/persist/null-persist behavior for a future DB-integration pass, without touching any existing passing test

## Task Commits

Each task was committed atomically:

1. **Task 1: POST route — thread clientId + client-existence check** - `9f20233` (feat)
2. **Task 2: PUT route — thread clientId on draft edit** - `ca8ecfe` (feat)

_Note: no TDD tasks in this plan — both were single-commit `auto` tasks._

## Files Created/Modified
- `src/app/api/admin/invoices/route.ts` - added `db`, `eq`, `clients` imports; existence guard before insert; `clientId: data.clientId ?? null` in the `tx.insert(invoices).values({...})` call
- `src/app/api/admin/invoices/route.test.ts` - added 1 non-DB `it.todo` (422 unknown clientId) and 2 DB-gated `it.todo`s (persists clientId / NULL for omitted)
- `src/app/api/admin/invoices/[id]/route.ts` - added `clients` to existing schema import; identical existence guard before the withTxDb update block; `clientId: data.clientId ?? null` in the `tx.update(invoices).set({...})` call
- `src/app/api/admin/invoices/[id]/route.test.ts` - added 2 DB-gated `it.todo`s (persists edited clientId / keeps NULL for free-text edit)

## Decisions Made
- Existence check is a plain `db.select` outside `withTxDb` since it's a read-only pre-condition, not part of the atomic write — the plan's `<interfaces>` section confirms `db`, `clients`, and `eq` are already available this way in both route files (PUT already imported `db`/`eq`; POST needed both added)
- Kept the client-existence guard's 422 shape identical to the existing zod `fieldErrors` shape (`{ error: "Validation failed.", fields: {...} }`) so callers (08-03 picker UI) can treat it as just another field error rather than special-casing a new error type

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both invoice routes now honour a `clientId` sent in the request body — 08-03's searchable client picker UI can send `clientId` and see it actually persisted end-to-end.
- `npx tsc --noEmit` clean; full `npx vitest run` suite green (134 passed, 48 skipped, 24 todo — including the 5 new `it.todo` stubs added in this plan).
- The `it.todo` DB-integration stubs (persist/null/422-unknown-clientId) are left unimplemented per the plan's instruction — a future plan touching these routes should implement them against a real `NETLIFY_DB_URL`-gated `describeIfDb` block, seeding a real `clients` row.

---
*Phase: 08-linked-invoicing-delivery*
*Completed: 2026-07-04*

## Self-Check: PASSED

- FOUND: src/app/api/admin/invoices/route.ts
- FOUND: src/app/api/admin/invoices/[id]/route.ts
- FOUND commit: 9f20233
- FOUND commit: ca8ecfe
