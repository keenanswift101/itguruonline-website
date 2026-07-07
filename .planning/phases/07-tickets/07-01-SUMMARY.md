---
phase: 07-tickets
plan: 01
subsystem: database
tags: [drizzle, postgres, zod, vitest, tickets]

# Dependency graph
requires:
  - phase: 06-clients
    provides: clients table (tickets.client_id FKs to clients.id)
requires_wave: 0
provides:
  - tickets table (schema.ts) with NOT NULL client_id FK to clients (ON DELETE restrict)
  - netlify/database/migrations/0008_tickets.sql (additive, no DROP)
  - ticket-types.ts contract (TicketListItem, ClientTicketSummary, TicketPriority, CreateTicketSchema, UpdateTicketSchema)
  - ticket-status.ts contract (ALLOWED_TRANSITIONS, STATUS_BADGE, PRIORITY_BADGE)
  - ticket-status.test.ts pure-logic unit test (green, no DB gate)
  - 4 Wave 0 route test stubs (tickets, tickets/[id], tickets/[id]/status, tickets/[id]/notes)
affects: [07-02, 07-03, 07-04, 07-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tickets table mirrors clients/quotations shape (serial id, notNull FK, timestamp withTimezone + $onUpdate)"
    - "ALLOWED_TRANSITIONS + STATUS_BADGE/PRIORITY_BADGE maps mirror quotation-status.ts exactly"

key-files:
  created:
    - src/lib/ticket-types.ts
    - src/lib/ticket-status.ts
    - src/lib/ticket-status.test.ts
    - src/app/api/admin/tickets/route.test.ts
    - src/app/api/admin/tickets/[id]/route.test.ts
    - src/app/api/admin/tickets/[id]/status/route.test.ts
    - src/app/api/admin/tickets/[id]/notes/route.test.ts
    - netlify/database/migrations/0008_tickets.sql
    - netlify/database/migrations/meta/0008_snapshot.json
  modified:
    - src/lib/db/schema.ts
    - netlify/database/migrations/meta/_journal.json

key-decisions:
  - "tickets.clientId is NOT NULL (no free-text ticket concept) with onDelete: restrict, not set null/cascade — a client with open tickets cannot be deleted"
  - "status varchar(12) not varchar(8) — 'in_progress' is 11 chars, needs headroom (Pitfall 1 from 07-RESEARCH)"
  - "resolved->open reopen transition allowed, mirroring quotations' declined->sent reopen pattern"
  - "requirements NOT marked complete — this plan is Wave 0 foundation only (schema/types/test-stubs, no routes/UI), mirrors the 06-01/08-01/10-01 correction precedent"

patterns-established:
  - "Ticket status/priority badge maps live in ticket-status.ts, structurally identical to quotation-status.ts"

requirements-completed: []

# Metrics
duration: 14min
completed: 2026-07-07
---

# Phase 07 Plan 01: Tickets Foundation Summary

**Added the `tickets` table (migration 0008, NOT NULL client_id FK to clients ON DELETE restrict) plus the shared ticket-types.ts/ticket-status.ts contract and 4 Wave 0 route test stubs that every later Phase 7 plan builds on.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-07T11:23:00+02:00
- **Completed:** 2026-07-07T11:37:13+02:00
- **Tasks:** 3 completed
- **Files modified:** 9 (2 modified, 7 created)

## Accomplishments
- `tickets` table added to `schema.ts` (NOT NULL `client_id` FK to `clients.id`, `ON DELETE restrict`; `subject` varchar(200); `description` text; `priority` varchar(8); `status` varchar(12); `resolved_at`/`created_at`/`updated_at`)
- Migration `0008_tickets.sql` generated via `drizzle-kit generate` — additive only (`CREATE TABLE` + one `ALTER TABLE ... ADD CONSTRAINT`, zero `DROP` statements); journal updated to tag `0008_tickets`
- `ticket-types.ts` (TicketListItem, ClientTicketSummary, TicketPriority, CreateTicketSchema, UpdateTicketSchema) and `ticket-status.ts` (ALLOWED_TRANSITIONS, STATUS_BADGE, PRIORITY_BADGE) created as the shared contract every later plan imports
- Pure-logic `ticket-status.test.ts` unit test (3 assertions on ALLOWED_TRANSITIONS, always runs, no DB) — green
- 4 route test stub files created (`tickets/route.test.ts`, `tickets/[id]/route.test.ts`, `tickets/[id]/status/route.test.ts`, `tickets/[id]/notes/route.test.ts`), each with the `NETLIFY_DB_URL` describeIfDb gate + `next/headers` mock, `it.todo()` placeholders only

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tickets table to schema.ts** - `902f664` (feat)
2. **Task 2: Generate the 0008_tickets migration** - `359caaf` (feat)
3. **Task 3: ticket-types.ts + ticket-status.ts + status unit test + 4 route stubs** - `174d12e` (feat)

_No TDD RED/GREEN split needed — Task 3 is pure new-file creation (types/status map/test/stubs), no existing behavior to red/green cycle against._

## Files Created/Modified
- `src/lib/db/schema.ts` - added `tickets` pgTable export
- `netlify/database/migrations/0008_tickets.sql` - generated migration (CREATE TABLE tickets + FK to clients)
- `netlify/database/migrations/meta/_journal.json` - journal entry for 0008_tickets
- `netlify/database/migrations/meta/0008_snapshot.json` - drizzle-kit schema snapshot
- `src/lib/ticket-types.ts` - TicketListItem/ClientTicketSummary/TicketPriority/CreateTicketSchema/UpdateTicketSchema
- `src/lib/ticket-status.ts` - ALLOWED_TRANSITIONS/STATUS_BADGE/PRIORITY_BADGE
- `src/lib/ticket-status.test.ts` - pure-logic unit test for ALLOWED_TRANSITIONS
- `src/app/api/admin/tickets/route.test.ts` - Wave 0 stub (TICKET-01/04)
- `src/app/api/admin/tickets/[id]/route.test.ts` - Wave 0 stub (TICKET-05)
- `src/app/api/admin/tickets/[id]/status/route.test.ts` - Wave 0 stub (TICKET-02)
- `src/app/api/admin/tickets/[id]/notes/route.test.ts` - Wave 0 stub (TICKET-03)

## Decisions Made
- `tickets.clientId`: NOT NULL + `onDelete: "restrict"` — the phase goal is explicit that every ticket belongs to a client (no free-text/one-off concept, unlike invoices/quotations); `restrict` (not `set null`, which is invalid SQL on a NOT NULL column, or `cascade`, which would silently delete support history) blocks deleting a client with open tickets.
- `status` sized `varchar(12)` (not `varchar(8)` like invoices) — `"in_progress"` is 11 characters; 12 gives 1-char headroom, matching the margin quotations kept for its longest 8-char status value.
- `resolved -> open` / `resolved -> in_progress` reopen transitions allowed in `ALLOWED_TRANSITIONS`, mirroring quotations' `declined -> sent` re-open pattern rather than making `resolved` terminal.
- Per the established Wave-0-foundation correction precedent (06-01, 08-01, 10-01), did NOT run `requirements mark-complete` for TICKET-01..05 even though they're listed in this plan's frontmatter — this plan only builds schema/types/test-stub scaffolding, not the actual owner-facing create/list/status/notes functionality. They'll be marked truly Complete as 07-02 through 07-05 deliver the real routes/UI.

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria (grep checks, tsc, vitest) passed on the first attempt for every task.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration `0008_tickets.sql` auto-applies on the next Netlify deploy to `main` (per the existing migration-on-deploy convention); no manual DB action needed for local dev beyond `netlify database migrations apply` when next running `netlify dev`.

## Next Phase Readiness

- `tickets` table, `ticket-types.ts`, and `ticket-status.ts` are now available for 07-02 (create/list routes+UI), 07-03 (detail/edit), 07-04 (status transition route+UI), and 07-05 (notes route+UI) to build against without any further schema/contract changes.
- All 4 route test stub files exist with the correct `next/headers` mock + `NETLIFY_DB_URL` gate shape — later plans fill in the `it.todo()` placeholders with real assertions and `route.ts` implementations.
- No blockers. `npx tsc --noEmit` clean and `npx vitest run` green (164 passed, 48 skipped, 67 todo, 0 failures) across the whole suite, not just this plan's new files.

---
*Phase: 07-tickets*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 9 created files found on disk; all 3 task commit hashes (902f664, 359caaf, 174d12e) found in git log.
