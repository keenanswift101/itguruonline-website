---
phase: 06-clients-entity-crm-integration
plan: 03
subsystem: ui
tags: [nextjs-app-router, react, tailwind-v4, admin-portal, crud]

# Dependency graph
requires:
  - phase: 06-02
    provides: "client-query.ts getClients(), POST /api/admin/clients, GET+PUT /api/admin/clients/[id]"
provides:
  - "ClientsTable — status-free client list component with source badges, search on name/email/company"
  - "ClientForm — create+edit capable client form (name/email required; phone/company/addresses optional)"
  - "/admin/clients — Clients list page (server component, requireAdmin + getClients)"
  - "/admin/clients/new — manual client creation page"
  - "Clients nav entry in AdminSidebar directly after CRM"
affects: [06-05, phase-07-tickets, phase-08-linked-invoicing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ClientsTable mirrors CrmTable.tsx exactly minus the status column/filter (clients have no lifecycle), replacing it with a source badge (manual/from_registration/from_enquiry) using the same neon-glow badge style"
    - "ClientForm mirrors InvoiceForm.tsx's create/edit duality: optional clientId prop selects PUT vs POST, 201->redirect to detail, 200 edit->router.refresh()+saved banner, 422->inline field errors mapped from the zod fieldErrors shape"

key-files:
  created:
    - src/components/admin/clients/ClientsTable.tsx
    - src/components/forms/ClientForm.tsx
    - src/app/admin/clients/page.tsx
    - src/app/admin/clients/new/page.tsx
  modified:
    - src/components/admin/AdminSidebar.tsx

key-decisions:
  - "ClientForm built with clientId?/initial? props up front (not just create-mode) so 06-05's detail/edit page can reuse it verbatim without a follow-up refactor, per the plan's explicit intent."

requirements-completed: [CLIENT-01, CLIENT-03]

# Metrics
duration: 13min
completed: 2026-07-04
---

# Phase 06 Plan 03: Clients List Section + Manual-Create UI Summary

**ClientsTable (status-free, source-badged client list) + ClientForm (create/edit-dual-mode) + /admin/clients list page + /admin/clients/new create page + a Clients sidebar entry after CRM — the first visible separation of Clients from Leads in the admin portal.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-04T15:22:47Z
- **Completed:** 2026-07-04T15:36:06Z
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `ClientsTable.tsx` renders clients newest-first with Name (linked to `/admin/clients/[id]`), Company, Email, Phone, a source badge (Manual / From registration / From enquiry, styled with the same neon `box-shadow` badge treatment as `CrmTable`'s status badges), and Date — with a single search box filtering on name+email+company and no status column/filter (clients have no lifecycle).
- `ClientForm.tsx` is create+edit dual-mode from day one: no `clientId` prop -> `POST /api/admin/clients` -> redirect to `/admin/clients/{id}` on 201; `clientId` prop set -> `PUT /api/admin/clients/{id}` -> `router.refresh()` + a "Saved." banner on 200. 422 responses map `fields` into inline per-field error messages exactly like `InvoiceForm`. Required fields (name, email) are validated client-side before submit; phone/company/physicalAddress/postalAddress are optional.
- `/admin/clients` (server component) calls `requireAdmin()` + `getClients()` and renders `ClientsTable`, with a "New Client" `.btn-metallic` CTA linking to `/admin/clients/new`.
- `/admin/clients/new` renders `ClientForm` with no props (create mode) behind the same `requireAdmin()` guard, with a back-link to `/admin/clients`.
- `AdminSidebar.tsx` gained a `{ href: "/admin/clients", label: "Clients" }` nav entry immediately after CRM.

## Task Commits

Each task was committed atomically:

1. **Task 1: ClientsTable + Clients nav entry** - `c06850c` (feat)
2. **Task 2: ClientForm (create+edit) + list page + new page** - `aed6543` (feat)

**Plan metadata:** (pending — this commit)

_Note: No TDD tasks in this plan; both commits are single-pass feat, matching the CrmTable/InvoiceForm patterns being mirrored._

## Files Created/Modified
- `src/components/admin/clients/ClientsTable.tsx` - status-free client list with search + source badges, links to `/admin/clients/[id]`
- `src/components/admin/AdminSidebar.tsx` - added Clients nav entry after CRM
- `src/components/forms/ClientForm.tsx` - create+edit client form with 422 field-error mapping
- `src/app/admin/clients/page.tsx` - server-component list page (`requireAdmin` + `getClients()`)
- `src/app/admin/clients/new/page.tsx` - manual-create page rendering `ClientForm` in create mode

## Decisions Made
- Confirmed the plan's design of building `ClientForm` as create/edit-capable now (rather than a create-only form later refactored) — 06-05's detail page will pass `clientId`+`initial` straight in with no changes needed to this component.
- No architectural deviations — plan executed exactly as written, including reusing `CrmTable`/`InvoiceForm`'s exact Tailwind classes and canonical `text-(--token)` syntax.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Local `netlify dev` smoke test initially 500'd on `/admin/clients` because migration `0005_clients.sql` (from 06-01) had never been applied to the local dev database. Ran `netlify database migrations apply` (pre-existing, out-of-scope migration file — not part of this plan's `files_modified`) to unblock verification; this is expected local-environment setup, not a plan bug. After applying, `/admin/clients` returned 200, and a real end-to-end create-then-list smoke test (`POST /api/admin/clients` -> row appears in `/admin/clients` with name/email/"Manual" badge) passed. The smoke-test row was deleted from the local dev DB afterward.
- Running `netlify dev` for the smoke test regenerated `deno.lock` (edge-function loader side effect) — reverted with `git checkout -- deno.lock` since it's unrelated to this plan's scope.

## User Setup Required

None - no external service configuration required. (Production/preview databases pick up migration `0005_clients.sql` automatically on next Netlify deploy, same as noted in 06-01's summary; this plan didn't add any new migration.)

## Next Phase Readiness
- `ClientForm` is ready for 06-05 to reuse in edit mode via `clientId`+`initial` props — no changes needed.
- `/admin/clients/[id]` (client detail page, linked from `ClientsTable` rows) is intentionally not built yet — that's 06-05's scope, per the plan.
- Verified end-to-end locally: sidebar Clients link renders, `/admin/clients` lists real DB rows, `/admin/clients/new` creates a client and the new row appears in the list with the correct "Manual" source badge.
- No blockers for 06-04 (already executed) or 06-05.

---
*Phase: 06-clients-entity-crm-integration*
*Completed: 2026-07-04*

## Self-Check: PASSED

All 5 created/modified files verified present on disk (ClientsTable.tsx, ClientForm.tsx, admin/clients/page.tsx, admin/clients/new/page.tsx, AdminSidebar.tsx); both task commits (c06850c, aed6543) verified present in git log.
