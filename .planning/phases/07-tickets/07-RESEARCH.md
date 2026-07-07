# Phase 7: Tickets - Research

**Researched:** 2026-07-07
**Domain:** In-repo CRUD feature (Next.js App Router + Drizzle/Neon Postgres), mirroring existing Clients (Phase 6) and Quotations (Phase 10) patterns.
**Confidence:** HIGH — this is a same-stack, same-conventions feature; every pattern below is copied from code already in this repo, not from external docs.

## Summary

Phase 7 adds a `tickets` table (migration `0008`) with a `client_id` FK (NOT NULL — a ticket must belong to a client per the phase goal), status/priority enums as `varchar`, and reuses `crm_notes` with a new `recordType: "ticket"` value for follow-up notes (TICKET-03) — no schema change needed for notes, exactly like Phase 6 did for `recordType: "client"`. The admin CRUD surface (list/create/detail, status-change route, notes route) is a structural mirror of the Clients feature (Phase 6) combined with the status-transition-map + filtered-list-with-badges pattern from Quotations (Phase 10). The one already-built integration point is the client detail page's tickets seam (`src/app/admin/clients/[id]/page.tsx` line 112) — a sibling `<Card>` to the existing Invoices card, fed by a new `getClientTickets()` query function mirroring `getClientInvoices()`.

**Primary recommendation:** Build tickets as a near-literal copy of the Clients feature's file layout (schema table → types/zod schema → query layer → API routes → list/detail pages), swap in Quotations' `ALLOWED_TRANSITIONS` + `STATUS_BADGE` status-map pattern for the open→in-progress→resolved lifecycle, and reuse `crm_notes` + `ClientNoteForm`'s structure verbatim for ticket notes (new recordType, no schema change).

## User Constraints

No CONTEXT.md exists for this phase (not found in `.planning/phases/07-tickets/`). Constraints below are sourced from REQUIREMENTS.md, STATE.md, and PROJECT.md (all read in full).

### Locked Decisions (from PROJECT.md / STATE.md)
- Tickets are a NEW table, linked to clients via `client_id` FK (not a status flag on an existing entity).
- Ticketing is built in-portal (no external helpdesk integration — explicitly rejected in REQUIREMENTS.md Out of Scope).
- No time tracking / billing-by-hours on tickets (status tracking only).
- No SLA / due-date tracking, no email notifications on status change (both explicitly deferred: TICKET-06, TICKET-07).
- Single-admin only — no assignment/ownership fields needed.
- Builds entirely on the existing v2.0/v2.1 stack (Neon/Drizzle, `requireAdmin`, existing CRM/invoicing patterns) — no new external services.
- Next migration number is `0008` (0000 initial → 0007 quotations, confirmed via `netlify/database/migrations/` listing).
- The client detail page (`src/app/admin/clients/[id]/page.tsx`) has an explicit seam comment (line 112: `{/* Phase 7: <Card className="mb-8"><h2>Tickets</h2>…</Card> goes here. */}`) that this phase must fill — this is the tickets half of CLIENT-06.

### Claude's Discretion
- Exact priority set (recommend `low` / `medium` / `high`).
- Exact status varchar length (recommend `varchar(12)` — `in-progress` is 11 chars, `in_progress` matching the CRM convention is also 11 chars; either fits in 12 with headroom, mirroring how quotations used `varchar(10)` for its 8-char worst case).
- Whether resolved→open is allowed as a "reopen" transition (recommend yes, mirroring quotations' `declined→sent` reopen pattern).
- List ordering tie-breaker after status grouping (recommend priority desc, then most-recently-updated).
- Whether ticket subject/description have max lengths (recommend mirroring `contactEnquiries.subject` at 200 chars, description as unbounded `text`).

### Deferred Ideas (OUT OF SCOPE — ignore completely)
- TICKET-06: Email notifications to the client on status change.
- TICKET-07: SLA/due-date tracking, overdue reminders.
- CLIENT-07: Client-facing self-service portal (clients viewing their own tickets).
- Multi-staff logins / ticket assignment.
- External helpdesk integration.
- Time tracking / billing tickets by hours.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TICKET-01 | Create a support ticket linked to a client, with subject, description, priority | `tickets` table schema below (client_id NOT NULL FK, subject varchar(200), description text, priority varchar). Create route/form mirror `src/app/api/admin/clients/route.ts` POST + `ClientForm.tsx`, using `ClientPicker` (required, not optional) for client selection. |
| TICKET-02 | Set and update ticket status (open → in-progress → resolved) | Status-transition-map pattern copied from `src/lib/quotation-status.ts` (`ALLOWED_TRANSITIONS`), status-change route mirrors `src/app/api/admin/quotations/[id]/status/route.ts`, UI mirrors `src/components/admin/crm/StatusSelect.tsx` (scheme-dark select + toast). |
| TICKET-03 | Follow-up notes/updates over time | Reuse `crm_notes` table with `recordType: "ticket"` (no schema change — column has no CHECK constraint). Notes route mirrors `src/app/api/admin/clients/[id]/notes/route.ts` verbatim (same HTML-stripping, same 5000-char cap). Chronological display mirrors the client detail page's notes block (`asc(crmNotes.createdAt)`). |
| TICKET-04 | List all tickets, filterable by status, open first | List page mirrors `src/app/admin/quotations/page.tsx` (searchParams status filter + `FILTER_LINKS` badges), with an ORDER BY that groups open/in-progress before resolved (see Architecture Patterns below for the exact SQL approach). |
| TICKET-05 | Detail view: client, priority, status, note history | Detail page mirrors `src/app/admin/clients/[id]/page.tsx` structure: header (subject/client link), a details Card (priority/status/description), a StatusSelect-equivalent, and a Notes Card identical in shape to the client detail page's notes block. |
| CLIENT-06 (tickets half) | Client detail page shows linked tickets | New `getClientTickets(clientId)` in `src/lib/client-query.ts` (mirrors `getClientInvoices`), rendered in the seam at `src/app/admin/clients/[id]/page.tsx` line 112 as a sibling `<Card>` to the Invoices card. |

## Standard Stack

No new libraries needed — this phase is 100% built on the existing stack already used by Clients (Phase 6) and Quotations (Phase 10).

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.2 | Schema + queries for the new `tickets` table | Already the project's only DB layer; verified in `package.json` |
| drizzle-kit | ^0.31.10 | Generates migration `0008` from schema.ts diff | `npm run db:generate` already wired; used for every prior migration (0005 clients, 0006 invoice link, 0007 quotations) |
| zod | (existing, used in `client-types.ts`/route validation) | `CreateTicketSchema` / `UpdateTicketSchema` request validation | Matches `CreateClientSchema` pattern exactly |
| next/navigation, next/link | Next.js 16 built-in | Redirects, back-links | Already used throughout `src/app/admin/**` |

### Supporting
No supporting libraries beyond what's already installed. No new npm packages required for this phase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `crm_notes` for ticket notes | A dedicated `ticket_notes` table | Rejected — `crm_notes` was explicitly designed with a generic `recordType`/`recordId` pair precisely so future record types (tickets) could reuse it without a schema change; the phase goal explicitly says "reuse crm_notes" |
| `client_id` NOT NULL | `client_id` nullable (mirroring invoices/quotations' optional link) | Rejected — the phase goal is explicit: "create a ticket linked to a client" is the only creation path (no free-text/one-off ticket concept exists, unlike invoices where a one-off client was a real deferred-migration concern). NOT NULL is correct here. |

**Installation:** None — no new packages.

**Version verification:** Not applicable (no new dependency added). Existing versions already verified in `package.json` (drizzle-orm ^0.45.2, drizzle-kit ^0.31.10, vitest ^4.1.9) — these are the versions currently installed and building successfully in the repo as of Phase 10.

## Architecture Patterns

### Recommended Project Structure

```
src/lib/db/schema.ts                                   # add `tickets` table (mirrors clients/quotations shape)
netlify/database/migrations/0008_tickets.sql            # generated via `npm run db:generate`
src/lib/ticket-types.ts                                 # TicketListItem, TicketPickerN/A, CreateTicketSchema, UpdateTicketSchema (mirrors client-types.ts)
src/lib/ticket-status.ts                                # ALLOWED_TRANSITIONS, STATUS_BADGE, PRIORITY_BADGE (mirrors quotation-status.ts)
src/lib/ticket-query.ts                                 # getTickets(), getTicketById(), getClientTickets(clientId) (mirrors client-query.ts)
src/lib/crm-types.ts                                    # EXTEND: recordType union or just hardcode "ticket" literal in the notes route (see Pitfall below)
src/app/api/admin/tickets/route.ts                      # GET (list) + POST (create)
src/app/api/admin/tickets/[id]/route.ts                 # GET (detail) + PUT (edit subject/description/priority)
src/app/api/admin/tickets/[id]/status/route.ts           # PATCH (status transition)
src/app/api/admin/tickets/[id]/notes/route.ts            # POST (add note) — mirrors clients/[id]/notes/route.ts
src/app/admin/tickets/page.tsx                          # list + status filter (mirrors quotations/page.tsx)
src/app/admin/tickets/new/page.tsx                      # create form (mirrors clients/new/page.tsx)
src/app/admin/tickets/[id]/page.tsx                      # detail view (mirrors clients/[id]/page.tsx)
src/components/forms/TicketForm.tsx                      # create form, ClientPicker (required) + subject/description/priority
src/components/admin/tickets/TicketStatusSelect.tsx       # mirrors StatusSelect.tsx but ticket-specific route + ALLOWED_TRANSITIONS-filtered options
src/components/admin/tickets/TicketNoteForm.tsx           # near-identical copy of ClientNoteForm.tsx, posts to tickets/[id]/notes
src/components/admin/AdminSidebar.tsx                    # EDIT: add { href: "/admin/tickets", label: "Tickets" } nav entry
src/app/admin/clients/[id]/page.tsx                      # EDIT: fill the Phase-7 seam (line 112) with a Tickets Card
```

### Pattern 1: Reuse `crm_notes` for a new `recordType` (TICKET-03)
**What:** `crmNotes` table already has `recordType: varchar(20)` with no DB-level CHECK constraint — it's a plain string, currently holding `"registration" | "enquiry" | "client"` values in practice (only `"registration"` and `"enquiry"` are in the `CrmRecordType` TS union in `src/lib/crm-types.ts`; `"client"` was added by Phase 6 as a hardcoded string literal directly in the notes route, NOT added to the `CrmRecordType` union — see `06-05` decision in STATE.md: "Client notes route hardcodes recordType='client' string literal directly (no CrmRecordType union change needed)").
**When to use:** Any time a new admin entity needs simple chronological notes.
**Example:**
```typescript
// Source: src/app/api/admin/clients/[id]/notes/route.ts (existing code, verified)
const [note] = await db
  .insert(crmNotes)
  .values({
    recordType: "ticket",   // new hardcoded literal, same pattern as "client"
    recordId: ticketId,
    body: clean,
  })
  .returning();
```
**Recommendation:** Follow the Phase 6 precedent exactly — do NOT add `"ticket"` to the `CrmRecordType` union in `crm-types.ts` (that union is specifically for the CRM leads list's `encodeCrmId`/`parseCrmId` URL-id scheme, which tickets don't participate in). Just hardcode the string literal `"ticket"` in the new ticket notes route, matching the client notes route's approach.

### Pattern 2: Status transition map + badges (TICKET-02, TICKET-04)
**What:** A `Record<Status, Status[]>` allow-list enforced server-side in the PATCH route, checked before any write; a parallel `Record<string, {label, className}>` badge map for list/detail UI.
**When to use:** Any entity with a controlled status lifecycle (proven twice already: CRM leads' 4-state flow is looser/unguarded, but invoices and quotations both use this exact guarded pattern).
**Example:**
```typescript
// Source: src/lib/quotation-status.ts (existing code, verified) — ticket equivalent:
export type TicketStatus = "open" | "in_progress" | "resolved";

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["resolved", "open"],       // allow reverting if reopened by mistake
  resolved: ["open", "in_progress"],       // reopen a resolved ticket
};

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "text-red-400 border border-red-500/50" },
  in_progress: { label: "In Progress", className: "text-[#00aaff] border border-[#00aaff]/40" },
  resolved: { label: "Resolved", className: "text-green-400 border border-green-500/40" },
};
```
**Naming note:** Use `in_progress` (snake_case) as the DB/enum value — matches the existing `CRM_STATUSES` convention (`"in_progress"` is already used for leads in `crm-types.ts`) rather than introducing a new `"in-progress"` (hyphenated) value elsewhere in the codebase. Display label is "In Progress" either way. This also sidesteps the phase-goal's literal "in-progress" wording being a display label, not a DB value.

### Pattern 3: "Open first" list ordering (TICKET-04)
**What:** Order tickets so open/in-progress sort before resolved, matching the phase goal ("see open ones first").
**When to use:** The tickets list page query.
**Example:**
```typescript
// Drizzle doesn't have a terse CASE-WHEN sugar; use sql`` for the sort key:
import { sql, desc } from "drizzle-orm";

const rows = await db
  .select()
  .from(tickets)
  .orderBy(
    sql`CASE ${tickets.status} WHEN 'resolved' THEN 1 ELSE 0 END`, // resolved sorts last
    desc(tickets.createdAt) // then most recent first within each group
  );
```
Filtering by a specific status (via `?status=` query param, mirroring quotations) simply adds a `.where(eq(tickets.status, statusFilter))` before `.orderBy`, exactly like `src/app/admin/quotations/page.tsx`. When no filter is applied ("All"), the CASE-based ordering above satisfies "open first". When a specific status filter IS applied, the CASE ordering is moot (all rows share status) — just order by createdAt or priority.

### Pattern 4: Client detail page — filling the Phase-7 seam (CLIENT-06 tickets half)
**What:** `src/app/admin/clients/[id]/page.tsx` already has the Invoices Card built and an explicit placeholder comment at line 112 for a sibling Tickets Card.
**Example:**
```typescript
// Source: src/app/admin/clients/[id]/page.tsx (existing code) + new getClientTickets()
const clientTickets = await getClientTickets(client.id);
// ...
<Card className="mb-8">
  <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Tickets</h2>
  {clientTickets.length === 0 ? (
    <p className="text-sm text-(--text-secondary)">No tickets yet.</p>
  ) : (
    <ul className="divide-y divide-(--border-color)">
      {clientTickets.map((t) => (
        <li key={t.id} className="flex items-center justify-between py-2">
          <Link href={`/admin/tickets/${t.id}`} className="text-sm text-(--text-primary) hover:underline">
            {t.subject}
          </Link>
          <span className="text-xs text-(--text-secondary)">{t.priority} · {t.status}</span>
        </li>
      ))}
    </ul>
  )}
</Card>
```
This is a straight structural copy of the existing Invoices Card two blocks above it in the same file — same `<ul className="divide-y ...">` pattern, same empty-state copy style.

### Anti-Patterns to Avoid
- **Adding a CHECK constraint on `crm_notes.record_type`:** Would require a migration touching existing rows and break the whole point of the generic notes design. Don't do it — the column is intentionally unconstrained.
- **Making `client_id` nullable "just in case":** The phase goal and TICKET-01 wording are unambiguous — every ticket belongs to a client. Nullable would require handling a null-client UI state nothing in the requirements asks for.
- **Using `withTxDb` for ticket creation:** Ticket create is a single `INSERT` into `tickets` (no line items, no child rows) — no multi-statement atomicity need, unlike invoices/quotations (which insert a parent + line items together). Plain `db.insert(tickets)...returning()` is correct and matches the simplicity of `clients` POST.
- **Reusing `StatusSelect.tsx` directly for tickets:** It's hardcoded to `CRM_STATUSES`/`encodeCrmId` (leads-specific URL scheme). Build a small `TicketStatusSelect.tsx` sibling component instead (same shape, different constants/endpoint) — mirrors how quotations also got their own status UI rather than reusing `StatusSelect`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ticket follow-up notes storage | A new `ticket_notes` table | `crm_notes` with `recordType: "ticket"` | Explicitly directed by the phase goal; zero schema risk, proven pattern from Phase 6 |
| Status transition validation | Ad-hoc if/else chains in the route | The `ALLOWED_TRANSITIONS` map + a single lookup-and-409 guard | Already proven twice (invoices, quotations) — consistent 409 `"Invalid status transition."` error shape the frontend already knows how to toast |
| Client selection in the create form | A native `<select>` of all clients | `ClientPicker` component (`src/components/forms/ClientPicker.tsx`) | Already handles search-filtering, keyboard/click-outside close, and matches the exact visual style used in invoice/quotation forms — just make selection required (no "one-off" null option) for tickets |
| requireAdmin / route auth | A custom middleware or ad-hoc cookie check | `requireAdmin()` from `@/lib/auth` at the top of every route/page | Standard across all 30+ existing admin routes; returns a session or null, caller redirects/401s |

**Key insight:** This phase has zero net-new infrastructure decisions — every "don't hand-roll" item here is "don't rebuild what Phase 6/8/10 already built, copy it."

## Runtime State Inventory

Not applicable — this is a greenfield table addition (new `tickets` table via additive migration), not a rename/refactor/migration phase. No existing runtime state references "tickets" anywhere in the codebase to migrate.

## Common Pitfalls

### Pitfall 1: `varchar` length too tight for `"in_progress"`
**What goes wrong:** Copying `invoices.status` (`varchar(8)`) instead of `quotations.status` (`varchar(10)`) as the template would truncate/reject `"in_progress"` (11 chars) at the DB layer with an opaque Postgres error.
**Why it happens:** Skimming the wrong sibling table (invoices, whose longest status is `"draft"`/5 chars, needed only 8) instead of quotations (which already had to solve the "longer status string" problem for `"declined"`/8 chars and specifically chose `varchar(10)` for headroom).
**How to avoid:** Use `varchar(12)` or larger for `tickets.status` — `"in_progress"` is exactly 11 characters, so 12 gives 1 char of headroom (matching the margin quotations kept: `varchar(10)` for an 8-char max value).
**Warning signs:** A Drizzle/Postgres insert error mentioning value too long for type character varying(N) during manual testing of the in-progress transition.

### Pitfall 2: Forgetting `client_id` FK direction and cascade behavior
**What goes wrong:** Using `onDelete: "cascade"` on `tickets.clientId` would silently delete all of a client's tickets if the client record is ever deleted — likely not desired for an audit-trail-style entity like tickets (support history should probably survive even if a client record is later removed, or at minimum this needs an explicit decision).
**Why it happens:** Copying `invoiceLineItems.invoiceId`'s `onDelete: "cascade"` (correct there — line items are meaningless without their parent invoice) instead of `invoices.clientId`'s `onDelete: "set null"` (correct there — an invoice should survive its client being deleted).
**How to avoid:** Mirror `invoices.clientId` / `quotations.clientId`'s `onDelete: "set null"` behavior — BUT since `tickets.client_id` must be NOT NULL per this phase's design (no free-text ticket concept), `set null` is invalid SQL for a NOT NULL column. Recommend `onDelete: "restrict"` (default Postgres behavior, or `"no action"`) so a client with open tickets cannot be deleted until its tickets are dealt with — surface this as an explicit decision point for the planner rather than silently picking cascade.
**Warning signs:** None yet in this codebase — clients currently have no delete route at all (CLIENT-04 is edit only, no delete requirement exists in REQUIREMENTS.md), so this FK constraint may never actually be exercised. Still worth setting correctly since Drizzle requires an explicit `.references()` call either way.

### Pitfall 3: Date serialization across the server/client component boundary
**What goes wrong:** Passing a raw `Date` object (e.g., `ticket.createdAt`, `ticket.resolvedAt`) from a server component or API route straight into a client component prop causes a Next.js serialization warning/error, or renders as a giant ISO string with millisecond noise inconsistently.
**Why it happens:** Drizzle's `timestamp` columns return native `Date` objects; the project's established fix (used in `client-query.ts`'s `getClients()` and `getClientInvoices()`) is to `.toISOString()` every timestamp field in the query-layer mapping function before it crosses into a list-item/summary type.
**How to avoid:** In `ticket-query.ts`, map every `Date` field (`createdAt`, `updatedAt`, `resolvedAt`) to `.toISOString()` (or leave Postgres `date`-type fields, if any, as-is since Drizzle already returns those as plain strings — see `ClientInvoiceSummary`'s comment on `issueDate`/`dueDate`).
**Warning signs:** React console warning about passing Date objects as props, or a hydration mismatch on the tickets list/detail page.

### Pitfall 4: `requireAdmin()` guard-order in tests
**What goes wrong:** Writing a test asserting a 404 for a non-numeric ticket id without a session cookie, expecting the id-validation error — but `requireAdmin()` always runs first in every route in this codebase, so the actual response is 401, not 400/404.
**Why it happens:** Assuming validation-before-auth ordering, which is NOT this codebase's convention.
**How to avoid:** Follow the confirmed convention from `src/app/api/admin/clients/[id]/notes/route.test.ts`: "returns 401 (guard fires before id parsing) for a non-numeric client id" — mirror this exact test shape for ticket routes (401 for all unauthenticated cases, regardless of what else is wrong with the request).
**Warning signs:** A failing test expecting 400/404 that actually receives 401.

### Pitfall 5: Native `<select>` styling on dark background
**What goes wrong:** A plain `<select>` for ticket priority/status renders with a white dropdown background on some browsers/OSes against the site's dark theme, making options unreadable.
**Why it happens:** Native select popups don't inherit page CSS custom properties by default.
**How to avoid:** Always add `scheme-dark` to the `<select>` className alongside the existing `bg-(--bg-primary) text-(--text-primary)` classes, exactly as `StatusSelect.tsx` already does (`className="... scheme-dark focus:outline-none ..."`). Apply to both the ticket status select and the priority select (create form + any inline priority-edit control).
**Warning signs:** Visual QA on Windows/Chrome shows a white-background native dropdown popup that clashes with the dark theme.

### Pitfall 6: Toast + `router.refresh()` ordering
**What goes wrong:** Calling `router.refresh()` before showing the toast, or forgetting `router.refresh()` entirely after a mutation, leaves the page showing stale server-rendered data (e.g., ticket list not reflecting a just-added note or status change) even though the toast claims success.
**Why it happens:** Easy to copy the fetch/toast logic but skip the refresh call when adapting `ClientNoteForm`/`StatusSelect` for tickets.
**How to avoid:** Always call `toast.success(...)` then `router.refresh()` in that order (matches both `ClientNoteForm.tsx` and `StatusSelect.tsx` exactly) after every successful mutation (create note, change status, edit ticket).
**Warning signs:** Manual QA shows a success toast but stale data until a manual page reload.

## Code Examples

### Ticket table schema (add to `src/lib/db/schema.ts`, after `quotationLineItems`)
```typescript
// Source: pattern verified against clients/invoices/quotations tables in this file
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }), // see Pitfall 2 — no free-text ticket concept
  subject: varchar("subject", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  // 'low' | 'medium' | 'high'
  priority: varchar("priority", { length: 8 }).notNull().default("medium"),
  // 'open' | 'in_progress' | 'resolved' — varchar(12), "in_progress" is 11 chars (Pitfall 1)
  status: varchar("status", { length: 12 }).notNull().default("open"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```
Run `npm run db:generate` after adding this to produce `netlify/database/migrations/0008_tickets.sql` (drizzle-kit auto-names the file; Phase 8's `08-01` correction note confirms migrations should be drizzle-kit-generated, not hand-written, "to guarantee constraint-naming/style parity" with prior migrations).

### Status route stamping `resolved_at` on transition to resolved
```typescript
// Source: pattern extrapolated from src/app/api/admin/quotations/[id]/status/route.ts
if (target === "resolved") {
  await db.update(tickets)
    .set({ status: "resolved", resolvedAt: new Date() })
    .where(eq(tickets.id, numId));
} else if (target === "open" || target === "in_progress") {
  // Reopening clears resolvedAt so a re-resolved ticket gets a fresh timestamp
  await db.update(tickets)
    .set({ status: target, resolvedAt: null })
    .where(eq(tickets.id, numId));
}
```

## State of the Art

No external "state of the art" applies — this is entirely an internal-consistency question (matching this repo's own Phase 6/8/10 conventions), not a question of what's current in the broader Next.js/Drizzle ecosystem. No deprecated approaches to flag; the stack (Next.js 16, Drizzle 0.45.2, Zod) is the same one already in active use as of the most recent phase (10-05, 2026-07-07 STATE.md entry).

## Open Questions

1. **Should `tickets.clientId` use `onDelete: "restrict"` or `"no action"`?**
   - What we know: Postgres defaults to `NO ACTION` if unspecified; Drizzle's `.references()` requires an explicit choice for clarity in this codebase's style (every other FK in schema.ts specifies one explicitly).
   - What's unclear: There's no existing client-delete route in this codebase to even trigger this constraint today (CLIENT-04 is edit-only). This is speculative until a delete-client feature exists.
   - Recommendation: Use `onDelete: "restrict"` for explicitness and pick it up in the planner's task description as a one-line decision; functionally near-identical to the Postgres default either way since no delete-client route exists yet.

2. **Should priority have transition-like restrictions, or is it always freely editable?**
   - What we know: The phase goal only mentions priority at creation time ("subject, description, and priority") and doesn't mention changing it later in the goal statement, but TICKET-05's "detail view" implies the owner can see it — editing isn't explicitly requested.
   - What's unclear: Whether the owner needs to change priority after creation (e.g., escalating a ticket).
   - Recommendation: Allow free-form priority editing via the same PUT route used for subject/description (no transition map needed, since priority isn't a lifecycle state) — cheap to include, avoids a follow-up request. Flag this as Claude's Discretion for the planner.

3. **Does the ticket detail page need its own edit form for subject/description, or are those set-once at creation?**
   - What we know: TICKET-01 only specifies creation; no requirement explicitly asks for editing subject/description after the fact.
   - What's unclear: Whether "detail view" (TICKET-05) implies edit capability, given `ClientForm`'s established create+edit dual-mode pattern.
   - Recommendation: Mirror `ClientForm`'s dual-mode pattern (`ticketId?` prop triggers PUT instead of POST) for consistency and near-zero extra cost, but this is a nice-to-have, not a hard requirement — planner's call.

## Environment Availability

Skipped — this phase has no external dependencies beyond the already-provisioned Netlify Database (Neon Postgres) and the existing Next.js/Node toolchain, all of which are already verified working as of Phase 10 (most recent completed phase, per STATE.md).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` (environment: node, include: `src/**/*.test.ts`, `@/` alias to `src/`) |
| Quick run command | `npx vitest run src/app/api/admin/tickets --reporter=dot` (scope to the new routes) |
| Full suite command | `npm test` (== `vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TICKET-01 | POST /api/admin/tickets creates a ticket linked to a client | unit (non-DB guard) + DB-gated | `npx vitest run src/app/api/admin/tickets/route.test.ts` | ❌ Wave 0 |
| TICKET-02 | PATCH /api/admin/tickets/[id]/status enforces ALLOWED_TRANSITIONS | unit (non-DB guard) + DB-gated | `npx vitest run src/app/api/admin/tickets/[id]/status/route.test.ts` | ❌ Wave 0 |
| TICKET-03 | POST /api/admin/tickets/[id]/notes inserts crm_notes with recordType 'ticket' | unit (non-DB guard) + DB-gated | `npx vitest run src/app/api/admin/tickets/[id]/notes/route.test.ts` | ❌ Wave 0 |
| TICKET-04 | GET /api/admin/tickets (or list page query) filters by status, open-first ordering | unit (non-DB guard); DB-gated `it.todo` for ordering, mirrors existing DB-gated skip pattern | `npx vitest run src/app/api/admin/tickets/route.test.ts` | ❌ Wave 0 |
| TICKET-05 | GET /api/admin/tickets/[id] returns full ticket + notes | unit (non-DB guard) + DB-gated | `npx vitest run src/app/api/admin/tickets/[id]/route.test.ts` | ❌ Wave 0 |
| CLIENT-06 (tickets half) | getClientTickets(clientId) query used by client detail page | DB-gated (`describeIfDb` skip pattern, same as `getClientInvoices` has no dedicated test file today — verify if one exists before assuming none needed) | manual/DB-gated | ❌ Wave 0 |

**Note on DB-gated tests:** This codebase's established pattern (seen in `clients/[id]/notes/route.test.ts`) is `const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;` followed by `it.todo(...)` placeholders for the actual DB-dependent assertions — real DB integration tests are NOT run in CI/default `npm test` (no `NETLIFY_DB_URL` set there), only locally against `netlify dev`. Mirror this exactly: every new ticket route test file should have a fast non-DB guard-clause `describe` block (401 checks, always run) plus a `describeIfDb` block of `it.todo`s for the real DB assertions.

### Sampling Rate
- **Per task commit:** `npx vitest run <changed-test-file-path>`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/admin/tickets/route.test.ts` — covers TICKET-01 (create), TICKET-04 (list) non-DB guards
- [ ] `src/app/api/admin/tickets/[id]/route.test.ts` — covers TICKET-05 (detail/edit) non-DB guards
- [ ] `src/app/api/admin/tickets/[id]/status/route.test.ts` — covers TICKET-02 non-DB guards + transition-map unit tests (can test `ALLOWED_TRANSITIONS` as a pure function with no DB/mocking at all, mirroring how simple `quotation-status.ts` is to unit test)
- [ ] `src/app/api/admin/tickets/[id]/notes/route.test.ts` — covers TICKET-03 non-DB guards
- No new test framework/config needed — `vitest.config.ts` already covers `src/**/*.test.ts` globally, no per-feature setup required.

## Sources

### Primary (HIGH confidence — direct repo inspection, this session)
- `src/lib/db/schema.ts` — full current schema, confirms `clients`, `crmNotes`, `invoices`, `quotations` shapes and FK conventions
- `netlify/database/migrations/` directory listing — confirms next migration number is `0008`
- `netlify/database/migrations/0007_quotations.sql` — confirms drizzle-kit-generated migration SQL style/format
- `src/lib/crm-types.ts` — confirms `CrmRecordType` union scope and `crm_notes.recordType` has no CHECK constraint
- `src/app/api/admin/clients/[id]/notes/route.ts` + `.test.ts` — notes route pattern + non-DB-guard test pattern to mirror
- `src/components/admin/clients/ClientNoteForm.tsx` — note-add form pattern (toast + router.refresh + Spinner)
- `src/components/admin/crm/StatusSelect.tsx` — status-change select pattern (scheme-dark, toast, disabled-while-pending)
- `src/lib/client-query.ts`, `src/lib/client-types.ts` — full client query-layer + types pattern, including `getClientInvoices` (direct template for `getClientTickets`)
- `src/app/admin/clients/[id]/page.tsx` — confirmed the exact Phase-7 seam location/comment (line 112) and the Invoices Card structure to mirror
- `src/components/admin/AdminSidebar.tsx` — confirmed nav-link array shape for adding "Tickets"
- `src/app/api/admin/quotations/[id]/status/route.ts` + `src/lib/quotation-status.ts` — status-transition-map + resolved-style terminal/reopen pattern
- `src/app/admin/quotations/page.tsx` — filterable list page with status badges + FILTER_LINKS pattern
- `src/lib/db/tx.ts` — confirms `withTxDb` exists and why (neon-http can't do `db.transaction()`); confirms it's unnecessary for a single-insert ticket create
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/PROJECT.md` — requirements text, locked decisions, phase dependency chain
- `vitest.config.ts` + `package.json` — test framework/config confirmed directly

### Secondary (MEDIUM confidence)
- None — no external web sources were needed; this phase required zero new libraries or ecosystem research, only in-repo pattern discovery.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, 100% reuse of already-installed/verified packages
- Architecture: HIGH — every pattern cited is copy-pasted/adapted from working code already in this exact repo (Phase 6 Clients, Phase 10 Quotations)
- Pitfalls: HIGH — all six pitfalls are drawn from either an explicit STATE.md decision note (varchar sizing, correction-pattern conventions) or a direct diff between two existing sibling tables (FK cascade behavior between invoiceLineItems vs invoices)

**Research date:** 2026-07-07
**Valid until:** Effectively indefinite for this phase's scope — this research is grounded in the current state of this specific repo, not a fast-moving external ecosystem. Re-verify only if the Clients (Phase 6), Quotations (Phase 10) code, or `schema.ts` changes materially before Phase 7 planning begins.
