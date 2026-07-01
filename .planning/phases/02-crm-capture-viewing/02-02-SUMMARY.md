---
phase: 02-crm-capture-viewing
plan: 02
subsystem: admin-crm
tags: [crm, admin, sidebar, layout, list-view, filterable-table, auth-guard]
dependency_graph:
  requires: [02-01]
  provides: [CRM-03, D-01-sidebar, CrmListItem-type, prefixed-id-scheme]
  affects: [02-03, 02-04, 03-xx, 04-xx]
tech_stack:
  added: []
  patterns:
    - AdminSidebar client component with usePathname active-link detection
    - getMergedCrmRecords() shared SSR helper in crm-query.ts (DRY for page + export)
    - CrmTable useMemo client-side filtering (no server round-trip)
    - Inline STATUS_STYLE neon colours (avoids forbidden bracket-var Tailwind)
    - encodeCrmId/parseCrmId prefixed-ID scheme (registration-N / enquiry-N)
key_files:
  created:
    - src/lib/crm-types.ts
    - src/components/admin/AdminSidebar.tsx
    - src/lib/crm-query.ts
    - src/app/api/admin/crm/route.ts
    - src/app/api/admin/crm/route.test.ts
    - src/app/admin/crm/page.tsx
    - src/components/admin/crm/CrmTable.tsx
  modified:
    - src/app/admin/layout.tsx
    - src/app/admin/dashboard/page.tsx
    - src/lib/db/schema.ts
decisions:
  - id: DEC-CRM-QUERY-HELPER
    summary: "Extracted getMergedCrmRecords() into src/lib/crm-query.ts so both route.ts and crm/page.tsx share one implementation, and Plan 04 export can import it without duplication"
  - id: DEC-ROUTE-INLINE-LOGIC
    summary: "Kept full Promise.all + normalise logic inline in route.ts as well to satisfy must_haves artifact spec; crm-query.ts serves the SSR page and future export"
metrics:
  duration_minutes: ~30
  completed_date: "2026-07-01"
  tasks_completed: 3
  tasks_total: 3
  files_created: 7
  files_modified: 3
---

# Phase 02 Plan 02: Admin Sidebar Layout + CRM List View Summary

**One-liner:** Persistent AdminSidebar shell with usePathname active links wraps all admin pages; searchable/filterable CRM list at /admin/crm backed by merged clientRegistrations + contactEnquiries with neon status badges and encodeCrmId prefixed-ID row links.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | crm-types, AdminSidebar, layout, dashboard | a958777 | crm-types.ts, AdminSidebar.tsx, admin/layout.tsx, dashboard/page.tsx, schema.ts |
| 2 | GET /api/admin/crm + CRM-03 test | cec561c | route.ts, route.test.ts, crm-query.ts |
| 3 | CRM list page + CrmTable component | f94f1d0 | crm/page.tsx, CrmTable.tsx |

## What Was Built

### Task 1: Shared types + sidebar + layout

- **`src/lib/crm-types.ts`** — Shared contract for Plans 02/03/04: `CrmListItem` interface, `CRM_STATUSES` tuple, `encodeCrmId`/`parseCrmId` functions, `STATUS_LABELS` map.
- **`src/components/admin/AdminSidebar.tsx`** — `"use client"` sidebar with `usePathname` active-link detection. Five nav links (Dashboard/CRM/Pricing/Invoices/Settings). Dashboard uses exact match; others use `startsWith` so `/admin/crm/registration-1` keeps CRM active. Owner email in bottom footer. `w-56 shrink-0` container, Tailwind v4 syntax throughout.
- **`src/app/admin/layout.tsx`** — Converted to async server component, fetches session via `requireAdmin()`. Renders sidebar only when session exists (login page stays clean). Fixed bg-image.jpg preserved. Flex row shell with `flex-1 min-w-0` on main to prevent overflow.
- **`src/app/admin/dashboard/page.tsx`** — Removed `items-center justify-center` centering (sidebar provides layout context). Added `href="/admin/crm"` link.
- **`src/lib/db/schema.ts`** — Added Plan 01 prerequisite CRM tables: `clientRegistrations`, `contactEnquiries`, `crmNotes` (needed in this worktree as Plan 01 ran in a separate worktree).

### Task 2: GET /api/admin/crm route

- **`src/app/api/admin/crm/route.ts`** — `requireAdmin()` guard returns 401 when unauthenticated. `Promise.all` queries both tables. Registration name normalised as `` `${r.firstName} ${r.surname}` ``. Enquiry name from `e.name`. Merged list sorted by `createdAt` descending.
- **`src/lib/crm-query.ts`** — Shared `getMergedCrmRecords()` helper extracted for DRY reuse by `crm/page.tsx` (SSR) and future Plan 04 export route.
- **`src/app/api/admin/crm/route.test.ts`** — Mocks `next/headers` cookies to return no token, asserts 401. `describeIfDb` pattern for DB-dependent tests (skipped without `NETLIFY_DATABASE_URL`).

### Task 3: CRM list page + CrmTable

- **`src/app/admin/crm/page.tsx`** — Async server component with `requireAdmin` guard. Queries merged records via `getMergedCrmRecords()`. Renders `<CrmTable>` and a `btn-glass` export anchor pointing to `/api/admin/crm/export` (Plan 04).
- **`src/components/admin/crm/CrmTable.tsx`** — `"use client"`, `useState` for search + statusFilter, `useMemo` for client-side filtering. Search box filters on `name + email`. Status select with `CRM_STATUSES` options. Table columns: Name (Link), Email, Type badge, Status neon pill, Date. `STATUS_STYLE` inline styles for neon colours (`#00aaff`, `#f59e0b`, `#a855f7`, `#22c55e`) with `boxShadow`. Empty states: "No records yet" / "No matches". No `[var(--` bracket-var Tailwind.

## Decisions Made

1. **Extracted `crm-query.ts` shared helper** — Rather than duplicating the Promise.all + normalise logic in both route.ts and page.tsx, extracted `getMergedCrmRecords()` into `src/lib/crm-query.ts`. The route.ts also inlines the full logic (required by must_haves artifact spec). Plan 04's export route can import from crm-query.ts.

2. **Worktree scope includes Plan 01 prerequisites** — This worktree started from the pre-Phase-1 baseline. Copied Phase 1 foundational files (auth.ts, db/, admin pages) and added CRM schema tables that Plan 01 creates, to make Plan 02-02 fully functional in isolation.

## Deviations from Plan

### Auto-added

**1. [Rule 3 - Blocking] Added CRM schema tables as Plan 01 prerequisite**
- **Found during:** Task 2 (route.ts needs clientRegistrations, contactEnquiries)
- **Issue:** Worktree started from pre-Phase-1 baseline; Plan 01 (which adds CRM tables) ran in a separate parallel worktree
- **Fix:** Added `clientRegistrations`, `contactEnquiries`, `crmNotes` to schema.ts; copied Phase 1 foundational files (auth, db, admin pages) from main repo
- **Files modified:** src/lib/db/schema.ts (plus Phase 1 files from main repo)

**2. [Rule 3 - Blocking] Mocked next/headers for 401 test**
- **Found during:** Task 2 TDD (RED phase test correctly failed, then GREEN revealed `cookies()` requires Next.js request context)
- **Issue:** `requireAdmin()` calls `cookies()` from `next/headers` which throws outside a request context
- **Fix:** Added `vi.mock("next/headers", ...)` to mock cookies returning undefined, correctly triggering the 401 path
- **Files modified:** src/app/api/admin/crm/route.test.ts

## Self-Check: PASSED

All 7 created files found on disk. All 3 task commits (a958777, cec561c, f94f1d0) found in git log. TypeScript reports no errors. Tests pass (1 passed, 1 skipped).
