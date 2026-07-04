# Phase 8: Linked Invoicing & Delivery - Research

**Researched:** 2026-07-04
**Domain:** Drizzle/Postgres schema migration, invoice→client linking, Resend transactional email with PDF attachments, Next.js admin CRUD patterns
**Confidence:** HIGH (all findings grounded in this repo's actual code + installed package types, not general framework knowledge)

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for Phase 8 (`.planning/phases/08-linked-invoicing-delivery/` contained no CONTEXT.md at research time — glob returned no files). No `/gsd:discuss-phase` was run for this phase. All scope comes from REQUIREMENTS.md (INVOICE-09..13, CLIENT-06 partial) and the locked v2.1 decisions already recorded in STATE.md / PROJECT.md:

- Invoice→client is an optional `client_id` FK with auto-fill; free-text one-off invoices stay valid (locked, PROJECT.md Key Decisions).
- CLIENT-06 is split: invoices-history lands in Phase 8, tickets-history is deferred to Phase 7 having landed first is NOT a hard dependency for Phase 8 — REQUIREMENTS.md explicitly marks tickets portion "DEFERRED to Phase 7 (tickets don't exist yet)" and asks Phase 8 to build the client-history section so a tickets list slots in later without rework.
- Single-admin auth only, no multi-staff roles.
- No payment gateway; invoicing remains generate-and-track.
- IT-Guru is not VAT-registered — no VAT fields, no "Tax Invoice" wording (already respected by existing `InvoiceDocument`/`invoices` schema — do not reintroduce).

Since no CONTEXT.md exists, there are no "Claude's Discretion" or "Deferred Ideas" sections to copy. The planner should treat the codebase conventions documented below (CLAUDE.md + existing invoice/client code) as the binding constraints in place of a CONTEXT.md.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INVOICE-09 | Searchable client picker auto-fills name/email/address, stores `invoices.client_id` | Migration design (below), custom-dropdown pattern from `StepApplicantInfo.tsx`'s `CountryCodeSelect`, `getClients()` reuse for picker data, `InvoiceForm.tsx`/`invoices` POST route changes |
| INVOICE-10 | Free-text one-off invoices still work; existing rows (`client_id` NULL) stay valid/editable | Nullable FK column, no backfill, no NOT NULL constraint — see Migration section |
| INVOICE-11 | Marking Sent emails the PDF as an attachment to the client email | Shared PDF helper (factor `renderToBuffer` out of the pdf route), Resend `attachments` field (installed SDK type: `content?: string \| Buffer`), hook point in status route |
| INVOICE-12 | Block Mark Sent when no client email; prompt to add one | Server 422/409 guard in status route + client-side messaging in `InvoiceStatusActions.tsx` |
| INVOICE-13 | Resend + Revert-to-Draft replace "Unpublish"; revert clears invoice number | New route or reused status route + new UI buttons in `InvoiceStatusActions.tsx` |
| CLIENT-06 (partial) | Client detail page shows linked invoices; tickets slot in later without rework | New query in `client-query.ts` (or new file), a `<Card>` section in `src/app/admin/clients/[id]/page.tsx` structured so a Tickets card can be added as a sibling |
</phase_requirements>

## Summary

This phase extends the existing, fully-working Phase 4 invoicing system (`src/lib/invoices.ts`, `src/app/api/admin/invoices/*`, `InvoiceForm.tsx`, `InvoiceStatusActions.tsx`) rather than building anything new from scratch. Everything needed — gapless gapless gapless numbering, PDF rendering via `@react-pdf/renderer`, transactional email via `resend`, the `withTxDb()` transaction helper, and the custom-dropdown pattern for rich pickers (`CountryCodeSelect` in `StepApplicantInfo.tsx`) — already exists in the codebase and should be reused verbatim, not reinvented.

The core additions are: (1) a nullable `client_id` integer FK on `invoices` (migration `0006`, following the exact style of `0005_clients.sql`), (2) a searchable client-picker component built as a custom listbox (native `<select>` cannot be searchable/rich the way this codebase already does for country codes), (3) a factored-out PDF-buffer helper reused by both the download route and a new email-on-send code path, and (4) replacing the "Unpublish" button with "Resend" (re-email, no status change) and "Revert to Draft" (the old sent→draft transition, unchanged logic).

**Primary recommendation:** Add `invoices.client_id integer references clients(id) on delete set null` (migration `0006`), keep it fully nullable with no backfill of existing rows (INVOICE-10 requires zero destructive migration). Build the client picker as a client-side searchable listbox component (not a native `<select>`) that fetches `getClients()`-shaped data via a new lightweight `GET /api/admin/clients` list call (already exists) and auto-fills `clientName`/`clientEmail`/`billingAddress` state in `InvoiceForm.tsx` on selection, while still allowing all fields to be free-typed/overridden. Factor `renderToBuffer(<InvoiceDocument .../>)` out of `src/app/api/admin/invoices/[id]/pdf/route.tsx` into a new `src/lib/invoice-pdf.ts` helper (`generateInvoicePdfBuffer(invoice, lineItems): Promise<Buffer>`) and call it from both the pdf route and the new send-email logic in the status route. Pass the raw `Buffer` directly to Resend's `attachments[0].content` — the installed SDK type (`resend@6.12.4`, confirmed in `node_modules/resend/dist/index.d.mts`) accepts `string | Buffer` directly, so no manual base64 conversion step is needed.

## Standard Stack

### Core (already installed — no new dependencies needed)
| Library | Installed Version | Purpose | Why Standard (for this repo) |
|---------|---------|---------|--------------|
| `resend` | 6.12.4 (`^6.12.4`, latest published 6.17.1) | Transactional email + attachments | Already the sole email provider (`src/lib/email.ts`); `EmailApiAttachment`/`Attachment` types confirmed to support `content?: string \| Buffer` and `filename` |
| `@react-pdf/renderer` | 4.5.1 (pinned, matches latest published) | PDF generation | Already used for `InvoiceDocument` in the download route; `renderToBuffer` is the exact function to reuse |
| `drizzle-orm` | 0.45.2 | Schema + queries | Existing ORM; migration must match Drizzle-Kit's generated SQL style (see `0005_clients.sql`) |
| `zod` | 4.4.3 | Input validation | Existing `invoiceInput` schema in `src/lib/invoices.ts` must be extended, not replaced |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None new | — | — | This phase needs zero new npm packages. All work is schema + route + component changes on the existing stack. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom listbox for client picker | Native `<select>` | CLAUDE.md explicitly forbids native `<select>` for rich pickers needing search/richer rendering — same reasoning as `CountryCodeSelect` (though here the driver is "searchable", not flags, the repo's established pattern of build-your-own button+listbox still applies for consistency and to support type-ahead filtering) |
| Base64-encoding the PDF buffer manually | Passing raw `Buffer` to Resend `content` | Installed SDK types accept `Buffer` directly (`content?: string \| Buffer`) — manual `.toString('base64')` is what Resend's own docs example shows for reading from disk, but for an in-memory buffer passing it directly is simpler and equally supported; document both work, prefer passing the Buffer directly to avoid an unnecessary encode/decode round trip |
| A new `POST .../resend` route for Resend | Extending the existing PATCH status route with a same-status "resend" action | Recommended: a dedicated route (see Key Question 5 below) — status route's `ALLOWED_TRANSITIONS` model doesn't naturally fit a no-status-change action |

**Installation:** None required — all dependencies already present in `package.json`.

**Version verification (2026-07-04):**
```
npm view resend version           → 6.17.1 (installed: ^6.12.4, semver-compatible)
npm view @react-pdf/renderer version → 4.5.1 (installed: exact match)
```

## Architecture Patterns

### Recommended Project Structure (new/changed files only)
```
netlify/database/migrations/
└── 0006_invoice_client_link.sql   # new — nullable client_id FK on invoices

src/lib/
├── db/schema.ts                   # add invoices.clientId column
├── invoices.ts                    # extend invoiceInput with optional clientId
├── invoice-pdf.ts                 # NEW — factored renderToBuffer helper (shared by pdf route + email-on-send)
└── client-query.ts                # add getClientInvoices(clientId) query for CLIENT-06

src/app/api/admin/invoices/
├── route.ts                       # POST — thread clientId through, look up client for auto-fill server-side too (defense in depth)
├── [id]/route.ts                  # PUT — thread clientId through (same draft-only lock)
├── [id]/pdf/route.tsx             # refactor to call src/lib/invoice-pdf.ts helper
├── [id]/status/route.ts           # add email-on-send (INVOICE-11), no-email guard (INVOICE-12)
└── [id]/resend/route.ts           # NEW — POST, re-sends current PDF, no status change (INVOICE-13)

src/components/forms/
├── InvoiceForm.tsx                 # add ClientPicker, auto-fill on select, keep free-text override
├── ClientPicker.tsx                # NEW — searchable custom listbox, mirrors CountryCodeSelect's button+listbox+useEffect(click-outside) shape
└── InvoiceStatusActions.tsx        # replace "Unpublish" with "Resend" + "Revert to Draft"; add no-email-blocked messaging

src/app/admin/clients/[id]/page.tsx # add "Invoices" Card section (CLIENT-06 partial), structured for a sibling "Tickets" Card later
```

### Pattern 1: Nullable FK migration matching existing style
**What:** Add `client_id integer` column to `invoices`, FK to `clients(id)`, `ON DELETE SET NULL` (matches the exact style already used for `converted_client_id` on `client_registrations`/`contact_enquiries` in `0005_clients.sql`).
**When to use:** Any time a lead/invoice/ticket needs an optional link to `clients` without breaking existing free-text rows.
**Example:**
```sql
-- Source: netlify/database/migrations/0005_clients.sql (existing pattern to mirror)
ALTER TABLE "invoices" ADD COLUMN "client_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk"
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE no action;
```
Corresponding schema.ts change:
```typescript
// Source: src/lib/db/schema.ts (existing invoices table, extend in place)
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }),
  // ...unchanged...
});
```
Note: `clients` is defined at the *end* of `schema.ts` (per the 06-01 decision comment: "Drizzle `.references()` lazy thunks allow forward refs from earlier-defined lead tables") — the same forward-reference trick works here since `invoices` is defined before `clients` in the file. No reordering needed.

**Generate via drizzle-kit, don't hand-write the migration:** run `npm run db:generate` after the schema.ts edit so the SQL exactly matches Drizzle's own naming/constraint conventions (constraint name `invoices_client_id_clients_id_fk` etc.) — do NOT hand-author the migration file; diff it against the schema change to confirm it's additive-only (no destructive drops), then apply locally with `netlify database migrations apply`.

### Pattern 2: Searchable client picker as a controlled custom listbox
**What:** A `"use client"` component styled like `CountryCodeSelect` (button + `role="listbox"` + click-outside-to-close `useEffect`), but with a search `<input>` inside the open panel that filters the client list by name/email/company (client-side `.filter()`, no server round-trip needed — client lists are small at single-admin scale).
**When to use:** INVOICE-09's picker. Also directly reusable for QUOTE-01 in Phase 10 (mirrors invoice creation per REQUIREMENTS.md), so build it as a standalone, reusable component (`src/components/forms/ClientPicker.tsx`), not inlined into `InvoiceForm.tsx`.
**Example:**
```tsx
// Source: adapted from src/components/forms/steps/StepApplicantInfo.tsx's CountryCodeSelect
"use client";
import { useEffect, useRef, useState } from "react";
import type { ClientListItem } from "@/lib/client-types";

interface ClientPickerProps {
  clients: ClientListItem[];       // passed down, fetched once by parent or via a client-side fetch
  selectedClientId: number | null;
  onSelect: (client: ClientListItem | null) => void; // null = "one-off, no stored client"
}

export function ClientPicker({ clients, selectedClientId, onSelect }: ClientPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = clients.find((c) => c.id === selectedClientId) ?? null;
  const filtered = clients.filter((c) =>
    `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}>
        {selected ? selected.name : "One-off / no stored client"}
      </button>
      {open && (
        <div role="listbox" className="absolute z-20 ...">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients…" />
          <button type="button" onClick={() => { onSelect(null); setOpen(false); }}>
            One-off (no stored client)
          </button>
          {filtered.map((c) => (
            <button key={c.id} type="button" role="option" aria-selected={c.id === selectedClientId}
              onClick={() => { onSelect(c); setOpen(false); }}>
              {c.name} — {c.email}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```
Wiring into `InvoiceForm.tsx`: on `onSelect(client)`, set `fields.clientName = client.name`, `fields.clientEmail = client.email`, `fields.billingAddress = client.physicalAddress || client.postalAddress`, and set a new `clientId` state to `client.id`. Fields remain editable inputs after auto-fill (not locked/disabled) — this is what "auto-fills" + "still supports free-text" both require simultaneously: selecting a client is a convenience prefill, not a hard binding of the text fields. `clientId` is the actual link; if the owner edits `clientName` after picking a client, `clientId` should probably be cleared to avoid a mismatched name vs. linked client — **flagged as an Open Question below** since REQUIREMENTS.md doesn't specify this edge case explicitly.

### Pattern 3: Shared PDF-buffer helper (factor out `renderToBuffer`)
**What:** Extract the buffer-generation logic from `src/app/api/admin/invoices/[id]/pdf/route.tsx` into `src/lib/invoice-pdf.ts` so both the download route and the send-email code path call the identical rendering logic (single source of truth — same reasoning as `client-query.ts`'s `getClients()` comment: "don't re-inline this query").
**When to use:** Any place that needs the invoice PDF as bytes (download route, email attachment, and future QUOTE PDF work in Phase 10 can follow the same factoring pattern for quotations).
**Example:**
```typescript
// Source: refactored from src/app/api/admin/invoices/[id]/pdf/route.tsx
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/InvoiceDocument";
import type { invoices, invoiceLineItems } from "@/lib/db/schema";

type InvoiceRow = typeof invoices.$inferSelect;
type LineItemRow = typeof invoiceLineItems.$inferSelect;

export async function generateInvoicePdfBuffer(
  invoice: InvoiceRow,
  lineItems: LineItemRow[]
): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} lineItems={lineItems} />);
}
```
The pdf route becomes:
```typescript
const buffer = await generateInvoicePdfBuffer(invoice, lineItems);
return new Response(new Uint8Array(buffer), { headers: { /* unchanged */ } });
```
And the status route's send-on-sent logic (see Pattern 4) calls the same function, passing the `Buffer` straight into Resend's `attachments[0].content` (no `new Uint8Array()` wrapping needed for Resend — that wrapping is only required for the `Response` `BodyInit` type constraint, not for Resend's `content?: string | Buffer` field).

### Pattern 4: Email-on-send hook point in the status route
**What:** Inside `PATCH .../status`'s `if (inv.status === "draft" && target === "sent")` branch, after the existing atomic numbering UPDATE succeeds, fetch the now-updated invoice + line items, generate the PDF buffer, and call `sendEmail()` with the attachment. This keeps the numbering UPDATE exactly as-is (INVOICE-11/12/13 must not touch the gapless-numbering SQL).
**When to use:** The draft→sent transition only. Resend (INVOICE-13) is a *separate* route (see Key Question 5) that does the email step without touching status/numbering at all.
**Example:**
```typescript
// Source: extending src/app/api/admin/invoices/[id]/status/route.ts's existing draft→sent branch
if (inv.status === "draft" && target === "sent") {
  // INVOICE-12: block before any write if there's no client email.
  if (!inv.clientEmail) {
    return NextResponse.json(
      { error: "This invoice has no client email. Add one before marking it Sent." },
      { status: 422 }
    );
  }

  const fiscalYear = new Date(inv.issueDate).getFullYear();
  await db.execute(sql`
    UPDATE invoices SET status = 'sent', fiscal_year = ${fiscalYear},
      sequence_number = (SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM invoices WHERE fiscal_year = ${fiscalYear})
    WHERE id = ${numId} AND status = 'draft'
  `);

  // Re-fetch full invoice + line items for PDF + email (best-effort — see Key Question 6).
  const [updated] = await db.select().from(invoices).where(eq(invoices.id, numId));
  const lineItems = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, numId));
  const pdfBuffer = await generateInvoicePdfBuffer(updated, lineItems);
  const invoiceNumber = formatInvoiceNumber(updated.fiscalYear, updated.sequenceNumber);

  await sendEmail({
    to: updated.clientEmail!,
    subject: `Invoice ${invoiceNumber} from IT-Guru Online`,
    html: emailLayout(`Invoice ${invoiceNumber}`, `<p>Please find your invoice attached.</p>`),
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }],
  });
}
```
`sendEmail()`'s `SendEmailOptions` interface needs a new optional field:
```typescript
// Source: src/lib/email.ts — add to SendEmailOptions
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | string }[]; // NEW
}
// ...inside sendEmail(), thread through:
const { error } = await resend.emails.send({
  from: FROM_EMAIL, to, subject, html,
  ...(bcc ? { bcc } : {}),
  ...(replyTo ? { replyTo } : {}),
  ...(attachments ? { attachments } : {}),
});
```

### Anti-Patterns to Avoid
- **Do not add a `NOT NULL` constraint or backfill `client_id` for existing invoices** — INVOICE-10 explicitly requires zero destructive migration; existing free-text invoices must stay valid with `client_id = NULL` forever unless the owner manually links them later via edit.
- **Do not touch the gapless-numbering `UPDATE ... SET sequence_number = (SELECT COALESCE(MAX...)...)` SQL** — this is a fragile, carefully-commented atomic statement (D-04/INVOICE-03); email-sending must be bolted on *after* it succeeds, never interleaved with it.
- **Do not disable/lock the free-text fields when a client is picked** — CLAUDE.md's design and INVOICE-10's "free-text one-off invoices still work" both imply the picker is a convenience prefill, not a rigid binding; the owner must still be able to override a name/email/address inline (e.g. billing a client's accounts department at a different email than their primary contact).
- **Do not build the client picker as a native `<select>`** — same CLAUDE.md rule that forced `CountryCodeSelect` to be custom applies to any picker needing search/filter UX beyond what `<option>` supports.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF-to-base64 conversion for email attachments | A manual `buffer.toString('base64')` step | Pass the `Buffer` directly to Resend's `content` field | Installed SDK type (`resend@6.12.4`) accepts `string \| Buffer` natively — confirmed in `node_modules/resend/dist/index.d.mts` line 604 (`interface Attachment { content?: string \| Buffer; ... }`). Encoding manually is extra unneeded code. |
| Client-side fuzzy search for the picker | A fuzzy-match library (Fuse.js etc.) | Plain `.filter()` substring match on `name`/`email`/`company` | At single-admin scale (dozens to low hundreds of clients, not thousands), a client dataset can be fetched once and filtered client-side with a trivial substring match — no need for a search library or server-side search endpoint. Revisit only if client volume grows into the thousands. |
| Invoice PDF generation for email | Re-implementing PDF rendering separately for email vs download | The single `generateInvoicePdfBuffer()` helper (Pattern 3) | Two independent PDF-rendering code paths risk drifting (e.g. one route gets a template fix, the other doesn't) — exactly why `client-query.ts`'s `getClients()` comment already warns against this class of duplication elsewhere in the codebase. |
| Draft→sent transaction with email | A new `withTxDb()` transaction wrapping both the numbering UPDATE and the email send | Sequential: numbering UPDATE first (already atomic/gapless), THEN email best-effort afterward (not in the same transaction) | See Key Question 6 — email delivery is inherently non-transactional (external HTTP call to Resend) and must not be allowed to roll back a successful, committed number assignment. `withTxDb()` is for atomic multi-statement DB writes, not for wrapping external API calls. |

**Key insight:** This phase's implementation surface is almost entirely "extend an existing pattern," not "solve a new problem" — every non-trivial piece (custom dropdown, PDF rendering, transactional email, gapless numbering, draft-lock guards) already has a proven, working precedent elsewhere in this exact codebase.

## Runtime State Inventory

Not applicable — this phase is a schema addition (new nullable column) plus new routes/UI, not a rename/refactor/migration of existing identifiers. Skipping this section per the "greenfield phases" exclusion rule. (Note: this phase DOES touch the database schema, but it is additive-only — no existing column, table, or string is renamed or removed, so the rename/refactor trigger does not apply.)

## Common Pitfalls

### Pitfall 1: Forgetting the no-email guard breaks INVOICE-12's intent
**What goes wrong:** If the block-on-no-email check is only added client-side (in `InvoiceStatusActions.tsx`) and not server-side, a stale page state or direct API call could mark an invoice Sent with no client email, silently skipping the email entirely — defeating "every sent invoice was genuinely delivered."
**Why it happens:** The existing `PATCH .../status` route trusts the client for the *target* status but re-validates the *transition* server-side (`ALLOWED_TRANSITIONS`) — it's easy to add a new business rule only to the UI layer and forget the route needs its own independent check, exactly as the route's own comment warns: "never trust the client."
**How to avoid:** Add the guard as the very first check inside the `draft → sent` branch (before the numbering UPDATE runs), returning a distinct, recognizable error (e.g. a specific `error` string or a `code: "NO_CLIENT_EMAIL"` field) so `InvoiceStatusActions.tsx` can distinguish it from a generic 409/422 and show "Add a client email first" with a link to edit, rather than a generic error message.
**Warning signs:** A vitest guard test asserting 422 (not 200/409) when `clientEmail` is null and target is `sent` — add this alongside the existing `route.test.ts` transition tests.

### Pitfall 2: Email failure should not silently swallow the fact that no email was sent
**What goes wrong:** `sendEmail()` is designed to never throw (per its own doc comment: "Failures are logged but never thrown — a missing notification shouldn't fail the form submission it's attached to"). If the status route calls `sendEmail()` the same way, a Resend outage means the invoice silently becomes "Sent" with NO email actually delivered, and the owner has no way to know except checking server logs.
**Why it happens:** `sendEmail()`'s fire-and-forget contract was designed for *notification* emails (contact form confirmations, reminders) where a missed email is low-stakes. Invoice delivery is higher-stakes — INVOICE-12's whole premise is "every sent invoice was genuinely delivered."
**How to avoid:** Since INVOICE-12 already guarantees a client email exists before the transition is even allowed, the remaining risk is purely "Resend API is down/erroring," which is rare. Recommend: keep the transition itself always-succeeds (numbering already committed), but have the invoice-send code path check `sendEmail()`'s return/error and, if it fails, still return 200 (status IS sent — number IS assigned, per the atomic UPDATE that already ran) but include a `warning` field in the JSON response (e.g. `{ ok: true, emailWarning: "The invoice was marked Sent, but the email failed to send. Use Resend to try again." }`), and have `InvoiceStatusActions.tsx` surface that as a non-blocking `role="alert"` banner. This requires `sendEmail()` to surface success/failure to its caller (currently `Promise<void>`, swallows errors) — needs `sendEmail()` to return `{ ok: boolean }` or similar, OR a parallel path that catches errors itself around the call site. Flag this for the planner: decide whether to change `sendEmail()`'s return contract (affects every other caller) or wrap this one call site in its own try/catch reading Resend's response directly.

### Pitfall 3: Date serialization across the RSC boundary
**What goes wrong:** `invoices.createdAt`/`updatedAt`/`paidAt` are `timestamp` columns that come back as JS `Date` objects from Drizzle. Passing a raw `Date` object as a prop from a server component into a client component (e.g. `InvoiceStatusActions`, or a new `ClientInvoicesList` client component) throws a serialization error in Next.js App Router (`Date` isn't a valid RSC-serializable prop by default in the pattern this repo already avoids — see `client-types.ts`'s explicit comment: `createdAt: string; // ISO string — never a raw Date across the RSC boundary`).
**Why it happens:** Easy to forget when quickly wiring up a new list/history component and just spreading a DB row into props.
**How to avoid:** Follow the exact existing convention (`ClientListItem.createdAt: string` via `.toISOString()`) for any new type feeding client components — e.g. a `ClientInvoiceSummary` type for CLIENT-06's history list should stringify dates the same way.
**Warning signs:** A Next.js build/runtime error like "Only plain objects can be passed to Client Components from Server Components" pointing at a Date value.

### Pitfall 4: Buffer→BodyInit typing trap
**What goes wrong:** `renderToBuffer()`'s return type doesn't directly satisfy the DOM `BodyInit` type used by `Response`, even though it works at runtime — the existing pdf route already documents this exact gotcha with a `new Uint8Array(buffer)` wrap.
**Why it happens:** TypeScript's DOM lib types are stricter than Node's runtime behavior here (per the existing inline comment: "Buffer<ArrayBufferLike> is rejected by the DOM BodyInit type under this tsconfig even though it works at runtime").
**How to avoid:** Keep the `new Uint8Array(buffer)` wrap in the (refactored) pdf route's `Response` construction. Do NOT apply the same wrap when passing the buffer to Resend's `attachments[].content` — Resend's own type is `string | Buffer` (not `BodyInit`), so the raw `Buffer` from `generateInvoicePdfBuffer()` is correct there and should NOT be wrapped in `Uint8Array` (that would need `Buffer.from(uint8Array)` conversion back, which is just extra unneeded steps).
**Warning signs:** A TS build error only in the `Response` construction path, not in the Resend call path — if both start erroring, the buffer type was mismatched somewhere in the refactor.

### Pitfall 5: `requireAdmin()` placement in the new Resend route
**What goes wrong:** A new `POST .../invoices/[id]/resend/route.ts` (Key Question 5) could accidentally skip the `requireAdmin()`-first convention if copy-pasted carelessly from a public route instead of an existing admin route.
**Why it happens:** New route files sometimes get scaffolded from the nearest example, and if that example is chosen poorly the auth-first convention could be missed.
**How to avoid:** Copy the skeleton from `src/app/api/admin/invoices/[id]/status/route.ts` (which already has `requireAdmin()` as line 1 of the handler body) rather than any public route.
**Warning signs:** Missing 401 test case in the new route's `.test.ts` file — the existing convention (per every `*.test.ts` reviewed) always has a "non-DB guards" describe block asserting 401 first.

## Code Examples

### Extending `invoiceInput` (src/lib/invoices.ts) with optional clientId
```typescript
// Source: src/lib/invoices.ts, extend the existing invoiceInput schema
export const invoiceInput = z.object({
  clientId: z.number().int().positive().nullable().optional(), // NEW — null/undefined = one-off
  clientName: z.string().trim().min(1).max(255),
  clientEmail: z /* ...unchanged... */,
  billingAddress: z /* ...unchanged... */,
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lineItems: z.array(lineItemInput).max(100).default([]),
});
```
Server-side: the POST/PUT routes should validate that if `clientId` is provided, the referenced client actually exists (avoid a silent FK violation surfacing as a raw 500) — a `SELECT` check before insert/update, returning 422 `{ fields: { clientId: ["Client not found."] } }` if missing, mirroring the existing 404-vs-422 conventions elsewhere.

### `getClientInvoices` query for CLIENT-06 (src/lib/client-query.ts)
```typescript
// Source: pattern mirrors existing getClients() in the same file
import { invoices } from "@/lib/db/schema";
import { formatInvoiceNumber } from "@/lib/invoices";

export interface ClientInvoiceSummary {
  id: number;
  invoiceNumber: string;    // formatted via formatInvoiceNumber, "DRAFT" if unassigned
  status: string;
  totalRands: number;
  dueDate: string;          // DATE column, already a plain string from Drizzle (not Date)
  issueDate: string;
}

export async function getClientInvoices(clientId: number): Promise<ClientInvoiceSummary[]> {
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, clientId))
    .orderBy(desc(invoices.createdAt));
  return rows.map((inv) => ({
    id: inv.id,
    invoiceNumber: formatInvoiceNumber(inv.fiscalYear, inv.sequenceNumber),
    status: inv.status,
    totalRands: inv.totalRands,
    dueDate: inv.dueDate,
    issueDate: inv.issueDate,
  }));
}
```
Note: `date` columns (`issueDate`, `dueDate`) come back from Drizzle as plain strings already (per the existing `invoices` schema using `date(...)`, distinct from `timestamp(...)`) — no `.toISOString()` needed for those two fields, only for actual `timestamp` columns like `createdAt`.

### Client detail page — CLIENT-06 partial, structured for tickets to slot in later
```tsx
// Source: extending src/app/admin/clients/[id]/page.tsx — add as a new Card, sibling-ready for Tickets
import { getClientInvoices } from "@/lib/client-query";
// ...
const clientInvoices = await getClientInvoices(client.id);
// ...
{/* History section — invoices now, tickets in Phase 7 as a sibling Card */}
<Card className="mb-8">
  <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Invoices</h2>
  {clientInvoices.length === 0 ? (
    <p className="text-sm text-(--text-secondary)">No invoices yet.</p>
  ) : (
    <ul className="divide-y divide-(--border-color)">
      {clientInvoices.map((inv) => (
        <li key={inv.id} className="py-2 flex items-center justify-between">
          <Link href={`/admin/invoices/${inv.id}`} className="text-sm text-(--text-primary) hover:underline">
            {inv.invoiceNumber}
          </Link>
          <span className="text-xs text-(--text-secondary)">R{inv.totalRands} — {inv.status}</span>
        </li>
      ))}
    </ul>
  )}
</Card>
{/* Card>Tickets</Card> — Phase 7, once the tickets table + client_id FK exist */}
```
This keeps the "history" concept as independent `<Card>` sections (Invoices now, Tickets later) rather than a single merged/interleaved timeline — simplest structure that requires zero rework when Phase 7 lands; a future phase can literally insert a new `<Card>` block without touching this one.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| "Unpublish" (sent→draft, single button) | "Resend" (re-email, no status change) + "Revert to Draft" (sent→draft, same as old Unpublish) | This phase (INVOICE-13) | `InvoiceStatusActions.tsx`'s `sent` block goes from 2 buttons (Mark Paid, Unpublish) to 3 (Mark Paid, Resend, Revert to Draft) |
| Invoice PDF only reachable via manual download | PDF automatically emailed on Mark Sent | This phase (INVOICE-11) | `sendEmail()` gains an `attachments` parameter, used for the first time in the codebase (no prior email had attachments) |
| Free-text-only invoice client fields | Free-text fields + optional linked `client_id` | This phase (INVOICE-09/10) | `invoices` table gains its first FK to `clients`; `InvoiceForm.tsx` gains a picker; existing invoices unaffected (NULL `client_id`) |

**Deprecated/outdated:** None — no functionality is being deprecated; "Unpublish" is being renamed/split, not removed (its sent→draft behavior lives on as "Revert to Draft").

## Open Questions

1. **Should selecting a client and then manually editing the auto-filled `clientName`/`clientEmail` clear `clientId`?**
   - What we know: INVOICE-09 requires auto-fill + `client_id` storage; INVOICE-10 requires free-text to keep working. Nothing in REQUIREMENTS.md addresses the case where an owner picks a client, then edits the prefilled email (e.g. to bill a different contact at the same company).
   - What's unclear: Whether the invoice should stay "linked" (client_id set, but with a locally-overridden email/name) for CLIENT-06 history purposes, or whether editing the auto-filled text should silently unlink it.
   - Recommendation: Keep `clientId` set even if the text fields are edited afterward — CLIENT-06's "linked invoices" list is about the *business relationship* (which client this invoice belongs to), not about the literal string match of `clientName`. This also avoids surprising behavior where a small correction to a client's billing email accidentally drops the invoice from their history. Planner should make this explicit in the picker's UX copy/behavior description.

2. **Exact wording/UX for INVOICE-12's "prompt to add one first"**
   - What we know: The block must happen both server-side (422) and client-side (visible prompt).
   - What's unclear: Whether the prompt should link directly to editing the invoice's `clientEmail` field inline (fastest fix) or navigate to the linked client's edit page (if `client_id` is set) to fix it at the source.
   - Recommendation: If `client_id` is set, link to `/admin/clients/{clientId}` (fix at the source, benefits future invoices too); if it's a free-text one-off with no `client_id`, the invoice must be un-locked for editing to add an email — but Draft invoices are already editable (`InvoiceForm` renders in edit mode for `status === "draft"`), so the fix is simply: surface the error message and the existing "Save Changes" form is already right there on the same page. No new UI needed for the free-text case; only the client-linked case benefits from an extra link.

3. **`sendEmail()`'s always-succeeds contract vs. INVOICE-11/12's delivery guarantee**
   - What we know: `sendEmail()` currently returns `Promise<void>` and swallows all errors (by design, for low-stakes notification emails).
   - What's unclear: Whether the planner should change `sendEmail()`'s signature (affecting every existing caller: contact form, registration, automation jobs, password reset) or add a separate, stricter send path just for invoices/quotations.
   - Recommendation: Prefer NOT changing `sendEmail()`'s contract (blast radius across ~6+ existing call sites). Instead, have the status route catch/inspect the Resend call's result directly by importing `resend` or by having `sendEmail()` optionally return a result object when a new `{ strict: true }`-style option is passed (backward compatible default `void`-like behavior otherwise). Planner should pick one approach and document it as a locked decision, since Phase 10 (QUOTE-03) will need the exact same delivery-guarantee pattern.

## Environment Availability

No external CLI tools, runtimes, or services beyond what's already configured are needed for this phase — `RESEND_API_KEY` is already a required env var (used by every existing email call), and `@react-pdf/renderer` / `resend` are already installed dependencies with no new native bindings.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `RESEND_API_KEY` env var | INVOICE-11 email send | Already required by existing `sendEmail()` — assumed present in both `.env.local` and Netlify env (not newly re-verified this session, but no new requirement introduced) | — | `sendEmail()` already no-ops with a console warning if unset (existing behavior, unchanged) |
| `resend` npm package | INVOICE-11 attachments | ✓ | 6.12.4 installed | — |
| `@react-pdf/renderer` | Shared PDF helper | ✓ | 4.5.1 installed | — |
| Netlify Postgres (local `netlify dev`) | Migration testing | Assumed available per existing dev workflow (`netlify database migrations apply`) | — | — |

**Missing dependencies with no fallback:** None identified.

**Missing dependencies with fallback:** None identified.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | none found at repo root via glob — likely default vitest config or inline in `package.json`/`vite.config` (not located during this research pass; confirm during planning) |
| Quick run command | `npx vitest run src/app/api/admin/invoices` (targeted) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INVOICE-09 | POST/PUT invoice with `clientId` stores the FK; picker auto-fills client fields | unit (route) + unit (component, optional) | `npx vitest run src/app/api/admin/invoices/route.test.ts` | ✅ extend existing |
| INVOICE-10 | Existing free-text invoices (client_id NULL) remain readable/editable after migration | unit (route) + DB integration (gated) | `npx vitest run src/app/api/admin/invoices/[id]/route.test.ts` | ✅ extend existing |
| INVOICE-11 | Mark Sent triggers `sendEmail()` with a PDF attachment | unit (mocked db + mocked email, following `invoice-reminder.test.ts`'s `vi.mock("@/lib/email")` pattern) | `npx vitest run src/app/api/admin/invoices/[id]/status/route.test.ts` | ✅ extend existing |
| INVOICE-12 | Mark Sent blocked (422) when `clientEmail` is null | unit (mocked db, no-DB guard style already in the file) | `npx vitest run src/app/api/admin/invoices/[id]/status/route.test.ts` | ✅ extend existing |
| INVOICE-13 | Resend re-sends email without changing status; Revert clears the number | unit (new route test) | `npx vitest run src/app/api/admin/invoices/[id]/resend/route.test.ts` | ❌ Wave 0 — new file needed |
| CLIENT-06 (partial) | Client detail page lists linked invoices | unit (query function) + manual/visual (page render) | `npx vitest run src/lib/client-query.test.ts` (if created) | ❌ Wave 0 — no existing `client-query.test.ts` found; consider adding one, or cover via a new route/page-level test |

### Sampling Rate
- **Per task commit:** targeted `npx vitest run <changed-file-path>.test.ts`
- **Per wave merge:** `npx vitest run` (full suite — DB-integration tests auto-skip without `NETLIFY_DB_URL`, per existing `describeIfDb` convention)
- **Phase gate:** Full suite green before `/gsd:verify-work`; additionally, per CLAUDE.md's DB testing trap, verify the migration itself via `netlify database migrations apply` locally (not just unit tests) before considering the phase done — unit tests with mocked `db` cannot catch a malformed migration SQL statement.

### Wave 0 Gaps
- [ ] `src/app/api/admin/invoices/[id]/resend/route.test.ts` — new route, no existing coverage (INVOICE-13's Resend action)
- [ ] `src/lib/invoice-pdf.test.ts` (optional but recommended) — the newly-factored `generateInvoicePdfBuffer()` helper has no dedicated test yet; existing `pdf/route.test.ts` may cover it indirectly once the route is refactored to call it, but a direct unit test isolates regressions in the shared helper from route-level auth/plumbing concerns
- [ ] Extend `src/app/api/admin/invoices/[id]/status/route.test.ts` with: (a) 422 case for no-client-email on draft→sent, (b) a mocked-email-send assertion for successful sends, mirroring `invoice-reminder.test.ts`'s `vi.mock("@/lib/email")` + `mockSendEmail` pattern
- [ ] Consider `src/lib/client-query.test.ts` — no existing test file for this module at all (only routes/components are tested); `getClients()` itself is currently untested directly (covered indirectly via `clients/route.test.ts`), and the new `getClientInvoices()` should get direct coverage since CLIENT-06's client detail page has no dedicated `page.test.tsx` pattern anywhere in this codebase (server components aren't unit-tested here — confirm this is an accepted gap, not an oversight, before planning skips it)

## Sources

### Primary (HIGH confidence — direct codebase reads)
- `src/lib/db/schema.ts` — full current schema, all tables
- `netlify/database/migrations/0005_clients.sql` — exact migration style to mirror for the new FK
- `src/app/api/admin/invoices/[id]/status/route.ts` — draft→sent/paid/draft transition logic, gapless numbering
- `src/components/forms/InvoiceStatusActions.tsx` — current Mark Sent/Unpublish/Mark Paid buttons
- `src/app/api/admin/invoices/[id]/pdf/route.tsx` — existing `renderToBuffer` usage to factor out
- `src/lib/email.ts` — `sendEmail()`, `SendEmailOptions`, BCC logic
- `src/components/forms/InvoiceForm.tsx`, `src/lib/invoices.ts` — current invoice create/edit form + validation schema
- `src/lib/client-query.ts`, `src/lib/client-types.ts` — `getClients()`/`getClientById()` and existing type conventions (ISO-string dates)
- `src/app/admin/clients/[id]/page.tsx` — client detail page structure to extend for CLIENT-06
- `src/app/api/admin/invoices/route.ts`, `src/app/api/admin/invoices/[id]/route.ts` — POST/PUT/DELETE invoice routes
- `src/components/forms/steps/StepApplicantInfo.tsx` (`CountryCodeSelect`) — the established custom-dropdown pattern this repo already uses instead of native `<select>`
- `src/lib/db/tx.ts`, `src/lib/db/index.ts` — `withTxDb()` and the driver-branching `db` singleton
- `node_modules/resend/dist/index.d.mts` — installed SDK's actual TypeScript types (`Attachment.content?: string | Buffer`), read directly rather than assumed from training data
- `src/app/api/admin/invoices/[id]/status/route.test.ts`, `src/lib/automation/invoice-reminder.test.ts` — existing test conventions (mocked db, mocked `sendEmail`, `describeIfDb` gating) to follow for new tests
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/PROJECT.md`, `./CLAUDE.md` — requirement text, locked decisions, project conventions

### Secondary (MEDIUM confidence)
- `npm view resend version` / `npm view @react-pdf/renderer version` (registry check, 2026-07-04) — confirms installed versions are current/compatible
- Resend attachments docs (resend.com/docs/dashboard/emails/attachments) — confirms base64/Buffer content shape and 40MB size limit; cross-verified against installed package's own `.d.mts` types (which is the higher-confidence source and takes precedence where they'd ever disagree)

### Tertiary (LOW confidence)
- None — no unverified claims are relied upon in this document.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all versions verified against the registry and installed `node_modules`.
- Architecture: HIGH — every pattern recommended is a direct extension of an existing, working pattern already in this codebase (migration style, transaction helper, custom dropdown, PDF rendering, email sending).
- Pitfalls: HIGH — sourced directly from existing inline code comments in this repo (e.g. the Buffer/BodyInit trap, the RSC Date-serialization convention, the "never trust the client" transition-guard comment) rather than generic framework knowledge.
- Open questions: flagged honestly where REQUIREMENTS.md is silent (client-id-clearing-on-edit, email-delivery-guarantee-contract) — these need a planning/owner decision, not further research.

**Research date:** 2026-07-04
**Valid until:** ~30 days (stable stack, no fast-moving dependencies; re-verify `resend` version if the phase is planned significantly later than this research, since Resend ships frequent minor releases)
