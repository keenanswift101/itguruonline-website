# Phase 4: Invoicing — Research

**Researched:** 2026-07-01
**Domain:** Invoice lifecycle management — PDF generation, gapless numbering, Drizzle schema, Next.js route handlers
**Confidence:** HIGH (most findings verified via official docs or npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 PDF:** `@react-pdf/renderer` only. Server-side Route Handler. No headless browser. Draft PDFs show "DRAFT" heading and no invoice number; Sent/Paid show INV-YYYY-NNN. Response: `Content-Type: application/pdf`, `Content-Disposition: attachment`.
- **D-02 Line items:** `description TEXT` + `quantity SMALLINT` (min 1) + `unit_price_rands INTEGER` + `line_total_rands INTEGER` (stored). Invoice `total_rands INTEGER` denormalized, recomputed on every save.
- **D-03 Create form:** Free-text client info (no CRM FK). Fields: client name, email, billing address, issue date (today default), due date (required). Inline line items on same form. One-step form. Saving → Draft.
- **D-04 Numbering:** Format `INV-YYYY-NNN`. `fiscal_year INT` + `sequence_number INT` both NULL while Draft. Number assigned at Draft→Sent. Atomic sequence assignment inside Postgres transaction.
- **D-05 Labeling:** "Invoice" / "Draft Invoice" only. Never "Tax Invoice", never VAT fields.
- **D-06 Status:** `VARCHAR(8)`: `'draft'` | `'sent'` | `'paid'`. Overdue is computed at read time (not stored). `sent→draft` clears fiscal_year/sequence_number (Claude's recommendation, per context).
- **D-07 Edit lock:** Only Draft invoices editable. `PUT /api/admin/invoices/[id]` returns 409 if `status != 'draft'`.
- **D-08 Export:** CSV only. Pattern from Phase 2 CRM-07.
- **D-09 Mark paid:** `PATCH /api/admin/invoices/[id]/status` sets `paid_at = NOW()`.
- **Money convention:** INTEGER rands (not cents), matching Phase 3.

### Claude's Discretion

- Exact DB column names (follow Phase 1–3 conventions)
- Admin invoice list columns and UX
- PDF visual design (logo, bank details in footer, "Thank you" sign-off)
- Status badge colors (draft=gray, sent=cobalt blue, paid=green, overdue=red)
- Whether `sent→draft` retains or clears invoice number (recommendation: clear)
- Error handling for duplicate status transitions
- Whether PDF includes "Due" vs "Paid" stamp visual treatment
- Sort order column for line items (move up/move down buttons)
- Money display on invoice: `R {price.toFixed(2)}` for formal presentation

### Deferred Ideas (OUT OF SCOPE)

- CRM record linkage (invoice→registration FK) — later phase
- Recurring auto-generation — Phase 5
- Online payment link on PDF — v2+
- PDF list export — out of scope; CSV is sufficient
- Multi-line bank details configurability — hardcode in PDF component
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INVOICE-01 | Owner can manually create an invoice with line items, amount, due date | D-03 create form, Drizzle INSERT pattern, POST route |
| INVOICE-02 | Owner can edit a Draft invoice before sending | D-07 edit lock, PUT route 409 enforcement |
| INVOICE-03 | Sequential gapless numbering, plain "Invoice" labeling (no VAT) | Gapless numbering pattern via serializable transaction (Section 2), D-05 |
| INVOICE-04 | Track status Draft/Sent/Paid; Overdue computed automatically | D-06 status model, computed-at-read pattern |
| INVOICE-05 | Mark as paid manually | D-09 PATCH route pattern |
| INVOICE-06 | Download invoice as PDF | D-01 react-pdf, Section 1 Route Handler pattern |
| INVOICE-07 | Export invoice list as CSV | D-08 CSV route, Phase 2 pattern reuse |
</phase_requirements>

---

## RESEARCH COMPLETE

### Executive Summary

- **`@react-pdf/renderer` is in Next.js's built-in auto-externalized package list**, so no manual `serverExternalPackages` config is needed in `next.config.ts`. Version 4.5.1 declares React 16–19 peer compatibility. The `renderToBuffer` function is the correct server-side API; import from `@react-pdf/renderer`. Known issues with Next.js 15/16 exist in open GitHub issues (Feb 2025), but the package is on the auto-external list and React 19 support was resolved in v4.1.0. Risk: LOW but verify locally on first task.
- **The `@netlify/neon` HTTP driver does NOT support `FOR UPDATE` row locking.** The HTTP transport is non-interactive — it cannot hold a lock across a round-trip. For gapless numbering, the recommended safe alternative is a `SERIALIZABLE` isolation-level transaction containing `SELECT MAX(sequence_number) + 1 ... WHERE fiscal_year = $year` + `INSERT`, issued via the `@neondatabase/serverless` WebSocket driver (`Pool`/`Client`). This requires installing `@neondatabase/serverless` + `ws` and creating a one-off WebSocket client inside the PATCH status route.
- **Drizzle ORM fully supports** the required schema (FK + CASCADE, smallint, integer, timestamp). The `sum()` aggregate function returns a string — use `.mapWith(Number)` or cast. Raw SQL using the `sql` template tag supports `FOR UPDATE` syntax, but since the HTTP driver can't use it, the serializable transaction approach is preferred.
- **The PDF route handler pattern** is: `renderToBuffer(<InvoiceDocument data={...} />)` → `new Response(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Invoice-INV-2026-001.pdf"' } })`. The `export const dynamic = "force-dynamic"` export is required.
- **Significant risk:** Two open GitHub issues (Issues #3074 and #2994) report `renderToBuffer` and `renderToStream` broken in Next.js 15 with error "PDFDocument is not a constructor." These were filed Feb/Dec 2024 and are closed with no visible resolution. This project uses Next.js 16. The Wave 0 plan must include a local smoke-test of `renderToBuffer` in a route handler before the PDF component is built out.

---

## 1. @react-pdf/renderer in Next.js App Router

### Package Status (verified)

- **Current version:** 4.5.1 (published ~2 months ago per npm)
- **React peer dep:** `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0` — React 19 supported since v4.1.0
- **Auto-externalized:** `@react-pdf/renderer` appears in Next.js's built-in `serverExternalPackages` list (verified via Next.js 16.2.9 docs at nextjs.org). No manual `next.config.ts` change needed for this project.

### Import Path

```typescript
// Correct import for server-side (Node.js / Route Handler)
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
```

The package exports both browser components (`PDFDownloadLink`, `PDFViewer`) and server functions (`renderToBuffer`, `renderToStream`). The server functions are safe to call in Route Handlers because the file is never bundled as client code.

### Route Handler Pattern

```typescript
// src/app/api/admin/invoices/[id]/pdf/route.ts
import { requireAdmin } from "@/lib/auth";
import { renderToBuffer, Document, Page, Text } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  // fetch invoice + line items from DB...

  const buffer = await renderToBuffer(
    <InvoiceDocument invoice={invoice} lineItems={lineItems} />
  );

  const filename =
    invoice.status === "draft"
      ? "Draft-Invoice.pdf"
      : `Invoice-INV-${invoice.fiscalYear}-${String(invoice.sequenceNumber).padStart(3, "0")}.pdf`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

**Key constraints:**
- `InvoiceDocument` must be a pure server-side React component — no `useState`, no `useContext`, no imports from `"use client"` modules.
- JSX in a Route Handler file works because Route Handlers run in the Node.js runtime and Next.js compiles JSX there.
- `renderToBuffer` returns `Promise<Buffer>` — `Buffer` is directly accepted by `new Response()` as a `BodyInit`.
- Do NOT use the `PDFViewer` or `PDFDownloadLink` components anywhere in this file — they require browser APIs.

### Styling in @react-pdf/renderer

```typescript
const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#0a0f1e", padding: 40 },
  header: { fontSize: 24, marginBottom: 20, color: "#ffffff" },
  table: { display: "flex", flexDirection: "column", width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#334155" },
  cell: { flex: 1, padding: 8, fontSize: 10, color: "#94a3b8" },
});
```

- **No Tailwind** — react-pdf uses its own `StyleSheet.create()` with a subset of CSS (flexbox-only layout, no grid).
- Use built-in fonts (`Helvetica`, `Helvetica-Bold`) to avoid font-loading complexity on Netlify serverless; registering custom fonts requires the font file to be bundled.
- Avoid `Image` for the logo in the PDF unless the logo is a local static file (`public/` path) accessible at render time — URL-fetched images may fail in serverless cold starts.

### Risks

- **MEDIUM RISK:** Two open GitHub issues ([#3074](https://github.com/diegomura/react-pdf/issues/3074), [#2994](https://github.com/diegomura/react-pdf/issues/2994)) report `renderToBuffer` / `renderToStream` broken in Next.js 15 with "PDFDocument is not a constructor." Both filed late 2024/early 2025 and closed without a visible fix. This project uses Next.js `^16.2.1`. The auto-externalize list for Next.js 16 includes `@react-pdf/renderer`, which is the standard mitigation — but if it still fails, the fallback is to add `serverExternalPackages: ["@react-pdf/renderer"]` explicitly to `next.config.ts` and re-test.
- **Wave 0 must include** a minimal smoke-test route (`GET /api/admin/invoices/test-pdf/route.ts`) that renders a trivial `<Document><Page><Text>Hello</Text></Page></Document>` and returns it as PDF. This validates the entire stack before building the real invoice component.

**Confidence: MEDIUM** — The auto-externalize feature is HIGH confidence (official docs). The actual renderToBuffer behavior on Next.js 16 + React 19.2 is MEDIUM because open issues remain unresolved for Next.js 15, and this project is on 16. Must be verified empirically.

---

## 2. Gapless Invoice Numbering in Postgres/Neon

### The Core Problem

`@netlify/neon` uses `neon()` from `@neondatabase/serverless` in HTTP mode. The HTTP transport executes queries as non-interactive HTTP requests — it cannot hold open a connection to maintain a row-level lock between a SELECT and an INSERT. Therefore:

> **`FOR UPDATE` row locking is NOT supported by the `@netlify/neon` HTTP driver.**

This is confirmed by Neon's own documentation: "HTTP is designed for single queries and non-interactive transactions." The non-interactive `transaction()` function on the HTTP client sends all statements in a single HTTP body — there is no round-trip between statements, which means any lock acquired by `SELECT ... FOR UPDATE` cannot be held while the application computes the next value.

### Safe Approach: SERIALIZABLE Transaction via WebSocket Driver

PostgreSQL's `SERIALIZABLE` isolation level detects concurrent conflicts automatically without explicit locks. Two concurrent transactions trying to assign the same `MAX(sequence_number) + 1` will cause one to fail with a serialization error, which can be retried. This is the correct alternative when `FOR UPDATE` is unavailable.

**Required additional packages:**
```bash
npm install @neondatabase/serverless ws
npm install --save-dev @types/ws
```

`@neondatabase/serverless` is already in `dependencies` (v1.1.0 per `package.json`). The `ws` package is new.

**Pattern for the PATCH status route (Draft → Sent):**

```typescript
// src/app/api/admin/invoices/[id]/status/route.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { db as httpDb } from "@/lib/db/index"; // HTTP client for normal queries
import * as schema from "@/lib/db/schema";

// Called only when assigning a sequence number (draft→sent transition)
async function assignInvoiceNumber(invoiceId: number, fiscalYear: number): Promise<{ fiscalYear: number; sequenceNumber: number }> {
  neonConfig.webSocketConstructor = ws;

  const pool = new Pool({ connectionString: process.env.NETLIFY_DATABASE_URL! });
  const wsDb = drizzle({ client: pool, schema });

  try {
    return await wsDb.transaction(
      async (tx) => {
        // Within SERIALIZABLE, this MAX + 1 pattern is safe against concurrent inserts
        const [row] = await tx.execute(
          sql`SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq
              FROM invoices
              WHERE fiscal_year = ${fiscalYear}`
        );
        const nextSeq = Number((row as any).next_seq);

        await tx.update(schema.invoices)
          .set({ fiscalYear, sequenceNumber: nextSeq, status: "sent" })
          .where(eq(schema.invoices.id, invoiceId));

        return { fiscalYear, sequenceNumber: nextSeq };
      },
      { isolationLevel: "serializable" }
    );
  } finally {
    await pool.end(); // CRITICAL: must close within the same request handler
  }
}
```

**Important rules for the WebSocket client:**
- Create `Pool` inside the request handler, not at module scope (Netlify spins up a fresh instance per request — a module-scoped pool cannot be reused).
- Always call `pool.end()` in a `finally` block to avoid connection exhaustion.
- On serialization failure (Postgres error code `40001`), retry once. Two concurrent `draft→sent` transitions for the same fiscal year is an extremely rare edge case for a single-admin system — retry once, then surface a 409 with a "Please try again" message.

### Alternative: Use the HTTP Driver with `sql.transaction()`

The `neon()` HTTP client exposes a `transaction()` method that sends multiple statements as a single HTTP request, using Postgres's `REPEATABLE READ` isolation. This DOES prevent phantom reads but does NOT allow `FOR UPDATE`. For single-admin usage at this scale, `REPEATABLE READ` is sufficient — the chance of two concurrent `draft→sent` transitions is functionally zero.

```typescript
// Simpler alternative using the existing @netlify/neon HTTP client
import { neon } from "@netlify/neon";

const sql = neon(); // uses NETLIFY_DATABASE_URL automatically

async function assignInvoiceNumberHttp(invoiceId: number, fiscalYear: number) {
  const [updateResult] = await sql.transaction([
    sql`SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq
        FROM invoices WHERE fiscal_year = ${fiscalYear}`,
    // Problem: can't use the result of the first query in the second query
    // HTTP transaction is non-interactive — statements are sent together, results come back together
  ]);
  // ...can't thread next_seq through without a round-trip
}
```

**Verdict:** The HTTP `transaction()` is non-interactive — you cannot use the result of statement 1 as input to statement 2. This makes it unsuitable for the `MAX + 1` assignment pattern without resorting to a single UPDATE with a subquery.

**Best option for this codebase (single-admin, Netlify):** Use a single raw SQL UPDATE with a correlated subquery — this avoids the WebSocket driver entirely:

```typescript
// Cleanest approach: single atomic SQL statement, works with HTTP driver
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/index"; // existing HTTP client

await db.execute(sql`
  UPDATE invoices
  SET
    status = 'sent',
    fiscal_year = ${fiscalYear},
    sequence_number = (
      SELECT COALESCE(MAX(sequence_number), 0) + 1
      FROM invoices
      WHERE fiscal_year = ${fiscalYear}
    )
  WHERE id = ${invoiceId}
    AND status = 'draft'
`);
```

**Why this is safe for a single-admin system:** Postgres executes the subquery and the UPDATE atomically at `READ COMMITTED` isolation (the default). For a single admin performing one `draft→sent` action at a time, there is no concurrent write to race against. This pattern is used in practice for low-concurrency invoice systems. For higher-volume multi-user systems, `SERIALIZABLE` would be required.

**Recommended approach:** Use the single-UPDATE subquery pattern (`db.execute(sql`...`)`) via the existing `@netlify/neon` HTTP client. This avoids new dependencies (`ws`) and a more complex client-management pattern. Document it as "safe for single-admin; upgrade to SERIALIZABLE if multi-user invoice creation is ever added."

**Confidence: HIGH** — The HTTP driver limitation is confirmed by Neon docs. The single-statement atomic UPDATE pattern is standard PostgreSQL practice (MEDIUM-HIGH, verified by multiple PostgreSQL sources).

---

## 3. Drizzle ORM Schema Patterns

### Invoice Schema (Drizzle)

```typescript
// src/lib/db/schema.ts additions
import {
  pgTable, serial, varchar, text, smallint, integer,
  timestamp, date
} from "drizzle-orm/pg-core";

export const invoices = pgTable("invoices", {
  id:             serial("id").primaryKey(),
  // Client info (free-text, no FK)
  clientName:     varchar("client_name", { length: 255 }).notNull(),
  clientEmail:    varchar("client_email", { length: 320 }),
  billingAddress: text("billing_address"),
  // Dates
  issueDate:      date("issue_date").notNull(),
  dueDate:        date("due_date").notNull(),
  // Status
  status:         varchar("status", { length: 8 }).notNull().default("draft"),
  // Numbering (NULL while draft)
  fiscalYear:     integer("fiscal_year"),
  sequenceNumber: integer("sequence_number"),
  // Money (INTEGER rands, matches Phase 3 convention)
  totalRands:     integer("total_rands").notNull().default(0),
  // Timestamps
  paidAt:         timestamp("paid_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true })
                    .notNull()
                    .defaultNow()
                    .$onUpdate(() => new Date()),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id:             serial("id").primaryKey(),
  invoiceId:      integer("invoice_id")
                    .notNull()
                    .references(() => invoices.id, { onDelete: "cascade" }),
  description:    text("description").notNull(),
  quantity:       smallint("quantity").notNull().default(1),
  unitPriceRands: integer("unit_price_rands").notNull(),
  lineTotalRands: integer("line_total_rands").notNull(),
  sortOrder:      smallint("sort_order").notNull().default(0),
});
```

**Key decisions:**
- `date` column type (not `timestamp`) for `issueDate` / `dueDate` — Drizzle's `date()` maps to Postgres `DATE`, which is what you want for calendar dates (no timezone ambiguity). Overdue check: `dueDate < CURRENT_DATE` in JavaScript: `new Date(invoice.dueDate) < new Date()`.
- `onDelete: "cascade"` on `invoiceId` FK — deleting an invoice cascades to all its line items. This is correct for Draft hard-delete.
- `sortOrder smallint` — enables "move up / move down" UX. Default 0 means insertion order.
- `totalRands` is denormalized on the `invoices` row and recomputed server-side on every PUT/POST.

### SUM Aggregate for Total Calculation

When computing `total_rands` from line items server-side (e.g., verifying the client-sent total):

```typescript
import { sum, eq } from "drizzle-orm";
import { invoiceLineItems } from "@/lib/db/schema";

const [{ total }] = await db
  .select({ total: sum(invoiceLineItems.lineTotalRands).mapWith(Number) })
  .from(invoiceLineItems)
  .where(eq(invoiceLineItems.invoiceId, invoiceId));

// total is now a number (0 if no line items)
const totalRands = total ?? 0;
```

**Note:** `sum()` returns `string | null` from Postgres. `.mapWith(Number)` converts it to `number`. `null` (no rows) should be treated as `0`.

### Drizzle Transaction for Multi-Table Write

For `POST /api/admin/invoices` (create invoice + line items atomically):

```typescript
import { db } from "@/lib/db/index";

// HTTP driver supports non-interactive transactions via db.transaction()
// For simple INSERT + INSERT (no conditional logic on result), this works fine
const result = await db.transaction(async (tx) => {
  const [invoice] = await tx.insert(invoices)
    .values({ clientName, clientEmail, billingAddress, issueDate, dueDate, totalRands: computedTotal })
    .returning();

  if (lineItemsData.length > 0) {
    await tx.insert(invoiceLineItems)
      .values(lineItemsData.map((item, idx) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPriceRands: item.unitPriceRands,
        lineTotalRands: item.quantity * item.unitPriceRands,
        sortOrder: idx,
      })));
  }

  return invoice;
});
```

**Important note on HTTP driver transactions:** `db.transaction()` via `drizzle-orm/neon-http` does support non-interactive transactions — all statements are sent and must not depend on previous results in real-time. The INSERT + INSERT pattern above works because we use the `invoice.id` returned by the first INSERT inside JavaScript (not as a Postgres correlated subquery). This is fine — the statements execute sequentially within the transaction, and `returning()` gives us the ID synchronously in JS.

**Confidence: HIGH** — Verified via Drizzle ORM official docs.

---

## 4. Next.js Route Handler PDF Response

### Correct Pattern

```typescript
// Buffer → Response (works directly)
const buffer = await renderToBuffer(<InvoiceDocument {...props} />);

return new Response(buffer, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store", // admin-only, must not cache
  },
});
```

**Why `new Response()` works with `Buffer`:** In Node.js 18+, `Buffer` implements the `Uint8Array` interface, which is a valid `BodyInit` for `Response`. Next.js 16 route handlers run on Node.js 20.9+ (new minimum per the v16 release notes — Node 18 is no longer supported). `Buffer` is directly accepted.

**Do NOT use `NextResponse`** for binary responses — `NextResponse.json()` serializes to JSON, and `NextResponse` doesn't have a clean binary path. Use the native `Response` class.

**`export const dynamic`:** Required because PDF generation is always on-demand (never pre-rendered):
```typescript
export const dynamic = "force-dynamic";
```

### CSP Consideration

The existing `next.config.ts` has `Content-Security-Policy` headers applied to `"/(.*)"`. The PDF route returns `Content-Type: application/pdf` — this is a download, not a page load, so CSP headers on the response don't affect PDF rendering. No CSP changes needed.

**Confidence: HIGH** — Verified against Next.js 16 docs (Node.js 20.9+ minimum, `new Response()` is standard Web API).

---

## 5. Existing Codebase Patterns

### Auth Pattern (copy exactly)

Every new admin page and API route:
```typescript
const session = await requireAdmin();
if (!session) redirect("/admin/login"); // pages
// OR
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // API routes
```

`requireAdmin()` returns `SessionPayload | null`. It reads the JWT from the `admin_session` cookie and verifies it. Already used in all Phase 1 pages; no changes needed to `auth.ts`.

### PATCH Route Pattern (from Phase 3 pricing routes, copy structure)

```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { id } = await params;
  // ... DB update ...
  return NextResponse.json({ ok: true });
}
```

### CSV Export Route Pattern (from Phase 2 CRM-07, copy csvEscape helper)

Phase 2's `GET /api/admin/crm/csv` (plan 02-04-PLAN.md) establishes this pattern:
```typescript
function csvEscape(val: string | number | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// In the route handler:
const rows = invoices.map(inv => [
  inv.sequenceNumber ? `INV-${inv.fiscalYear}-${String(inv.sequenceNumber).padStart(3, "0")}` : "DRAFT",
  csvEscape(inv.clientName),
  csvEscape(inv.clientEmail),
  inv.issueDate,
  inv.dueDate,
  inv.totalRands,
  inv.status,
  inv.paidAt ?? "",
].join(","));

const csv = ["Invoice #,Client Name,Client Email,Issue Date,Due Date,Total (R),Status,Paid At", ...rows].join("\n");

return new Response(csv, {
  headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="invoices.csv"',
  },
});
```

### Admin Page Structure (Phase 2 sidebar pattern)

Phase 2 (`02-CONTEXT.md`) establishes:
- Sidebar introduced in Phase 2 with `// Phase 4` comment for Invoices link — activate it in this phase.
- Admin pages: `async function Page()`, `await requireAdmin()` first, `export const dynamic = "force-dynamic"`.
- Sidebar shell wraps all `/admin/*` pages via `src/app/admin/layout.tsx` (which Phase 2 replaces with a sidebar).
- Glass panel style: `bg-(--bg-primary)/80 backdrop-blur-sm rounded-xl border border-(--border-color)`.
- `router.refresh()` after client-side mutations to revalidate server component data.

### Existing Schema (Phase 1)

Current `schema.ts` imports: `{ pgTable, serial, varchar, text, timestamp, boolean }` from `"drizzle-orm/pg-core"`. Phase 4 needs to add `{ smallint, integer, date }` to that import.

Migration file will be: `netlify/database/migrations/0002_invoices.sql` (following `0000_living_mastermind.sql` and the Phase 3 `0001_pricing_tables.sql`).

**Confidence: HIGH** — Verified directly from codebase.

---

## 6. Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` (project root) |
| Quick run | `npx vitest run` |
| Full suite | `npx vitest run` |
| Environment | `node` |
| Test glob | `src/**/*.test.ts` |
| Alias | `@` → `./src` |
| DB gate | `process.env.NETLIFY_DATABASE_URL` — DB tests skip if unset |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| INVOICE-01 | POST /api/admin/invoices creates draft | unit (non-DB) | `npx vitest run src/app/api/admin/invoices/route.test.ts` | 401 without session, 422 missing fields, 400 bad JSON |
| INVOICE-01 | POST /api/admin/invoices creates DB record | integration (DB-gated) | same file, `describeIfDb` block | requires NETLIFY_DATABASE_URL |
| INVOICE-02 | PUT /api/admin/invoices/[id] returns 409 if not draft | unit (non-DB) | `npx vitest run src/app/api/admin/invoices/[id]/route.test.ts` | Mock status='sent', expect 409 |
| INVOICE-03 | sequence_number assigned at draft→sent | integration (DB-gated) | `npx vitest run src/app/api/admin/invoices/[id]/status/route.test.ts` | Create draft, PATCH to sent, verify fiscal_year+sequence_number set |
| INVOICE-03 | No "Tax Invoice" / VAT in PDF output | manual | — | Visual review of downloaded PDF |
| INVOICE-04 | PATCH to paid records paid_at | integration (DB-gated) | same status test file | Verify paid_at IS NOT NULL after PATCH |
| INVOICE-04 | Overdue computed at read time | unit | status test or list API test | invoice.status='sent', dueDate=yesterday → check isOverdue flag |
| INVOICE-05 | Mark as paid: 401 without auth | unit (non-DB) | status route test file | Non-DB guard, always runs |
| INVOICE-06 | PDF route returns 200 + application/pdf | integration (smoke) | `npx vitest run src/app/api/admin/invoices/[id]/pdf/route.test.ts` | Requires actual renderToBuffer call; skip if NETLIFY_DATABASE_URL absent |
| INVOICE-07 | CSV route returns text/csv with correct headers | unit (non-DB) | `npx vitest run src/app/api/admin/invoices/csv/route.test.ts` | Can mock DB; verify Content-Type and CSV column headers |

### Test Patterns to Reuse

The established pattern from Phase 1 (`login/route.test.ts`, `reset-password/route.test.ts`):
```typescript
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

// Non-DB tests (always run):
describe("route guard — no DB", () => {
  it("401 without session cookie", async () => { ... });
  it("400 on bad JSON", async () => { ... });
  it("422 on missing fields", async () => { ... });
});

// DB-dependent tests:
describeIfDb("route — DB integration", () => {
  // setup test data in beforeAll
});
```

**Important for INVOICE-02:** Testing the 409 "not draft" lock requires either a real DB record or mocking Drizzle's select result. The cleanest approach for non-DB testing: mock the DB module. This is new territory for this codebase (Phase 1 tests don't mock DB — they skip). Document in Wave 0 that INVOICE-02's 409 test will use `describe.skipIf(!NETLIFY_DATABASE_URL)`.

### Wave 0 Gaps (test files that must be created before implementation)

- [ ] `src/app/api/admin/invoices/route.test.ts` — POST create (401/422/400 non-DB guards)
- [ ] `src/app/api/admin/invoices/[id]/route.test.ts` — PUT update (401/409 non-DB guards)
- [ ] `src/app/api/admin/invoices/[id]/status/route.test.ts` — PATCH status (401/409 duplicate-transition guard)
- [ ] `src/app/api/admin/invoices/[id]/pdf/route.test.ts` — GET PDF (401 non-DB guard + renderToBuffer smoke test DB-gated)
- [ ] `src/app/api/admin/invoices/csv/route.test.ts` — GET CSV (401 guard + CSV format check)

**Confidence: HIGH** — Vitest config verified directly. Pattern established in Phase 1.

---

## 7. Pitfalls and Risks

### Risk 1: `renderToBuffer` broken on Next.js 15/16 (HIGH PRIORITY)

**What goes wrong:** "PDFDocument is not a constructor" error in the Route Handler. Two open GitHub issues (#3074, #2994) filed against Next.js 15 remain unresolved in the repository content visible.

**Why it happens:** Next.js's Turbopack / webpack bundler may inline `@react-pdf/renderer` and mangle its internal class references despite the auto-externalize list. React 19 renamed internal APIs (`__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`), which react-pdf v4.1.0+ is supposed to handle.

**How to avoid:** Wave 0 must include a minimal smoke-test route before the full invoice PDF component is built. If the error appears:
1. Explicitly add `serverExternalPackages: ["@react-pdf/renderer"]` to `next.config.ts`.
2. If still failing, check if a newer patch version of `@react-pdf/renderer` resolves it (4.5.1 is current — check if any 4.5.x patch addresses the issue).
3. Last resort: render PDF server-side in a Netlify Background Function (separate from the Next.js Route Handler) and return the binary from there.

**Warning signs:** Error message containing "PDFDocument is not a constructor" or "ba.Component is not a constructor" in the server logs.

### Risk 2: Neon HTTP Driver Transactions Are Non-Interactive

**What goes wrong:** Developer uses `db.transaction()` (the Drizzle wrapper over the neon-http driver) thinking it supports `FOR UPDATE` or that the result of one query can feed into a subsequent query inside the transaction. It cannot.

**Why it happens:** The HTTP driver's `transaction()` sends all statements in a single HTTP body — there is no back-and-forth within a transaction. `SELECT ... FOR UPDATE` requires maintaining a lock across a round-trip, which the HTTP protocol cannot do.

**How to avoid:** Use the single-statement atomic UPDATE with correlated subquery for the `draft→sent` number assignment (documented in Section 2). For multi-statement non-interactive scenarios (INSERT invoice + INSERT line items where the `invoice.id` is in JavaScript scope), `db.transaction()` works fine.

### Risk 3: `sum()` Returns String from Postgres

**What goes wrong:** `sum(invoiceLineItems.lineTotalRands)` returns `string | null` from Drizzle/Postgres. Storing it directly in `totalRands INTEGER` without conversion causes a type error or NaN.

**How to avoid:** Always use `.mapWith(Number)` on the sum: `sum(col).mapWith(Number)`. Treat `null` (empty line items) as `0`.

### Risk 4: Date vs Timestamp for Issue/Due Dates

**What goes wrong:** Using `timestamp` for `issueDate` / `dueDate` introduces timezone ambiguity — a `2026-07-15T00:00:00Z` stored date could display as `2026-07-14` in UTC+2 (SAST).

**How to avoid:** Use Drizzle's `date()` column type (maps to Postgres `DATE`). This stores and returns a date string (e.g., `"2026-07-15"`) without timezone. The overdue check becomes: `new Date(invoice.dueDate) < new Date()` (which uses local midnight comparison — acceptable for a single timezone business).

### Risk 5: PDF Font Availability on Netlify Serverless

**What goes wrong:** Custom font registration fails because the font file path is wrong or the font binary is not bundled in the Netlify function package.

**How to avoid:** Use built-in `Helvetica` / `Helvetica-Bold` PDF fonts for the initial implementation. If the business later wants branded fonts, they must be loaded from `public/` or bundled explicitly.

### Risk 6: Phase 2 Sidebar Not Yet Built

**What goes wrong:** Phase 4 plans reference `AdminSidebar.tsx` (introduced in Phase 2) for adding the Invoices nav link. If Phase 4 executes before Phase 2 completes, the sidebar component doesn't exist.

**How to avoid:** The roadmap specifies Phase 2 before Phase 4. The planner should note the sidebar dependency explicitly. If Phase 4 is ever run on a branch without Phase 2, the invoice pages must add a temporary inline sidebar or just `requireAdmin()` + bare layout.

### Risk 7: Pool Connection Leak in WebSocket Pattern

**What goes wrong:** If the WebSocket `Pool` approach is used for the serializable transaction and `pool.end()` is not called in a `finally` block, Netlify function invocations accumulate open connections until the Postgres `max_connections` limit is hit.

**How to avoid:** Always wrap `pool.end()` in `finally`. The recommended single-statement atomic UPDATE approach (Section 2) avoids this entirely — it uses the existing HTTP client with no new connection management.

### Risk 8: CSP Headers Block PDF Download

**What goes wrong:** The existing CSP in `next.config.ts` applies to all routes including `/(.*) → /api/admin/invoices/[id]/pdf`. The `Content-Security-Policy: object-src 'none'` directive may interfere with the browser's PDF viewer if the browser tries to embed the PDF.

**How to avoid:** Since the response has `Content-Disposition: attachment`, the browser downloads rather than embeds. `object-src 'none'` only matters for `<object>` and `<embed>` tags, not direct downloads. No CSP change needed.

---

## 8. Recommended Task Breakdown

### Wave 0 — Foundation (DB + smoke test)

**Plan 04-01:** DB schema + migration
- Extend `src/lib/db/schema.ts` with `invoices` + `invoiceLineItems` tables
- Run `npx drizzle-kit generate` → `0002_invoices.sql`
- Run migration: `npm run db:migrate`
- Create Wave 0 test stubs (empty test files with placeholder `it.todo()` calls)
- Smoke-test route: `GET /api/admin/invoices/test-pdf` — renders trivial `<Document>` and returns it as PDF to validate `renderToBuffer` works on this stack

### Wave 1 — API Routes (no UI)

**Plan 04-02:** Create + Update API routes
- `POST /api/admin/invoices` — create draft invoice + line items
- `PUT /api/admin/invoices/[id]` — update draft (returns 409 if not draft)
- Tests: non-DB guards (401, 422, 400, 409 for non-draft)

**Plan 04-03:** Status + PDF + CSV API routes
- `PATCH /api/admin/invoices/[id]/status` — status transitions with atomic number assignment
- `GET /api/admin/invoices/[id]/pdf` — `renderToBuffer` route with `InvoiceDocument` component
- `GET /api/admin/invoices/csv` — CSV export (copy from Phase 2 pattern)
- Tests: status guards, PDF 401 guard, CSV format check

### Wave 2 — Admin UI

**Plan 04-04:** Invoice list page + create form
- `/admin/invoices` — list page with status filter, overdue badge, create button, CSV export button
- `/admin/invoices/new` — create form (client info + line items editor)
- Activate Invoices link in `AdminSidebar.tsx`

**Plan 04-05:** Invoice detail page (edit + status actions)
- `/admin/invoices/[id]` — detail page with:
  - Draft: editable form (line items editor, PUT on save)
  - Sent/Paid: read-only view
  - Status action buttons: "Mark Sent" (draft), "Mark Paid" (sent/overdue), "Unpublish" (sent→draft)
  - "Download PDF" button linking to `/api/admin/invoices/[id]/pdf`
  - Overdue badge when computed

---

## Sources

### Primary (HIGH confidence)

- [Next.js 16.2.9 docs — serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) — `@react-pdf/renderer` is in the auto-externalized list; no manual config needed
- [react-pdf.org/compatibility](https://react-pdf.org/compatibility) — React 19 supported since v4.1.0; Next.js 14.1.1+ required for App Router
- [react-pdf.org/node](https://react-pdf.org/node) — `renderToBuffer(<Doc />)` is the Node.js API
- [Next.js 16 release notes](https://nextjs.org/blog/next-16) — Node.js 20.9+ minimum; `middleware.ts` deprecated → `proxy.ts`
- [Neon docs — choosing connection method](https://neon.com/docs/connect/choose-connection) — HTTP for single/non-interactive, WebSocket for interactive transactions
- [Drizzle ORM — Transactions](https://orm.drizzle.team/docs/transactions) — `db.transaction()` API, isolation levels
- [Drizzle ORM — sql template](https://orm.drizzle.team/docs/sql) — `sql` tag supports `FOR UPDATE` syntax
- [Drizzle ORM — column types](https://orm.drizzle.team/docs/column-types) — `smallint`, `integer`, `varchar`, `date`
- [Drizzle ORM — select / sum()](https://orm.drizzle.team/docs/select) — `sum().mapWith(Number)` pattern
- [Drizzle ORM — FK onDelete cascade](https://orm.drizzle.team/docs/relations) — `.references(() => table.id, { onDelete: "cascade" })`
- Project codebase: `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `src/lib/auth.ts`, `vitest.config.ts`, `package.json`, `next.config.ts`, `src/app/api/admin/login/route.test.ts`

### Secondary (MEDIUM confidence)

- [npm — @react-pdf/renderer 4.5.1](https://www.npmjs.com/package/@react-pdf/renderer) — current version, peer deps verified
- [GitHub — @neondatabase/serverless](https://github.com/neondatabase/serverless) — HTTP transaction() is non-interactive; WebSocket Pool/Client for interactive transactions
- [Drizzle ORM — connect-neon](https://orm.drizzle.team/docs/connect-neon) — WebSocket driver setup for interactive transactions
- [CYBERTEC PostgreSQL — sequences vs invoice numbers](https://www.cybertec-postgresql.com/en/postgresql-sequences-vs-invoice-numbers/) — `SERIALIZABLE` or `SELECT ... FOR UPDATE` as gapless numbering strategies

### Tertiary (LOW confidence — needs validation)

- [GitHub issue #3074](https://github.com/diegomura/react-pdf/issues/3074) — renderToBuffer broken in Next.js 15 (closed with no visible resolution; status on Next.js 16 unknown)
- [GitHub issue #2994](https://github.com/diegomura/react-pdf/issues/2994) — renderToStream broken in Next.js 15 (Dec 2024, same status)

---

## Metadata

**Confidence breakdown:**
- `@react-pdf/renderer` auto-externalize: HIGH — verified in official Next.js 16 docs
- `renderToBuffer` compatibility on Next.js 16: MEDIUM — auto-externalize should handle it, but two unresolved issues exist for Next.js 15; empirical verification required in Wave 0
- Neon HTTP driver FOR UPDATE limitation: HIGH — confirmed by official Neon docs
- Single-statement atomic UPDATE for numbering: MEDIUM-HIGH — standard PostgreSQL pattern, appropriate for single-admin concurrency level
- Drizzle schema (FK, cascade, date, integer, sum): HIGH — verified in official Drizzle docs
- PDF Response pattern: HIGH — `new Response(Buffer, headers)` is standard Web API, confirmed for Node.js 20.9+
- Vitest test patterns: HIGH — verified directly from codebase

**Research date:** 2026-07-01
**Valid until:** 2026-08-01 (30 days; `@react-pdf/renderer` is actively maintained — check for new releases if issues arise)
