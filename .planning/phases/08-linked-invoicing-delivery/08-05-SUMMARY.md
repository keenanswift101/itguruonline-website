---
phase: 08-linked-invoicing-delivery
plan: 05
subsystem: ui
tags: [drizzle, postgres, nextjs-app-router, tailwind-v4, admin-portal, client-invoicing]

# Dependency graph
requires:
  - phase: 08-01
    provides: invoices.clientId nullable FK
  - phase: 06-05
    provides: /admin/clients/[id] detail page (Card-based layout, Edit Details + Notes sections)
provides:
  - "getClientInvoices(clientId) query (invoices.client_id, newest first, serialization-safe)"
  - "ClientInvoiceSummary type"
  - "Invoices Card on the client detail page with empty state + links to invoice detail"
  - "Explicit comment-marked seam for the Phase 7 Tickets Card (sibling, zero rework)"
affects: [phase-07-tickets]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-history area on the detail page is built as independent, stacked Cards (Invoices now, Tickets as a documented future sibling) rather than one combined 'History' Card — keeps Phase 7's tickets addition a pure insertion with no restructuring"

key-files:
  created:
    - src/lib/client-query.test.ts
  modified:
    - src/lib/client-query.ts
    - src/lib/client-types.ts
    - src/app/admin/clients/[id]/page.tsx

key-decisions:
  - "CLIENT-06 delivered PARTIALLY by design: only the invoices half (query + Card) ships in this plan; the tickets half is explicitly deferred to Phase 7 since the tickets table doesn't exist yet. REQUIREMENTS.md keeps CLIENT-06 as 'In Progress' (not checked complete) to reflect this."
  - "Invoices Card inserted between Edit Details and Notes so client history sits with the client record and Notes (which the owner adds to most often) stays last/most-accessible"

requirements-completed: []

# Metrics
duration: 10min
completed: 2026-07-05
---

# Phase 8 Plan 5: Client Invoice History Summary

**`getClientInvoices(clientId)` query (invoices.client_id, newest first) plus an "Invoices" Card on `/admin/clients/[id]` linking to each invoice, with an explicit code-comment seam marking exactly where Phase 7's Tickets Card slots in as a sibling.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-05T07:52:00Z (approx.)
- **Completed:** 2026-07-05T08:02:00Z (approx.)
- **Tasks:** 2/2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Added `getClientInvoices(clientId)` to `src/lib/client-query.ts`: selects from `invoices` filtered by `eq(invoices.clientId, clientId)`, ordered `desc(invoices.createdAt)`, mapped through `formatInvoiceNumber()` for the `INV-YYYY-NNN`/`DRAFT` display string.
- Added `ClientInvoiceSummary` to `src/lib/client-types.ts` (id, invoiceNumber, status, totalRands, issueDate, dueDate — all plain strings/numbers, no raw `Date` fields, since Postgres `date` columns already deserialize as strings via Drizzle).
- Created `src/lib/client-query.test.ts`: `NETLIFY_DB_URL`-gated `describe.skip`/`describe` with three `it.todo()` stubs (linked-by-client_id ordering, empty-client case, DRAFT-number formatting) mirroring the established Wave-0 stub convention.
- Client detail page (`src/app/admin/clients/[id]/page.tsx`) now calls `getClientInvoices(client.id)` and renders an "Invoices" Card between "Edit Details" and "Notes": each invoice links to `/admin/invoices/${id}` showing its number, total, status, and due date; friendly "No invoices yet." empty state.
- Left an explicit, clearly-worded comment seam (`{/* … Tickets are DEFERRED to Phase 7: add a sibling <Card> here … */}` plus a placeholder line after the Invoices Card) so Phase 7 can add the Tickets Card with zero rework to this block.

## Task Commits

Each task was committed atomically:

1. **Task 1: getClientInvoices query + ClientInvoiceSummary type + test** - `a304536` (feat)
2. **Task 2: Invoices history Card on the client detail page + tickets seam** - `a696959` (feat)

**Plan metadata:** (pending — this commit)

_Note: no TDD tasks in this plan — both were single-commit `auto` tasks._

## Files Created/Modified
- `src/lib/client-query.ts` - new `getClientInvoices(clientId)` query (by `invoices.client_id`, newest first)
- `src/lib/client-types.ts` - new `ClientInvoiceSummary` interface
- `src/lib/client-query.test.ts` - DB-gated `it.todo()` stubs for `getClientInvoices`
- `src/app/admin/clients/[id]/page.tsx` - "Invoices" Card (empty state + links) inserted between "Edit Details" and "Notes"; explicit Phase 7 tickets seam comment

## Decisions Made
- CLIENT-06 is intentionally split across two milestone phases: this plan ships only the invoices half. REQUIREMENTS.md's traceability table records CLIENT-06 as "In Progress" (not checked complete) — matches the established correction pattern used in 06-01/06-02/08-01/08-02 for plans that only deliver part of a multi-piece requirement.
- Invoices Card placed between Edit Details and Notes (not after Notes) so the client's transactional history sits visually with their record, while Notes — the section the owner interacts with most (adding notes) — stays last for easy access/scroll-to.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. No new migration, no new environment variables.

## Next Phase Readiness

- The client detail page's history area is now Card-per-source (Invoices today), with a clearly commented insertion point for Phase 7's Tickets Card — Phase 7 can add a sibling `<Card>` immediately after the Invoices Card with zero rework to this file.
- `npx tsc --noEmit` exits 0; full `npx vitest run` suite green (134 passed, 48 skipped, 27 todo across 33 files, 2 skipped test files).
- Manual `netlify dev` verification (open a client with linked invoices, confirm the Invoices Card renders and links resolve) was not run in this session — recommended before considering Phase 8 fully closed out. No blocker identified from static/automated checks.
- Only 08-03 (searchable client picker UI) remains before Phase 8 (linked-invoicing-delivery) is complete.

---
*Phase: 08-linked-invoicing-delivery*
*Completed: 2026-07-05*

## Self-Check: PASSED
