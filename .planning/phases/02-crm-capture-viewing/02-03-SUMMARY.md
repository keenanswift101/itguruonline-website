---
phase: 02-crm-capture-viewing
plan: "03"
subsystem: crm-detail
tags: [crm, detail-view, notes, status, api-routes, server-component, client-component]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [crm-detail-api, crm-status-patch, crm-notes-post, crm-detail-page]
  affects: [admin-crm-list]
tech_stack:
  added: []
  patterns:
    - Next.js 16 async params (Promise<{id}>) in route handlers and pages
    - parseCrmId for table disambiguation from prefixed URL segment
    - router.refresh() pattern for client-side mutations without full navigation
    - describeIfDb test pattern for DB-gated integration tests
    - HTML strip + truncation for stored note XSS prevention
key_files:
  created:
    - src/app/api/admin/crm/[id]/route.ts
    - src/app/api/admin/crm/[id]/route.test.ts
    - src/app/api/admin/crm/[id]/status/route.ts
    - src/app/api/admin/crm/[id]/status/route.test.ts
    - src/app/api/admin/crm/[id]/notes/route.ts
    - src/app/api/admin/crm/[id]/notes/route.test.ts
    - src/app/admin/crm/[id]/page.tsx
    - src/components/admin/crm/StatusSelect.tsx
    - src/components/admin/crm/NoteForm.tsx
  modified:
    - src/components/ui/Card.tsx
decisions:
  - "parseCrmId used in both API routes and page to keep disambiguation logic in one place"
  - "Notes route strips HTML and javascript: URIs inline rather than a shared sanitiser (single use case, 2 LOC)"
  - "Card.tsx upgraded to Tailwind v4 canonical syntax (border-(--border-color) bg-(--bg-primary)) per CLAUDE.md requirement"
  - "StatusSelect uses defaultValue not value to avoid controlled/uncontrolled React warning (value comes from SSR)"
metrics:
  duration_seconds: 1014
  completed_date: "2026-07-02"
  tasks_completed: 3
  files_created: 9
  files_modified: 1
---

# Phase 02 Plan 03: CRM Detail View, Status + Notes Summary

One-liner: Three admin API routes (GET detail, PATCH status, POST notes) plus a full-page server component and two client controls delivering CRM-04/05/06 — record detail, status changes, and timestamped append-only notes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | GET detail route + PATCH status route + tests | fdd5147 | route.ts, route.test.ts, status/route.ts, status/route.test.ts |
| 2 | POST notes route + test | fdee5bd | notes/route.ts, notes/route.test.ts |
| 3 | Detail page + StatusSelect + NoteForm + Card fix | d520381 | page.tsx, StatusSelect.tsx, NoteForm.tsx, Card.tsx |

## What Was Built

**GET /api/admin/crm/[id]** — Parses the prefixed id (`registration-{n}` or `enquiry-{n}`) with `parseCrmId`, queries the appropriate table, fetches `crmNotes` ordered ascending by `createdAt`, returns `{ recordType, record, notes }`. Returns 401 without session, 404 for unparseable id or missing row.

**PATCH /api/admin/crm/[id]/status** — Validates `status` against `CRM_STATUSES`, returns 422 for any value outside the four valid statuses. Updates `clientRegistrations` or `contactEnquiries` based on the parsed `recordType`. Returns 422 on recordType mismatch.

**POST /api/admin/crm/[id]/notes** — Validates non-empty body text (422 for empty/whitespace), strips HTML and `javascript:` URIs, truncates to 5000 chars, inserts into `crmNotes` with correct `recordType` + `recordId`. Returns 201 + inserted row. Append-only (no update/delete).

**`/admin/crm/[id]/page.tsx`** — Async server component with `requireAdmin` + `redirect`, `parseCrmId` + `notFound`, inline DB queries for record + ordered notes. Renders: back link to `/admin/crm`, display name + `referenceId` (registrations), `StatusSelect`, full detail cards (personal info, domain, package, declaration for registrations; subject/message/phone for enquiries), `NoteForm`, and chronological notes log with empty state.

**`StatusSelect.tsx`** — `"use client"` component: `<select>` with all four CRM statuses, `onChange` fires `PATCH` to `/api/admin/crm/{prefixedId}/status`, then `router.refresh()`. Pending state disables the select.

**`NoteForm.tsx`** — `"use client"` component: `<form>` with `<textarea>` + `btn-metallic` submit button. `onSubmit` guards empty body, POSTs to `/api/admin/crm/{prefixedId}/notes`, clears body, calls `router.refresh()`. Pending state disables button.

**`Card.tsx`** — Fixed bracket-var Tailwind syntax to v4 canonical (`border-(--border-color) bg-(--bg-primary)`) per CLAUDE.md requirement.

## Test Results

- 10 tests passing, 8 skipped (DB-gated `describeIfDb` stubs)
- All non-DB guard tests pass: 401 without session, parseCrmId null cases, CRM_STATUSES validation, note body trimming
- `npx tsc --noEmit` exits clean

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Rule 3 — Merge dev into worktree
- **Found during:** Pre-task setup
- **Issue:** Worktree branch `worktree-agent-a11715b2443c2ca6c` was created from an earlier commit and was missing the CRM foundation files from Plans 02-01 and 02-02 (crm-types.ts, crm-query.ts, db/schema.ts, auth.ts, etc.)
- **Fix:** `git merge dev` (fast-forward) to bring the worktree up to the merged state before implementing Plan 03
- **Files modified:** None (merge only)

## Known Stubs

None — all data flows from real DB queries; no hardcoded empty values or placeholder text that affects functionality.

## Self-Check: PASSED

Files created:
- src/app/api/admin/crm/[id]/route.ts — FOUND
- src/app/api/admin/crm/[id]/route.test.ts — FOUND
- src/app/api/admin/crm/[id]/status/route.ts — FOUND
- src/app/api/admin/crm/[id]/status/route.test.ts — FOUND
- src/app/api/admin/crm/[id]/notes/route.ts — FOUND
- src/app/api/admin/crm/[id]/notes/route.test.ts — FOUND
- src/app/admin/crm/[id]/page.tsx — FOUND
- src/components/admin/crm/StatusSelect.tsx — FOUND
- src/components/admin/crm/NoteForm.tsx — FOUND

Commits:
- fdd5147 — feat(02-03): Task 1 — GET detail route + PATCH status route + tests
- fdee5bd — feat(02-03): Task 2 — POST notes route + test
- d520381 — feat(02-03): Task 3 — CRM detail page + StatusSelect + NoteForm
