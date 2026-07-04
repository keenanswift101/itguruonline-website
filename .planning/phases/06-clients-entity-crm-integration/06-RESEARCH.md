# Phase 6: Clients Entity + CRM Integration - Research

**Researched:** 2026-07-04
**Domain:** Drizzle/Postgres schema design + Next.js App Router admin CRUD, on an established internal stack (no new libraries)
**Confidence:** HIGH

## Summary

Phase 6 is pure CRUD extension of a pattern that already exists three times in this codebase (CRM leads, billing schedules, invoices). There is no new technology to evaluate — the work is: add a `clients` table (migration `0005`), add two nullable "converted" back-reference columns to the existing lead tables, build a `/admin/clients` list+detail+edit UI mirroring `/admin/crm`, reuse `crm_notes` as-is for client notes, and add a "Convert to Client" action on the existing CRM detail page. Every architectural question (auth placement, validation style, transaction rules, migration workflow, Date serialization) already has one canonical answer elsewhere in the repo — this research documents those answers so the plan copies them exactly rather than inventing new ones.

The one real design decision is **CLIENT-03's "visually separated" list**: this research recommends a new top-level `/admin/clients` route (own nav entry) rather than a tab/filter bolted onto the existing `/admin/crm` page, because clients have a genuinely different shape (company, structured address, no lead-status lifecycle) and because Phase 7/8 will hang tickets and invoices off `clients.id` — a real detail page at `/admin/clients/[id]` is needed regardless, so it should be the canonical client view from the start.

**Primary recommendation:** Add `clients` table + `converted_client_id` FK columns on `client_registrations`/`contact_enquiries` in migration `0005`; build `/admin/clients` as a peer section to `/admin/crm` (own nav link, own `client-query.ts`/`client-types.ts`/API routes) that reuses `crmNotes` with `recordType = "client"`; implement convert-from-lead as a `withTxDb` transaction (insert client + stamp `converted_client_id` on the lead) exposed as a new action on the existing `/admin/crm/[id]` detail page.

## Project Constraints (from CLAUDE.md)

These directives apply directly to Phase 6 work:

- **DB env vars**: runtime code must read `NETLIFY_DB_URL` / `NETLIFY_DB_DRIVER`, never `NETLIFY_DATABASE_URL` or a bare `@netlify/database`/`neon()` import — see `src/lib/db/index.ts`'s existing pattern, copy it exactly for any new query module.
- **Transactions**: neon-http cannot run `db.transaction()` — any multi-statement atomic write (client insert + lead stamp) MUST go through `withTxDb()` (`src/lib/db/tx.ts`).
- **Migrations**: live in `netlify/database/migrations/`, auto-applied on deploy. Next number is `0005`.
- Server components by default; `"use client"` only where state/effects are needed.
- Section/data-owning components keep their copy/data at the top of the file — not directly relevant to CRUD pages, but keep list/detail pages consistent with existing `/admin/crm` structure rather than introducing a new layout convention.
- Tailwind v4 canonical arbitrary-value syntax: `text-(--text-secondary)` etc., not `text-[var(--text-secondary)]` — all new UI must follow this (existing CRM components already do — copy their classes).
- No multi-staff roles / no CSRF-token machinery on ordinary admin CRUD routes — confirmed by grep: CSRF (`src/lib/csrf.ts`) is only wired into auth routes (login/logout/password), not into CRM/invoice/billing-schedule mutation routes. New client routes should follow the CRM/invoice precedent (session-cookie + `requireAdmin()` only), not add CSRF.
- IT-Guru is not VAT-registered — not directly relevant to clients, but keep in mind if any client-facing document text is touched later.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLIENT-01 | Manual create: name, email, phone, company, physical/postal address | `clients` table schema below has exact matching columns; `POST /api/admin/clients` pattern mirrors `billing-schedules` POST (zod + `db.insert().returning()`) |
| CLIENT-02 | Convert an enquiry/registration into a client, carrying over captured details | Field-mapping table below (registration vs enquiry → client); `withTxDb` transaction pattern from `invoices` POST route; new `converted_client_id` FK columns for idempotency + back-link |
| CLIENT-03 | Clients list visually separated from Leads list in the CRM area | Recommendation: new `/admin/clients` route + nav entry, not a tab inside `/admin/crm` — rationale in Architecture Patterns |
| CLIENT-04 | Open + edit a client | Mirrors `invoices/[id]` GET+PUT pattern (`src/app/api/admin/invoices/[id]/route.ts`) minus the draft-only write lock (clients have no status lifecycle blocking edits) |
| CLIENT-05 | Private timestamped notes reusing `crm_notes` | `crm_notes.record_type` is a plain `varchar(20)` with **no CHECK constraint or enum** (confirmed in migration `0001`) — adding `"client"` as a new value requires zero schema migration, only a TS union-type update and a route that accepts it |
</phase_requirements>

## Standard Stack

No new libraries. This phase reuses the exact stack already installed and used identically across Phases 1-5:

| Library | Version (installed) | Purpose | Why standard here |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.2 | Schema + queries | Every existing table uses this; `clients` must match its style |
| drizzle-kit | ^0.31.10 | Migration generation | `npm run db:generate` already the house workflow (0000-0004) |
| zod | ^4.4.3 | Request validation | Every mutation route (`invoices.ts`, `billing-schedules/route.ts`) validates with zod `safeParse` |
| @neondatabase/serverless / pg | ^1.1.0 / 8.22.0 | DB drivers (prod HTTP / local TCP) | Already abstracted behind `src/lib/db/index.ts` and `src/lib/db/tx.ts` — reuse, don't touch |
| next (App Router) | ^16.2.1 | Pages + route handlers | Same server-component + route-handler split as `/admin/crm` |

**No installation needed** — zero new packages for this phase.

**Version verification:** Not applicable — no new dependencies introduced. Confirmed current versions above are what `package.json` already pins (checked directly, not training-data recall).

## Architecture Patterns

### Recommended Project Structure

```
src/lib/db/schema.ts          # add `clients` table + 2 new columns on existing tables
src/lib/client-query.ts       # NEW — getClients(), getClientById() (mirrors crm-query.ts)
src/lib/client-types.ts       # NEW — ClientListItem, zod input schemas (mirrors crm-types.ts + invoices.ts)
src/app/admin/clients/
  page.tsx                    # NEW — list page (server component, requireAdmin + getClients())
  new/page.tsx                # NEW — manual-create form page
  [id]/page.tsx                # NEW — detail + edit + notes (mirrors crm/[id]/page.tsx + invoices/[id]/page.tsx)
src/components/admin/clients/
  ClientsTable.tsx             # NEW — mirrors CrmTable.tsx (search/filter table)
  ClientForm.tsx                # NEW — create/edit form, mirrors InvoiceForm.tsx client-detail fields
src/app/api/admin/clients/
  route.ts                    # NEW — GET list, POST create
  [id]/route.ts                # NEW — GET one, PUT edit
  [id]/notes/route.ts          # NEW — POST note (recordType hardcoded "client", reuses crmNotes table)
src/app/api/admin/crm/[id]/convert/route.ts   # NEW — POST convert lead → client (lives under existing crm/[id] namespace since it acts on a lead)
netlify/database/migrations/0005_clients.sql  # NEW — generated via `npm run db:generate`, hand-reviewed
```

### Pattern 1: New `clients` table (fits existing schema.ts style)

**What:** A dedicated table, not a status flag, per the locked PROJECT.md decision. Columns match CLIENT-01 exactly, plus fields Phase 7/8 need (a stable `id` for `tickets.client_id` / `invoices.client_id` FKs) and a source/back-link pair for CLIENT-02.

```typescript
// Source: pattern copied from existing clientRegistrations/billingSchedules
// in src/lib/db/schema.ts (same file, add alongside them)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull().default(""),
  company: varchar("company", { length: 200 }).notNull().default(""),
  physicalAddress: text("physical_address").notNull().default(""),
  postalAddress: text("postal_address").notNull().default(""),
  // "manual" | "from_registration" | "from_enquiry" — provenance, CLIENT-02
  source: varchar("source", { length: 20 }).notNull().default("manual"),
  // Nullable back-link to the lead this client was converted from, if any.
  // No FK constraint needed (recordType/id pair, like crmNotes) — the lead
  // row keeps its own converted_client_id pointing the other way (see below).
  sourceRecordType: varchar("source_record_type", { length: 20 }), // "registration" | "enquiry" | null
  sourceRecordId: integer("source_record_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

**Why no `unique()` on `email`:** the milestone's Out of Scope list explicitly defers "Client merge/dedupe tooling — not needed at current volume." A unique constraint would make CLIENT-02 fail whenever a lead's email already matches an existing client (a realistic case — same person enquires twice). Leave it unconstrained; dedupe is future work.

**Two new columns on the existing lead tables** (for CLIENT-02 idempotency + reverse lookup — "has this lead already been converted?"):

```typescript
// ALTER on clientRegistrations and contactEnquiries
convertedClientId: integer("converted_client_id").references(() => clients.id, { onDelete: "set null" }),
```

This is the only schema change to the two v2.0 lead tables. It's additive and nullable — zero risk to existing rows/behavior.

**Readiness for Phase 7/8:** `clients.id` (serial, `pgTable` default `references()` target) is exactly the FK shape `tickets.client_id` and `invoices.client_id` will need (`integer(...).references(() => clients.id, ...)`), matching how `invoiceLineItems.invoiceId` and `billingSchedules.packageId` already reference other tables in this schema.

### Pattern 2: `crm_notes` reuse for CLIENT-05 — no table change needed

`crm_notes.record_type` is `varchar(20) NOT NULL` with **no CHECK constraint, no Postgres enum, no DB-level restriction** — confirmed by reading migration `0001_nosy_lady_mastermind.sql` directly (the comment in `schema.ts` — `// "registration" | "enquiry"` — is a TypeScript-only convention, not enforced in the database). This means:

- Zero migration required to store `record_type = "client"` rows.
- Only TS-level changes: extend the type union (new `CrmRecordType`-equivalent for clients, or a shared `RecordType = "registration" | "enquiry" | "client"`), and a new route `POST /api/admin/clients/[id]/notes` that inserts with `recordType: "client"` (copy `src/app/api/admin/crm/[id]/notes/route.ts` almost verbatim — same XSS-stripping, same 5000-char clamp, same `.returning()`).
- Reading notes for the detail page: `db.select().from(crmNotes).where(and(eq(crmNotes.recordType, "client"), eq(crmNotes.recordId, clientId))).orderBy(asc(crmNotes.createdAt))` — identical query shape to `crm/[id]/page.tsx`.

### Pattern 3: Convert-from-lead (CLIENT-02) — field mapping + atomic write

**Field mapping (recommend exact mapping, no alternatives to weigh — this is mechanical):**

| Client field | From `client_registrations` | From `contact_enquiries` |
|---|---|---|
| `name` | `` `${firstName} ${surname}`.trim() `` | `name` |
| `email` | `email` | `email` |
| `phone` | `cellPhone` | `phone ?? ""` |
| `company` | `""` (no source field — owner fills in via edit) | `""` |
| `physicalAddress` | `physicalAddress` | `""` (enquiries never capture an address) |
| `postalAddress` | `postalAddress` | `""` |
| `source` | `"from_registration"` | `"from_enquiry"` |
| `sourceRecordType` / `sourceRecordId` | `"registration"` / `reg.id` | `"enquiry"` / `enq.id` |

**Should the lead be marked converted?** Yes — stamp `converted_client_id` on the lead row inside the same transaction. This (a) prevents accidental double-conversion (check `if (existing.convertedClientId) return 409` before inserting), and (b) lets the CRM detail page show "Already converted → [View Client]" instead of a dead "Convert" button. The original lead's `status` field is left untouched — no requirement asks for that, and changing it silently would conflict with the existing lead-status lifecycle (`new`/`contacted`/`in_progress`/`completed`) which means something different.

**Transaction requirement:** this is a two-table write (insert into `clients`, update `client_registrations`/`contact_enquiries`) — per the CRITICAL DB rule, this MUST use `withTxDb()`, exactly like the invoice-create route's `invoice` + `invoiceLineItems` atomic insert:

```typescript
// Source: pattern copied from src/app/api/admin/invoices/route.ts POST handler
const client = await withTxDb((db) =>
  db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ convertedClientId: leadTable.convertedClientId })
      .from(leadTable)
      .where(eq(leadTable.id, leadId));
    if (existing?.convertedClientId) throw new AlreadyConvertedError();

    const [newClient] = await tx.insert(clients).values({ /* mapped fields */ }).returning();

    await tx
      .update(leadTable)
      .set({ convertedClientId: newClient.id })
      .where(eq(leadTable.id, leadId));

    return newClient;
  })
);
```

**Route placement:** `POST /api/admin/crm/[id]/convert` (using the existing `encodeCrmId`/`parseCrmId` — the id param is already `"registration-5"` or `"enquiry-12"`), triggered by a new "Convert to Client" button on `src/app/admin/crm/[id]/page.tsx` next to the existing `StatusSelect`. On success, redirect to `/admin/clients/[newClientId]`.

### Pattern 4: CLIENT-03 — separate `/admin/clients` section (recommendation)

Two options were weighed:

| Option | Verdict |
|---|---|
| A. New top-level `/admin/clients` route + own nav entry | **Recommended** |
| B. Tab/filter toggle inside existing `/admin/crm/page.tsx` | Rejected |

**Why A:** `CrmListItem`/`parseCrmId`/`CrmTable` are built around a two-variant union (`registration` \| `enquiry`) that share a status lifecycle (`new`/`contacted`/`in_progress`/`completed`) and near-identical fields. Clients don't share that lifecycle (CLIENT-04 is "open + edit," no status workflow requirement) and have different fields (company, split address). Forcing clients into the same `CrmListItem`/`parseCrmId` union would mean widening `CrmStatus`/`CRM_STATUSES` with meaningless values for clients, or making half the fields on `CrmListItem` optional — both degrade the existing, working leads code for no benefit. A clean parallel module (`client-query.ts`, `client-types.ts`, `/admin/clients/*`) costs a small amount of duplication but keeps both entities simple and matches how `billingSchedules`/`invoices` are already separate modules from `crm-query.ts` despite living in the same admin portal. Add `{ href: "/admin/clients", label: "Clients" }` to `navLinks` in `AdminSidebar.tsx`, positioned right after `"/admin/crm"`.

**Minor existing-code smell to avoid repeating:** `src/app/api/admin/crm/route.ts` currently duplicates the exact query logic already in `src/lib/crm-query.ts`'s `getMergedCrmRecords()` instead of calling it. For the new client routes, have **both** `admin/clients/page.tsx` and `api/admin/clients/route.ts` call a single `getClients()` in `client-query.ts` — don't repeat the duplication pattern.

### Anti-Patterns to Avoid

- **Don't add a CHECK constraint or Postgres enum to `crm_notes.record_type`.** It's intentionally a free-form varchar; adding a constraint now would require a migration touching the two existing lead-record-type values too, for no benefit (validation already happens in TS at the route level).
- **Don't make `clients.email` unique.** See Pattern 1 rationale — duplicate-client tolerance is an explicit out-of-scope decision, not an oversight.
- **Don't call `db.transaction()` directly on the default `db` export for the convert action** — it will throw at runtime on the deployed neon-http driver even though it may work locally against `netlify dev`'s node-postgres branch. Always go through `withTxDb()`.
- **Don't pass raw Drizzle `Date` objects as props into a `"use client"` table/form component.** Convert `createdAt`/`updatedAt` to ISO strings in the server component or query layer first (see Common Pitfalls).

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Request validation | Manual `if (!body.name) ...` chains | `zod` `safeParse` (already the house pattern in `invoices.ts`, `billing-schedules/route.ts`) | Consistent 422 shape (`{ error, fields }`) the frontend already expects |
| Atomic multi-table write | Sequential `await db.insert()` then `await db.update()` with no rollback | `withTxDb()` + `tx.transaction()` | Exactly the documented CRITICAL rule; a partial convert (client created, lead not stamped) would let the owner convert the same lead twice |
| Migration SQL | Hand-writing `CREATE TABLE`/`ALTER TABLE` from scratch | `npm run db:generate` (drizzle-kit) after editing `schema.ts`, then hand-review the diff | Matches how migrations `0000`-`0004` were produced; drizzle-kit correctly diffs against `meta/_journal.json` snapshots so column order/types stay consistent |

**Key insight:** there is nothing in this phase that needs a new abstraction — the risk is entirely in *not* reusing what's there (e.g., building a separate ad-hoc notes table instead of `crm_notes`, or a bespoke session check instead of `requireAdmin()`).

## Common Pitfalls

### Pitfall 1: Passing Drizzle `Date` fields straight to a client component
**What goes wrong:** Next.js server components can pass complex data to Client Components, but a raw JS `Date` object is not guaranteed serializable across the RSC boundary the same way a plain string is, and every existing list adapter in this codebase converts explicitly.
**Why it happens:** `db.select()` returns `createdAt`/`updatedAt` as native `Date` objects (timestamp columns), but `CrmListItem.createdAt` is typed `string` and `crm-query.ts` explicitly does `r.createdAt.toISOString()` before building the list item.
**How to avoid:** In `client-query.ts`, convert every `Date` field to `.toISOString()` before returning `ClientListItem[]`, exactly like `getMergedCrmRecords()`.
**Warning signs:** TypeScript happily compiles a `Date` prop but the rendered table shows `[object Object]` or a hydration mismatch warning in dev.

### Pitfall 2: Forgetting `withTxDb` for the convert action
**What goes wrong:** Using the default `db` export's `db.transaction()` for the client-insert + lead-stamp write throws `"No transactions support in neon-http driver"` in production (this exact error string is called out in `src/lib/db/tx.ts`'s own comment), even though it may silently work when testing locally against `netlify dev`'s node-postgres branch — masking the bug until first production use.
**Why it happens:** Two DB drivers are branched on `NETLIFY_DB_DRIVER`; only the local dev one supports `db.transaction()` natively.
**How to avoid:** Always route multi-statement writes through `withTxDb()`, per the CRITICAL rule in STATE.md/CLAUDE.md.
**Warning signs:** Code works in `netlify dev` but 500s in the deployed function with a transaction-related error.

### Pitfall 3: Double-conversion / lost idempotency
**What goes wrong:** Without the `converted_client_id` stamp, clicking "Convert to Client" twice on the same lead silently creates two client rows with identical source data.
**Why it happens:** No requirement explicitly asks for idempotency, so it's easy to skip if only reading CLIENT-02 literally.
**How to avoid:** Add `converted_client_id` to both lead tables, check-and-throw inside the transaction if already set, and hide/disable the "Convert" button in the UI once a lead has a `convertedClientId`.
**Warning signs:** QA testing the convert button twice in a row without noticing duplicate clients appear in `/admin/clients`.

### Pitfall 4: `NETLIFY_DATABASE_URL` vs `NETLIFY_DB_URL` confusion when running `db:generate`/`db:migrate` locally
**What goes wrong:** `drizzle.config.ts` reads `process.env.NETLIFY_DATABASE_URL` (the legacy var name) for `dbCredentials.url`, which conflicts with the CRITICAL rule that runtime code must use `NETLIFY_DB_URL`.
**Why it happens:** `drizzle-kit generate` (the command this phase actually needs) diffs `schema.ts` against the local snapshot files in `netlify/database/migrations/meta/` — it does **not** need a live DB connection for `generate`, only for `push`/`migrate`/`studio`. So this mismatch is latent, not currently a blocker for Phase 6's migration-writing step, but should not be "fixed" as a drive-by change without separately verifying `netlify dev:exec` actually injects both var names (untested in this research — flagged as an open question, not a phase blocker since `db:generate` works fine either way).
**How to avoid:** Run `npm run db:generate` (no live DB needed) to produce `0005_*.sql`, then hand-review before committing. Don't attempt `db:migrate` locally as part of this phase unless actually testing against a local DB — production migrations auto-apply on deploy per existing convention.

## Code Examples

### Manual create route (CLIENT-01) — mirrors `billing-schedules` POST exactly
```typescript
// Source: pattern from src/app/api/admin/billing-schedules/route.ts (existing file)
const CreateClientSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  physicalAddress: z.string().trim().max(5000).optional().or(z.literal("")),
  postalAddress: z.string().trim().max(5000).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = CreateClientSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const [client] = await db.insert(clients).values({ ...parsed.data, source: "manual" }).returning();
  return NextResponse.json({ client }, { status: 201 });
}
```

### Notes reuse (CLIENT-05) — mirrors `crm/[id]/notes/route.ts` exactly
```typescript
// Source: src/app/api/admin/crm/[id]/notes/route.ts, adapted for a numeric client id
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isInteger(clientId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let json: { body?: string };
  try { json = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const text = (json.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Note body required" }, { status: 422 });

  const clean = text.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").slice(0, 5000);

  const [note] = await db
    .insert(crmNotes)
    .values({ recordType: "client", recordId: clientId, body: clean })
    .returning();

  return NextResponse.json({ note }, { status: 201 });
}
```

## Open Questions

1. **Does `netlify dev:exec drizzle-kit migrate` actually need `NETLIFY_DATABASE_URL` to be set locally, or does Netlify's CLI alias it from `NETLIFY_DB_URL`?**
   - What we know: `drizzle.config.ts` hardcodes `NETLIFY_DATABASE_URL`; runtime code deliberately avoids that var name per the CRITICAL rule.
   - What's unclear: whether this has ever actually been exercised successfully, or whether `db:migrate`/`db:studio` currently work at all locally.
   - Recommendation: not a Phase 6 blocker — `db:generate` (the only command this phase needs) doesn't touch a live connection. Flag for the planner to add a quick manual check (`npm run db:generate` succeeds) rather than assume; don't attempt to fix the config mismatch as a drive-by.

2. **Should `company`/address fields be required or optional on manual create?**
   - What we know: CLIENT-01 lists "name, email, phone, company, physical/postal address" without marking any optional.
   - What's unclear: whether the owner wants all fields mandatory at creation (a walk-in client with only a name and phone, no email yet, is plausible for an IT support business).
   - Recommendation: require `name` + `email` (matches every other entity in this codebase — registrations and enquiries both require email), leave `phone`/`company`/addresses optional with empty-string defaults, editable later via CLIENT-04. This is a Claude's-discretion-style call the planner should confirm with the user if not already settled — no CONTEXT.md exists for this phase, so it was not pre-decided.

## Validation Architecture

### Test Framework
| Property | Value |
|---|---|
| Framework | Vitest ^4.1.9 |
| Config file | `vitest.config.ts` (root) — `environment: "node"`, includes `src/**/*.test.ts` |
| Quick run command | `npx vitest run src/app/api/admin/clients` (path-scoped) |
| Full suite command | `npm test` (= `vitest run`) |

Existing convention (seen in `crm/[id]/notes/route.test.ts`): non-DB guard tests (401/422 paths) always run; DB-dependent tests are gated behind `describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip`. New client route tests should follow this exact split.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| CLIENT-01 | POST /api/admin/clients creates a client with required fields, 401 without session, 422 on bad email | unit (route) | `npx vitest run src/app/api/admin/clients/route.test.ts` | ❌ Wave 0 |
| CLIENT-02 | Convert route maps fields correctly per source type, is idempotent (409 on re-convert), atomic (both writes or neither) | unit (route) + DB-gated | `npx vitest run src/app/api/admin/crm/[id]/convert/route.test.ts` | ❌ Wave 0 |
| CLIENT-03 | `/admin/clients` list renders separately from `/admin/crm`, nav link present | manual (Playwright screenshot per CLAUDE.md's Reveal caveat is N/A here — plain table, no IntersectionObserver) | manual visual check | ❌ Wave 0 (no e2e harness in repo) |
| CLIENT-04 | GET/PUT `/api/admin/clients/[id]` — 404 on unknown id, edit persists | unit (route) | `npx vitest run src/app/api/admin/clients/[id]/route.test.ts` | ❌ Wave 0 |
| CLIENT-05 | POST notes with `recordType: "client"` stores + retrieves correctly, XSS-strip behavior matches existing note route | unit (route), copy assertions from `crm/[id]/notes/route.test.ts` | `npx vitest run src/app/api/admin/clients/[id]/notes/route.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** path-scoped `npx vitest run <changed-route>.test.ts`
- **Per wave merge:** `npm test` (full suite — cheap, whole suite is fast per existing Phase 4/5 velocity notes)
- **Phase gate:** full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/admin/clients/route.test.ts` — covers CLIENT-01
- [ ] `src/app/api/admin/clients/[id]/route.test.ts` — covers CLIENT-04
- [ ] `src/app/api/admin/clients/[id]/notes/route.test.ts` — covers CLIENT-05 (can copy `crm/[id]/notes/route.test.ts` almost line-for-line)
- [ ] `src/app/api/admin/crm/[id]/convert/route.test.ts` — covers CLIENT-02
- No new fixtures/framework needed — Vitest is already configured and the `describeIfDb` gating pattern is established.

## Sources

### Primary (HIGH confidence — direct repo inspection, not training-data recall)
- `src/lib/db/schema.ts` — all existing table definitions, column/FK/timestamp conventions
- `netlify/database/migrations/0001_nosy_lady_mastermind.sql` — confirmed `crm_notes.record_type` has no CHECK constraint
- `netlify/database/migrations/0003_invoices.sql`, `0004_automation.sql` — migration file style, FK/unique-constraint syntax
- `src/lib/crm-query.ts`, `src/lib/crm-types.ts` — merged-list pattern, Date→ISO-string serialization, `encodeCrmId`/`parseCrmId`
- `src/app/admin/crm/page.tsx`, `src/app/admin/crm/[id]/page.tsx` — list/detail server-component pattern
- `src/components/admin/crm/CrmTable.tsx`, `NoteForm.tsx`, `StatusSelect.tsx` — client-component mutation pattern (fetch + `router.refresh()`)
- `src/app/api/admin/crm/[id]/notes/route.ts`, `.../status/route.ts`, `.../crm/route.ts` — requireAdmin + validation + response shape
- `src/app/api/admin/billing-schedules/route.ts` — zod `CreateSchema` + FK-existence pre-check pattern
- `src/app/api/admin/invoices/route.ts`, `.../invoices/[id]/route.ts` — `withTxDb` transaction pattern, draft-only write-lock pattern (not needed for clients, but the transaction shape is)
- `src/lib/db/tx.ts`, `src/lib/db/index.ts` — driver branching, CRITICAL env var rule, transaction constraint
- `src/lib/auth.ts` — `requireAdmin()` implementation and dev-bypass conditions
- `src/components/admin/AdminSidebar.tsx` — nav link structure for adding a "Clients" entry
- `drizzle.config.ts`, `package.json` scripts — migration generation workflow
- `vitest.config.ts`, `crm/[id]/notes/route.test.ts` — test framework config and `describeIfDb` gating convention
- Grep across `src/app/api/admin` for `csrf` — confirmed CSRF is only used on auth routes, not CRM/invoice/billing mutation routes

### Secondary / Tertiary
None used — no WebSearch/Context7 needed for this phase; everything is internal-pattern research.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all versions read directly from `package.json`
- Architecture: HIGH — every pattern cross-referenced against an existing, working file in this exact repo
- Pitfalls: HIGH — all four pitfalls are grounded in code/comments actually present in the repo (not speculative)

**Research date:** 2026-07-04
**Valid until:** No expiry concern — this research is about the codebase's own established conventions, not an external/fast-moving ecosystem. Re-validate only if `src/lib/db/tx.ts`, `crm-query.ts`, or the migration workflow change before Phase 6 is planned/executed.
