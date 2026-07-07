---
phase: 07-tickets
plan: 02
subsystem: api
tags: [drizzle, postgres, zod, vitest, tickets, api]

# Dependency graph
requires:
  - phase: 07-tickets (07-01)
    provides: tickets table (schema.ts), ticket-types.ts contract (TicketListItem, ClientTicketSummary, CreateTicketSchema, UpdateTicketSchema), ticket-status.ts (TicketStatus), 2 route test stubs for this plan to fill
provides:
  - ticket-query.ts (getTickets, getTicketById, getClientTickets query layer)
  - POST/GET /api/admin/tickets (create with client-existence check + list with ?status filter)
  - GET/PUT /api/admin/tickets/[id] (detail + edit subject/description/priority)
  - Filled non-DB guard assertions in both Wave 0 route test stubs
affects: [07-03, 07-04, 07-05, 08 (CLIENT-06 tickets half)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ticket ordering via two SQL CASE expressions (RESOLVED_LAST, PRIORITY_RANK) composed into .orderBy() — shared between getTickets (unfiltered) and getClientTickets"
    - "Client-existence 422 pre-check as a plain db.select outside any tx (single insert, no withTxDb needed) — same pattern as 08-02's invoice clientId guard"

key-files:
  created:
    - src/lib/ticket-query.ts
    - src/app/api/admin/tickets/route.ts
    - src/app/api/admin/tickets/[id]/route.ts
  modified:
    - src/app/api/admin/tickets/route.test.ts
    - src/app/api/admin/tickets/[id]/route.test.ts

key-decisions:
  - "getTickets(statusFilter) only applies RESOLVED_LAST ordering in the unfiltered case (when filtering to a single status, resolved-sinks-to-bottom is a no-op, so PRIORITY_RANK + updatedAt desc alone drives filtered ordering)"
  - "Did not mark TICKET-01/04/05 complete — this plan only delivers the backend route layer; owner-facing create/list/detail UI is 07-04/07-05's job (mirrors the 06-01/06-02/08-01/08-02/10-01 correction precedent). Traceability table updated to 'In Progress' with a note pointing at the UI plans."

patterns-established:
  - "Ticket route guard tests use the toggleable `sessionToken` closure variable (not a static next/headers mock) so authed 422/wired-body cases can run without a DB, mirroring quotations' route.test.ts convention"

requirements-completed: []

# Metrics
duration: 22min
completed: 2026-07-07
---

# Phase 07 Plan 02: Ticket Query Layer + Create/List/Detail/Edit Routes Summary

**Ticket CRUD backend (ticket-query.ts + POST/GET /api/admin/tickets + GET/PUT /api/admin/tickets/[id]) with open-first/priority-desc ordering and a client-existence 422 guard on create, ready for the 07-04/07-05 UI to consume.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-07T11:43:34+02:00
- **Completed:** 2026-07-07T12:05:38+02:00
- **Tasks:** 3 completed
- **Files modified:** 5 (3 created, 2 filled-in test stubs)

## Accomplishments
- `src/lib/ticket-query.ts`: `getTickets(statusFilter?)` (client-joined list, open/in_progress before resolved, then priority high→low, then most-recently-updated), `getTicketById(id)` (client-joined detail or null), `getClientTickets(clientId)` (CLIENT-06 seam, resolved last)
- `POST /api/admin/tickets`: validates `CreateTicketSchema`, 422s with `fieldErrors` on bad input, 422s with a `clientId` field error if the client doesn't exist, single-insert (no `withTxDb`, per CLAUDE.md's neon-http transaction rule) with `status: "open"`, 201 with the new id
- `GET /api/admin/tickets`: lists via `getTickets`, optional `?status=open|in_progress|resolved` filter (unknown values ignored, falls back to unfiltered)
- `GET /api/admin/tickets/[id]`: client-joined detail, 404 for unknown/non-numeric id
- `PUT /api/admin/tickets/[id]`: edits subject/description/priority via `UpdateTicketSchema` (never clientId/status — status is 07-03's transition-guarded route), 404 if the row doesn't exist
- Filled all non-DB guard assertions in both Wave 0 test stubs (401 on every route, 422 on empty subject / missing clientId) — DB-dependent create/ordering/detail/edit assertions remain `describeIfDb` todos for a future DB-gated pass

## Task Commits

Each task was committed atomically:

1. **Task 1: ticket-query.ts (getTickets, getTicketById, getClientTickets)** - `eecc382` (feat)
2. **Task 2: POST/GET /api/admin/tickets + fill route.test guards** - `1e5458b` (feat)
3. **Task 3: GET/PUT /api/admin/tickets/[id] + fill [id]/route.test guards** - `e213526` (feat)

_No TDD RED/GREEN split needed — every task is new-file/stub-fill creation against the 07-01 contract, no existing behavior to red/green cycle against._

## Files Created/Modified
- `src/lib/ticket-query.ts` - getTickets/getTicketById/getClientTickets query layer, RESOLVED_LAST + PRIORITY_RANK SQL CASE ordering helpers
- `src/app/api/admin/tickets/route.ts` - POST (create + client-existence 422) + GET (list + ?status filter)
- `src/app/api/admin/tickets/route.test.ts` - filled 401 (POST+GET) and 422 (empty subject, missing clientId) guard assertions
- `src/app/api/admin/tickets/[id]/route.ts` - GET (detail, 404 unknown) + PUT (edit subject/description/priority, 404 unknown)
- `src/app/api/admin/tickets/[id]/route.test.ts` - filled 401 (GET+PUT) guard assertions
- `.planning/REQUIREMENTS.md` - traceability table updated: TICKET-01/04/05 moved Pending → In Progress with notes pointing at 07-04/07-05 for the remaining UI work

## Decisions Made
- Client-existence check for ticket create is a plain `db.select` outside any transaction — the ticket insert itself is a single statement, so no `withTxDb()` is needed (consistent with CLAUDE.md's neon-http transaction rule and the 08-02 invoice-linking precedent).
- Did not run `requirements mark-complete` for TICKET-01/04/05 even though they're listed in this plan's frontmatter — only the backend route layer was built here; the owner-facing create/list/detail UI (07-04, 07-05) is what the requirements' acceptance criteria actually describe. Manually updated REQUIREMENTS.md's traceability table to "In Progress" with a note instead, following the 06-01/06-02/08-01/08-02/10-01 correction precedent.

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria (grep checks, tsc, vitest) passed on the first attempt for every task.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ticket-query.ts` (`getTickets`, `getTicketById`, `getClientTickets`) and the create/list/detail/edit routes are ready for 07-04 (list + create UI) and 07-05 (detail UI) to consume directly.
- `getClientTickets` is ready for Phase 8's CLIENT-06 tickets-half addition to the client detail page (the invoices half already shipped in 08-05; the seam comment there can now be filled in with zero rework).
- 07-03 (status-transition + notes routes) is a separate parallel plan and does not depend on anything built here beyond the shared `tickets` table/types from 07-01.
- No blockers. `npx tsc --noEmit` clean and `npx vitest run` green (170 passed, 48 skipped, 61 todo, 0 failures) across the whole suite, not just this plan's new files.

---
*Phase: 07-tickets*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 6 created/modified files found on disk; all 3 task commit hashes (eecc382, 1e5458b, e213526) found in git log.
