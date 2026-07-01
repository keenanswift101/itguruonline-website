---
phase: 02-crm-capture-viewing
plan: 01
subsystem: crm-capture
tags: [drizzle, schema, db-insert, api-routes, testing, vitest]
dependency_graph:
  requires: [src/lib/db/schema.ts, src/lib/db/index.ts]
  provides: [clientRegistrations table, contactEnquiries table, crmNotes table, CRM DB capture in register/contact routes]
  affects: [src/app/api/register/route.ts, src/app/api/contact/route.ts, netlify/database/migrations/]
tech_stack:
  added: [integer from drizzle-orm/pg-core]
  patterns: [db.insert wrapped in try/catch before sendEmail, describeIfDb pattern for DB-conditional tests]
key_files:
  created:
    - src/app/api/register/route.test.ts
    - src/app/api/contact/route.test.ts
    - netlify/database/migrations/0001_nosy_lady_mastermind.sql
    - netlify/database/migrations/meta/0001_snapshot.json
  modified:
    - src/lib/db/schema.ts
    - src/app/api/register/route.ts
    - src/app/api/contact/route.ts
decisions:
  - "Insert-before-email ordering: DB capture placed before first sendEmail call — if email fails, record is still captured"
  - "Try/catch wraps DB insert: transient DB errors log to stderr but do not block the user's confirmation (201/200 still returned)"
  - "No pgEnum for status: varchar('status') with default 'new' matches existing role column pattern"
  - "crmNotes uses no FK constraint: polymorphic design supports both registrations and enquiries via recordType/recordId"
  - "vi.mock hoisted at top level: avoids Vitest warning about nested vi.unmock; imported mocked modules as named imports for spy access"
metrics:
  duration: ~25 minutes
  completed: 2026-07-01
  tasks_completed: 3
  files_created: 4
  files_modified: 3
---

# Phase 02 Plan 01: CRM Capture Foundation Summary

**One-liner:** Three Drizzle CRM tables (client_registrations, contact_enquiries, crm_notes) added to schema with migration generated, and DB insert wired before email in both public API routes so every registration and contact submission is persisted even if email delivery fails.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add three CRM tables to Drizzle schema and generate migration | 66d9136 | src/lib/db/schema.ts, netlify/database/migrations/0001_nosy_lady_mastermind.sql |
| 2 | Insert client_registrations before email in register route + CRM-01 test | a4d7302 | src/app/api/register/route.ts, src/app/api/register/route.test.ts |
| 3 | Insert contact_enquiries before email in contact route + CRM-02 test | 752257e | src/app/api/contact/route.ts, src/app/api/contact/route.test.ts |

## What Was Built

### Schema (Task 1)

- Added `integer` to pg-core import for `crmNotes.recordId`
- `client_registrations` table: 23 columns covering all 4 wizard steps (stepA personal info, stepB domain, stepC package/add-ons, stepD declaration) plus `reference_id` (unique varchar 32), `status` (default "new"), `created_at`
- `contact_enquiries` table: 8 columns — status, name, email, phone (nullable), subject, message, created_at
- `crm_notes` table: 5 columns — id, record_type, record_id (integer), body, created_at; polymorphic (no FK) to support both registrations and enquiries
- No `pgEnum` — varchar with default matches existing `role` column pattern
- Migration `0001_nosy_lady_mastermind.sql` generated with all three CREATE TABLE statements

### Register Route (Task 2)

- Replaced the `// TODO: Persist to DB (Supabase)` comment with a real `db.insert(clientRegistrations)` wrapped in `try/catch`
- Insert sits at line 125; first `sendEmail` at line 165 — ordering enforced by code placement
- Error path: logs `[register] DB insert failed:` to stderr, continues to return 201 with `referenceId`

### Contact Route (Task 3)

- Added `db.insert(contactEnquiries)` before `sendEmail` at line 107 vs 120
- `payload.phone ?? null` coerces `undefined` to `null` for the nullable varchar column
- Error path: logs `[contact] DB insert failed:` to stderr, continues to return 200

### Tests

Both test files follow the `src/app/api/admin/login/route.test.ts` pattern:
- `vi.mock` at top level for `@/lib/email` and `@/lib/db/index` — avoids Resend API key and NETLIFY_DATABASE_URL requirements
- Import mocked modules as named imports for `vi.mocked()` spy access
- `invocationCallOrder` assertion proves insert precedes email
- Insert-failure path asserts expected status (201 / 200) still returned
- `const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip` for real DB round-trips

## Verification Results

- `npm test -- src/app/api/register/route.test.ts`: 3 passed, 1 skipped
- `npm test -- src/app/api/contact/route.test.ts`: 5 passed, 1 skipped
- `npx tsc --noEmit`: no errors
- `npm run db:generate`: migration generated with all 3 CREATE TABLE statements
- grep confirms `db.insert` line numbers precede `sendEmail` line numbers in both routes

## Deviations from Plan

### Pre-execution: Worktree needed dev branch merge

**Found during:** Pre-task setup

**Issue:** The worktree branch `worktree-agent-a62a7f46ddf2bd199` was created from `eea6c94` (before Phase 1 work), so `src/lib/db/` directory did not exist in the worktree. The plan's `read_first` files referenced `src/lib/db/schema.ts` and `src/lib/db/index.ts`.

**Fix:** Ran `git merge dev --no-edit` (fast-forward) to bring Phase 1 work into the worktree before executing plan tasks.

**Classification:** [Rule 3 - Blocking issue] — missing files would have blocked all three tasks.

### Task 2 + 3: Test restructure for Vitest mock hoisting

**Found during:** Tasks 2 and 3 test runs

**Issue:** First attempt at test file used `vi.unmock()` inside `describeIfDb` `beforeAll` and `vi.resetModules()` in `beforeEach`. Vitest hoists `vi.unmock()` to top level regardless of nesting, causing it to undo all mocks before tests ran. This resulted in Resend constructor failing (no API key) and Neon client failing (no DATABASE_URL).

**Fix:** Restructured test files to:
1. Keep `vi.mock()` at top level only (no `vi.unmock()`)
2. Import mocked modules as named top-level imports for spy access via `vi.mocked()`
3. Use `beforeEach(() => vi.clearAllMocks())` + `mockReturnValue` resets instead of `resetModules`
4. `describeIfDb` block notes it skips without DATABASE_URL — no unmocking needed

**Classification:** [Rule 1 - Bug] — tests were failing, not functioning as designed.

## Known Stubs

None — all three tables and both route inserts are fully wired. The `describeIfDb` round-trip tests are skipped without a live DB but are not stubs; they are intentionally conditional and will execute in the Netlify dev environment.

## Self-Check: PASSED

Files exist:
- src/lib/db/schema.ts: FOUND
- src/app/api/register/route.ts: FOUND
- src/app/api/contact/route.ts: FOUND
- src/app/api/register/route.test.ts: FOUND
- src/app/api/contact/route.test.ts: FOUND
- netlify/database/migrations/0001_nosy_lady_mastermind.sql: FOUND

Commits exist:
- 66d9136: FOUND (schema + migration)
- a4d7302: FOUND (register route + test)
- 752257e: FOUND (contact route + test)
