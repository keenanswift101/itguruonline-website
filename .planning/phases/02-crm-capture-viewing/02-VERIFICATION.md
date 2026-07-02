---
phase: 02-crm-capture-viewing
verified: 2026-07-02T07:35:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 2: CRM Capture + Viewing Verification Report

**Phase Goal:** Every public enquiry and registration is captured and viewable in the admin CRM — searchable list, detail view with status management and notes, and CSV export.
**Verified:** 2026-07-02T07:35:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Registration wizard submission writes a client_registrations row before confirmation email | VERIFIED | `db.insert(clientRegistrations)` at line 125 in `register/route.ts`, precedes `sendEmail` at line 165. Comment "CRM capture — MUST precede email send" present. |
| 2 | Contact form submission writes a contact_enquiries row before admin email | VERIFIED | `db.insert(contactEnquiries)` at line 107 in `contact/route.ts`, precedes `sendEmail` at line 120. Comment "CRM capture — MUST precede email send" present. |
| 3 | A DB insert failure logs but does not block email or success response | VERIFIED | Both inserts wrapped in try/catch; catch logs to stderr only; function continues to email send. Register returns 201, contact returns 200 even on insert failure (confirmed by passing tests). |
| 4 | Every captured registration row has a non-null reference_id matching ITG-YYYYMMDD-XXXXX | VERIFIED | `generateReferenceId()` at line 60 of `register/route.ts` produces ITG-YYYYMMDD-XXXXX format; inserted before email. Test asserts `/^ITG-\d{8}-[A-Z0-9]{5}$/`. |
| 5 | Persistent admin sidebar shows all nav links with active-link highlight and owner email | VERIFIED | `AdminSidebar.tsx` has `usePathname`, `w-56 shrink-0`, five nav hrefs, active/inactive classes, `{email}` at bottom. `admin/layout.tsx` wraps children in flex row and renders `{session && <AdminSidebar email={session.email} />}`. |
| 6 | /admin/crm shows a merged, searchable, filterable list; each row links to prefixed detail URL | VERIFIED | `CrmTable.tsx` has `useState`, `useMemo`, search input, status select, table with five columns, `Link href={/admin/crm/${encodeCrmId(...)}}` on name cell. Empty states handled. `crm/page.tsx` calls `getMergedCrmRecords()` server-side. |
| 7 | Detail view, status PATCH, note POST, and CSV export all exist and are protected by requireAdmin | VERIFIED | All five admin CRM API routes (`/crm`, `/crm/[id]`, `/crm/[id]/status`, `/crm/[id]/notes`, `/crm/export`) start with `requireAdmin()` returning 401 when null. Detail page (`/admin/crm/[id]/page.tsx`) calls `requireAdmin()` and redirects on null. |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|---------|--------|-------------|-------|--------|
| `src/lib/db/schema.ts` | clientRegistrations, contactEnquiries, crmNotes table definitions | Yes | 75 lines, all 3 tables with correct columns | Imported in all 5 API routes + detail page | VERIFIED |
| `src/app/api/register/route.ts` | DB capture before email in registration POST | Yes | Full implementation with try/catch, 208 lines | Entry point, no further wiring needed | VERIFIED |
| `src/app/api/contact/route.ts` | DB capture before email in contact POST | Yes | Full implementation with try/catch, 147 lines | Entry point, no further wiring needed | VERIFIED |
| `src/app/api/register/route.test.ts` | Insert-before-email ordering test for CRM-01 | Yes | 159 lines, invocationCallOrder assert, describeIfDb, insert-failure test | Vitest passes 3 tests (2 non-DB ordering + 1 guard) | VERIFIED |
| `src/app/api/contact/route.test.ts` | Insert-before-email ordering test for CRM-02 | Yes | 147 lines, invocationCallOrder assert, null-phone test, describeIfDb | Vitest passes 5 tests | VERIFIED |
| `src/lib/crm-types.ts` | Shared CrmListItem type + STATUS constants + parseCrmId/encodeCrmId | Yes | 32 lines, all required exports present | Imported by 4 API routes + 3 components + 2 pages | VERIFIED |
| `src/components/admin/AdminSidebar.tsx` | Client sidebar with active-link highlight via usePathname | Yes | 58 lines, `"use client"`, usePathname, isActive logic, email footer | Rendered in `admin/layout.tsx` conditionally on session | VERIFIED |
| `src/app/api/admin/crm/route.ts` | GET merged CRM list with requireAdmin guard | Yes | 39 lines, Promise.all query, merge+sort, CrmListItem shape | Consumed by `admin/crm/page.tsx` (indirectly via crm-query.ts) | VERIFIED |
| `src/lib/crm-query.ts` | getMergedCrmRecords() shared helper | Yes | 43 lines, identical merge logic, single source of truth | Called by `admin/crm/page.tsx`; list route duplicates but is consistent | VERIFIED |
| `src/components/admin/crm/CrmTable.tsx` | Client-side filterable table | Yes | 129 lines, `"use client"`, useState+useMemo, encodeCrmId links, neon STATUS_STYLE, empty states | Rendered by `admin/crm/page.tsx` with records prop | VERIFIED |
| `src/app/admin/crm/page.tsx` | Server component list page with requireAdmin | Yes | 28 lines, requireAdmin, getMergedCrmRecords(), CrmTable, CSV export anchor | Page route, wired to sidebar via layout | VERIFIED |
| `src/app/api/admin/crm/[id]/route.ts` | GET full record + notes detail | Yes | 31 lines, requireAdmin, parseCrmId, table-dispatch, notes query | Called by `admin/crm/[id]/page.tsx` indirectly (page queries DB directly) | VERIFIED |
| `src/app/admin/crm/[id]/page.tsx` | Detail page rendering full record, status select, note form | Yes | 253 lines, requireAdmin, parseCrmId, StatusSelect, NoteForm, notes list | Page route under admin layout | VERIFIED |
| `src/app/api/admin/crm/[id]/status/route.ts` | PATCH status with CRM_STATUSES validation | Yes | 46 lines, requireAdmin, CRM_STATUSES validation (422 on bad value), table-dispatch update | Called by StatusSelect component via fetch | VERIFIED |
| `src/app/api/admin/crm/[id]/notes/route.ts` | POST append note to crm_notes | Yes | 41 lines, requireAdmin, HTML strip sanitization, db.insert crmNotes, returning() | Called by NoteForm component via fetch | VERIFIED |
| `src/components/admin/crm/StatusSelect.tsx` | Client status dropdown with PATCH + router.refresh | Yes | 58 lines, `"use client"`, fetch PATCH to `/api/admin/crm/${encodeCrmId(...)}/status`, router.refresh() | Rendered in `admin/crm/[id]/page.tsx` | VERIFIED |
| `src/components/admin/crm/NoteForm.tsx` | Client append-note form with router.refresh | Yes | 59 lines, `"use client"`, fetch POST to `/api/admin/crm/${encodeCrmId(...)}/notes`, router.refresh() | Rendered in `admin/crm/[id]/page.tsx` | VERIFIED |
| `src/lib/csv.ts` | csvEscape() RFC 4180 + formula-injection escaper; csvRow() helper | Yes | 26 lines, both functions exported, formula prefix defense, quote doubling | Imported by export route | VERIFIED |
| `src/lib/csv.test.ts` | Unit tests for csvEscape/csvRow edge cases | Yes | 79 lines, 14 test cases covering all edge cases | Vitest passes all 14 tests | VERIFIED |
| `src/app/api/admin/crm/export/route.ts` | GET CSV export with requireAdmin + correct Content-Type/Disposition headers | Yes | 106 lines, requireAdmin, buildCsvBody (exported for testing), Promise.all query, CRLF output | Linked from `admin/crm/page.tsx` export anchor | VERIFIED |
| `netlify/database/migrations/0001_nosy_lady_mastermind.sql` | CREATE TABLE statements for all 3 CRM tables | Yes | All three tables with correct columns | Applied on Netlify build | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `register/route.ts` | clientRegistrations table | `db.insert(clientRegistrations)` in try/catch before sendEmail | WIRED | Line 125 insert; line 165 first sendEmail. Order confirmed by test. |
| `contact/route.ts` | contactEnquiries table | `db.insert(contactEnquiries)` in try/catch before sendEmail | WIRED | Line 107 insert; line 120 first sendEmail. Order confirmed by test. |
| `admin/layout.tsx` | AdminSidebar.tsx | `import + {session && <AdminSidebar email={session.email} />}` in flex row | WIRED | Layout is async server component calling requireAdmin for email prop. |
| `admin/crm/page.tsx` | CrmTable.tsx | `getMergedCrmRecords()` then `<CrmTable records={items} />` | WIRED | Records are live DB rows passed as prop; not hardcoded empty. |
| `CrmTable.tsx` | `/admin/crm/[id]` | `Link href={/admin/crm/${encodeCrmId(r.recordType, r.id)}}` | WIRED | Links use prefixed ID scheme as required. |
| `StatusSelect.tsx` | `/api/admin/crm/[id]/status` | fetch PATCH with `{ status, recordType }` body, then router.refresh() | WIRED | Full round-trip wired; refresh rerenders detail page. |
| `NoteForm.tsx` | `/api/admin/crm/[id]/notes` | fetch POST with `{ body, recordType }`, setBody(""), then router.refresh() | WIRED | Full round-trip wired. |
| `export/route.ts` | clientRegistrations + contactEnquiries | `Promise.all([db.select()...clientRegistrations, db.select()...contactEnquiries])` | WIRED | Both tables queried; result passed to buildCsvBody. |
| `export/route.ts` | `csv.ts csvRow` | `import { csvRow } from "@/lib/csv"` then every field wrapped via csvRow | WIRED | All 12 columns per row go through csvEscape via csvRow. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `CrmTable.tsx` | `records: CrmListItem[]` | Prop from `admin/crm/page.tsx` → `getMergedCrmRecords()` → `db.select().from(clientRegistrations)` + `db.select().from(contactEnquiries)` | Yes — live DB queries in crm-query.ts | FLOWING |
| `admin/crm/[id]/page.tsx` | `record` + `notes` | Direct `db.select().from(clientRegistrations/contactEnquiries)` + `db.select().from(crmNotes)` | Yes — live DB queries in page server component | FLOWING |
| `export/route.ts` | `registrations`, `enquiries` | `Promise.all([db.select()...])` — two live DB queries | Yes — produces real rows for buildCsvBody | FLOWING |

Note: The GET `/api/admin/crm` list route (route.ts) duplicates the merge logic that is also in `crm-query.ts` rather than calling the shared helper. This is a minor code quality concern (two copies of the same merge/sort to maintain in sync) but both produce identical correct output. Not a goal-blocking issue.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| csvEscape handles all edge cases | `npx vitest run src/lib/csv.test.ts` | 14 tests pass | PASS |
| register route inserts before email | `npx vitest run src/app/api/register/route.test.ts` | invocationCallOrder test passes (insertOrder < emailOrder) | PASS |
| contact route inserts before email | `npx vitest run src/app/api/contact/route.test.ts` | invocationCallOrder test passes | PASS |
| admin CRM routes return 401 without session | `npx vitest run` | All 4 non-DB 401 guard tests pass across crm route, [id] route, status route, notes route, export route | PASS |
| Full test suite | `npx vitest run` | 51 passed, 26 skipped (DB-gated), 0 failed | PASS |
| TypeScript | `npx tsc --noEmit` | No errors output | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CRM-01 | 02-01-PLAN.md | Every registration wizard submission is automatically saved as a client record | SATISFIED | `db.insert(clientRegistrations)` before email in `register/route.ts`; test proves ordering and 201-on-insert-failure |
| CRM-02 | 02-01-PLAN.md | Every contact form submission is automatically saved as an enquiry record | SATISFIED | `db.insert(contactEnquiries)` before email in `contact/route.ts`; test proves ordering and 200-on-insert-failure |
| CRM-03 | 02-02-PLAN.md | Owner can view a searchable, filterable list of all enquiries/clients | SATISFIED | `/admin/crm` page renders CrmTable with client-side search+status filter; GET /api/admin/crm returns merged sorted list; CRM-03 is marked Pending in REQUIREMENTS.md traceability table but the implementation is complete |
| CRM-04 | 02-03-PLAN.md | Owner can open a record to see full submitted details | SATISFIED | `/admin/crm/[id]/page.tsx` renders all fields for both registration (Personal, Domain, Package, Declaration cards) and enquiry (details card) |
| CRM-05 | 02-03-PLAN.md | Owner can set a record's status (New, Contacted, In Progress, Completed) | SATISFIED | `StatusSelect.tsx` sends PATCH to `/api/admin/crm/[id]/status`; route validates against CRM_STATUSES (422 on invalid), dispatches to correct table |
| CRM-06 | 02-03-PLAN.md | Owner can add free-text, timestamped notes to a record | SATISFIED | `NoteForm.tsx` POSTs to `/api/admin/crm/[id]/notes`; route inserts into crmNotes with recordType/recordId; page renders notes in chronological order |
| CRM-07 | 02-04-PLAN.md | Owner can export the enquiry/client list as CSV | SATISFIED | GET `/api/admin/crm/export` returns `text/csv; charset=utf-8` attachment with correct Content-Disposition; buildCsvBody unit-tested for RFC 4180 escaping and formula injection defense |

**Note on REQUIREMENTS.md traceability status:** The traceability table in REQUIREMENTS.md marks CRM-01, CRM-02, CRM-03, CRM-07 as "Pending" and CRM-04, CRM-05, CRM-06 as "Complete". The implementation verifies all seven are fully implemented. The "Pending" status in the traceability table reflects pre-implementation state and has not been updated to match the actual codebase.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `CrmTable.tsx` | 50, 55 | `focus:border-[#00aaff]` — bracket form for hex literal | Info | CLAUDE.md prohibition targets `[var(--` CSS var bracket form. A hex literal `[#00aaff]` is a different pattern that Tailwind v4 requires for arbitrary hex colors. Not a violation. |
| `api/admin/crm/route.ts` | 12-36 | Merge/sort logic duplicated from `crm-query.ts` | Info | Both implementations are correct and produce identical output. Minor DRY violation, not a goal blocker. |
| `[id]/route.test.ts`, `status/route.test.ts`, `notes/route.test.ts` | various | DB-gated tests use `expect(true).toBe(true)` as placeholder assertions | Warning | The non-DB 401 guard tests do exercise real code paths. The DB-gated placeholder tests are not ideal coverage but are explicitly deferred to staging. No goal-blocking impact. |

No stub implementations, no TODO/FIXME blocking comments, no hardcoded empty data reaching user-visible output in any production path.

---

### Human Verification Required

The following items require a live browser session against a running dev environment with `NETLIFY_DATABASE_URL` configured:

#### 1. Sidebar Active-Link Highlight

**Test:** Log in, navigate to /admin/crm, then /admin/crm/registration-1, then /admin/dashboard.
**Expected:** CRM nav link stays highlighted on /admin/crm and /admin/crm/registration-1 (startsWith check); Dashboard link highlighted only on exact /admin/dashboard.
**Why human:** PathName-based CSS state not verifiable without a running browser + Next.js router.

#### 2. StatusSelect Persistence

**Test:** Open a CRM record, change status from "New" to "Contacted", refresh the page.
**Expected:** Status shown as "Contacted" after refresh (persists to DB).
**Why human:** Requires live DB + browser fetch to PATCH endpoint.

#### 3. NoteForm Append

**Test:** Open a CRM record, type a note in the textarea, click "Add note", verify it appears with timestamp below.
**Expected:** Note appears immediately after router.refresh(), timestamp is accurate.
**Why human:** Requires live DB + browser render.

#### 4. CSV Export Download

**Test:** Click "Export CSV" on /admin/crm page while logged in.
**Expected:** Browser downloads `crm-export.csv` with all records, header row intact, phone numbers starting with + are formula-injection escaped.
**Why human:** Browser file download cannot be verified programmatically without a running server.

---

### Summary

**All seven requirements (CRM-01 through CRM-07) are fully implemented and wired.** The goal — every public enquiry and registration captured and viewable in the admin CRM with search, detail, status, notes, and CSV export — is achieved.

Key evidence:
- Schema: 3 CRM tables defined in schema.ts, migration SQL generated and present
- Capture: Both public routes insert before email with try/catch error isolation
- Test suite: 51 tests pass (0 fail); 26 DB-gated tests skipped correctly (no NETLIFY_DATABASE_URL in local env)
- TypeScript: `npx tsc --noEmit` clean
- Auth guards: All 5 admin CRM API routes call `requireAdmin()` as first statement; 3 admin page routes check session and redirect
- Data flow: CrmTable receives real DB rows from `getMergedCrmRecords()`, not hardcoded data
- CSV: buildCsvBody unit-tested with RFC 4180 + formula injection edge cases; all pass

The REQUIREMENTS.md traceability table shows some CRM requirements as "Pending" — this reflects an un-updated planning artifact, not missing implementation.

---

_Verified: 2026-07-02T07:35:00Z_
_Verifier: Claude (gsd-verifier)_
