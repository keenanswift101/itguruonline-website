---
phase: 07-tickets
plan: 05
subsystem: ui
tags: [react, nextjs, drizzle, tickets, crm-notes]

# Dependency graph
requires:
  - phase: 07-tickets (07-02)
    provides: getTicketById(id), getClientTickets(clientId) query layer
  - phase: 07-tickets (07-03)
    provides: PATCH /api/admin/tickets/[id]/status, POST /api/admin/tickets/[id]/notes
  - phase: 07-tickets (07-01)
    provides: ALLOWED_TRANSITIONS, STATUS_BADGE, PRIORITY_BADGE, TicketStatus
provides:
  - TicketStatusSelect (transition-filtered status select, PATCH + toast + refresh)
  - TicketNoteForm (add-note form, POST + toast + spinner + refresh)
  - /admin/tickets/[id] detail page (client link, priority/status badges, status select, description, chronological notes)
  - Tickets Card on /admin/clients/[id] fed by getClientTickets (fills the Phase-7 CLIENT-06 seam)
affects: [09-dashboard-rework]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ticket detail page mirrors the client-detail Card layout exactly (Details Card + Notes Card with inline form + chronological list), reusing the same Badge span pattern already established in /admin/tickets/page.tsx"

key-files:
  created:
    - src/components/admin/tickets/TicketStatusSelect.tsx
    - src/components/admin/tickets/TicketNoteForm.tsx
    - src/app/admin/tickets/[id]/page.tsx
  modified:
    - src/app/admin/clients/[id]/page.tsx

key-decisions:
  - "TicketStatusSelect built as a new ticket-specific component rather than reusing StatusSelect.tsx (that component is hardcoded to CRM_STATUSES/encodeCrmId and has no transition-filtering concept)"
  - "TicketNoteForm is a near-verbatim copy of ClientNoteForm.tsx with only the endpoint and label id swapped, keeping the toast+spinner+refresh UX identical across all note forms in the portal"

patterns-established:
  - "Ticket detail page's Badge helper duplicates the one already in /admin/tickets/page.tsx (small enough that extracting a shared component wasn't worth it for two call sites)"

requirements-completed: [TICKET-02, TICKET-03, TICKET-05, CLIENT-06]

# Metrics
duration: 16min
completed: 2026-07-07
---

# Phase 07 Plan 05: Ticket Detail UI + Client-Detail Tickets Card Summary

**TicketStatusSelect + TicketNoteForm client components, the /admin/tickets/[id] detail page (client link, priority/status badges, transition-guarded status select, chronological notes thread), and a real Tickets Card filling the Phase-7 seam on /admin/clients/[id] — completes CLIENT-06.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-07T13:37:54+02:00
- **Completed:** 2026-07-07T13:53:00+02:00
- **Tasks:** 2 completed
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `TicketStatusSelect`: offers only the current status plus its `ALLOWED_TRANSITIONS` targets (deduped), PATCHes `/api/admin/tickets/[id]/status`, toasts success/error, `router.refresh()` on success
- `TicketNoteForm`: POSTs to `/api/admin/tickets/[id]/notes`, toast + `Spinner` while pending, clears the textarea and refreshes on success
- `/admin/tickets/[id]`: `requireAdmin` + numeric-id + `notFound()` guards, header with subject + client link to `/admin/clients/[clientId]`, Details Card (priority badge, status badge, `TicketStatusSelect`, description with "No description." empty state), Notes Card (`TicketNoteForm` + chronological `crm_notes` thread filtered to `recordType: "ticket"`, oldest→newest)
- `/admin/clients/[id]`: added `getClientTickets(client.id)` and replaced the Phase-7 seam comment with a real Tickets Card (sibling to the Invoices Card), listing each ticket's subject (linked to `/admin/tickets/[id]`) and `priority · status`

## Task Commits

Each task was committed atomically:

1. **Task 1: TicketStatusSelect + TicketNoteForm** - `ab64cbc` (feat)
2. **Task 2: /admin/tickets/[id] detail page + client-detail Tickets Card** - `20f1b37` (feat)

**Preceding catch-up commit:** `774239e` (docs: complete 07-04's SUMMARY.md + STATE/ROADMAP/REQUIREMENTS finalization, left uncommitted from the prior session — not part of this plan's scope, closed out before starting 07-05's own work)

_No TDD RED/GREEN split needed — both tasks are new-component/new-page creation against the 07-01/07-02/07-03 contracts, no existing behavior to red/green cycle against._

## Files Created/Modified
- `src/components/admin/tickets/TicketStatusSelect.tsx` - transition-filtered status select (scheme-dark, ALLOWED_TRANSITIONS-guarded options), PATCH + toast + refresh
- `src/components/admin/tickets/TicketNoteForm.tsx` - add-note form, POST + toast + spinner + refresh, mirrors ClientNoteForm.tsx
- `src/app/admin/tickets/[id]/page.tsx` - ticket detail: requireAdmin/notFound guards, client link, priority/status badges, status select, description, ticket-scoped crm_notes thread
- `src/app/admin/clients/[id]/page.tsx` - added getClientTickets import/call and a real Tickets Card replacing the Phase-7 seam comment

## Decisions Made
- Built `TicketStatusSelect` as a brand-new component instead of extending `StatusSelect.tsx` — that component is hardcoded to `CRM_STATUSES`/`encodeCrmId` and has no transition-filtering concept, so reusing it would have required branching logic that defeats the point of a small focused component.
- `TicketNoteForm` is a near-verbatim copy of `ClientNoteForm.tsx` (only the endpoint URL and label `id` differ), keeping note-adding UX byte-for-byte consistent across clients and tickets.

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria (grep checks, tsc, vitest) passed on the first attempt for every task.

**Pre-existing housekeeping (not a deviation from this plan's own tasks):** committed 07-04's leftover finalization (SUMMARY.md + STATE/ROADMAP/REQUIREMENTS updates, uncommitted from the prior session) as its own `docs(07-04)` commit before starting Task 1, following the 07-03 precedent for keeping each plan's metadata commit clean.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 (Tickets) is now fully complete: TICKET-01 through TICKET-05 all delivered end-to-end (create, list+filter, status transition, notes, detail view), plus CLIENT-06 (client detail shows both linked invoices and tickets).
- The client detail page's Tickets Card and the ticket detail page's client link close the loop between Phase 6 (clients) and Phase 7 (tickets) — no further rework needed for either.
- Phase 8 (Linked Invoicing & Delivery) already has CLIENT-06's invoices half shipped (08-05) and now the tickets half from this plan; Phase 8 itself still has 08-02/08-03 remaining per STATE.md's session continuity note.
- No blockers. `npx tsc --noEmit` clean and `npx vitest run` green (174 passed, 48 skipped, 57 todo, 0 failures) across the whole suite, not just this plan's new files.

---
*Phase: 07-tickets*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 4 created/modified files found on disk; all 3 referenced commit hashes (ab64cbc, 20f1b37, 774239e) found in git log.
