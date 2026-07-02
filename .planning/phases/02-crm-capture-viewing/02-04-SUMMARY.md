---
phase: 02-crm-capture-viewing
plan: "04"
subsystem: crm-export
tags: [csv, export, api-route, tdd, formula-injection, rfc4180]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [CRM-07]
  affects: [src/lib/csv.ts, src/app/api/admin/crm/export/route.ts]
tech_stack:
  added: []
  patterns: [RFC-4180-csv-escaping, formula-injection-defense, extracted-pure-fn-for-testability]
key_files:
  created:
    - src/lib/csv.ts
    - src/lib/csv.test.ts
    - src/app/api/admin/crm/export/route.ts
    - src/app/api/admin/crm/export/route.test.ts
  modified: []
decisions:
  - buildCsvBody() extracted as pure exported function for unit testability without DB/auth
  - InferSelectModel<typeof table> used for correct Drizzle row types (avoids manual type duplication)
  - vi.mock("next/headers") pattern (from existing crm/route.test.ts) applied to test 401 guard without Next.js request scope
metrics:
  duration: 28m
  completed_date: "2026-07-02"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 02 Plan 04: CSV Export Summary

**One-liner:** RFC 4180 + formula-injection-safe `csvEscape` helper and `GET /api/admin/crm/export` endpoint returning a merged crm-export.csv attachment guarded by `requireAdmin`.

## What Was Built

### Task 1: `src/lib/csv.ts` + `src/lib/csv.test.ts`

Standalone `csvEscape(value: unknown): string` function:
1. Null/undefined → `""`
2. Formula-injection defense: values starting with `=`, `+`, `-`, `@` get a leading `'` so Excel/LibreOffice treat the cell as text
3. RFC 4180 wrapping: if value contains `,`, `"`, CR, or LF — wrap in double-quotes and double any internal double-quotes

`csvRow(fields: unknown[]): string` maps `csvEscape` over an array and joins with `,`.

15 unit tests cover every edge case: plain values, comma wrapping, internal quote doubling, newline wrapping, CRLF wrapping, each formula prefix (`=`, `+`, `-`, `@`), empty string, null, undefined, and combined formula+comma.

### Task 2: `src/app/api/admin/crm/export/route.ts` + `route.test.ts`

`GET /api/admin/crm/export`:
- First call is `await requireAdmin()` — returns 401 `{"error":"Unauthorized"}` if null
- `Promise.all` queries `clientRegistrations` and `contactEnquiries` (same pattern as the list route)
- `buildCsvBody(registrations, enquiries)` — exported pure function builds the CSV string:
  - 12-column header: `ID,Type,Name,Email,Phone,Status,Submitted Date,Domain,Package,Add-ons,Subject,Message`
  - Registration rows: add-ons boolean fields joined with `; ` before escaping; Subject/Message columns blank
  - Enquiry rows: Domain/Package/Add-ons blank; Subject/Message filled
  - Lines joined with `\r\n` (RFC 4180 line terminator)
  - Every field passed through `csvRow` → `csvEscape`
- Response headers: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="crm-export.csv"`

Test coverage (7 tests, 1 DB-only skipped):
- 401 without session (`vi.mock("next/headers")` — matches existing project pattern)
- Header row exactness
- Registration row column layout (type-specific filled, enquiry columns blank)
- Enquiry row column layout (type-specific filled, registration columns blank)
- RFC 4180 escaping of `He said, "hello", ok?` → `"He said, ""hello"", ok?"`
- CRLF-only line terminators (no bare LF)
- Formula injection neutralisation in name field (`=CMD formula` → `'=CMD formula`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error in route.ts**
- **Found during:** Task 2 TypeScript check
- **Issue:** `Awaited<ReturnType<typeof db.select>>["0"]` is not valid — `db.select()` returns a builder, not an array
- **Fix:** Replaced manual type alias with `InferSelectModel<typeof clientRegistrations>` / `InferSelectModel<typeof contactEnquiries>` from drizzle-orm
- **Files modified:** `src/app/api/admin/crm/export/route.ts`
- **Commit:** f458074 (part of Task 2 commit)

**2. [Rule 2 - Missing pattern] Added `vi.mock("next/headers")` to 401 test**
- **Found during:** Task 2 first test run
- **Issue:** `cookies()` from `next/headers` throws outside a Next.js request scope in Vitest; test for 401 guard failed
- **Fix:** Applied the same `vi.mock("next/headers", ...)` pattern already used in `src/app/api/admin/crm/route.test.ts`
- **Files modified:** `src/app/api/admin/crm/export/route.test.ts`
- **Commit:** f458074

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: csvEscape + csvRow helper + unit tests | 7c402e5 | src/lib/csv.ts, src/lib/csv.test.ts |
| Task 2: export route + route tests | f458074 | src/app/api/admin/crm/export/route.ts, src/app/api/admin/crm/export/route.test.ts |

## Known Stubs

None — all columns mapped directly from DB fields; no placeholder values.
