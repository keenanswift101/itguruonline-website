---
phase: 06-clients-entity-crm-integration
plan: 02
subsystem: api
tags: [drizzle, postgres, zod, vitest, next-app-router, crud]

# Dependency graph
requires:
  - phase: 06-01
    provides: "clients table (schema.ts), client-types.ts contract (ClientListItem, CreateClientSchema, UpdateClientSchema), Wave 0 route.test.ts stubs"
provides:
  - "src/lib/client-query.ts — getClients() / getClientById(), single source of truth for client reads"
  - "POST + GET /api/admin/clients — create (source=manual) + list"
  - "GET + PUT /api/admin/clients/[id] — read one + edit (no status lock)"
  - "Filled non-DB guard tests for both routes (real 401 assertions replacing it.todo placeholders)"
affects: [06-03, 06-04, 06-05, phase-07-tickets, phase-08-linked-invoicing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "client-query.ts mirrors crm-query.ts exactly: Date->ISO conversion in the query layer, single getClients() called by both the API route and (in 06-03) the list page — no inline query duplication like crm/route.ts has"
    - "Clients have no status lifecycle, so PUT /api/admin/clients/[id] is a plain single-statement db.update() with no withTxDb/EditLockError machinery (unlike invoices/[id]'s draft-only write lock)"
    - "Provenance fields (source, sourceRecordType, sourceRecordId) are write-once at creation and never touched by the edit route"

key-files:
  created:
    - src/lib/client-query.ts
    - src/app/api/admin/clients/route.ts
    - src/app/api/admin/clients/[id]/route.ts
  modified:
    - src/app/api/admin/clients/route.test.ts
    - src/app/api/admin/clients/[id]/route.test.ts

key-decisions:
  - "Non-DB guard tests assert 401 for every case (including the 422/400 scenarios), since requireAdmin() with no session cookie always fires before validation — matches the established guard-order convention in crm/[id]/notes/route.test.ts. Real 422/400/404 body-shape assertions are left as it.todo() under describeIfDb, requiring a live session + DB."

patterns-established:
  - "CRUD API contract-first: client-query.ts + the two route files are now the stable server contract 06-03's list/create/edit UI pages will fetch/POST/GET/PUT against."

requirements-completed: [CLIENT-01, CLIENT-03, CLIENT-04]

# Metrics
duration: 16min
completed: 2026-07-04
---

# Phase 06 Plan 02: Client Data-Access Layer + CRUD API Summary

**client-query.ts (getClients/getClientById) plus POST+GET /api/admin/clients and GET+PUT /api/admin/clients/[id] route handlers, mirroring the existing crm/billing-schedules/invoices patterns exactly, with filled 401-guard tests replacing the Wave 0 it.todo stubs.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-04T14:44:00Z
- **Completed:** 2026-07-04T15:00:00Z
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 test stubs filled)

## Accomplishments
- `src/lib/client-query.ts` created with `getClients()` (newest-first, Date->ISO) and `getClientById()`, matching `crm-query.ts`'s established shape.
- `POST + GET /api/admin/clients` created: POST validates with `CreateClientSchema`, inserts with `source: "manual"`, returns `{ id }` (201); GET calls `getClients()` (no inline query duplication) and returns `{ items }`.
- `GET + PUT /api/admin/clients/[id]` created: GET returns the full row or 404; PUT validates with `UpdateClientSchema`, updates all editable fields via a plain `db.update()` (no status lock, no `withTxDb` needed — single-statement write), returns `{ ok: true }` or 404. Provenance fields (`source`/`sourceRecordType`/`sourceRecordId`) are never touched by PUT.
- Both Wave 0 test stub files (`route.test.ts` and `[id]/route.test.ts`) had their non-DB `it.todo()` guards replaced with real `it()` assertions: 401 for every unauthenticated request (POST/GET/PUT), following the guard-order convention established in `crm/[id]/notes/route.test.ts` (401 always fires before 422/400 body validation when no session cookie is present). DB-gated `it.todo()` blocks (create/persist/404 behaviors requiring a live session + DB) were left untouched under `describeIfDb`.

## Task Commits

Each task was committed atomically:

1. **Task 1: client-query.ts — getClients + getClientById** - `61ad76c` (feat)
2. **Task 2: POST + GET /api/admin/clients** - `092e1b5` (feat)
3. **Task 3: GET + PUT /api/admin/clients/[id]** - `5f5394d` (feat)

**Plan metadata:** (pending — this commit)

_Note: No TDD tasks in this plan (routes built directly per the plan's exact code, then guard tests filled in); all commits are single-pass feat._

## Files Created/Modified
- `src/lib/client-query.ts` - `getClients()` / `getClientById()`, ISO date conversion, single source of truth for client reads
- `src/app/api/admin/clients/route.ts` - `POST` (create, source=manual) + `GET` (list via `getClients()`)
- `src/app/api/admin/clients/route.test.ts` - filled non-DB guards (401 for POST and GET) replacing `it.todo()` placeholders
- `src/app/api/admin/clients/[id]/route.ts` - `GET` (one, 404 if missing) + `PUT` (edit all fields, no status lock, 404 if missing)
- `src/app/api/admin/clients/[id]/route.test.ts` - filled non-DB guards (401 for GET/PUT, 401-before-400-id-parse) replacing `it.todo()` placeholders

## Decisions Made
- Confirmed and followed the plan's guard-order pattern verbatim: since `requireAdmin()` is checked before any body/id parsing, all non-DB unauthenticated-request tests assert `401`, not the deeper validation status code they're nominally testing for. This matches the exact style of the existing `crm/[id]/notes/route.test.ts` test.
- No architectural deviations — plan executed exactly as written, including omitting `withTxDb` (single-statement writes only) and never referencing `source` in the `[id]/route.ts` edit handler.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `client-query.ts`'s `getClients()` is ready to be imported directly by 06-03's `/admin/clients` list page (server component) — no duplication needed.
- `POST /api/admin/clients` and `GET/PUT /api/admin/clients/[id]` are the stable contract 06-03's create form and edit form will call.
- `getClientById()` returns the full raw row (not yet ISO-serialized) — 06-03's detail/edit page must convert `createdAt`/`updatedAt` to ISO strings itself before passing to any client component, per the established Pitfall 1 pattern from the phase research.
- No blockers for 06-03.

---
*Phase: 06-clients-entity-crm-integration*
*Completed: 2026-07-04*

## Self-Check: PASSED

All 3 created files verified present on disk (client-query.ts, clients/route.ts, clients/[id]/route.ts); all 3 task commits (61ad76c, 092e1b5, 5f5394d) verified present in git log.
