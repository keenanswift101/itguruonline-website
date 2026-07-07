---
phase: 07-tickets
plan: 04
subsystem: ui
tags: [react, nextjs, forms, tickets, client-picker]

# Dependency graph
requires:
  - phase: 07-tickets (07-02)
    provides: getTickets query (open-first/priority ordering + status filter), POST /api/admin/tickets create route
  - phase: 07-tickets (07-01)
    provides: ticket-types.ts (TicketPriority), ticket-status.ts (STATUS_BADGE, PRIORITY_BADGE)
provides:
  - TicketForm (required ClientPicker + subject/description/priority, POSTs to /api/admin/tickets)
  - /admin/tickets/new page (feeds getClientsForPicker() into TicketForm)
  - /admin/tickets list page (status filter All/Open/In Progress/Resolved, open-first, priority+status badges)
  - AdminSidebar Tickets nav entry
affects: [07-05 (detail UI, parallel/no shared files), 09-dashboard (open-ticket tiles will link here)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TicketForm mirrors ClientForm/QuotationForm's state/toast/error/submit pattern exactly, but keeps ClientPicker's selection REQUIRED (validate() blocks submit on null clientId) rather than treating null as a valid one-off path"

key-files:
  created:
    - src/components/forms/TicketForm.tsx
    - src/app/admin/tickets/new/page.tsx
    - src/app/admin/tickets/page.tsx
  modified:
    - src/components/admin/AdminSidebar.tsx

key-decisions:
  - "TicketForm keeps selectedClientId in its own state and validates it non-null at submit time rather than modifying ClientPicker's built-in 'one-off / no stored client' option — per the plan's interface note, ClientPicker itself is never touched, since other callers (QuotationForm) rely on the one-off path being valid there"
  - "TICKET-01 and TICKET-04 marked complete in REQUIREMENTS.md — this plan delivers the actual owner-facing create+list UI, completing what 07-02 only built as backend routes"

patterns-established: []

requirements-completed: [TICKET-01, TICKET-04]

# Metrics
duration: 26min
completed: 2026-07-07
---

# Phase 07 Plan 04: Ticket Create Form + List UI + Sidebar Nav Summary

**TicketForm (required ClientPicker + subject/description/priority) posting to /api/admin/tickets, /admin/tickets list with open-first status filter and priority/status badges, /admin/tickets/new page, and a Tickets sidebar nav entry.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-07-07T12:35:28+02:00
- **Completed:** 2026-07-07T13:01:16+02:00
- **Tasks:** 2 completed
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `src/components/forms/TicketForm.tsx`: `"use client"` form with a required `ClientPicker` (blocks submit with "Select a client." if none chosen), subject input, optional description textarea, priority native `<select>` (`scheme-dark` + dark-styled `<option>`s, default "medium"). POSTs `{ clientId, subject, description, priority }` to `/api/admin/tickets`; on 201 redirects to `/admin/tickets/[id]`; on 422 maps `fields` to inline errors + toast; on other errors shows a server-message banner + `toast.error`.
- `src/app/admin/tickets/new/page.tsx`: `requireAdmin()` guard, fetches `getClientsForPicker()`, renders `TicketForm` inside the standard card shell with a back link to `/admin/tickets`.
- `src/app/admin/tickets/page.tsx`: `requireAdmin()` guard, parses `?status=open|in_progress|resolved` against `getTickets(statusFilter)` (open-first ordering when unfiltered, per 07-02), All/Open/In Progress/Resolved filter links styled identically to the quotations list, table columns Subject/Client/Priority/Status/Actions using `STATUS_BADGE`/`PRIORITY_BADGE` from `ticket-status.ts`, empty state "No tickets yet."
- `src/components/admin/AdminSidebar.tsx`: added `{ href: "/admin/tickets", label: "Tickets" }` between Clients and Pricing.
- `REQUIREMENTS.md`: TICKET-01 and TICKET-04 marked complete (this plan finishes what 07-02 left as backend-only "In Progress").

## Task Commits

Each task was committed atomically:

1. **Task 1: TicketForm.tsx (required client picker + subject/description/priority)** - `3a5f113` (feat)
2. **Task 2: /admin/tickets list + /admin/tickets/new page + sidebar nav** - `75ce430` (feat)

_No TDD RED/GREEN split needed — both tasks are new-file/UI-composition work mirroring an established pattern (ClientForm/QuotationForm, quotations list/new pages), no existing behavior to red/green cycle against._

## Files Created/Modified
- `src/components/forms/TicketForm.tsx` - required-client create form, POSTs to /api/admin/tickets, redirects to detail on 201
- `src/app/admin/tickets/new/page.tsx` - new-ticket page feeding getClientsForPicker() into TicketForm
- `src/app/admin/tickets/page.tsx` - tickets list, status filter links, priority/status badges, open-first ordering
- `src/components/admin/AdminSidebar.tsx` - added Tickets nav entry between Clients and Pricing

## Decisions Made
- `ClientPicker` was reused completely unmodified — its built-in "one-off / no stored client" option still exists in the dropdown UI, but `TicketForm.validate()` rejects a null `selectedClientId` at submit time with "Select a client." This keeps the shared component's contract intact for `QuotationForm` (where one-off is legitimately valid) while making the client link required specifically for tickets, exactly as the plan's `<interfaces>` note specified.
- Marked TICKET-01/TICKET-04 complete in REQUIREMENTS.md (not just "In Progress") since this plan is what actually delivers the owner-facing create + list UI that those requirements' acceptance criteria describe; 07-02 had intentionally left them unmarked pending this UI.

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria (grep checks, tsc, vitest) passed on the first attempt for both tasks.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `TicketForm`, `/admin/tickets`, and `/admin/tickets/new` are live and usable end-to-end against 07-02's existing backend routes.
- 07-05 (ticket detail UI — status transitions, notes) is unblocked and shares no files with this plan (parallel wave, as noted in the plan's objective).
- Phase 9 (dashboard rework) can link its open-ticket tile straight to `/admin/tickets?status=open`.
- No blockers. `npx tsc --noEmit` clean and `npx vitest run` green (174 passed, 48 skipped, 57 todo, 0 failures) across the whole suite, not just this plan's new files.

---
*Phase: 07-tickets*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 4 created/modified files found on disk; both task commit hashes (3a5f113, 75ce430) found in git log.
