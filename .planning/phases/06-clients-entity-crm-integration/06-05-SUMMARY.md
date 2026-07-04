---
phase: 06-clients-entity-crm-integration
plan: 05
subsystem: ui
tags: [nextjs-app-router, react, tailwind-v4, admin-portal, crud, crm-notes-reuse]

# Dependency graph
requires:
  - phase: 06-02
    provides: "getClientById(id), GET/PUT /api/admin/clients/[id]"
  - phase: 06-03
    provides: "ClientForm (create+edit dual-mode via clientId?/initial? props)"
provides:
  - "POST /api/admin/clients/[id]/notes — reuses crm_notes with recordType 'client', numeric id parse, HTML-strip + 5000-char clamp"
  - "ClientNoteForm — client-component add-note form posting to the new route"
  - "/admin/clients/[id] — client detail page: header + source badge + originating-lead link, inline edit (ClientForm), notes thread (oldest->newest) + add-note form"
  - "Filled non-DB guard tests for the client notes route (401 assertions replacing it.todo stubs)"
affects: [phase-07-tickets, phase-08-linked-invoicing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client notes route is a numeric-id variant of the leads notes route: same requireAdmin-first guard, same HTML-strip/javascript:-strip/5000-char clamp, hardcoded recordType='client' instead of parseCrmId's registration|enquiry union — zero schema change, crm_notes.record_type is a free-form varchar"
    - "Client detail page mirrors crm/[id]/page.tsx's layout shape (back link, header, Card sections, notes Card with form+list) but swaps StatusSelect/ConvertButton for ClientForm-in-edit-mode (no status lifecycle on clients) and adds a conditional 'Originating lead' link when sourceRecordType/sourceRecordId are set"

key-files:
  created:
    - src/app/api/admin/clients/[id]/notes/route.ts
    - src/components/admin/clients/ClientNoteForm.tsx
    - src/app/admin/clients/[id]/page.tsx
  modified:
    - src/app/api/admin/clients/[id]/notes/route.test.ts

key-decisions:
  - "Non-DB guard test for the non-numeric-id case asserts 401 (not 404) since requireAdmin() runs before Number(id) parsing with no session cookie present — matches the established guard-order convention from crm/[id]/notes/route.test.ts and clients/[id]/route.test.ts."
  - "No CrmRecordType/RecordType TS union needed updating — the client notes route hardcodes the string literal \"client\" directly rather than going through parseCrmId/encodeCrmId, and schema.ts's inline comment on crm_notes.record_type already documented \"client\" as a valid value from 06-01."

requirements-completed: [CLIENT-04, CLIENT-05]

# Metrics
duration: 14min
completed: 2026-07-04
---

# Phase 06 Plan 05: Client Detail Page — Edit + Private Notes Summary

**`/admin/clients/[id]` detail page (inline ClientForm edit + timestamped notes thread) plus the `POST /api/admin/clients/[id]/notes` route reusing `crm_notes` with `recordType='client'` — closes out Phase 6's client experience.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-04T16:44:00Z
- **Completed:** 2026-07-04T16:58:17Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 test stub filled)

## Accomplishments
- `POST /api/admin/clients/[id]/notes` created: `requireAdmin()` first, numeric id parse (`Number.isInteger` guard returning 404 for non-numeric ids once authenticated), inserts a `crm_notes` row with `recordType: "client"` after the same HTML-strip (`.replace(/<[^>]*>/g, "")`), `javascript:`-strip, and 5000-char clamp used by the leads notes route.
- `ClientNoteForm.tsx` created: identical textarea + `.btn-metallic` markup/behavior to the leads `NoteForm`, POSTs to `/api/admin/clients/${clientId}/notes`, clears + `router.refresh()`s on success.
- Filled the Wave 0 stub `route.test.ts`: real `it()` assertions replace both `it.todo()` guards — 401 with no session cookie for both a numeric and a non-numeric id (guard fires before id-parse, matching the established convention). DB-gated `it.todo()`s (insert + HTML-strip assertions) left untouched under `describeIfDb`.
- `/admin/clients/[id]/page.tsx` created (server component): `requireAdmin()` + redirect if unauthenticated; `notFound()` for a non-numeric or unknown id; `getClientById(numId)` for the record; notes loaded via `db.select().from(crmNotes).where(and(eq(crmNotes.recordType, "client"), eq(crmNotes.recordId, numId))).orderBy(asc(crmNotes.createdAt))`. Layout: back link to `/admin/clients`, header with client name + a source badge (Manual/From registration/From enquiry) + a conditional "Originating lead" link to `/admin/crm/${sourceRecordType}-${sourceRecordId}` when set, an "Edit Details" Card rendering `ClientForm` in edit mode (`clientId` + `initial` with all string fields — no raw `Date` objects crossed the RSC boundary), and a "Notes" Card with `ClientNoteForm` + the oldest-to-newest notes list (empty state "No notes yet.").

## Task Commits

Each task was committed atomically:

1. **Task 1: Client notes route + ClientNoteForm + fill test** - `b3b4765` (feat)
2. **Task 2: /admin/clients/[id] detail + edit + notes page** - `bd70c15` (feat)

**Plan metadata:** (pending — this commit)

_Note: No TDD tasks in this plan; both commits are single-pass feat, matching the crm/[id]/notes route + crm/[id]/page.tsx patterns being mirrored._

## Files Created/Modified
- `src/app/api/admin/clients/[id]/notes/route.ts` - POST note reusing `crm_notes` with `recordType: "client"`, numeric id, HTML-strip + clamp
- `src/components/admin/clients/ClientNoteForm.tsx` - client-component add-note form posting to the new route
- `src/app/api/admin/clients/[id]/notes/route.test.ts` - filled non-DB guards (401 for both numeric and non-numeric ids) replacing `it.todo()` placeholders
- `src/app/admin/clients/[id]/page.tsx` - client detail page: details header + source badge/originating-lead link, inline `ClientForm` edit, notes thread + `ClientNoteForm`

## Decisions Made
- Confirmed the guard-order convention: since `requireAdmin()` fires before any id/body parsing, all non-DB unauthenticated-request tests (including the non-numeric-id case) assert `401`, not the deeper 404/422 status they're nominally probing — matches `crm/[id]/notes/route.test.ts` and `clients/[id]/route.test.ts` exactly.
- No TS `RecordType` union needed touching — the route hardcodes the `"client"` string literal directly (clients never go through `parseCrmId`/`encodeCrmId`), and `crm_notes.record_type`'s inline schema.ts comment already listed `"client"` as valid from 06-01. No architectural deviation from the plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. No new migration, no new environment variables.

## Next Phase Readiness
- Phase 6 (Clients Entity + CRM Integration) is now feature-complete: manual create (CLIENT-01, 06-03), convert-from-lead (CLIENT-02, 06-04), visually separated list (CLIENT-03, 06-03), open+edit (CLIENT-04, this plan), and private notes (CLIENT-05, this plan) are all built.
- `/admin/clients/[id]` is ready to be extended by Phase 7 (tickets linked to a client) and Phase 8 (invoice history / CLIENT-06) — the Card-based layout has clear insertion points for additional sections.
- `npx tsc --noEmit` exits 0 and the full `npx vitest run` suite (32 files, 131 passed / 48 skipped / 13 todo) is green.
- Manual `netlify dev` verification (open a client, edit + save, add a note) was not run in this session — recommended before considering Phase 6 fully closed out, per the plan's verification step 4. No blocker identified from static/automated checks.

---
*Phase: 06-clients-entity-crm-integration*
*Completed: 2026-07-04*

## Self-Check: PASSED

All 4 files verified present on disk: `src/app/api/admin/clients/[id]/notes/route.ts`, `src/components/admin/clients/ClientNoteForm.tsx`, `src/app/api/admin/clients/[id]/notes/route.test.ts`, `src/app/admin/clients/[id]/page.tsx`. Both task commits (`b3b4765`, `bd70c15`) verified present in `git log`.
