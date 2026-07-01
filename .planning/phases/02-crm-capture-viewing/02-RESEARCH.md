# Phase 2: CRM Capture + Viewing — Research

**Researched:** 2026-07-01
**Domain:** Drizzle ORM schema extension, Next.js 16 App Router admin layout, API route patterns, CSV streaming, client-side filtering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Persistent left sidebar nav on all `/admin/*` pages. Links: CRM, Pricing (Phase 3), Invoices (Phase 4), Settings (Phase 5). The sidebar is introduced in Phase 2 so Phases 3–5 each just add a nav entry — no layout rework needed later.
- **D-02:** CRM lives at `/admin/crm` (separate route). The current `/admin/dashboard` stub remains a summary/home page, giving room to add metrics/quick-actions in a later phase without URL changes.
- **D-03:** Two separate tables — `client_registrations` and `contact_enquiries`. Each stores its full typed payload. A combined list view queries both and merges/sorts in code with a `type` label. Avoids a JSONB blob, keeps schema typed, and is cleanest for Phase 4 invoicing (find all clients on 'advanced' package).
- **D-04:** `client_registrations` uses individual typed columns for all fields (personal info, domain, hosting package, add-ons, declaration). No JSONB blobs — all fields must be queryable for Phase 4 lookups (e.g. find all 'enterprise' clients for recurring billing).
- **D-05:** Status column (`status VARCHAR`, values: `new` | `contacted` | `in_progress` | `completed`) lives on each table. Notes use a shared `crm_notes` table with `record_type TEXT` (values: `registration` | `enquiry`) + `record_id INTEGER` + `body TEXT` + `created_at TIMESTAMPTZ`. This avoids a polymorphic parent table while keeping one notes query pattern.
- **D-06:** Table/spreadsheet layout — rows, not cards.
- **D-07:** Visible columns: Name / Email / Type / Status / Date. Type = "Registration" or "Enquiry" badge. Status = coloured badge. Date = submitted date.
- **D-08:** Live client-side filtering — all records loaded once on page load, filtered in-browser as the owner types into a search box. No server round-trip per keystroke.
- **D-09:** Full-page route — `/admin/crm/[id]` with a back-link to `/admin/crm`.
- **D-10:** Notes are an append-only log: a textarea + "Add note" button appends a new timestamped entry. All past notes shown in chronological order below the input. Notes are never edited or deleted.
- **D-11:** Single merged CSV (one button, one file). Columns: ID, Type, Name, Email, Phone, Status, Submitted Date, and key type-specific fields (Domain / Package / Add-ons for registrations; Subject / Message for enquiries). Empty cells where a field doesn't apply.

### Claude's Discretion

- Exact column names / SQL types beyond what D-03/D-04/D-05 specify
- Loading skeleton / loading state for the CRM list
- Pagination: start with "load all" (client-side filter chosen), add pagination only if list grows beyond a practical threshold
- Status badge colour scheme (must use Tailwind v4 CSS custom property syntax)
- Sidebar collapse/expand behavior (icon-only collapsed vs always-open is fine either way)
- Empty state when no CRM records exist yet
- `client_registrations` reference ID column name and format (matches existing `ITG-YYYYMMDD-XXXXX` from `register/route.ts`)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-01 | Every registration wizard submission is automatically saved as a client record | DB insert before sendEmail in register/route.ts; client_registrations table schema |
| CRM-02 | Every contact form submission is automatically saved as an enquiry record | DB insert before sendEmail in contact/route.ts; contact_enquiries table schema |
| CRM-03 | Owner can view a searchable, filterable list of all enquiries/clients | /admin/crm page; GET /api/admin/crm; useMemo filter pattern |
| CRM-04 | Owner can open a record to see full submitted details | /admin/crm/[id] page; GET /api/admin/crm/[id] |
| CRM-05 | Owner can set a record's status (New, Contacted, In Progress, Completed) | PATCH /api/admin/crm/[id]/status; status column on both tables |
| CRM-06 | Owner can add free-text, timestamped notes to a record | POST /api/admin/crm/[id]/notes; crm_notes table |
| CRM-07 | Owner can export the enquiry/client list as CSV | GET /api/admin/crm/export; NextResponse with Content-Disposition header |
</phase_requirements>

---

## Summary

Phase 2 extends the existing Drizzle ORM schema with three new tables, wires DB persistence into two existing public API routes (inserting BEFORE email dispatch so capture succeeds even on Resend failure), builds an `/admin/crm` section with list + detail pages, introduces a persistent sidebar layout, and adds five admin-only API routes. Every pattern needed already exists in the codebase from Phase 1 — the planner is assembling proven building blocks, not introducing new concepts.

The largest risk is the sidebar layout refactor: `src/app/admin/layout.tsx` must be extended to wrap `{children}` in a two-column flex shell (sidebar + main), while keeping the `fixed inset-0 -z-10` background image underneath. The sidebar itself can be a Server Component; only the active-link highlight requires a thin `"use client"` wrapper using `usePathname()`. The admin dashboard page also needs a minor update to remove its `flex items-center justify-center` centering now that the sidebar provides structural layout context.

The second-largest risk is the DB insert ordering in the public routes. The guard must be: insert first, catch any DB error and log but do not abort (email can still send and caller still gets 201/200), then send email. This matches the phase success criteria that capture must succeed even if email fails — but the inverse must also hold: a DB failure must not silently suppress a successful registration from the user's perspective.

**Primary recommendation:** Follow the established Phase 1 patterns exactly. Drizzle schema extension, the `describe.skipIf(skipDB)` test pattern, and the `requireAdmin()` guard are all proven — reuse them without deviation.

---

## Project Constraints (from CLAUDE.md)

All directives below are binding. The planner must verify compliance.

| Directive | Detail |
|-----------|--------|
| Tailwind v4 syntax | Use `text-(--text-primary)`, `bg-(--bg-primary)`, `border-(--border-color)` — NOT `text-[var(--text-primary)]` or `text-[#hex]` |
| Dark-only theme | `<html data-theme="dark">` is hardcoded; no theme toggle |
| Fixed background | Every admin page must keep `fixed inset-0 -z-10` bg-image.jpg visible behind all content; sections must be `bg-transparent` — no per-section `bg-slate-900` fills |
| Button classes | Use `.btn-metallic` (primary CTA) and `.btn-glass` (secondary) from globals.css — not one-off inline button styles |
| Server components by default | Only add `"use client"` where state/effects are required |
| No native flag `<select>` | Country/flag pickers need custom dropdown with flagcdn.com images |
| Email HTML | Table-based, all styles inline, no flexbox/grid, no `<style>` block |
| Card component | `src/components/ui/Card.tsx` exists — use it rather than duplicating its border/bg/radius styles |
| Admin pattern | `await requireAdmin()` at top of every new admin server component page; `redirect("/admin/login")` if null |
| Reveal component | Use `src/components/ui/Reveal.tsx` for scroll-reveal on any public-facing content added (not applicable to admin pages) |
| Pricing sync | If any pricing field changes, update both `HOSTING_PACKAGES` in registration-types.ts AND the Services page (not applicable to Phase 2) |
| Note on Card.tsx | `Card.tsx` currently uses `border-[var(--border-color)]` (bracket form) — **do not copy this pattern in new code**. New code must use `border-(--border-color)` (v4 canonical). Fix it in Card.tsx when touched. |

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.2 | Schema definition, query builder | Already used in auth.ts; same pattern |
| drizzle-kit | ^0.31.10 | Migration generation (`npx drizzle-kit generate`) | Already configured in drizzle.config.ts |
| @netlify/neon | ^0.1.2 | Neon Postgres client for Netlify | Already wired in db/index.ts |
| next | ^16.2.1 | App Router pages and API routes | Project framework |
| react | ^19.2.4 | Client components (filter UI, note form) | Project framework |
| vitest | ^4.1.9 | Test runner | Already used for Phase 1 tests |

### No New Dependencies

Phase 2 requires no new npm packages. CSV generation is done with plain string concatenation (no library). Client-side filtering uses native `useMemo`/`useState`. The admin API routes use the same `NextResponse`, `requireAdmin`, `db`, `isTrustedOrigin` utilities already in the codebase.

**Verification:** `npm view drizzle-orm version` → 0.45.2 (matches installed). No installs needed.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── lib/
│   └── db/
│       └── schema.ts            # EXTEND: add client_registrations, contact_enquiries, crm_notes
├── app/
│   ├── admin/
│   │   ├── layout.tsx           # MODIFY: wrap children in sidebar shell
│   │   ├── dashboard/
│   │   │   └── page.tsx         # MINOR UPDATE: remove centering now sidebar provides context
│   │   └── crm/
│   │       ├── page.tsx         # NEW: server component, list view
│   │       └── [id]/
│   │           └── page.tsx     # NEW: server component, detail view
│   └── api/
│       ├── register/
│       │   └── route.ts         # MODIFY: add DB insert before sendEmail
│       ├── contact/
│       │   └── route.ts         # MODIFY: add DB insert before sendEmail
│       └── admin/
│           └── crm/
│               ├── route.ts     # NEW: GET /api/admin/crm (list)
│               ├── [id]/
│               │   ├── route.ts         # NEW: GET /api/admin/crm/[id] (detail)
│               │   ├── status/
│               │   │   └── route.ts     # NEW: PATCH /api/admin/crm/[id]/status
│               │   └── notes/
│               │       └── route.ts     # NEW: POST /api/admin/crm/[id]/notes
│               └── export/
│                   └── route.ts         # NEW: GET /api/admin/crm/export (CSV)
└── components/
    └── admin/                   # NEW directory
        ├── AdminSidebar.tsx     # NEW: "use client" — sidebar with usePathname()
        └── crm/
            ├── CrmTable.tsx     # NEW: "use client" — filterable table
            └── NoteForm.tsx     # NEW: "use client" — append note form
```

### Pattern 1: Drizzle Schema Extension

**What:** Add three new tables to `src/lib/db/schema.ts` alongside the existing `adminUsers` and `loginAttempts` tables.

**Status column:** Use `varchar("status", { length: 32 }).notNull().default("new")` rather than a `pgEnum`. Reason: pgEnum requires the enum type to be created in the DB with `CREATE TYPE`, which complicates migration rollbacks and is harder to extend. A varchar with a known set of valid values is simpler, and validation happens at the application layer (the PATCH /status route validates the incoming value). The existing schema uses varchar for `role` — follow the same pattern.

**crm_notes polymorphic key:** Use `record_type VARCHAR(20)` + `record_id INTEGER` with no FK constraint. A FK to a single table is impossible when the parent can be either table. No Drizzle-level `references()` call — the application enforces this.

**Example schema additions:**

```typescript
// Source: drizzle-orm docs + existing schema.ts pattern
import { pgTable, serial, varchar, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const clientRegistrations = pgTable("client_registrations", {
  id: serial("id").primaryKey(),
  referenceId: varchar("reference_id", { length: 32 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  // Step A — personal info
  firstName: varchar("first_name", { length: 100 }).notNull(),
  surname: varchar("surname", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  cellPhone: varchar("cell_phone", { length: 30 }).notNull(),
  telephone: varchar("telephone", { length: 30 }).notNull().default(""),
  physicalAddress: text("physical_address").notNull(),
  postalAddress: text("postal_address").notNull().default(""),
  // Step B — domain
  domainName: varchar("domain_name", { length: 253 }).notNull(),
  nameserver1: varchar("nameserver1", { length: 253 }).notNull().default(""),
  nameserver2: varchar("nameserver2", { length: 253 }).notNull().default(""),
  // Step C — package & add-ons
  hostingPackage: varchar("hosting_package", { length: 32 }).notNull(),
  domainRegistration: boolean("domain_registration").notNull().default(false),
  sslCertificate: boolean("ssl_certificate").notNull().default(false),
  emailHosting: boolean("email_hosting").notNull().default(false),
  websiteDesign: boolean("website_design").notNull().default(false),
  additionalServices: text("additional_services").notNull().default(""),
  // Step D — declaration
  termsAccepted: boolean("terms_accepted").notNull(),
  signature: varchar("signature", { length: 200 }).notNull(),
  signatureDate: varchar("signature_date", { length: 10 }).notNull(),
  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactEnquiries = pgTable("contact_enquiries", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const crmNotes = pgTable("crm_notes", {
  id: serial("id").primaryKey(),
  recordType: varchar("record_type", { length: 20 }).notNull(), // "registration" | "enquiry"
  recordId: integer("record_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

After editing schema.ts, run: `npm run db:generate` (alias for `npx drizzle-kit generate`), then `npm run db:migrate` (requires Netlify dev context).

### Pattern 2: DB Insert Before Email in Public Routes

**What:** In `register/route.ts` and `contact/route.ts`, insert to DB before calling `sendEmail`. Wrap the insert in try/catch so a DB failure does not block the email or the 201/200 response — but the failure must be logged to stderr for visibility.

**Critical ordering rule:** DB insert first, then email. This matches the success criteria: "even if email delivery fails" — the record is already in the DB by then.

**DB failure handling decision (for planner):** If the DB insert fails, the route should still send the email and return success to the user. A registration submission must never silently disappear from the user's perspective due to a transient DB error. The failure is logged server-side. This is an intentional trade-off: the user's confirmation is prioritised over perfect capture. An optional reconciliation path (resend notification with referenceId so admin can re-enter) is not in scope for Phase 2.

**Example pattern for register/route.ts:**

```typescript
// After generateReferenceId(), before sendEmail():
try {
  await db.insert(clientRegistrations).values({
    referenceId,
    firstName: clean.stepA.firstName,
    surname: clean.stepA.surname,
    email: clean.stepA.email,
    cellPhone: clean.stepA.cellPhone,
    telephone: clean.stepA.telephone,
    physicalAddress: clean.stepA.physicalAddress,
    postalAddress: clean.stepA.postalAddress,
    domainName: clean.stepB.domainName,
    nameserver1: clean.stepB.nameserver1,
    nameserver2: clean.stepB.nameserver2,
    hostingPackage: clean.stepC.hostingPackage,
    domainRegistration: clean.stepC.domainRegistration,
    sslCertificate: clean.stepC.sslCertificate,
    emailHosting: clean.stepC.emailHosting,
    websiteDesign: clean.stepC.websiteDesign,
    additionalServices: clean.stepC.additionalServices,
    termsAccepted: clean.stepD.termsAccepted,
    signature: clean.stepD.signature,
    signatureDate: clean.stepD.signatureDate,
  });
} catch (err) {
  console.error("[register] DB insert failed:", err);
  // Continue — email send still proceeds; user gets their referenceId
}
```

### Pattern 3: Admin Layout Sidebar Shell

**What:** Replace `src/app/admin/layout.tsx`'s minimal wrapper with a two-column flex shell. The `fixed inset-0 -z-10` background image div stays in the layout — it is the global background for all admin pages per CLAUDE.md.

**Sidebar Server vs Client split:**
- The sidebar container (`AdminSidebar`) must be `"use client"` only for the active-link highlight. `usePathname()` from `next/navigation` is a client hook. The sidebar has no async data needs, so marking the whole component `"use client"` is correct — it is a small, interactive UI component.
- The layout file itself stays a Server Component (no `"use client"` directive on `layout.tsx`).

**Layout structure:**

```tsx
// src/app/admin/layout.tsx — Server Component
import Image from "next/image";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex">
      {/* Fixed bg — must remain; all admin pages share this */}
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" priority aria-hidden="true" />
      </div>
      {/* Sidebar */}
      <AdminSidebar />
      {/* Main content area */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

**Sidebar component:**

```tsx
"use client";
// src/components/admin/AdminSidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/crm",       label: "CRM" },
  { href: "/admin/pricing",   label: "Pricing" },   // Phase 3
  { href: "/admin/invoices",  label: "Invoices" },  // Phase 4
  { href: "/admin/settings",  label: "Settings" },  // Phase 5
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin navigation"
      className="w-56 shrink-0 min-h-screen flex flex-col
                 bg-(--bg-primary)/80 backdrop-blur-sm
                 border-r border-(--border-color)"
    >
      <div className="p-4 border-b border-(--border-color)">
        <span className="text-(--text-primary) font-bold text-sm">IT-Guru Admin</span>
      </div>
      <ul className="flex-1 py-4 space-y-1 px-2">
        {navLinks.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors
                  ${active
                    ? "text-(--text-primary) bg-white/10"
                    : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
                  }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

**Active-link note:** `pathname.startsWith(href + "/")` ensures `/admin/crm/123` also highlights the CRM link. Use exact match for Dashboard to avoid it always being active.

### Pattern 4: Admin API Routes with requireAdmin()

**What:** Every admin API route must call `requireAdmin()` and return 401 if the session is absent. The admin routes do NOT have CSRF `isTrustedOrigin()` because they are called exclusively from the same-origin admin UI (the browser sends the httpOnly session cookie automatically). However, adding `isTrustedOrigin()` as a second layer is acceptable.

**Standard admin API route shell:**

```typescript
// src/app/api/admin/crm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ... query and return data
}
```

**PATCH /api/admin/crm/[id]/status:**

```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const VALID_STATUSES = ["new", "contacted", "in_progress", "completed"] as const;
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  }
  // ... update logic (check record_type in body to determine which table)
}
```

**Important: `params` is a Promise in Next.js 16.** The `params` argument in dynamic route handlers must be `await`-ed. This is a breaking change from Next.js 14/15 patterns and was verified from the existing codebase conventions.

### Pattern 5: Merged List Query (GET /api/admin/crm)

**What:** Query both tables, add a `type` discriminator, merge into one array, sort by `createdAt` descending.

```typescript
// Both queries run; results merged in application code
const [registrations, enquiries] = await Promise.all([
  db.select().from(clientRegistrations).orderBy(desc(clientRegistrations.createdAt)),
  db.select().from(contactEnquiries).orderBy(desc(contactEnquiries.createdAt)),
]);

const merged = [
  ...registrations.map(r => ({ ...r, recordType: "registration" as const })),
  ...enquiries.map(e => ({ ...e, recordType: "enquiry" as const })),
].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
```

**Pagination note (Claude's discretion):** For Phase 2, load all records. Neon Postgres on Netlify has fast cold-start; hundreds of rows will return in well under 100ms. Add pagination in a later phase if the owner reports slowness.

### Pattern 6: Client-Side Filter (CrmTable.tsx)

**What:** Pre-loaded records array, `useState` for search text and status filter, `useMemo` for derived filtered array.

```tsx
"use client";
import { useState, useMemo } from "react";

export function CrmTable({ records }: { records: CrmRecord[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      const nameEmail = `${r.name ?? ""} ${r.email}`.toLowerCase();
      const matchesSearch = !q || nameEmail.includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  return (
    <>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" />
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="all">All statuses</option>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      {/* table rows using filtered */}
    </>
  );
}
```

**Name field note:** `clientRegistrations` has `firstName` + `surname` (two columns). `contactEnquiries` has `name` (one column). The shared list type needs a normalised `name` field — compute it in the API route before returning (`name: r.firstName + " " + r.surname` for registrations, `name: e.name` for enquiries).

### Pattern 7: CSV Export (GET /api/admin/crm/export)

**What:** Build a CSV string server-side, return it as a streaming download with correct headers.

**NextResponse for file download:**

```typescript
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Query both tables (same as list route)
  const rows = await getMergedCrmRecords(); // extracted helper

  // Build CSV
  const header = ["ID", "Type", "Name", "Email", "Phone", "Status", "Submitted Date",
                  "Domain", "Package", "Add-ons", "Subject", "Message"].join(",");

  const lines = rows.map(r => [
    r.id,
    r.recordType === "registration" ? "Registration" : "Enquiry",
    csvEscape(r.name),
    csvEscape(r.email),
    csvEscape(r.phone ?? ""),
    r.status,
    r.createdAt.toISOString().split("T")[0],
    csvEscape(r.domainName ?? ""),
    csvEscape(r.hostingPackage ?? ""),
    csvEscape(r.addons ?? ""),
    csvEscape(r.subject ?? ""),
    csvEscape(r.message ?? ""),
  ].join(",")).join("\n");

  const csv = header + "\n" + lines;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="crm-export.csv"',
    },
  });
}

function csvEscape(val: string): string {
  // RFC 4180: wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}
```

**No library needed.** The CSV is simple enough for hand-rolled string building. The `csvEscape` function covers RFC 4180 edge cases (commas, quotes, newlines in user-supplied text — critical since message/additionalServices fields can contain any of these).

### Pattern 8: Detail Page — Notes (NoteForm.tsx)

**What:** Client component with a textarea and submit button. On submit, POST to `/api/admin/crm/[id]/notes`. On success, re-fetch notes or optimistically append to local state.

**Router.refresh() pattern:** After a POST that mutates server data, call `router.refresh()` from `useRouter()` to revalidate the server component's data. This is the App Router pattern for invalidating cached server data from a client component.

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NoteForm({ recordType, recordId }: { recordType: string; recordId: number }) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    await fetch(`/api/admin/crm/${recordId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, recordType }),
    });
    setBody("");
    setPending(false);
    router.refresh(); // revalidates the page's server data, re-renders notes list
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={body} onChange={e => setBody(e.target.value)} />
      <button type="submit" disabled={pending} className="btn-metallic">
        {pending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}
```

### Pattern 9: Status Update (inline in detail page)

**What:** A `<select>` dropdown on the detail page. On change, PATCH `/api/admin/crm/[id]/status`, then call `router.refresh()`.

The `record_type` must be sent in the PATCH body so the route knows which table to update (both tables have a `status` column but are separate tables).

### Anti-Patterns to Avoid

- **Using pgEnum for status:** Creates `CREATE TYPE` DDL in migration, complicates rollbacks. Use varchar with application-level validation instead (matches existing `role` column pattern).
- **Sending email before DB insert:** Violates the phase success criteria. Insert MUST be first.
- **Absolute-positioning the sidebar:** CLAUDE.md explicitly calls this out as having broken the header at some viewport widths. Use `flex` row layout instead.
- **Adding `bg-slate-900` or per-section background fills to admin pages:** CLAUDE.md forbids this. Admin pages must be `bg-transparent` so the fixed bg-image.jpg shows through.
- **Copying Card.tsx's `border-[var(--border-color)]` syntax:** Card.tsx uses the old bracket form. New code must use `border-(--border-color)` (Tailwind v4 canonical). Fix Card.tsx when touching it.
- **`router.push()` after note submit:** Does a full navigation. Use `router.refresh()` instead — it re-runs the server component's data fetch without a client-side navigation.
- **Await params without await in Next.js 16:** `params` in App Router dynamic segments is now a Promise. Always `await params` before accessing properties.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV field escaping | Custom regex | `csvEscape()` per RFC 4180 (6 lines, in the export route) | Commas/quotes/newlines in user messages will corrupt CSV without proper escaping |
| Auth check on API routes | Per-route cookie parsing | `requireAdmin()` from `@/lib/auth` | Already handles token verification, returns null on invalid/expired |
| Client-side DB queries | Any client-DB bridge | Server Component + API route pattern | Drizzle/Neon runs server-side only; never expose DB credentials to the browser |
| Active nav link detection | Manual pathname comparison | `usePathname()` from `next/navigation` | React hook provided by Next.js, already in the project's dependency set |
| CSRF on admin API | Custom origin check | Already handled: admin routes are same-origin + httpOnly cookie. `isTrustedOrigin()` can be added as defense-in-depth but is not strictly required for server-to-server calls within the admin | Cookie is httpOnly/SameSite; CSRF is already mitigated |

**Key insight:** Every utility this phase needs already exists in the codebase. The planner should compose existing pieces, not introduce new concepts.

---

## Common Pitfalls

### Pitfall 1: Email Sends Before DB Insert
**What goes wrong:** Registration confirms via email, DB insert fails silently — record never appears in admin portal.
**Why it happens:** Default "write the existing TODO comment location" — the TODO is after the business logic, just before the return.
**How to avoid:** Explicitly place the `db.insert()` call BEFORE the first `await sendEmail()` call. Add a comment `// CRM capture — MUST precede email send`.
**Warning signs:** Test: submit a registration, kill the DB connection, verify the email still goes. Flip: kill email, verify DB row exists.

### Pitfall 2: Sidebar Breaks Admin Layout at Narrow Viewports
**What goes wrong:** Sidebar + main content overflow the viewport; admin becomes unusable on laptop screens.
**Why it happens:** Fixed-width sidebar (`w-56`) plus full-width main content exceeds screen width.
**How to avoid:** Use `flex` row with `flex-1 min-w-0` on the main content. The `min-w-0` prevents flex children from overflowing their parent. At very narrow widths (tablet/mobile) a collapsed sidebar or hamburger menu may be needed — but this is Claude's discretion and can be deferred.
**Warning signs:** Open admin in a browser window narrowed to 1024px. Horizontal scroll = broken.

### Pitfall 3: `params` Not Awaited in Next.js 16 Dynamic Routes
**What goes wrong:** TypeScript error or runtime error accessing `params.id` directly.
**Why it happens:** Next.js 16 changed `params` to be a Promise for server components and route handlers.
**How to avoid:** Always: `const { id } = await params;` before using any param value.
**Warning signs:** TypeScript complains about `Type 'Promise<...>' has no property 'id'`.

### Pitfall 4: CSV Injection (Formula Injection)
**What goes wrong:** User-submitted text starting with `=`, `+`, `-`, `@` is interpreted as a spreadsheet formula by Excel/LibreOffice when the CSV is opened.
**Why it happens:** CSV has no escape mechanism for formula characters.
**How to avoid:** The `csvEscape()` function handles commas and quotes. For formula injection, add a prefix-check: if the value starts with `=`, `+`, `-`, or `@`, prepend a single quote `'` before wrapping. This is a data hygiene improvement — add it to `csvEscape()`.
**Warning signs:** Test data with `=1+1` in a message field appearing as `2` in Excel.

### Pitfall 5: Tailwind v4 Syntax Regression
**What goes wrong:** Using `text-[var(--text-primary)]` instead of `text-(--text-primary)` — IDE warns, may not compile correctly in Tailwind v4.
**Why it happens:** Copying from Card.tsx (which has the old bracket form) or writing from memory of Tailwind v3 patterns.
**How to avoid:** Global search-replace when touching any file. Card.tsx must also be updated to v4 syntax when it is touched in this phase.
**Warning signs:** ESLint/IDE warning on bracket-form arbitrary values.

### Pitfall 6: Missing `name` Normalisation for List View
**What goes wrong:** CRM list tries to render `record.name` but registration records have `firstName`/`surname`, causing undefined rendering.
**Why it happens:** Two tables have different name column structures.
**How to avoid:** The GET /api/admin/crm list route must normalise before returning: `name: r.firstName + " " + r.surname` for registrations. Define a shared `CrmListItem` type that both record types conform to after normalisation.
**Warning signs:** "undefined undefined" appearing in the Name column for registration rows.

### Pitfall 7: `router.refresh()` Not Called After Status/Note Mutations
**What goes wrong:** Owner adds a note or changes status — UI doesn't update until manual page reload.
**Why it happens:** Client component POSTs to API but the server component's cached data isn't invalidated.
**How to avoid:** Call `router.refresh()` after every successful mutation in `NoteForm` and the status dropdown.
**Warning signs:** Add a note, the note doesn't appear until F5.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` direct access | `const { id } = await params` | Next.js 15/16 | Route handlers must await params |
| `text-[var(--x)]` Tailwind arbitrary | `text-(--x)` Tailwind v4 CSS variable syntax | Tailwind v4 | Old syntax still works but IDE warns; use new form |
| JSONB blob for form submissions | Individual typed columns | Phase 2 decision | Queryable fields for Phase 4 recurring billing |
| `lib/rate-limiter.ts` in-memory rate limiting | DB-backed login lockout (Phase 1) | Phase 1 | In-memory limiter still used on public routes; admin routes don't need it (session cookie is the gate) |

**Note on STATE.md schema location discrepancy:** STATE.md mentions `db/schema.ts` and `db/index.ts` at repo root, but the actual files are at `src/lib/db/schema.ts` and `src/lib/db/index.ts`. `drizzle.config.ts` confirms the correct path is `src/lib/db/schema.ts`. The STATE.md note was a documentation error from an early planning session. Use `src/lib/db/schema.ts` — it is the file that exists and is imported by auth.ts.

---

## Environment Availability

Step 2.6: All required tools are already installed. No external dependencies beyond the project's existing stack.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| drizzle-orm | Schema + queries | Yes | 0.45.2 | — |
| drizzle-kit | Migration generation | Yes | 0.31.10 | — |
| @netlify/neon | DB client | Yes | 0.1.2 | — |
| NETLIFY_DATABASE_URL | DB migrations + DB tests | Yes (Netlify env) | — | Skip DB tests locally (describe.skipIf pattern) |
| vitest | Tests | Yes | 4.1.9 | — |
| next/navigation usePathname | Active sidebar link | Yes (Next.js 16) | — | — |

**Missing dependencies with no fallback:** None.

**Note on local vs Netlify DB:** `NETLIFY_DATABASE_URL` is set in the Netlify environment. Locally, it may not be set. The `describe.skipIf(skipDB)` pattern already handles this — all DB-dependent tests skip gracefully without the env var.

---

## Validation Architecture

> `nyquist_validation` is not explicitly disabled in `.planning/config.json` (file doesn't exist) — section is included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` (same — all tests in `src/**/*.test.ts`) |
| Timeout | 15 000 ms per test |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-01 | DB insert created for registration submission | integration (DB) | `npm test -- src/app/api/register/route.test.ts` | No — Wave 0 |
| CRM-01 | Insert happens BEFORE email send (capture survives email failure) | integration (DB + mock) | `npm test -- src/app/api/register/route.test.ts` | No — Wave 0 |
| CRM-02 | DB insert created for contact form submission | integration (DB) | `npm test -- src/app/api/contact/route.test.ts` | No — Wave 0 |
| CRM-03 | GET /api/admin/crm returns merged, sorted list | integration (DB) | `npm test -- src/app/api/admin/crm/route.test.ts` | No — Wave 0 |
| CRM-03 | GET /api/admin/crm returns 401 without session | unit (no DB) | `npm test -- src/app/api/admin/crm/route.test.ts` | No — Wave 0 |
| CRM-04 | GET /api/admin/crm/[id] returns full record details | integration (DB) | `npm test -- src/app/api/admin/crm/\[id\]/route.test.ts` | No — Wave 0 |
| CRM-05 | PATCH /api/admin/crm/[id]/status updates status | integration (DB) | `npm test -- src/app/api/admin/crm/\[id\]/status/route.test.ts` | No — Wave 0 |
| CRM-05 | PATCH rejects invalid status values with 422 | unit (no DB) | same file | No — Wave 0 |
| CRM-06 | POST /api/admin/crm/[id]/notes inserts crm_notes row | integration (DB) | `npm test -- src/app/api/admin/crm/\[id\]/notes/route.test.ts` | No — Wave 0 |
| CRM-07 | GET /api/admin/crm/export returns text/csv with correct headers | unit (no DB needed for header check) | `npm test -- src/app/api/admin/crm/export/route.test.ts` | No — Wave 0 |
| CRM-07 | CSV output escapes commas/quotes/newlines in user data | unit | same file | No — Wave 0 |

**Manual-only (no automated test path):**
- Sidebar active-link highlighting (`usePathname()` — requires browser/Playwright)
- Status badge colours in list/detail view
- CSV opens correctly in spreadsheet software

### Reused Phase 1 Test Patterns

All Phase 2 tests MUST reuse these patterns from Phase 1:

1. **`describe.skipIf(skipDB)` pattern** — DB-dependent test blocks skip gracefully when `NETLIFY_DATABASE_URL` is absent:
   ```typescript
   const skipDB = !process.env.NETLIFY_DATABASE_URL;
   describe.skipIf(skipDB)("CRM DB tests", () => { ... });
   ```

2. **`makeRequest()` helper** — Construct synthetic `Request` objects for route handler unit tests (avoids `fetch` in tests):
   ```typescript
   function makeRequest(method: string, body?: unknown, sessionCookie?: string) {
     return new Request("http://localhost:3000/api/admin/crm", {
       method,
       headers: {
         "Content-Type": "application/json",
         ...(sessionCookie ? { Cookie: `admin_session=${sessionCookie}` } : {}),
       },
       body: body ? JSON.stringify(body) : undefined,
     });
   }
   ```

3. **Unique test data per run** — Use `Date.now()` suffixes to avoid test-run collisions:
   ```typescript
   const testEmail = `crm-test+${Date.now()}@example.com`;
   ```

4. **`beforeAll` setup + `db.insert()` for test fixtures** — Insert test rows directly via Drizzle in `beforeAll`, don't rely on calling the public API route to set up state.

5. **Non-DB assertions always run first** — Structure each test file with a non-DB `describe` block (CSRF, 401 without session, validation errors) followed by `describe.skipIf(skipDB)` blocks. This ensures partial CI coverage even without a live DB.

### What the Nyquist Auditor Should Verify

- [ ] All five new API routes return 401 when called without a valid session cookie
- [ ] `register/route.ts` inserts a DB row before calling `sendEmail` (test: mock/spy on `sendEmail` to confirm insert happens before it's called)
- [ ] `contact/route.ts` inserts a DB row before calling `sendEmail`
- [ ] PATCH /status rejects values outside the four valid statuses
- [ ] CSV response has `Content-Type: text/csv` and `Content-Disposition: attachment` headers
- [ ] CSV output correctly escapes a message field containing commas and double-quotes
- [ ] Registration records have `referenceId` populated (not null/empty)
- [ ] `crm_notes` rows have `record_type` and `record_id` populated correctly after POST /notes

### Wave 0 Gaps (test files to create before implementation)

- [ ] `src/app/api/register/route.test.ts` — extends existing register route tests with DB capture assertions
- [ ] `src/app/api/contact/route.test.ts` — new file; contact route currently has no tests
- [ ] `src/app/api/admin/crm/route.test.ts` — list endpoint
- [ ] `src/app/api/admin/crm/[id]/route.test.ts` — detail endpoint
- [ ] `src/app/api/admin/crm/[id]/status/route.test.ts` — status update
- [ ] `src/app/api/admin/crm/[id]/notes/route.test.ts` — note append
- [ ] `src/app/api/admin/crm/export/route.test.ts` — CSV export (header + escape correctness)

---

## Open Questions

1. **DB insert failure policy (for planner to decide)**
   - What we know: CONTEXT.md says "even if email fails" → DB insert before email. But the inverse policy (DB fails → still email?) was not explicitly stated.
   - What's unclear: Should a DB insert failure cause a 500 response (failing the registration) or silently log and continue?
   - Recommendation: Continue silently (log to stderr) — prioritise the user's registration confirmation over perfect capture. This matches typical SaaS patterns for non-critical side effects. Document the trade-off in a code comment.

2. **`/admin/crm/[id]` routing — record type disambiguation**
   - What we know: The `id` path param is an integer from either table. Two records (one registration, one enquiry) could have the same integer ID.
   - What's unclear: How does the detail route know which table to query?
   - Recommendation: Encode the type in the URL segment, e.g. `/admin/crm/registration-123` or `/admin/crm/enquiry-45`. Parse the prefix to determine the table. Alternatively, pass `?type=registration` as a query param. The URL-encoded approach is cleaner and bookmark-able. **Planner must decide and document this.** This decision affects the list page's link generation and the detail page's routing logic.

3. **Status update PATCH — which table?**
   - What we know: Same integer ID space issue as above.
   - What's unclear: How does PATCH `/api/admin/crm/[id]/status` know whether to update `client_registrations` or `contact_enquiries`?
   - Recommendation: Require `record_type` in the PATCH request body: `{ status: "contacted", recordType: "registration" }`. The route uses this to determine the table. Document this in the OpenAPI-style comment in the route file.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/db/schema.ts` — verified Drizzle column type patterns (serial, varchar, text, boolean, timestamp, integer)
- `src/lib/auth.ts` — verified `requireAdmin()` signature and return type
- `src/lib/db/index.ts` — verified db proxy client pattern
- `src/app/api/register/route.ts` — verified existing route structure and TODO location
- `src/app/api/contact/route.ts` — verified existing route structure
- `drizzle.config.ts` — verified migration output path and schema path
- `netlify/database/migrations/0000_living_mastermind.sql` — verified SQL output from drizzle-kit generate
- `vitest.config.ts` — verified test config, include pattern, alias setup
- `src/lib/auth.test.ts` + `src/app/api/admin/login/route.test.ts` + `reset-password/route.test.ts` — verified all Phase 1 test patterns to reuse
- `CLAUDE.md` — all project directives verified directly

### Secondary (MEDIUM confidence)
- Next.js 16 App Router dynamic params as Promise — confirmed by TypeScript error pattern described in CLAUDE.md context and consistent with Next.js 15 release notes pattern
- `router.refresh()` for invalidating server component cache after client mutation — well-documented Next.js App Router pattern

### Tertiary (LOW confidence — verified sufficient for this project's scale)
- CSV RFC 4180 escaping rules — standard specification, not project-specific
- Formula injection defense (`=`/`+` prefix) — widely documented OWASP-adjacent pattern; acceptable to implement as minimal prefix check

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against installed package.json; no new packages
- Architecture: HIGH — every pattern verified against existing Phase 1 codebase
- Pitfalls: HIGH — sourced from actual code inspection (Card.tsx v4 regression, route.ts email order, params Promise)
- Open questions: Clearly flagged; don't block implementation but require planner decisions

**Research date:** 2026-07-01
**Valid until:** 2026-08-01 (stable stack; drizzle-orm and Next.js 16 are not fast-moving at this version)
