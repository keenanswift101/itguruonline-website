---
phase: 07-tickets
plan: 03
subsystem: api
tags: [drizzle, postgres, zod, vitest, tickets, crm-notes]

# Dependency graph
requires:
  - phase: 07-tickets (07-01)
    provides: tickets table (schema.ts, resolvedAt column), ticket-status.ts (ALLOWED_TRANSITIONS), crmNotes table, 2 route test stubs for this plan to fill
provides:
  - PATCH /api/admin/tickets/[id]/status (ALLOWED_TRANSITIONS-guarded transition, resolved_at stamping/clearing, no email)
  - POST /api/admin/tickets/[id]/notes (crm_notes insert with recordType "ticket", HTML-stripped, 5000-char cap)
  - Filled non-DB guard assertions in both Wave 0 route test stubs
affects: [07-04, 07-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status transition routes mirror quotations' status route shape (requireAdmin -> id parse -> body parse -> zod enum -> ALLOWED_TRANSITIONS lookup -> 409) but drop the email/PDF block entirely when the underlying entity has no send-notification requirement"
    - "Ticket notes route is a byte-for-byte copy of clients/[id]/notes/route.ts with only the recordType literal changed — crm_notes' free-form varchar recordType lets every CRM-adjacent entity (registration/enquiry/client/ticket) reuse the same table with zero migration"

key-files:
  created:
    - src/app/api/admin/tickets/[id]/status/route.ts
    - src/app/api/admin/tickets/[id]/notes/route.ts
  modified:
    - src/app/api/admin/tickets/[id]/status/route.test.ts
    - src/app/api/admin/tickets/[id]/notes/route.test.ts

key-decisions:
  - "Ticket status route omits quotations' sendEmail/PDF block entirely (TICKET-06 email-on-status-change is deferred/out of scope) — this is a pure DB update, not a structural mirror of the quotations route beyond the transition guard shape"
  - "Reopening a ticket (resolved->open or resolved->in_progress) clears resolvedAt to null in the same UPDATE as the status change, so a later re-resolve gets a fresh timestamp rather than keeping a stale one"
  - "Notes route guard test asserts 401 (not 404) for a non-numeric ticket id while unauthenticated — requireAdmin() runs before Number(id) validation, matching the established clients/[id]/notes/route.test.ts convention"

patterns-established:
  - "Ticket status/notes routes follow the same requireAdmin-first, zod-validated, ALLOWED_TRANSITIONS-guarded pattern as quotations/invoices, confirming this is now the standard shape for any status-lifecycle mutation route in the admin API"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-07-07
---

# Phase 07 Plan 03: Ticket Status Transition + Notes Routes Summary

**PATCH /api/admin/tickets/[id]/status (ALLOWED_TRANSITIONS-guarded, resolved_at stamped on resolve / cleared on reopen, no email) and POST /api/admin/tickets/[id]/notes (crm_notes reuse with recordType "ticket", HTML-stripped and clamped to 5000 chars).**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-07T12:18:00+02:00 (approx.)
- **Completed:** 2026-07-07T12:30:40+02:00
- **Tasks:** 2 completed
- **Files modified:** 4 (2 created, 2 filled-in test stubs)

## Accomplishments
- `PATCH /api/admin/tickets/[id]/status`: validates target against `z.enum(["open", "in_progress", "resolved"])`, looks up current status, 409s via `ALLOWED_TRANSITIONS` on a disallowed transition, stamps `resolvedAt: new Date()` when moving to `resolved`, clears `resolvedAt: null` when reopening to `open`/`in_progress` — no email/PDF logic (unlike quotations' status route)
- `POST /api/admin/tickets/[id]/notes`: verbatim copy of `clients/[id]/notes/route.ts` with `recordType: "ticket"`, same HTML-tag-strip + `javascript:`-strip + 5000-char clamp
- Filled both Wave 0 test stubs' non-DB guards: status route asserts 401 (no session) and 422 (invalid status enum, authed via a toggleable `sessionToken` closure mirroring quotations' status test); notes route asserts 401 for both a numeric and non-numeric ticket id while unauthenticated (guard-order convention: `requireAdmin()` fires before `Number(id)` validation)

## Task Commits

Each task was committed atomically:

1. **Task 1: PATCH /api/admin/tickets/[id]/status + fill status route.test guards** - `119468c` (feat)
2. **Task 2: POST /api/admin/tickets/[id]/notes + fill notes route.test guards** - `fdc1257` (feat)

**Preceding catch-up commit:** `071aa30` (docs: complete 07-02's SUMMARY.md + STATE/ROADMAP/REQUIREMENTS finalization, left uncommitted from the prior session — not part of this plan's scope, closed out before starting 07-03's own work)

_No TDD RED/GREEN split needed — both tasks are new-file creation against the 07-01 contract (schema, ticket-status.ts) plus filling pre-existing `it.todo()` stubs, no existing behavior to red/green cycle against._

## Files Created/Modified
- `src/app/api/admin/tickets/[id]/status/route.ts` - PATCH handler: requireAdmin -> id parse (400) -> body parse (400) -> zod enum (422) -> ticket lookup (404) -> ALLOWED_TRANSITIONS guard (409) -> resolvedAt stamp/clear -> 200
- `src/app/api/admin/tickets/[id]/notes/route.ts` - POST handler: requireAdmin -> ticketId parse (404) -> body parse (400) -> empty-body guard (422) -> HTML/js-URI strip + 5000-char clamp -> crm_notes insert (recordType "ticket") -> 201
- `src/app/api/admin/tickets/[id]/status/route.test.ts` - filled 401 (no session) + 422 (invalid enum, authed) guard assertions; DB-gated transition/resolved_at assertions remain `describeIfDb` todos
- `src/app/api/admin/tickets/[id]/notes/route.test.ts` - filled 401 guard assertions for both a numeric and non-numeric id while unauthenticated; DB-gated recordType/HTML-strip assertions remain `describeIfDb` todos

## Decisions Made
- Status route drops quotations' email/PDF block entirely — ticket status changes have no notification requirement in this milestone (TICKET-06 deferred), so the route is a pure DB update despite structurally mirroring the transition-guard shape.
- Reopening (`resolved -> open` / `resolved -> in_progress`) clears `resolvedAt` in the same `UPDATE` as the status change (not a separate statement), so a subsequent re-resolve gets a fresh timestamp instead of retaining a stale one from a prior resolution.
- Notes route's non-numeric-id guard test asserts 401 (not 404), since `requireAdmin()` always runs before `Number(id)` validation — confirmed this matches the established `clients/[id]/notes/route.test.ts` convention rather than introducing a new guard order.
- Did not run `requirements mark-complete` for TICKET-02/TICKET-03 — this plan only delivers the backend routes; both requirements' acceptance criteria describe owner-facing UI behavior (status change control, note entry) that lands in 07-05. REQUIREMENTS.md traceability table left as "Pending" for these two until 07-05 ships the UI, following the 06-01/06-02/07-02/08-01/08-02/10-01 correction precedent.

## Deviations from Plan

**1. [Rule 3 - Blocking] Committed prior session's unfinished 07-02 finalization before starting 07-03**
- **Found during:** Pre-task git status check
- **Issue:** `.planning/phases/07-tickets/07-02-SUMMARY.md` existed on disk but was untracked, and `.planning/STATE.md`/`ROADMAP.md`/`REQUIREMENTS.md` had uncommitted 07-02-completion edits — the prior session's `final_commit` step never ran. Continuing would have entangled 07-02's leftover metadata changes with this plan's own STATE/ROADMAP/REQUIREMENTS updates in the same diff, making it impossible to tell which plan's finalization was which.
- **Fix:** Verified via `git diff` that the pending changes were exclusively 07-02-completion content (progress counters, decision log entries, roadmap checkbox, requirements traceability rows), then committed them as their own `docs(07-02): complete ticket query layer + CRUD routes plan` commit before touching anything for 07-03.
- **Files modified:** `.planning/phases/07-tickets/07-02-SUMMARY.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`
- **Verification:** `git diff --cached` confirmed the staged content matched only 07-02's completion; `git log` confirms all three 07-02 task commits (`eecc382`, `1e5458b`, `e213526`) predate this catch-up commit.
- **Committed in:** `071aa30`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary housekeeping to keep this plan's own metadata commit clean; no scope creep into 07-03's actual task work.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both mutation routes (`PATCH .../status`, `POST .../notes`) are ready for 07-05's ticket detail page to consume directly (status dropdown + note form).
- `.../notes/route.ts` establishes the exact recordType "ticket" pattern 07-05's UI will POST against; no further backend changes anticipated before 07-05.
- No blockers. `npx tsc --noEmit` clean and `npx vitest run` green (174 passed, 48 skipped, 57 todo, 0 failures) across the whole suite, not just this plan's new files.

---
*Phase: 07-tickets*
*Completed: 2026-07-07*

## Self-Check: PASSED

Both created files (status/route.ts, notes/route.ts) found on disk; all 3 referenced commit hashes (119468c, fdc1257, 071aa30) found in git log.
