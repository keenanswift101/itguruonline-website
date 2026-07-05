# Phase 10: Quotations - Research

**Researched:** 2026-07-05
**Domain:** Next.js/Drizzle CRUD feature mirroring an existing, fully-implemented sibling feature (invoicing) in the same codebase
**Confidence:** HIGH

## Summary

Quotations are a near-exact structural clone of the invoicing system built in Phase 4/8, minus SARS-specific machinery (gapless invoice numbering, VAT-free "Tax Invoice" wording, `paid_at`) and plus two new concepts: a `valid_until` date and a draft→sent→accepted/declined lifecycle instead of draft→sent→paid. Because invoicing is fully implemented in this repo (`src/lib/invoices.ts`, `src/lib/invoice-status.ts`, `src/lib/invoice-pdf.tsx`, `src/components/pdf/InvoiceDocument.tsx`, the `/api/admin/invoices*` route tree, `InvoiceForm`/`ClientPicker`/`InvoiceStatusActions`, and `src/app/admin/invoices/*`), this phase should be executed as a disciplined mirror-and-adapt exercise, not a design-from-scratch build.

The single biggest simplification available to this phase: quotations do **not** need the gapless-numbering machinery (`fiscalYear`/`sequenceNumber` + the correlated-subquery atomic UPDATE in the invoice status route) because a quotation is not a SARS fiscal document — a quotation reference derived directly from the serial primary key (`QUO-{id}`) is sufficient, removes an entire class of concurrency/uniqueness code, and requires no new atomic-numbering logic in the status-transition route.

`ClientPicker` (`src/components/forms/ClientPicker.tsx`) and its backing `ClientPickerOption`/`getClientsForPicker()` (`src/lib/client-types.ts`, `src/lib/client-query.ts`) are already generic — the doc comment in `client-types.ts` literally says "shaped for the invoice/**quotation**picker" — so they can be reused completely unmodified by `QuotationForm`. `computeTotals` and `lineItemInput` in `src/lib/invoices.ts` are also generic over `{ quantity, unitPriceRands }` and have no invoice-specific fields; the recommendation is to extract them into a neutral shared module so `quotations.ts` doesn't have to duplicate them or create an awkward `quotations.ts → invoices.ts` import.

**Primary recommendation:** Build quotations as siblings (own schema tables, own routes, own pages, own status map) that reuse `ClientPicker`, `sendEmail`/`emailLayout`, `withTxDb`, and (after a small extraction) `computeTotals`/`lineItemInput` verbatim; do not attempt to parameterize/generalize `InvoiceDocument.tsx` or the invoice API routes themselves — the differences (PAID stamp, invoice-number gapless logic, due-date vs valid-until, no email-on-accept/decline) are numerous enough that a shared parameterized component would need more conditional branches than the ~250-line `InvoiceDocument.tsx` currently has, trading clarity for a marginal DRY win. Extract only the truly-identical low-level pieces (react-pdf StyleSheet, `formatRands`, `computeTotals`, `lineItemInput`) into small shared modules.

## Project Constraints (from CLAUDE.md)

- `requireAdmin()` (from `src/lib/auth.ts`) must be the first check in every new API route handler, mirroring the exact `if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })` pattern used by every invoice route.
- Money is **integer rands**, never cents (Phase 3 convention) — quotation totals/line items follow the same `INTEGER` columns as invoices.
- Any multi-statement atomic write (quotation + line items insert, accepted-quotation → draft-invoice conversion) **must** go through `withTxDb()` (`src/lib/db/tx.ts`) — the default `db` export uses the neon-http driver which cannot run `db.transaction()`.
- Migrations live in `netlify/database/migrations/`, auto-applied on deploy. Next migration number is **0007** (0000 initial → 0006 invoice-client-link already applied).
- IT-Guru is not VAT-registered — no VAT fields/wording anywhere, including the quotation PDF.
- Tailwind v4 canonical arbitrary-value syntax: `text-(--text-secondary)` not `text-[var(--text-secondary)]` — all existing invoice UI already follows this; new quotation UI must match.
- No native `<select>` for anything resembling a picker with rich content — not directly relevant here since `ClientPicker` is a custom listbox already, but keep in mind if any new dropdown (e.g. status filter) is built.
- Outgoing quotation emails must go through `sendEmail()`/`emailLayout()` in `src/lib/email.ts` (table-based HTML, inline styles only) — never hand-roll new email markup.
- Server components by default; `"use client"` only where state/effects are needed (forms, status action buttons — same as `InvoiceForm`/`InvoiceStatusActions`).
- `npm run dev` is NOT used for local testing against the DB — `netlify dev` + `DEV_AUTH_BYPASS=1` is the documented local workflow; irrelevant to research but relevant to how the planner should word verification steps.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUOTE-01 | Create a quotation (client picker or free-text, line items, valid-until date), mirroring invoice creation | Mirror `POST /api/admin/invoices` (`src/app/api/admin/invoices/route.ts`) + `InvoiceForm.tsx`; reuse `ClientPicker`/`getClientsForPicker()` unmodified; schema section below defines `quotations`/`quotation_line_items` (migration 0007) |
| QUOTE-02 | Edit + delete a draft quotation | Mirror `PUT`/`DELETE` in `src/app/api/admin/invoices/[id]/route.ts` — same draft-only write-lock pattern (409 outside draft), same `EditLockError`-inside-transaction technique |
| QUOTE-03 | Mark Sent → emails quotation PDF (labeled "Quotation", no SARS number) to client; blocked if no client email | Mirror `PATCH /api/admin/invoices/[id]/status` draft→sent branch (422 `no_client_email` guard) minus the gapless-numbering UPDATE; new `QuotationDocument.tsx` PDF; `sendEmail()` reused verbatim |
| QUOTE-04 | Status lifecycle draft → sent → accepted/declined (not paid/overdue) | New `src/lib/quotation-status.ts` `ALLOWED_TRANSITIONS` map, modeled on but distinct from `src/lib/invoice-status.ts` |
| QUOTE-05 | Convert accepted quotation → draft invoice in one click, atomic `withTxDb` write | Mirror `src/app/api/admin/crm/[id]/convert/route.ts` idempotency pattern (`AlreadyConvertedError` thrown inside the tx, not pre-checked) using a new `quotations.converted_invoice_id` column |
| QUOTE-06 | List all quotations, filter by status, download quotation PDF | Mirror `src/app/admin/invoices/page.tsx` (list+filter) and `src/app/api/admin/invoices/[id]/pdf/route.tsx` (download, incl. the `Buffer` → `Uint8Array` `BodyInit` fix) |
</phase_requirements>

## Standard Stack

No new libraries are needed. This phase reuses the exact dependencies already installed and used by the invoicing feature:

### Core (already installed — reuse, do not reinstall)
| Library | Version (from package.json) | Purpose | Reused From |
|---------|------|---------|-------------|
| `@react-pdf/renderer` | ^4.5.1 | Server-only PDF rendering | `src/lib/invoice-pdf.tsx`, `src/components/pdf/InvoiceDocument.tsx` |
| `drizzle-orm` | ^0.45.2 | Schema + queries | `src/lib/db/schema.ts` |
| `zod` | ^4.4.3 | Input validation | `src/lib/invoices.ts` (`invoiceInput`, `lineItemInput`) |
| `resend` | ^6.12.4 | Transactional email | `src/lib/email.ts` |
| `@neondatabase/serverless` / `pg` / `ws` | ^1.1.0 / 8.22.0 / ^8.21.0 | `withTxDb` transaction driver split | `src/lib/db/tx.ts` |

**No `npm install` needed for this phase** — every dependency is already a direct dependency in `package.json`. (Verified by reading `package.json` directly rather than assuming; no registry check was necessary since no new package is being added.)

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ID-derived `QUO-{id}` reference number | A second gapless-numbering sequence like invoices (`fiscalYear`/`sequenceNumber`) | Invoices need gapless numbering because SARS requires no missing invoice numbers on issued tax documents. A quotation is not a fiscal/tax document — there is no legal requirement for gapless quote numbers. Reusing the invoice numbering machinery here would import a whole class of concurrency-sensitive SQL (the correlated-subquery atomic UPDATE in `status/route.ts`) for zero compliance benefit. **Recommendation: use the serial PK.** |
| Sibling `QuotationDocument.tsx` | Parameterize `InvoiceDocument.tsx` with a `type: "invoice" | "quotation"` prop | See Architecture Patterns below — recommend sibling + small shared-styles extraction, not full parameterization |

## Architecture Patterns

### Recommended Project Structure (new files only; existing invoice files listed for contrast)

```
netlify/database/migrations/
└── 0007_quotations.sql              # NEW — generate via drizzle-kit, don't hand-write

src/lib/
├── db/schema.ts                     # ADD: quotations, quotationLineItems tables
├── quotations.ts                    # NEW — mirrors invoices.ts (quotationInput zod schema, formatQuotationNumber)
├── quotation-status.ts              # NEW — mirrors invoice-status.ts (ALLOWED_TRANSITIONS, STATUS_BADGE, isExpired)
├── quotation-pdf.tsx                # NEW — mirrors invoice-pdf.tsx (generateQuotationPdfBuffer)
└── billing-shared.ts                # NEW (small extraction) — computeTotals + lineItemInput moved out of invoices.ts

src/components/
├── pdf/
│   ├── pdf-shared.ts                # NEW (small extraction) — shared StyleSheet + formatRands, imported by both documents
│   └── QuotationDocument.tsx        # NEW — sibling to InvoiceDocument.tsx
└── forms/
    ├── QuotationForm.tsx            # NEW — mirrors InvoiceForm.tsx; reuses ClientPicker unmodified
    └── QuotationStatusActions.tsx   # NEW — mirrors InvoiceStatusActions.tsx; new transition set + Convert button

src/app/api/admin/quotations/
├── route.ts                        # NEW — POST only (mirrors invoices/route.ts; no GET, list page queries db directly)
├── [id]/route.ts                   # NEW — PUT, DELETE (mirrors invoices/[id]/route.ts draft-only lock)
├── [id]/status/route.ts            # NEW — PATCH (mirrors invoices/[id]/status/route.ts minus numbering)
├── [id]/resend/route.ts            # NEW (discretionary, recommended) — mirrors invoices/[id]/resend/route.ts
├── [id]/pdf/route.tsx              # NEW — GET download (mirrors invoices/[id]/pdf/route.tsx incl. Uint8Array fix)
└── [id]/convert/route.ts           # NEW — POST (mirrors crm/[id]/convert/route.ts idempotency pattern)

src/app/admin/quotations/
├── page.tsx                        # NEW — list + status filter (mirrors admin/invoices/page.tsx)
├── new/page.tsx                    # NEW — mirrors admin/invoices/new/page.tsx
└── [id]/page.tsx                   # NEW — detail/edit/status/convert (mirrors admin/invoices/[id]/page.tsx)

src/components/admin/AdminSidebar.tsx  # EDIT — add { href: "/admin/quotations", label: "Quotations" } nav entry
```

### Pattern 1: Sibling tables, not a shared polymorphic table
**What:** `quotations` + `quotation_line_items` as fully separate tables from `invoices`/`invoice_line_items`, with their own serial PK, not a shared `documents` table with a `type` discriminator.
**When to use:** Always here — this matches the existing codebase's style (separate `clientRegistrations`/`contactEnquiries` tables rather than a unified "leads" table) and keeps the FK from `quotations.converted_invoice_id → invoices.id` simple and typed.
**Example schema (for migration 0007 / `src/lib/db/schema.ts`):**
```typescript
// Source: mirrors src/lib/db/schema.ts's existing invoices/invoiceLineItems shape (lines 143-186),
// with SARS numbering removed and valid_until + converted_invoice_id added.
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  // Optional link to a stored client (mirrors invoices.clientId — INVOICE-09/10 pattern)
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }),
  billingAddress: text("billing_address"),
  issueDate: date("issue_date").notNull(),
  validUntil: date("valid_until").notNull(),
  // Status: 'draft' | 'sent' | 'accepted' | 'declined' — NOT invoices' draft/sent/paid.
  // varchar(10), not varchar(8) like invoices — "declined"/"accepted" are exactly 8 chars,
  // leaving zero headroom; invoices' varchar(8) is a known tight fit, don't repeat it.
  status: varchar("status", { length: 10 }).notNull().default("draft"),
  totalRands: integer("total_rands").notNull().default(0),
  // QUOTE-05 idempotency — set once, on first successful convert; NULL = not yet converted.
  convertedInvoiceId: integer("converted_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const quotationLineItems = pgTable("quotation_line_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: smallint("quantity").notNull().default(1),
  unitPriceRands: integer("unit_price_rands").notNull(),
  lineTotalRands: integer("line_total_rands").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
});
```
Note: `quotations` must be declared **after** `clients` and **before or after** `invoices` in `schema.ts` — Drizzle's `.references()` uses lazy thunks so forward refs work regardless of declaration order (confirmed: `clientRegistrations`/`contactEnquiries` already forward-reference `clients` which is declared later in the file). Place `quotations`/`quotationLineItems` after `invoices`/`invoiceLineItems` so the `convertedInvoiceId → invoices.id` reference reads naturally, though it isn't required to work.

**Migration generation:** Run `npx drizzle-kit generate` (not hand-written) exactly as Phase 8's migration 0006 was generated, "to guarantee constraint-naming/style parity" (per STATE.md's own decision log for 0006). Verify the generated SQL is additive-only (`CREATE TABLE` + `ADD CONSTRAINT`, no `DROP`).

### Pattern 2: Reference number = padded serial PK, not a second numbering sequence
**What:** `formatQuotationNumber(id: number): string` returns `QUO-${String(id).padStart(4, "0")}` — no draft/DRAFT distinction is needed because the ID exists from creation (unlike invoices, which hide the number until `sent`).
**When to use:** Always for this phase — see Standard Stack's Alternatives table for the compliance rationale.
**Example:**
```typescript
// Source: pattern mirrors src/lib/invoices.ts's formatInvoiceNumber, simplified —
// no fiscalYear/sequenceNumber inputs since there is no gapless-numbering requirement.
export function formatQuotationNumber(id: number): string {
  return `QUO-${String(id).padStart(4, "0")}`;
}
```
This also means the **quotation reference is stable and known immediately at creation** (in the New Quotation confirmation, in the PDF even while draft) — a genuine UX improvement over invoices' "DRAFT" placeholder, worth calling out to the owner as an intentional difference, not an oversight.

### Pattern 3: Sibling PDF document with a small shared-styles extraction (answers key question 2)
**What:** Do not parameterize `InvoiceDocument.tsx`. Create `src/components/pdf/QuotationDocument.tsx` as a structural sibling. Extract only the identical low-level building blocks — the react-pdf `StyleSheet.create({...})` object (page/header/table/footer styles are 100% identical) and the `formatRands` helper — into `src/components/pdf/pdf-shared.ts`, imported by both `InvoiceDocument.tsx` and `QuotationDocument.tsx`.
**When to use:** When two react-pdf documents share styling but differ meaningfully in conditional JSX (PAID stamp vs none, invoice-number line vs quotation-ref + valid-until line, bank-details footer vs a validity/terms footer).
**Why not parameterize:** `InvoiceDocument` already branches on `invoice.status === "draft"` (heading text) and `invoice.status === "paid"` (stamp). Adding `type: "invoice" | "quotation"` would require every content block (header meta row, footer) to also branch on `type`, and the props interface would need two full parallel sets of optional fields (`fiscalYear`/`sequenceNumber` for invoices vs `validUntil` for quotations). That produces a component that's harder to read than two ~200-line siblings that share only styling.
**Example — QuotationDocument differences from InvoiceDocument:**
```typescript
// heading logic — no "paid" state to distinguish
const heading = quotation.status === "draft" ? "Draft Quotation" : "Quotation";
const reference = formatQuotationNumber(quotation.id);

// meta row — Issue Date + Valid Until, not Issue Date + Due Date
<View style={styles.dateRow}>
  <Text style={styles.dateLabel}>Valid Until</Text>
  <Text style={styles.dateValue}>{quotation.validUntil}</Text>
</View>

// footer — recommend replacing "Payment via EFT" bank details with validity/terms text.
// Rationale (flag to owner as a judgement call, not a hard requirement): leaking bank
// account details on a document the client hasn't yet accepted is unnecessary exposure;
// bank details belong on the invoice generated after QUOTE-05 conversion, not the quote.
<Text style={styles.footerHeading}>Validity</Text>
<Text style={styles.clientLine}>
  This quotation is valid until {quotation.validUntil}. All prices in South African Rand (ZAR).
</Text>
```
`src/lib/quotation-pdf.tsx` mirrors `src/lib/invoice-pdf.tsx` exactly — a single `generateQuotationPdfBuffer(quotation, lineItems)` function calling `renderToBuffer(<QuotationDocument .../>)`, reused by both the download route and the send/resend email paths (same "never drift" rationale documented in the existing file's comment).

### Pattern 4: Status transitions — new, smaller ALLOWED_TRANSITIONS map (answers key question 3)
**What:** `src/lib/quotation-status.ts` exports its own transition map, structurally like `invoice-status.ts`'s but for a different state machine with no numbering side-effect.
**Recommended map** (draft/sent/accepted/declined are terminal-leaning, per QUOTE-04's literal wording "draft → sent → accepted / declined"):
```typescript
export type QuotationStatus = "draft" | "sent" | "accepted" | "declined";

const ALLOWED_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "declined", "draft"], // "draft" = revert-to-draft, mirrors INVOICE-13's Unpublish-replacement pattern for owner mistake correction
  accepted: [],   // terminal — QUOTE-05 conversion depends on this status being stable
  declined: ["sent"], // owner can re-open a declined quote and re-send (e.g. client changed their mind)
};
```
**Why `accepted` has no outgoing transitions:** Once `convertedInvoiceId` may be set (QUOTE-05), allowing `accepted → sent/declined` would let the owner mutate the status of a quotation that's already spawned a real invoice, with no code path to un-spawn it. Keeping `accepted` terminal keeps the convert operation's idempotency guarantee simple: "an invoice was created from this quotation, that's now permanent history." If the owner needs to change their mind after accepting, they should decline/cancel the *invoice*, not reopen the quote — this mirrors how a `paid` invoice can go back to `sent` (a correctable clerical event) but `invoices` never lets you un-set the fiscal number once assigned.
**Flag for planner:** This `accepted: []` / `declined: ["sent"]` shape is this researcher's judgement call to satisfy QUOTE-04's literal requirement while keeping QUOTE-05 safe — it is not explicitly locked by CONTEXT.md (no CONTEXT.md exists for this phase) or REQUIREMENTS.md. The planner should treat the `sent → draft` revert and `declined → sent` un-decline as **discretionary additions**, not hard requirements; the strictly-required transitions are only `draft→sent`, `sent→accepted`, `sent→declined`.

`STATUS_BADGE` mirrors `invoice-status.ts`'s shape with `draft`/`sent`/`accepted`/`declined` labels. Recommend adding an `isExpired(status, validUntil)` computed-at-read-time helper mirroring `isOverdue` exactly (`status === "sent" && new Date(validUntil) < today`) — this is a natural, cheap parity feature given `valid_until` exists, though QUOTE-04/06 don't explicitly ask for an "Expired" badge. Flag as discretionary but low-cost/high-value.

### Pattern 5: Email-on-send (answers key question 5) — reuse exactly, no numbering step
**What:** The quotation status route's `draft → sent` branch mirrors the invoice route's branch structurally but **omits the atomic gapless-numbering UPDATE entirely** (that whole `sql\`UPDATE invoices SET ... sequence_number = (SELECT COALESCE(MAX...)+1 ...)\`` block in `src/app/api/admin/invoices/[id]/status/route.ts` lines 83-94 has no quotation equivalent).
**Example (the quotation status route's draft→sent branch, condensed):**
```typescript
// Source: mirrors src/app/api/admin/invoices/[id]/status/route.ts's draft→sent branch,
// with the fiscal numbering UPDATE removed — a plain status UPDATE is sufficient because
// formatQuotationNumber(id) needs no assignment step (the id already exists).
if (q.status === "draft" && target === "sent") {
  if (!q.clientEmail) {
    return NextResponse.json({ error: "no_client_email" }, { status: 422 }); // QUOTE-03, mirrors INVOICE-12
  }

  await db.update(quotations).set({ status: "sent" }).where(eq(quotations.id, numId));

  const [updated] = await db.select().from(quotations).where(eq(quotations.id, numId));
  const lineItems = await db.select().from(quotationLineItems)
    .where(eq(quotationLineItems.quotationId, numId))
    .orderBy(asc(quotationLineItems.sortOrder), asc(quotationLineItems.id));
  const pdfBuffer = await generateQuotationPdfBuffer(updated, lineItems);
  const reference = formatQuotationNumber(updated.id);
  await sendEmail({
    to: updated.clientEmail!,
    subject: `Quotation ${reference} from IT-Guru Online`,
    html: emailLayout(`Quotation ${reference}`, `<p>Good day,</p><p>Please find quotation ${reference} attached as a PDF, valid until ${updated.validUntil}. If you have any questions, simply reply to this email.</p><p>Thank you,<br/>IT-Guru Online</p>`),
    attachments: [{ filename: `Quotation-${reference}.pdf`, content: pdfBuffer }],
  });
}
```
`sendEmail()` never throws (fire-and-forget, per its own doc comment) — same guarantee invoices rely on, so a Resend hiccup cannot roll back the `sent` status here either.

### Pattern 6: QUOTE-05 convert-to-invoice — mirrors the Phase 6 lead-conversion idempotency pattern exactly (answers key question 4)
**What:** `POST /api/admin/quotations/[id]/convert` follows `src/app/api/admin/crm/[id]/convert/route.ts`'s exact shape: an `AlreadyConvertedError` class thrown **inside** the `withTxDb` transaction (re-checked at write time, not pre-checked with a separate read before the transaction opens) so a race between two rapid clicks cannot double-convert.
**Example:**
```typescript
// Source: mirrors src/app/api/admin/crm/[id]/convert/route.ts's AlreadyConvertedError pattern,
// adapted for quotation → draft invoice + line items instead of lead → client.
class AlreadyConvertedError extends Error {}
class InvalidStateError extends Error {}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const invoice = await withTxDb((db) =>
      db.transaction(async (tx) => {
        const [q] = await tx.select().from(quotations).where(eq(quotations.id, numId));
        if (!q) throw new Error("NOT_FOUND");
        if (q.convertedInvoiceId != null) throw new AlreadyConvertedError();
        if (q.status !== "accepted") throw new InvalidStateError();

        const lineItems = await tx.select().from(quotationLineItems)
          .where(eq(quotationLineItems.quotationId, numId))
          .orderBy(asc(quotationLineItems.sortOrder), asc(quotationLineItems.id));

        const today = new Date();
        const issueDateStr = today.toISOString().slice(0, 10);
        // 30-day default due date — matches src/lib/automation/recurring-billing.ts's
        // existing convention (`now + 30 * 24 * 60 * 60 * 1000`), not an invented number.
        const dueDateStr = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const [invoice] = await tx.insert(invoices).values({
          clientId: q.clientId,
          clientName: q.clientName,
          clientEmail: q.clientEmail,
          billingAddress: q.billingAddress,
          issueDate: issueDateStr,
          dueDate: dueDateStr,
          totalRands: q.totalRands,
          // status defaults to 'draft' in the schema — QUOTE-05 requires draft, not sent.
        }).returning();

        if (lineItems.length) {
          await tx.insert(invoiceLineItems).values(
            lineItems.map((l, idx) => ({
              invoiceId: invoice.id,
              description: l.description,
              quantity: l.quantity,
              unitPriceRands: l.unitPriceRands,
              lineTotalRands: l.lineTotalRands,
              sortOrder: idx,
            }))
          );
        }

        await tx.update(quotations).set({ convertedInvoiceId: invoice.id }).where(eq(quotations.id, numId));

        return invoice;
      })
    );
    return NextResponse.json({ id: invoice.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AlreadyConvertedError) {
      return NextResponse.json({ error: "Quotation already converted." }, { status: 409 });
    }
    if (err instanceof InvalidStateError) {
      return NextResponse.json({ error: "Only accepted quotations can be converted." }, { status: 409 });
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }
    throw err;
  }
}
```
**Flag for planner (due date default):** REQUIREMENTS.md doesn't specify a due date for the generated invoice. The 30-day default above is not invented — it matches the exact convention already used by `src/lib/automation/recurring-billing.ts` (`dueDateObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)`). Confirm with the planner/owner whether 30 days is the desired default or whether it should instead reuse the quotation's own `validUntil` as some kind of anchor — flagged as an open question below, not locked.

### Anti-Patterns to Avoid
- **Reusing invoice numbering/fiscal-year logic for quotations:** No compliance reason exists; it would only add concurrency-sensitive SQL for no benefit. Use the serial PK instead (Pattern 2).
- **Allowing `accepted → sent/declined` transitions:** Breaks the QUOTE-05 idempotency invariant that "converted" means permanent. Keep `accepted` terminal (Pattern 4).
- **Duplicating `computeTotals`/`lineItemInput` verbatim into `quotations.ts`:** They are generic; duplicating them (rather than extracting to a shared module) creates two sources of truth for a pure function with zero invoice-specific logic. See Don't Hand-Roll below.
- **Building a new `ClientPicker`/`getClientsForPicker` for quotations:** Already generic and explicitly documented as shared (`client-types.ts`'s doc comment literally names "invoice/quotation picker"). Import and use as-is.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client search/select UI | A new `QuotationClientPicker` | `src/components/forms/ClientPicker.tsx` (unmodified) + `getClientsForPicker()` from `src/lib/client-query.ts` | Already generic, already documented as shared between invoice and quotation pickers, zero quotation-specific code needed |
| Line-item total math | A new `computeQuotationTotals` | Extract `computeTotals` (currently in `src/lib/invoices.ts`) into `src/lib/billing-shared.ts`, import from both `invoices.ts` and `quotations.ts` | The function is `<T extends { quantity: number; unitPriceRands: number }>` — already fully generic, no invoice fields touched |
| Line-item zod validation | A new `quotationLineItemInput` schema | Extract `lineItemInput` alongside `computeTotals` into the same shared module | Identical shape (`description`/`quantity`/`unitPriceRands`), no invoice-specific fields |
| Multi-statement atomic writes | Any bespoke transaction wrapper | `withTxDb()` from `src/lib/db/tx.ts` (unmodified) | The neon-http driver cannot run `db.transaction()` at all — this is a hard platform constraint, not a style preference; every atomic write in the codebase already goes through this one helper |
| PDF byte generation | A new renderer setup | `@react-pdf/renderer`'s `renderToBuffer`, following the exact `generateInvoicePdfBuffer` → `generateQuotationPdfBuffer` pattern in a new `src/lib/quotation-pdf.tsx` | Already proven in production (Phase 8), including the Buffer→Uint8Array `BodyInit` workaround needed for the download route |
| Outgoing email delivery/branding | New email HTML | `sendEmail()` + `emailLayout()` from `src/lib/email.ts` (unmodified) | Table-based inline-style HTML is load-bearing for Outlook/webmail rendering; BCC-to-`info@it-guru.co.za` behavior is centralized there and must not be reimplemented |
| Idempotent one-click conversion | A pre-check-then-write pattern (`if already converted, error` as a separate SELECT before the transaction) | The `AlreadyConvertedError`-thrown-inside-the-transaction pattern from `src/app/api/admin/crm/[id]/convert/route.ts` | A separate pre-check has a race window between the check and the write under concurrent double-clicks; throwing inside the transaction after re-reading current state closes that window, and this exact pattern is already proven and tested in this codebase |

**Key insight:** Almost nothing in this phase is a genuinely new problem — the codebase already solved "atomic multi-table write," "idempotent one-click conversion," "generic client picker," "branded transactional email," and "server-rendered PDF" for a near-identical entity. The only genuinely new decisions are (1) dropping SARS numbering in favor of an ID-derived reference, and (2) the accepted/declined status shape.

## Common Pitfalls

### Pitfall 1: `varchar(8)` status column reused verbatim from invoices
**What goes wrong:** Invoices' `status` column is `varchar(8)` because `"draft"`/`"sent"`/`"paid"` all fit comfortably. If a plan copy-pastes that column definition for quotations, `"declined"` (8 chars) and `"accepted"` (8 chars) fit *exactly* but leave zero headroom — any future status addition (e.g. "expired", 7 chars — fine, but "cancelled", 9 chars — would silently truncate to "cancelle" without a NOT NULL/CHECK failure, since Postgres varchar truncates on INSERT only if you don't use the exact stored value from a controlled enum; more critically, a typo'd length calculation could silently pass code review since both current statuses fit).
**Why it happens:** Copy-pasting the invoice schema without recomputing the max string length for the new status set.
**How to avoid:** Use `varchar(10)` or `varchar(20)` for `quotations.status` — cheap and removes the whole class of risk.
**Warning signs:** A migration or Drizzle schema diff showing `varchar(8)` on the new `quotations.status` column.

### Pitfall 2: Buffer vs BodyInit on the PDF download route
**What goes wrong:** `renderToBuffer()` returns `Buffer<ArrayBufferLike>`, which the DOM `BodyInit` type (used by `Response`) rejects under this project's `tsconfig` even though it works at runtime.
**Why it happens:** TypeScript's DOM lib types are stricter than what Node's `Buffer` actually satisfies at runtime.
**How to avoid:** Wrap in `new Uint8Array(buffer)` before passing to `new Response(...)`, exactly as `src/app/api/admin/invoices/[id]/pdf/route.tsx` line 43 already does — copy this verbatim into the quotation PDF route.
**Warning signs:** A TypeScript build error on `new Response(buffer, ...)` in the new quotation PDF route.

### Pitfall 3: Date serialization across the RSC boundary
**What goes wrong:** Postgres `timestamp` columns (`createdAt`/`updatedAt`) come back as JS `Date` objects from Drizzle; passing a raw `Date` from a server component into a client component prop throws a serialization error (or silently stringifies inconsistently). `date` columns (`issueDate`, `validUntil`, `dueDate`) are already plain strings from Postgres — no conversion needed for those, per the existing `client-types.ts` comment: *"issue/due dates are Postgres DATE columns that Drizzle already returns as plain strings."*
**Why it happens:** Conflating `timestamp` columns (need `.toISOString()`) with `date` columns (already strings) — an easy mistake when adding a `paidAt`-like field, which quotations should not have anyway.
**How to avoid:** Only pass `validUntil`/`issueDate` (already strings) into client components; never pass `createdAt`/`updatedAt` directly into `"use client"` components without `.toISOString()` first (mirror how `getClients()` in `client-query.ts` does `createdAt: c.createdAt.toISOString()`).
**Warning signs:** A Next.js "Only plain objects can be passed to Client Components" runtime error, or a client component receiving `[object Object]` where a date string was expected.

### Pitfall 4: `requireAdmin()` placement — must precede all body/param parsing
**What goes wrong:** If validation (zod parse) or DB reads happen before the `requireAdmin()` check, an unauthenticated request can trigger 400/422 responses instead of 401, leaking information about validation rules to unauthenticated callers and failing the existing non-DB-guard test convention (`"returns 401 even with a valid-shaped body (requireAdmin is first)"` in `src/app/api/admin/invoices/route.test.ts`).
**Why it happens:** Natural code-writing order tends to validate input before checking auth.
**How to avoid:** Every new quotation route handler's first two lines must be the `requireAdmin()` check and its 401 early-return, exactly matching every existing invoice route.
**Warning signs:** A test that POSTs an invalid body with no session cookie and expects 401, but gets 400/422 instead.

### Pitfall 5: Entangling quotation status logic with invoice gapless-numbering logic
**What goes wrong:** Because `ALLOWED_TRANSITIONS` and the numbering UPDATE live in the same file/function for invoices (`status/route.ts`), a naive mirror might try to reuse or generalize that function with a `hasNumbering: boolean` flag. This conflates two independently-varying concerns (status validity vs. numbering side-effect) into one function signature.
**Why it happens:** The invoice status route currently interleaves "is this transition allowed" with "what side-effect does this transition trigger" in one large `if/else if` chain — a reasonable design for one entity, but tempting to over-generalize across two entities.
**How to avoid:** Write `src/app/api/admin/quotations/[id]/status/route.ts` as a fully separate file with its own `ALLOWED_TRANSITIONS` import from `quotation-status.ts` and its own `if/else if` chain with no numbering branch at all — don't attempt to share the route handler logic itself, only the *pattern* (mirror the shape, not the code).
**Warning signs:** Any new shared function taking a `documentType` or `hasNumbering` parameter that branches internally between invoice and quotation semantics.

### Pitfall 6: react-pdf StyleSheet objects are not deeply mergeable at runtime the way CSS classes are
**What goes wrong:** If the shared `pdf-shared.ts` module tries to let `QuotationDocument` "override" a couple of style keys via object spread (`{ ...styles.footer, backgroundColor: "..." }`), react-pdf's `StyleSheet.create` return type doesn't support arbitrary post-hoc mutation the way Tailwind classes do — this can produce subtly wrong layouts (e.g., losing `position: "absolute"` on the footer) if done carelessly.
**Why it happens:** Assuming react-pdf styles behave like CSS-in-JS with cascade/override semantics.
**How to avoid:** Import the *entire* shared `styles` object as-is into `QuotationDocument.tsx` and only vary which `<Text>`/`<View>` elements are rendered (conditional JSX), not which style properties are merged. This is exactly how `InvoiceDocument.tsx` already varies its own output today (conditionally rendering `styles.paidStamp` only when `status === "paid"`, never mutating the style object).
**Warning signs:** A quotation PDF with a footer that isn't pinned to the bottom of the page, or text that overflows unexpectedly compared to the invoice PDF.

## Code Examples

See Architecture Patterns section above (Patterns 1-6) — all code examples are inline there with source attribution to the exact existing file/line being mirrored, since this phase's primary source of truth is this repository's own invoicing implementation rather than external documentation.

## State of the Art

Not applicable in the usual "library version drift" sense — this phase's "state of the art" is entirely internal to this codebase (Phase 4/8's invoicing implementation), which was read directly rather than assumed from training data.

| Old Approach (invoices, Phase 4/8) | New Approach (quotations, Phase 10) | Why Changed | Impact |
|--------------------------------------|--------------------------------------|-------------|--------|
| Gapless `fiscalYear`/`sequenceNumber` assigned atomically on draft→sent | Reference number derived directly from serial PK, available from creation | No SARS/fiscal compliance requirement for quotations | Simpler status route (no correlated-subquery UPDATE); reference number is stable even in draft (a UX improvement, not just a simplification) |
| `draft → sent → paid` status lifecycle with computed `Overdue` | `draft → sent → accepted/declined` lifecycle with computed `Expired` (recommended) | Requirement QUOTE-04 explicitly changes the lifecycle semantics | New `quotation-status.ts` instead of reusing `invoice-status.ts` |
| `paidAt` timestamp + "Undo Paid" button | No paid-equivalent; `converted_invoice_id` marks terminal success state | A quotation's "success" state is conversion to an invoice, not payment | `QuotationStatusActions.tsx` shows a "Convert to Invoice" button instead of a "Mark Paid" button when `status === "accepted"` |

**Deprecated/outdated:** Nothing — this is a greenfield addition alongside a still-current sibling feature.

## Open Questions

1. **Default due date on the invoice created by QUOTE-05 conversion**
   - What we know: REQUIREMENTS.md doesn't specify one. The codebase's existing convention for auto-generated invoices (`recurring-billing.ts`) is `issueDate = today`, `dueDate = today + 30 days`.
   - What's unclear: Whether the owner wants the converted invoice's due date to instead be relative to the quotation's `validUntil`, or configurable.
   - Recommendation: Use the existing 30-day convention (Pattern 6 above) since it's already established elsewhere in this codebase and requires no new decision; flag to the owner during plan review as a one-line assumption, easy to change if wrong.

2. **Should the quotation PDF's footer retain EFT bank details?**
   - What we know: Invoices show bank details in the footer because they're a request for payment. A quotation is a proposal, not yet accepted.
   - What's unclear: Owner's preference — some businesses do include bank details on quotes as a convenience/pre-fill for the client's own reference.
   - Recommendation: Replace the footer with validity/terms text instead of bank details (Pattern 3), since it avoids exposing payment details before a commitment exists; this is a one-line change if the owner disagrees during review.

3. **Is a `resend` endpoint for quotations actually wanted?**
   - What we know: QUOTE-03/06 don't explicitly ask for a resend action; invoices have one (INVOICE-13) because email delivery can fail and owners need a retry path.
   - What's unclear: Whether the owner considers this in-scope for v2.1 Phase 10 or a future nice-to-have.
   - Recommendation: Include it — it's a ~15-line mirror of `src/app/api/admin/invoices/[id]/resend/route.ts` with no new logic, and the same failure mode (Resend API hiccup) applies equally to quotations. Low cost, meaningful parity with the sibling feature the owner already uses.

## Environment Availability

Skipped — this phase introduces no new external dependencies, tools, or services. All required libraries (`@react-pdf/renderer`, `resend`, `drizzle-orm`, `zod`) are already installed direct dependencies (verified via `package.json`), and the only external service touched (Resend, for email) is already configured and working per Phase 8.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v4.1.9 |
| Config file | `vitest.config.ts` (environment: `node`, include: `src/**/*.test.ts`, testTimeout 15000ms) |
| Quick run command | `npx vitest run src/lib/quotations.test.ts` (or any specific new test file) |
| Full suite command | `npm run test` (→ `vitest run`) |

Note: `vitest.config.ts`'s `include` glob is `src/**/*.test.ts` (not `.test.tsx`) — the existing `invoice-pdf.test.ts` (which tests a `.tsx` source file) is itself named with a `.ts` extension; follow the same convention for `quotation-pdf.test.ts`.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUOTE-01 | `computeTotals`/reference-number formatting are correct; POST creates draft quotation + line items; 422 on missing required fields; 401 before validation | unit + route (mocked + DB-gated) | `npx vitest run src/lib/quotations.test.ts` / `npx vitest run src/app/api/admin/quotations/route.test.ts` | ❌ Wave 0 — mirror `src/app/api/admin/invoices/route.test.ts` structure exactly |
| QUOTE-02 | PUT/DELETE only succeed on draft status, 409 otherwise | route (mocked + DB-gated) | `npx vitest run src/app/api/admin/quotations/[id]/route.test.ts` | ❌ Wave 0 — mirror `src/app/api/admin/invoices/[id]/route.test.ts` |
| QUOTE-03 | draft→sent blocked with 422 `no_client_email`; email sent (mocked Resend) with PDF attachment on success | route (mocked db + mocked resend) | `npx vitest run src/app/api/admin/quotations/[id]/status/route.test.ts` | ❌ Wave 0 — mirror `src/app/api/admin/invoices/[id]/status/route.test.ts`'s `vi.mock("resend", ...)` pattern (must use `function` not arrow fn, per existing comment) |
| QUOTE-04 | `ALLOWED_TRANSITIONS` map rejects invalid transitions (409); `STATUS_BADGE`/`isExpired` pure-function correctness | unit | `npx vitest run src/lib/quotation-status.test.ts` | ❌ Wave 0 |
| QUOTE-05 | Convert only from `accepted`; 409 on double-convert (idempotency); atomic invoice+line-items insert; `converted_invoice_id` stamped | route (DB-gated, `describeIfDb` pattern) | `npx vitest run src/app/api/admin/quotations/[id]/convert/route.test.ts` | ❌ Wave 0 — no existing test file to copy for the convert-route shape itself (`crm/[id]/convert/route.ts` currently has **no** test file in this repo), so this test must be authored from the route's own logic; use `status/route.test.ts`'s mocked-db describe blocks as the closest structural template for the non-DB-integration portion |
| QUOTE-06 | List page renders + filters by status (manual/visual, RSC page); PDF download route returns `application/pdf` with correct filename; 401 without session | route (mocked + DB-gated) | `npx vitest run src/app/api/admin/quotations/[id]/pdf/route.test.ts` | ❌ Wave 0 — mirror `src/app/api/admin/invoices/[id]/pdf/route.test.ts` |

### Sampling Rate
- **Per task commit:** run the specific new/changed test file (`npx vitest run <file>`).
- **Per wave merge:** `npm run test` (full suite) — must stay green; DB-gated tests (`describeIfDb`) only run when `NETLIFY_DB_URL` is set in the test environment (matches existing convention; they `describe.skip` otherwise, so CI without a DB still passes cleanly).
- **Phase gate:** Full suite green before `/gsd:verify-work`, plus a manual pass of the list/detail pages (RSC pages have no automated render test in this codebase's existing convention — invoices' list/detail pages also have no dedicated `.test.ts`, only their API routes are tested).

### Wave 0 Gaps
- [ ] `src/lib/billing-shared.ts` — extraction target for `computeTotals`/`lineItemInput` out of `src/lib/invoices.ts`; needs its own or continued test coverage (currently covered indirectly via `src/app/api/admin/invoices/route.test.ts`'s "`src/lib/invoices helpers`" describe block — decide whether to move those assertions to a new `billing-shared.test.ts` or leave them importing from the new location transparently, since `invoices.ts` can simply re-export)
- [ ] `src/lib/quotations.test.ts` — new, covers `formatQuotationNumber` and the `quotationInput` zod schema
- [ ] `src/lib/quotation-status.test.ts` — new, covers `ALLOWED_TRANSITIONS`/`STATUS_BADGE`/`isExpired`
- [ ] `src/lib/quotation-pdf.test.ts` — new stub, mirrors the existing `it.todo(...)` placeholder style in `invoice-pdf.test.ts`
- [ ] All new route `.test.ts` files listed in the table above — no framework/config changes needed, only new test files following the exact `vi.mock("next/headers", ...)` + `signSession` + `describeIfDb` conventions already established across every existing invoice route test

*No test framework installation or config changes needed — Vitest is already fully configured and the conventions are well-established across 5+ existing route test files.*

## Sources

### Primary (HIGH confidence — direct repository inspection, not training data)
- `C:\Users\keena\Projects\it-guru-website\src\lib\db\schema.ts` — invoices/invoiceLineItems/clients table shapes
- `C:\Users\keena\Projects\it-guru-website\src\lib\invoices.ts`, `invoice-status.ts` — zod schema, `computeTotals`, `formatInvoiceNumber`, status badges
- `C:\Users\keena\Projects\it-guru-website\src\app\api\admin\invoices\route.ts`, `[id]/route.ts`, `[id]/status/route.ts`, `[id]/resend/route.ts`, `[id]/pdf/route.tsx` — full route implementations
- `C:\Users\keena\Projects\it-guru-website\src\lib\invoice-pdf.tsx`, `src\components\pdf\InvoiceDocument.tsx` — PDF generation
- `C:\Users\keena\Projects\it-guru-website\src\lib\email.ts` — `sendEmail`/`emailLayout`
- `C:\Users\keena\Projects\it-guru-website\src\components\forms\InvoiceForm.tsx`, `ClientPicker.tsx`, `InvoiceStatusActions.tsx`
- `C:\Users\keena\Projects\it-guru-website\src\app\admin\invoices\page.tsx`, `new\page.tsx`, `[id]\page.tsx`
- `C:\Users\keena\Projects\it-guru-website\src\components\admin\AdminSidebar.tsx`
- `C:\Users\keena\Projects\it-guru-website\src\lib\client-types.ts`, `client-query.ts` — already-generic `ClientPickerOption`/`getClientsForPicker`
- `C:\Users\keena\Projects\it-guru-website\src\app\api\admin\crm\[id]\convert\route.ts` — idempotent-conversion pattern
- `C:\Users\keena\Projects\it-guru-website\src\lib\db\tx.ts` — `withTxDb` transaction helper and its documented rationale
- `C:\Users\keena\Projects\it-guru-website\src\lib\automation\recurring-billing.ts` — 30-day due-date default convention
- `C:\Users\keena\Projects\it-guru-website\netlify\database\migrations\0005_clients.sql`, `0006_invoice_client_link.sql` — migration style/naming to mirror for 0007
- `C:\Users\keena\Projects\it-guru-website\src\lib\auth.ts` — `requireAdmin()` implementation
- `C:\Users\keena\Projects\it-guru-website\package.json`, `vitest.config.ts` — confirmed dependency versions and test config directly, no assumption
- `C:\Users\keena\Projects\it-guru-website\.planning\REQUIREMENTS.md`, `STATE.md`, `PROJECT.md` — phase requirements and locked v2.1 decisions
- Existing test files (`route.test.ts` for invoices create/status/pdf) — confirmed exact testing conventions (`vi.mock("next/headers")`, `describeIfDb`, Resend mock-as-function-not-arrow requirement)

### Secondary (MEDIUM confidence)
- None used — no WebSearch/Context7 lookups were needed since this phase is entirely internal-codebase mirroring with no new external library surface.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all versions read directly from `package.json`
- Architecture: HIGH — every pattern is a direct mirror of already-shipped, already-tested code in this same repository
- Pitfalls: HIGH — every pitfall listed was either directly observed in the existing invoice code (Buffer/BodyInit comment, date-serialization comment) or is a straightforward consequence of the schema/status design decisions made in this document
- Status-map/PDF-footer/due-date judgement calls: MEDIUM — these are this researcher's reasoned recommendations where REQUIREMENTS.md/CONTEXT.md leave a genuine gap; flagged explicitly as Open Questions and discretionary points above rather than stated as settled fact

**Research date:** 2026-07-05
**Valid until:** No external expiry — this research is anchored to the current state of this repository's own code, which only changes when the repository changes. Re-verify only if the invoicing feature (`src/lib/invoices.ts` et al.) is itself refactored before Phase 10 executes.
