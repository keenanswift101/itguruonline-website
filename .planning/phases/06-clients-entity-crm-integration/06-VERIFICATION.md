---
phase: 06-clients-entity-crm-integration
verified: 2026-07-04T19:15:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 6: Clients Entity + CRM Integration Verification Report

**Phase Goal:** Owner can manage clients as a first-class entity — distinct from leads — with manual creation, conversion from an enquiry/registration, editing, and private notes.
**Verified:** 2026-07-04T19:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Clients is a distinct first-class entity (new table, own PK, own list/detail UI) — not a lead status | ✓ VERIFIED | `clients` pgTable in `src/lib/db/schema.ts:195-213`, serial PK, own columns (name/email/phone/company/addresses/source/sourceRecordType/sourceRecordId). Migration `0005_clients.sql` creates the table and adds nullable `converted_client_id` FKs on `client_registrations`/`contact_enquiries`. |
| 2 | Owner can manually create a client (name+email required, rest optional) | ✓ VERIFIED | `POST /api/admin/clients` (`src/app/api/admin/clients/route.ts`) — `requireAdmin` → 401, `CreateClientSchema.safeParse` → 422 on bad input, inserts with `source: "manual"`. `ClientForm` (create mode, no `clientId`) POSTs here and redirects to `/admin/clients/{id}` on 201. `/admin/clients/new` renders it. |
| 3 | Owner can convert an enquiry or registration into a client, carrying over captured details, idempotently | ✓ VERIFIED | `POST /api/admin/crm/[id]/convert` (`src/app/api/admin/crm/[id]/convert/route.ts`) uses `withTxDb(db => db.transaction(...))` — single atomic tx inserts `clients` row + stamps `convertedClientId` back on the lead. Registration mapping: `firstName+surname→name`, `cellPhone→phone`, `physicalAddress`/`postalAddress` carried, `source: "from_registration"`. Enquiry mapping: `name→name`, `email→email`, `phone ?? ""→phone`, `source: "from_enquiry"`. Re-convert guarded by `AlreadyConvertedError` → 409. `ConvertButton` shows "Convert to Client" or "View Client" based on `convertedClientId`, wired into `/admin/crm/[id]/page.tsx` for both registration and enquiry record types. |
| 4 | Owner can view clients in a list visually separate from Leads, and open/edit an individual client | ✓ VERIFIED | `/admin/clients` (own page, own `ClientsTable` — name/company/email/phone/source/date columns, search box) is a fully separate route from `/admin/crm` (leads list); `grep` for "clients" inside `src/app/admin/crm/page.tsx` returns nothing — no mixing. Sidebar nav has a "Clients" entry immediately after "CRM" (`AdminSidebar.tsx:14-15`). `/admin/clients/[id]` renders `getClientById`, shows details + inline `ClientForm` in edit mode (PUT, no status lock) + notes; `notFound()` on unknown id. |
| 5 | Owner can add private notes to a client using the same notes machinery as leads | ✓ VERIFIED | `POST /api/admin/clients/[id]/notes` inserts into the shared `crmNotes` table with `recordType: "client"` (no schema change — reuses the `record_type`/`record_id` polymorphic pattern already used for `"registration"`/`"enquiry"`). Same HTML-strip + 5000-char clamp as the leads note route. Detail page reads notes via `eq(crmNotes.recordType, "client") AND eq(crmNotes.recordId, numId)` ordered `asc(createdAt)` — oldest→newest, matches spec. `ClientNoteForm` POSTs and `router.refresh()`s. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/schema.ts` | `clients` table + back-reference columns | ✓ VERIFIED | `pgTable("clients", ...)` present; `clientRegistrations.convertedClientId` and `contactEnquiries.convertedClientId` both reference `clients.id` with `onDelete: "set null"`. |
| `netlify/database/migrations/0005_clients.sql` | CREATE TABLE + 2 ALTER TABLE | ✓ VERIFIED | Matches schema exactly; FK constraints added in separate statements per drizzle-kit convention. |
| `src/lib/client-types.ts` | ClientListItem, ClientSource, CreateClientSchema, UpdateClientSchema | ✓ VERIFIED | All four exported; `UpdateClientSchema = CreateClientSchema` (documented: no status lifecycle lock on clients). |
| `src/lib/client-query.ts` | getClients, getClientById | ✓ VERIFIED | `getClients()` returns `ClientListItem[]` with Date→ISO conversion, ordered `desc(createdAt)`; `getClientById(id)` returns full row or null. Both used by API routes and pages (single source of truth, no duplication). |
| `src/app/api/admin/clients/route.ts` | GET (list) + POST (create) | ✓ VERIFIED | Both exported, `requireAdmin` guarded, POST validates with `CreateClientSchema`, GET calls `getClients()`. |
| `src/app/api/admin/clients/[id]/route.ts` | GET (one) + PUT (edit) | ✓ VERIFIED | Both exported; PUT updates all editable fields, no status lock, 404 on unknown id. |
| `src/app/api/admin/crm/[id]/convert/route.ts` | Atomic convert route | ✓ VERIFIED | `withTxDb` + `db.transaction` used (never bare `db.transaction` on neon-http); 409 idempotency guard via `AlreadyConvertedError`. |
| `src/app/api/admin/clients/[id]/notes/route.ts` | POST client note | ✓ VERIFIED | `recordType: "client"`, HTML-strip + 5000-char clamp, `requireAdmin` guarded. |
| `src/app/admin/clients/page.tsx` | List page | ✓ VERIFIED | Server component, `requireAdmin` + `getClients()`, renders `ClientsTable`, "New Client" link. |
| `src/app/admin/clients/new/page.tsx` | Manual create page | ✓ VERIFIED | Renders `ClientForm` (create mode). |
| `src/app/admin/clients/[id]/page.tsx` | Detail + edit + notes page | ✓ VERIFIED | `getClientById` + `notFound()` guard, inline `ClientForm` (edit mode), notes list `asc(createdAt)` + `ClientNoteForm`, link back to originating lead when `sourceRecordType`/`sourceRecordId` present. |
| `src/components/admin/clients/ClientsTable.tsx` | Client-only search/filter table | ✓ VERIFIED | Columns: name/company/email/phone/source (color-coded badge)/date; client-side search filter over name/email/company. |
| `src/components/forms/ClientForm.tsx` | Create+edit form | ✓ VERIFIED | `clientId` prop toggles POST vs PUT; `initial` prop prefills edit mode; name/email required client-side, rest optional. |
| `src/components/admin/clients/ClientNoteForm.tsx` | Add-note form | ✓ VERIFIED | POSTs to `/api/admin/clients/{id}/notes`, `router.refresh()` on success. |
| `src/components/admin/crm/ConvertButton.tsx` | Convert-from-lead button | ✓ VERIFIED | POSTs to convert route, `router.push` to new client detail on 201, shows "View Client" link once `convertedClientId` is set, 409 handled with inline error + refresh. |
| `src/components/admin/AdminSidebar.tsx` | Nav entry after CRM | ✓ VERIFIED | `{ href: "/admin/clients", label: "Clients" }` immediately follows the CRM entry in `navLinks`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `schema.ts` | `clients` | `convertedClientId` FK on both lead tables | ✓ WIRED | Confirmed via grep + read. |
| `0005_clients.sql` | `0004_automation.sql` | sequential migration | ✓ WIRED | Next number in sequence, no gaps. |
| `clients/route.ts` (GET) | `client-query.ts` | `getClients()` call | ✓ WIRED | No inline query duplication. |
| `clients/route.ts` (POST) | `client-types.ts` | `CreateClientSchema` | ✓ WIRED | |
| `clients/[id]/route.ts` | `schema.ts` | `db.update(clients)` | ✓ WIRED | |
| `admin/clients/page.tsx` | `client-query.ts` | `getClients()` | ✓ WIRED | Same source of truth as the API route. |
| `ClientForm.tsx` | `clients/route.ts` | POST `/api/admin/clients` (create mode) | ✓ WIRED | |
| `ClientForm.tsx` | `clients/[id]/route.ts` | PUT `/api/admin/clients/{id}` (edit mode) | ✓ WIRED | |
| `AdminSidebar.tsx` | `admin/clients/page.tsx` | nav link `/admin/clients` | ✓ WIRED | |
| `convert/route.ts` | `db/tx.ts` | `withTxDb` | ✓ WIRED | Correctly avoids bare `db.transaction` on the neon-http driver. |
| `convert/route.ts` | `schema.ts` | inserts `clients`, updates `convertedClientId` | ✓ WIRED | Both branches (registration/enquiry) update the correct lead table inside the same tx. |
| `ConvertButton.tsx` | `convert/route.ts` | fetch POST + `router.push` | ✓ WIRED | |
| `crm/[id]/page.tsx` | `ConvertButton.tsx` | rendered with `convertedClientId` prop | ✓ WIRED | Present for both registration and enquiry record types (shared `record.convertedClientId` field). |
| `clients/[id]/notes/route.ts` | `schema.ts` | insert `crmNotes` with `recordType: "client"` | ✓ WIRED | |
| `admin/clients/[id]/page.tsx` | `client-query.ts` | `getClientById(numId)` | ✓ WIRED | |
| `admin/clients/[id]/page.tsx` | `ClientForm.tsx` | edit mode with `clientId` + `initial` | ✓ WIRED | |
| `ClientNoteForm.tsx` | `clients/[id]/notes/route.ts` | fetch POST `/notes` | ✓ WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `ClientsTable` | `records` prop | `getClients()` → live `db.select().from(clients)` | Yes — real DB query, no static fallback | ✓ FLOWING |
| `admin/clients/[id]/page.tsx` (details + notes) | `client`, `notes` | `getClientById()` + direct `db.select().from(crmNotes)` | Yes — both are live queries | ✓ FLOWING |
| `crm/[id]/page.tsx` (Convert/View Client) | `record.convertedClientId` | Direct `db.select()` from `clientRegistrations`/`contactEnquiries` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

`npx tsc --noEmit` — clean, no errors.
`npx vitest run` — 32 test files pass, 131 passed / 48 skipped (DB-gated, require `NETLIFY_DB_URL`) / 13 todo (DB-gated convert/edge-case assertions deferred to manual/live testing, documented in 06-VALIDATION.md).
`npx vitest run src/app/api/admin/clients src/app/api/admin/crm/[id]/convert` — 4 test files pass, 11 passed / 10 todo — non-DB guard assertions (401 unauthorized, 401-before-id-parse ordering) all pass.

Full DB-backed behavioral checks (actual insert/convert against a live database) were not re-run in this verification pass since they require `netlify dev` + `NETLIFY_DB_URL`; the 06-03 executor's own live smoke test (create+list) and the manual-verification items below cover this ground per 06-VALIDATION.md's documented strategy (DB-dependent tests intentionally gate on `NETLIFY_DB_URL` and are not part of the fast local suite).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLIENT-01 | 06-01, 06-02, 06-03 | Owner can create a client record manually | ✓ SATISFIED | POST route + validation + ClientForm create mode + `/admin/clients/new` page, all wired. |
| CLIENT-02 | 06-01, 06-04 | Owner can convert an enquiry/registration into a client, carrying over details | ✓ SATISFIED | Atomic `withTxDb` convert route with correct field mapping for both record types + 409 idempotency + ConvertButton UI. |
| CLIENT-03 | 06-01, 06-02, 06-03 | Owner can view a list of clients, visually separated from leads | ✓ SATISFIED | Separate `/admin/clients` route/page/table/nav entry; CRM leads page has zero references to clients. Full visual confirmation is a manual/human item per 06-VALIDATION.md (layout/visual, not unit-testable) but the code-level separation is unambiguous. |
| CLIENT-04 | 06-01, 06-02, 06-05 | Owner can open and edit an individual client's details | ✓ SATISFIED | GET/PUT routes + detail page with inline ClientForm (edit mode, no status lock) + `notFound()` on unknown id. |
| CLIENT-05 | 06-01, 06-05 | Owner can add private notes to a client (same machinery as leads) | ✓ SATISFIED | `crm_notes` reused via `recordType: "client"`, no schema change; notes route + ClientNoteForm + ordered notes list on detail page. |

No orphaned requirements — REQUIREMENTS.md lists CLIENT-06 (Phase 8, history view) and CLIENT-07 (deferred, self-service portal) as out of scope for this phase, matching the phase's declared requirement IDs (CLIENT-01..05 only). All 5 IDs appear in at least one plan's frontmatter and are cross-referenced above.

### Anti-Patterns Found

None. Scanned all Phase 6 files modified across the five plans (schema, migration, types, query layer, API routes, forms, table/list/detail pages, sidebar) for `TODO|FIXME|XXX|HACK|PLACEHOLDER`, "not yet implemented", "coming soon" — zero matches. No stub returns (`return <div>Component</div>`, empty handlers, static-empty JSON) found in any of the reviewed files.

### Human Verification Required

### 1. Visual separation of Clients vs Leads lists

**Test:** Load `/admin/clients` and `/admin/crm` side by side under `netlify dev`.
**Expected:** Clients list shows no status column/badges (clients have no lifecycle status); Leads list shows status pills. The two are unmistakably different sections, not a filtered view of the same table.
**Why human:** Visual/layout judgment — code-level check (separate routes, separate components, separate DB table) is confirmed, but "visually separate" as experienced by the owner is a UX judgment call.

### 2. End-to-end convert flow against a live database

**Test:** Convert a real enquiry and a real registration under `netlify dev`; verify the resulting client has correctly mapped fields (name, email, phone, addresses); attempt to convert the same lead again and confirm the button shows "View Client" (not a fresh convert) and a direct re-POST returns 409.
**Expected:** New client appears with source badge "From registration"/"From enquiry", correct field values, and the original lead's CRM detail page shows "View Client" linking to it.
**Why human/DB-gated:** The convert route's DB-dependent assertions are `it.todo()` locally (gated on `NETLIFY_DB_URL`, per repo convention) — this is the actual insert/transaction behavior, not exercisable without a live Postgres connection.

### 3. Client edit persistence

**Test:** Edit a client's fields on `/admin/clients/[id]` and save; refresh the page.
**Expected:** Changes persist (confirms PUT + DB write, not just client-side state).
**Why human/DB-gated:** Requires a live DB round-trip.

### 4. Notes visual parity with leads notes

**Test:** Add a note to a client and compare its rendering/timestamp format to a lead's note thread.
**Expected:** Same visual treatment (timestamp format, ordering, styling).
**Why human:** Visual parity judgment, not a structural code check (structural reuse of `crm_notes` is already confirmed).

### Gaps Summary

No gaps found. All 5 must-have observable truths verified against the actual codebase (not just SUMMARY claims): the `clients` table exists as a genuinely distinct entity with its own PK, manual creation and convert-from-lead both write through a single well-defined path (`client-query.ts`/`client-types.ts` as shared contracts, `withTxDb` for the one multi-table atomic write), editing has no artificial status lock, and notes reuse the existing `crm_notes` polymorphic table with zero schema changes. `npx tsc --noEmit` is clean and the full vitest suite passes (131 passed, 48 correctly DB-gated skips, 13 DB-gated todos deferred to human/live verification per the phase's own validation strategy). No anti-patterns, no orphaned artifacts, no broken wiring found. Remaining items (visual separation judgment, live DB round-trips) are inherently manual per 06-VALIDATION.md and are listed above for the user to spot-check, but do not block phase completion.

---

_Verified: 2026-07-04T19:15:00Z_
_Verifier: Claude (gsd-verifier)_
