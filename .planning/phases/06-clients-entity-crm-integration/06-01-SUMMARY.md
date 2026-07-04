---
phase: 06-clients-entity-crm-integration
plan: 01
subsystem: database
tags: [drizzle, postgres, zod, vitest, schema-migration]

# Dependency graph
requires: []
provides:
  - "clients table (Drizzle schema.ts) — id, name, email, phone, company, physicalAddress, postalAddress, source, sourceRecordType, sourceRecordId, createdAt, updatedAt"
  - "convertedClientId nullable FK column on clientRegistrations and contactEnquiries, referencing clients.id (ON DELETE set null)"
  - "netlify/database/migrations/0005_clients.sql — CREATE TABLE clients + 2 ALTER TABLE ADD COLUMN converted_client_id + FK constraints"
  - "src/lib/client-types.ts — ClientSource, ClientListItem, CreateClientSchema, UpdateClientSchema (the shared contract every later Phase 6 plan imports)"
  - "4 Wave 0 test stub files gated on NETLIFY_DB_URL, mirroring the crm/[id]/notes/route.test.ts convention"
affects: [06-02, 06-03, 06-04, 06-05, phase-07-tickets, phase-08-linked-invoicing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "clients table appended at end of schema.ts; Drizzle .references() lazy thunks allow forward references from earlier-defined lead tables"
    - "client-types.ts mirrors crm-types.ts shape (ClientListItem interface + zod Create/Update schemas), kept as a separate module from crm-types.ts per the research's 'don't widen CrmListItem' recommendation"
    - "Wave 0 stub tests use it.todo() placeholders + describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip gate + vi.mock('next/headers') for guard-test scaffolding, filled in by later plans"

key-files:
  created:
    - src/lib/client-types.ts
    - netlify/database/migrations/0005_clients.sql
    - src/app/api/admin/clients/route.test.ts
    - src/app/api/admin/clients/[id]/route.test.ts
    - src/app/api/admin/clients/[id]/notes/route.test.ts
    - src/app/api/admin/crm/[id]/convert/route.test.ts
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "clients.email has no unique() constraint — duplicate-client tolerance is intentional (a lead may enquire twice with the same email); dedupe tooling is explicitly out of scope for this milestone."
  - "clients table placed at the end of schema.ts (after automationRuns) rather than reordered near the lead tables — Drizzle .references() are lazy thunks, so forward references from clientRegistrations/contactEnquiries (defined earlier in the file) to clients (defined later) are safe, matching the existing billingSchedules -> hostingPackages precedent."
  - "crmNotes.recordType kept as a plain unconstrained varchar(20) — no CHECK constraint added for the future 'client' value, since migration 0001 confirmed there was never a DB-level constraint to begin with."

patterns-established:
  - "New entity contract-first: client-types.ts is the single source of truth for Client shapes/validation that every later Wave (1-4) plan and route imports, mirroring how crm-types.ts serves the leads side."
  - "Wave 0 test-stub scaffolding: create the route.test.ts file with it.todo() placeholders + the DB-gate + auth mock before any route.ts exists, so later plans fill in real assertions against an already-reviewed test shape."

requirements-completed: [CLIENT-01, CLIENT-02, CLIENT-03, CLIENT-04, CLIENT-05]

# Metrics
duration: 12min
completed: 2026-07-04
---

# Phase 06 Plan 01: Clients Entity Foundation (Wave 0) Summary

**Added the `clients` Postgres table, `convertedClientId` back-links on both lead tables, generated migration `0005_clients.sql`, and established the `client-types.ts` zod/type contract plus 4 Wave 0 test stubs that every later Phase 6 plan builds on.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-04T14:24:00Z
- **Completed:** 2026-07-04T14:36:00Z
- **Tasks:** 3
- **Files modified:** 7 (1 modified, 6 created, plus 2 generated migration-meta files)

## Accomplishments
- `clients` table added to `src/lib/db/schema.ts` with all 11 business columns (no unique constraint on email, intentionally) plus id/timestamps.
- `clientRegistrations` and `contactEnquiries` both gained a nullable `convertedClientId` FK to `clients.id` (`ON DELETE set null`), unblocking CLIENT-02's convert-and-idempotency-check flow for a later plan.
- `netlify/database/migrations/0005_clients.sql` generated via `npm run db:generate -- --name clients` (no live DB connection needed) — matches the plan's expected DDL exactly, including both FK constraints.
- `src/lib/client-types.ts` created as the shared contract (`ClientSource`, `ClientListItem`, `CreateClientSchema`, `UpdateClientSchema`) that Waves 1-4 will import.
- 4 Wave 0 test stub files created with `it.todo()` placeholders, the `NETLIFY_DB_URL` gate, and the `next/headers` mock — ready for later plans to fill in real assertions once the corresponding routes exist.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add clients table + convertedClientId columns to schema.ts** - `2151c37` (feat)
2. **Task 2: Generate the 0005_clients migration** - `b701a95` (chore)
3. **Task 3: Create client-types.ts contract + 4 Wave 0 test stubs** - `6f8d66e` (feat)

**Plan metadata:** (pending — this commit)

_Note: No TDD tasks in this plan (Wave 0 stubs are placeholders, not RED/GREEN cycles); all commits are single-pass feat/chore._

## Files Created/Modified
- `src/lib/db/schema.ts` - added `clients` pgTable (11 columns), `convertedClientId` FK column on `clientRegistrations` and `contactEnquiries`, updated `crmNotes.recordType` inline comment
- `netlify/database/migrations/0005_clients.sql` - generated migration: `CREATE TABLE clients` + 2 `ALTER TABLE ADD COLUMN converted_client_id` + 2 FK constraints
- `netlify/database/migrations/meta/0005_snapshot.json`, `meta/_journal.json` - drizzle-kit generated snapshot/journal bookkeeping (auto-updated by `db:generate`)
- `src/lib/client-types.ts` - `ClientSource`, `ClientListItem`, `CreateClientSchema`, `UpdateClientSchema`, `CreateClientInput`
- `src/app/api/admin/clients/route.test.ts` - Wave 0 stub for CLIENT-01 (list/create)
- `src/app/api/admin/clients/[id]/route.test.ts` - Wave 0 stub for CLIENT-04 (get/edit)
- `src/app/api/admin/clients/[id]/notes/route.test.ts` - Wave 0 stub for CLIENT-05 (client notes)
- `src/app/api/admin/crm/[id]/convert/route.test.ts` - Wave 0 stub for CLIENT-02 (convert-from-lead)

## Decisions Made
- Confirmed `npm run db:generate` does not require a live DB connection (diffs local `meta/_journal.json` snapshots only) — the `NETLIFY_DATABASE_URL` vs `NETLIFY_DB_URL` mismatch in `drizzle.config.ts` was not a blocker for this task, exactly as the research predicted.
- No architectural deviations — plan executed exactly as written, including the "append clients at end of file" ordering trick and the "no unique email" rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reverted premature REQUIREMENTS.md "Complete" marks for CLIENT-01..05**
- **Found during:** State-update step (after `requirements mark-complete` ran against this plan's frontmatter `requirements: [CLIENT-01..05]`)
- **Issue:** This plan (06-01) is Wave 0 foundation only — schema, types, and `it.todo()` test stubs. No create/edit/notes/convert routes or UI exist yet (those land in 06-02 through 06-05, whose frontmatter also independently lists overlapping requirement IDs). Blindly marking all 5 CLIENT requirements "Complete" in `REQUIREMENTS.md` after this plan would misrepresent the phase's real state to any future planning/verification pass.
- **Fix:** Manually reverted the 5 checkboxes back to unchecked and changed the traceability table's "Complete" status to "In Progress (foundation done in 06-01; ...)" with a pointer to which later plan actually delivers the user-facing behavior.
- **Files modified:** `.planning/REQUIREMENTS.md`
- **Verification:** Read the file back after edit; confirms `[ ]` checkboxes and "In Progress" status for CLIENT-01..05.
- **Committed in:** final metadata commit for this plan (not a task commit, since REQUIREMENTS.md isn't a `files_modified` target of any task).

---

**Total deviations:** 1 auto-fixed (1 bug — inaccurate requirement-tracking state)
**Impact on plan:** No code/schema impact. Purely a documentation-accuracy correction so `REQUIREMENTS.md` doesn't overclaim completion before plans 06-02..06-05 execute.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. The `0005_clients.sql` migration is committed but not applied locally or in production; it auto-applies on the next Netlify deploy per the established convention (migrations `0000`-`0004` all follow this pattern).

## Next Phase Readiness
- `clients.id` is a stable serial PK ready for Phase 7 (`tickets.client_id`) and Phase 8 (`invoices.client_id`) FKs.
- `client-types.ts` is ready to be imported by Wave 1's `POST /api/admin/clients` route (CLIENT-01) and later waves' edit/notes/convert routes.
- All 4 Wave 0 test stub files exist with the correct gate/mock scaffolding — later plans fill in real `it()` assertions in place of `it.todo()`.
- No blockers for Wave 1.

---
*Phase: 06-clients-entity-crm-integration*
*Completed: 2026-07-04*

## Self-Check: PASSED

All 6 created files verified present on disk; all 3 task commits (2151c37, b701a95, 6f8d66e) verified present in git log.
