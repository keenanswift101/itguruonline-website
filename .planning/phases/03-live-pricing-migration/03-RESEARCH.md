# Phase 3: Live Pricing Migration — Research

**Researched:** 2026-07-01
**Domain:** Drizzle ORM schema extension, Next.js server component DB fetching, inline admin UI editing, TypeScript refactoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Public Services page and registration wizard both read hosting packages via **direct DB fetch in server components** — same pattern as admin pages. No public API endpoint needed.
- **D-02:** The `HOSTING_PACKAGES` TypeScript constant in `src/lib/registration-types.ts` is **deleted** after the DB is seeded from its data. DB is the only runtime source. The `HostingPackage` union type and `HOSTING_PACKAGES` seed data are used to populate the DB migration seed, then the const is removed.
- **D-03:** `RegistrationWizard.tsx` (currently `"use client"`) imports `HOSTING_PACKAGES` directly. After the migration, the `/register` page (server component) fetches packages from DB and passes them as a `packages` prop to `RegistrationWizard`. `RegistrationWizard` passes them down to `StepServiceSelection`. Both components gain a `packages` prop (typed from DB row type) and drop the direct import of `HOSTING_PACKAGES`.
- **D-04:** The hardcoded `packages` array in `src/app/services/page.tsx` is also **deleted** and replaced with a DB fetch.
- **D-05:** Hosting package editing uses **inline table editing** — one row per package, cells are editable inline. Auto-save on blur via PATCH to the API. No Edit button or separate form page.
- **D-06:** Features list edited as a **textarea — one feature per line**. Saved as newline-separated TEXT in DB (Claude's discretion confirmed: TEXT is simpler).
- **D-07:** `is_popular` boolean column per package row — toggled via checkbox. No enforced uniqueness constraint.
- **D-08:** Domain prices: `tld VARCHAR` + `price_rands INTEGER`. No registration/renewal distinction. Price in rand (not cents).
- **D-09:** Six fixed TLDs: `.co.za`, `.com`, `.net`, `.org`, `.online`, `.africa`. Admin edits price only — cannot add/remove TLDs from UI.
- **D-10:** Domain prices appear **on the Domain Checker page only**. Show `R{price}/yr` next to available TLD badge. NULL price = omit silently.
- **D-11:** All DB fetches use `{ cache: 'no-store' }` (no-store via Drizzle's neon-http driver, which bypasses Next.js fetch cache by default). Every request hits the DB.
- **D-12:** Site settings table: `contact_email` and `hosting_setup_fee_note`. These replace the two hardcoded constants.
- **D-13:** Admin `/admin/pricing` page has three sections: Hosting Packages, Domain Prices, Site Settings — all on one page, same inline-edit pattern.

### Claude's Discretion

- Exact `hosting_packages` DB column names and types — research recommends separate integer + varchar columns (see Architecture section)
- Features stored as `TEXT` (newline-separated) — confirmed simpler over JSONB
- Admin UI visual treatment: section headers, "Saved ✓" inline feedback fading after 1.5s (not a toast)
- Exact URL structure within `/admin/pricing` — one page (recommended)
- Activate Pricing nav link in sidebar by removing the `// Phase 3` comment

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRICE-01 | Owner can edit a hosting package's price, description, features, and "Most Popular" label | Inline table editor component with PATCH `/api/admin/pricing/packages/[id]`; `is_popular` boolean column |
| PRICE-02 | Hosting price edits appear on public Services page and registration wizard within seconds, no code deploy | `no-store` DB fetch in server components; Drizzle neon-http bypasses Next.js fetch cache by default |
| PRICE-03 | Owner can add/edit per-TLD domain registration prices | `domain_prices` table with 6 pre-seeded TLD rows; PATCH `/api/admin/pricing/domains/[tld]` |
| PRICE-04 | Domain prices appear on the public site in place of "request a quote" | Domain Checker page receives `domainPrices` as prop from server component parent; DomainRow updated to show `R{price}/yr` |
| PRICE-05 | Owner can update site settings (contact email, hosting setup-fee note) without a code change | `site_settings` table with `key`/`value` rows or flat columns; PATCH `/api/admin/pricing/settings` |
</phase_requirements>

---

## Summary

Phase 3 is a data-layer migration and admin UI addition. The work divides into four clean streams: (1) extend the Drizzle schema with three new tables and generate/run a new migration, (2) seed the tables from existing hardcoded data then delete the TS constants, (3) refactor public pages and the registration wizard to fetch from DB, and (4) build the `/admin/pricing` inline-edit page with three PATCH API routes.

The project already has all required infrastructure: Drizzle ORM with `@netlify/neon` HTTP driver at `src/lib/db/`, `requireAdmin()` for auth, an established pattern of server-component DB fetches (Phase 2 admin pages), and Vitest with the `describeIfDb` skip pattern for DB-dependent tests. No new npm packages are required.

The highest-complexity task is the registration wizard props refactor: `RegistrationWizard` is a `"use client"` component that currently imports `HOSTING_PACKAGES` directly. It must gain a `packages` prop, which means `src/app/register/page.tsx` (server component) becomes async and passes packages down. This is straightforward but touches three files simultaneously and must be done atomically to avoid a broken intermediate state. The `selectedPkg` lookup at line 235 of `RegistrationWizard.tsx` and the step-3 summary sidebar also depend on package data and must be updated.

**Primary recommendation:** Implement in wave order — schema/migration first, then seed + const deletion, then public page refactors, then admin UI. Each wave is independently deployable and testable.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | installed | ORM + query builder | Already used in schema.ts/index.ts |
| @netlify/neon | installed | Neon HTTP driver | Already in db/index.ts lazy proxy |
| drizzle-kit | installed (devDep) | Migration generation | `db:generate` + `db:migrate` scripts present |
| zod | installed | API body validation | Used in all existing API routes |
| next | 16 (App Router) | Server components + route handlers | Project framework |

### No New Dependencies Required

All needed libraries are already in `package.json`. The phase is entirely within the existing stack.

**Installation:** None required.

---

## Architecture Patterns

### Recommended Table Design

```typescript
// src/lib/db/schema.ts additions

export const hostingPackages = pgTable("hosting_packages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(), // "startup", "basic", etc.
  name: varchar("name", { length: 64 }).notNull(),
  priceRands: integer("price_rands").notNull(),         // 85, 99, 149, 279, 399, 35
  pricePeriod: varchar("price_period", { length: 8 }).notNull().default("mo"), // "mo" | "yr"
  description: text("description").notNull().default(""),
  features: text("features").notNull().default(""),     // newline-separated
  isPopular: boolean("is_popular").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
});

export const domainPrices = pgTable("domain_prices", {
  tld: varchar("tld", { length: 16 }).primaryKey(),   // ".co.za", ".com", etc.
  priceRands: integer("price_rands"),                  // nullable — NULL = no price shown
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),    // "contact_email", "hosting_setup_fee_note"
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
});
```

**Why `priceRands` as integer + `pricePeriod` as varchar rather than a combined "R85/mo" string:**
- Admin editing a number input (85) is cleaner and less error-prone than free-text "R85/mo"
- Public display just formats: `` `R${priceRands}/${pricePeriod}` ``
- Avoids parsing errors if admin accidentally types "85/mo" without "R"
- `sortOrder` ensures the package display order is DB-controlled, not alphabetical

**Why `tld` as primary key on `domain_prices`:**
- TLDs are the natural unique identifier; serial PK adds no value
- PATCH routes use `/api/admin/pricing/domains/[tld]` — natural URL param

**Why `siteSettings` as key/value rows:**
- Extensible without a schema migration when adding future settings
- Admin edits two simple text fields; no complexity overhead

### Migration File Pattern

Migration is generated by drizzle-kit and includes seed data for the six domain_prices TLDs and the two site_settings keys:

```sql
-- Migration 0001_pricing_tables.sql (generated by drizzle-kit generate)
CREATE TABLE "hosting_packages" (...);
CREATE TABLE "domain_prices" (...);
CREATE TABLE "site_settings" (...);

-- Seed domain TLDs (pre-populate so admin sees all 6 rows immediately)
INSERT INTO "domain_prices" ("tld") VALUES
  ('.co.za'), ('.com'), ('.net'), ('.org'), ('.online'), ('.africa')
ON CONFLICT DO NOTHING;

-- Seed site settings defaults
INSERT INTO "site_settings" ("key", "value") VALUES
  ('contact_email', 'info@it-guru.co.za'),
  ('hosting_setup_fee_note', 'New hosting accounts include a once-off R395 cPanel account setup, configuration, and migration-assistance fee.')
ON CONFLICT DO NOTHING;
```

**IMPORTANT:** The seed for `hosting_packages` rows is done in the migration file itself (not a separate script) — the HOSTING_PACKAGES const data is transcribed into INSERT statements. This ensures the DB is seeded before the TS const is deleted. The `ON CONFLICT DO NOTHING` guard means re-running the migration is idempotent.

### Server Component DB Fetch Pattern

```typescript
// src/app/services/page.tsx — after refactor
import { db } from "@/lib/db/index";
import { hostingPackages } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

// At top of page component (async server component):
const packages = await db
  .select()
  .from(hostingPackages)
  .orderBy(asc(hostingPackages.sortOrder));
```

Drizzle with `@netlify/neon`'s HTTP driver does not go through Next.js `fetch()`, so it is not subject to Next.js route-segment caching. It hits the DB on every request by default. No special `cache: 'no-store'` configuration is needed at the Drizzle call level — but adding `export const dynamic = 'force-dynamic'` or `export const revalidate = 0` at the page level is good practice to make the intent explicit and prevent any future Next.js static optimization from caching the page.

```typescript
// At top of any page that reads live pricing data:
export const dynamic = "force-dynamic";
```

### Registration Wizard Props Refactor Pattern

The wizard is `"use client"` and cannot call `db` directly. The server component parent fetches and passes down:

```typescript
// src/app/register/page.tsx — becomes async server component
import { db } from "@/lib/db/index";
import { hostingPackages } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type HostingPackageRow = InferSelectModel<typeof hostingPackages>;

export default async function RegisterPage() {
  const packages = await db
    .select()
    .from(hostingPackages)
    .orderBy(asc(hostingPackages.sortOrder));

  return (
    // ...
    <RegistrationWizard packages={packages} />
    // ...
  );
}
```

```typescript
// RegistrationWizard.tsx signature change:
export function RegistrationWizard({ packages }: { packages: HostingPackageRow[] }) {
  // Replace HOSTING_PACKAGES.find(...) with packages.find(...)
  // Pass packages down to StepServiceSelection
}
```

```typescript
// StepServiceSelection.tsx signature change:
interface StepCProps {
  data: StepCData;
  packages: HostingPackageRow[];
  onNext: (data: StepCData) => void;
  onBack: () => void;
}
```

**Key detail:** `HostingPackage` union type (`"startup" | "basic" | ...`) in `registration-types.ts` is used for `StepCData.hostingPackage`. After the migration the `slug` column serves the same purpose. The union type can be replaced with `string` in `StepCData` since the DB is now the authority on valid slugs, OR kept as a narrower type derived from the DB rows. The simpler path is `string` — no breakage, the existing `validateStepC` check still works because it just checks for non-empty.

### Domain Checker Price Display Pattern

`DomainChecker` is a `"use client"` component. The server component parent (`src/app/domain-checker/page.tsx`) fetches prices and passes them as a prop:

```typescript
// src/app/domain-checker/page.tsx — becomes async
const domainPrices = await db.select().from(domainPricesTable);
// Pass as Map<string, number | null> for O(1) lookup in the client component
const priceMap = Object.fromEntries(
  domainPrices.map((r) => [r.tld, r.priceRands])
);

return <DomainChecker domainPrices={priceMap} />;
```

Inside `DomainRow` component (within `DomainChecker.tsx`):
```typescript
// When result.available && !result.error && domainPrices[result.tld] != null:
<span className="text-xs text-slate-300">
  R{domainPrices[result.tld]}/yr
</span>
```

The `priceMap` object is JSON-serializable, safe to pass as a prop from server to client.

### Admin API Route Pattern

Following existing route structure in `src/app/api/admin/`:

```typescript
// src/app/api/admin/pricing/packages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { hostingPackages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const PatchSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  priceRands: z.number().int().positive().optional(),
  description: z.string().optional(),
  features: z.string().optional(),      // newline-separated text
  isPopular: z.boolean().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: "At least one field required" });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  await db.update(hostingPackages).set(parsed.data).where(eq(hostingPackages.id, id));
  return NextResponse.json({ ok: true });
}
```

Same pattern for `/api/admin/pricing/domains/[tld]/route.ts` and `/api/admin/pricing/settings/route.ts`.

### Admin Pricing Page Structure

```
src/app/admin/pricing/page.tsx        — server component, requireAdmin(), fetches all three tables
src/app/admin/pricing/PackagesEditor.tsx  — "use client" inline table
src/app/admin/pricing/DomainPricesEditor.tsx — "use client" inline table
src/app/admin/pricing/SettingsEditor.tsx  — "use client" two-field form
```

All three editor components receive initial data as props from the server page. After each PATCH, the component calls `router.refresh()` to revalidate the server component data (established Phase 2 pattern from NoteForm).

### Recommended Project Structure (new files only)

```
src/
├── app/
│   ├── admin/
│   │   └── pricing/
│   │       ├── page.tsx               # Server component — requireAdmin + DB fetch
│   │       ├── PackagesEditor.tsx     # "use client" — inline table for hosting_packages
│   │       ├── DomainPricesEditor.tsx # "use client" — inline table for domain_prices
│   │       └── SettingsEditor.tsx     # "use client" — two text fields for site_settings
│   └── api/
│       └── admin/
│           └── pricing/
│               ├── packages/
│               │   └── [id]/
│               │       └── route.ts   # PATCH handler
│               ├── domains/
│               │   └── [tld]/
│               │       └── route.ts   # PATCH handler
│               └── settings/
│                   └── route.ts       # PATCH handler
└── lib/
    └── db/
        └── schema.ts                  # Extended with 3 new tables
netlify/
└── database/
    └── migrations/
        └── 0001_pricing_tables.sql    # Generated by drizzle-kit generate
```

### Anti-Patterns to Avoid

- **Fetching pricing in a client component via useEffect + fetch:** All three pricing reads should happen in server components. The existing `DomainChecker` is already `"use client"` — it receives prices as props, not fetches them itself.
- **Putting seed data in a separate script:** Seed the hosting_packages and site_settings rows inside the migration SQL itself (with `ON CONFLICT DO NOTHING`) so they're applied automatically on `db:migrate`. A separate seed script creates a two-step deployment risk.
- **Using `router.refresh()` for public pages after admin edit:** `router.refresh()` only refreshes the current admin route's server component. Public pages use `no-store` / `force-dynamic` and refresh on their own next load — no cross-page invalidation needed.
- **Storing price as "R85/mo" string:** Store integer rands + period string separately so the admin edits a number input, not a free-text field. Parsing "R85/mo" back out is fragile.
- **Using bracket-form Tailwind classes:** Use `text-(--text-primary)` not `text-[var(--text-primary)]`. The admin editor components will use existing design tokens.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB migrations | Custom SQL runner | `drizzle-kit generate` + `drizzle-kit migrate` | Already wired up — `db:generate` and `db:migrate` npm scripts exist |
| Request validation | Manual type checks | `zod` schemas | Already used in every existing API route |
| Admin auth guard | Custom cookie checks | `requireAdmin()` from `src/lib/auth.ts` | Phase 1 output — drop-in for every new admin route/page |
| Optimistic UI state | Complex state machines | Simple `useState` for pending/saved/error per field | Inline edit is single-field; no need for full form library |
| Price formatting | Custom formatter | Template literal `` `R${priceRands}/${pricePeriod}` `` | Simple enough; no `Intl.NumberFormat` needed for rand amounts |

---

## Common Pitfalls

### Pitfall 1: Deleting HOSTING_PACKAGES before DB is seeded

**What goes wrong:** If `HOSTING_PACKAGES` is deleted in the same commit as the DB tables are created but before the migration is run on production, the public site crashes with "HOSTING_PACKAGES is not defined".

**Why it happens:** Migration order — the TS file change and the DB migration are separate operations.

**How to avoid:** The migration SQL itself contains the INSERT seed data. Plan sequence: (1) push migration to production, (2) verify seed rows in DB, (3) delete TS const and deploy app. Never combine steps 1 and 3 in one deploy.

**Warning signs:** TypeScript errors at build time if import is deleted before migration validates.

### Pitfall 2: RegistrationWizard prop drilling breaks the Suspense boundary

**What goes wrong:** `register/page.tsx` wraps `<RegistrationWizard>` in `<Suspense>`. If `RegisterPage` becomes async and awaits a DB call, the Suspense fallback still works — but only if the DB call is in the page component, not inside the Suspense boundary's child. Putting the DB fetch inside RegistrationWizard itself (which is "use client") would break.

**Why it happens:** "use client" components cannot call `db` directly; they run in the browser.

**How to avoid:** Keep the DB fetch in `register/page.tsx` (server component) and pass `packages` as a serializable prop. Confirm `HostingPackageRow` is fully JSON-serializable (no Date objects in the prop — only pass `id`, `slug`, `name`, `priceRands`, `pricePeriod`, `description`, `features`, `isPopular`, `sortOrder`, not timestamps).

### Pitfall 3: Domain Checker page prop passing with NEXT_PUBLIC serialization

**What goes wrong:** `domainPrices` is a plain object (`Record<string, number | null>`). This is JSON-serializable and safe to pass from server to client component. However if the type is wrong (e.g., contains `undefined` values), Next.js will throw a serialization error.

**Why it happens:** JavaScript `undefined` is not JSON-serializable. `null` is fine; `undefined` is not.

**How to avoid:** Use `r.priceRands ?? null` (not `|| null`) when building the price map to ensure `undefined` never appears. Explicitly type the prop as `Record<string, number | null>`.

### Pitfall 4: TLD URL encoding in PATCH route

**What goes wrong:** A PATCH to `/api/admin/pricing/domains/.co.za` — the `.` at the start and `.` within the TLD may cause routing issues in some environments. The TLD should be URL-encoded when used as a path param.

**Why it happens:** Dots in path segments can be ambiguous in some routing implementations.

**How to avoid:** URL-encode TLDs when constructing the PATCH URL in the client: `encodeURIComponent(tld)` → `.co.za` becomes `%2Eco.za`. In the route handler, use `decodeURIComponent(params.tld)` when reading the param. Alternatively, use a query param: `PATCH /api/admin/pricing/domains?tld=.co.za`.

**Recommendation:** Use `encodeURIComponent` / `decodeURIComponent` on the path param. This is the most RESTful approach and consistent with Next.js dynamic route conventions.

### Pitfall 5: `router.refresh()` after inline edit does not update other open tabs

**What goes wrong:** Admin edits a price in Tab A. Tab B (open to `/services`) still shows the old price until manually refreshed. This is expected and acceptable per D-11.

**Why it happens:** `no-store` means every new request hits the DB, but open pages are not pushed updates.

**How to avoid:** This is by design and documented. Do not add WebSocket or polling. Document in admin UI: "Changes appear on the public site on the next page load."

### Pitfall 6: Tailwind v4 bracket-form syntax in new editor components

**What goes wrong:** New editor components written with `text-[var(--text-primary)]` will trigger IDE warnings and are inconsistent with the project standard.

**Why it happens:** Muscle memory from older Tailwind syntax.

**How to avoid:** Always use `text-(--text-primary)` form. The existing `StepServiceSelection.tsx` and `AdminDashboardPage` already demonstrate the correct form — copy from those.

---

## Code Examples

### Existing Pattern: requireAdmin redirect (copy this exactly)

```typescript
// src/app/admin/dashboard/page.tsx — established Phase 2 pattern
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // ...
}
```

### Existing Pattern: Drizzle select with ordering

```typescript
// Established pattern from db/index.ts + schema.ts
import { db } from "@/lib/db/index";
import { hostingPackages } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

const packages = await db
  .select()
  .from(hostingPackages)
  .orderBy(asc(hostingPackages.sortOrder));
```

### Existing Pattern: Drizzle update

```typescript
import { eq } from "drizzle-orm";

await db
  .update(hostingPackages)
  .set({ priceRands: 95, updatedAt: new Date() })
  .where(eq(hostingPackages.id, id));
```

### Existing Pattern: Test skip guard (use this in all new route tests)

```typescript
// Established in src/app/api/admin/login/route.test.ts
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describeIfDb("PATCH /api/admin/pricing/packages/[id] — DB tests", () => {
  // ...
});
```

### Inline Save Feedback Pattern (implement in editor components)

```typescript
// "use client" editor component pattern
const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

async function handleBlur(fieldName: string, value: string) {
  setSaveState("saving");
  try {
    const res = await fetch(`/api/admin/pricing/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldName]: value }),
    });
    if (!res.ok) throw new Error();
    setSaveState("saved");
    router.refresh();
    setTimeout(() => setSaveState("idle"), 1500);
  } catch {
    setSaveState("error");
  }
}
```

### Inline "Saved ✓" indicator (design system aligned)

```tsx
{saveState === "saved" && (
  <span className="text-xs text-green-400 transition-opacity">Saved ✓</span>
)}
{saveState === "error" && (
  <span className="text-xs text-red-400">Save failed</span>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HOSTING_PACKAGES TS const | DB rows in hosting_packages table | Phase 3 | Owner can edit prices without code deploy |
| Hardcoded packages array in services/page.tsx | DB fetch in async server component | Phase 3 | Single source of truth |
| HOSTING_SETUP_FEE + HOSTING_SETUP_FEE_NOTE consts | site_settings DB rows | Phase 3 | Both hardcodings removed |
| No domain prices on public site | domain_prices table + Domain Checker display | Phase 3 | PRICE-03/PRICE-04 fulfilled |

**Deprecated/outdated after Phase 3:**
- `HOSTING_PACKAGES` const in `registration-types.ts` — deleted after DB seeded
- `HOSTING_SETUP_FEE` const in `registration-types.ts` — deleted after DB seeded
- `packages` array in `services/page.tsx` — deleted, replaced with DB fetch
- `HOSTING_SETUP_FEE_NOTE` const in `services/page.tsx` — deleted, replaced with DB fetch
- `HostingPackage` union type may be replaced with `string` in `StepCData` — evaluate during implementation

---

## Open Questions

1. **`HostingPackage` union type in `StepCData.hostingPackage`**
   - What we know: Currently typed as `"startup" | "basic" | "standard" | "advanced" | "enterprise" | "parked" | ""`. Used in `validateStepC` and `StepCData`.
   - What's unclear: After deleting HOSTING_PACKAGES, do we want to keep this union type (derived from slug values) or relax it to `string`?
   - Recommendation: Relax to `string` for simplicity. The slug column in the DB is the authority. The API validation route can check slug exists in DB if needed (out of scope for Phase 3). Keeping the union type requires manually syncing it with DB slugs — unnecessary maintenance.

2. **`services/page.tsx` contact email usage**
   - What we know: The Contact page likely has a hardcoded contact email. PRICE-05 says "contact_email" is a site setting.
   - What's unclear: Where does `contact_email` actually appear in the public site? The Contact page (`src/app/contact/`) was not checked.
   - Recommendation: Check `src/app/contact/page.tsx` before implementing SettingsEditor. If contact_email appears there, add a DB fetch to that page too. This is a small addition to the plan.

3. **Admin sidebar Pricing link activation**
   - What we know: `src/app/components/admin/AdminSidebar.tsx` has a `// Phase 3` comment placeholder (referenced in CONTEXT.md).
   - What's unclear: The actual file path — `src/app/components/admin/` vs `src/components/admin/` — was not verified (admin layout at `src/app/admin/layout.tsx` doesn't import a sidebar).
   - Recommendation: Verify the sidebar component path before planning. The admin layout currently does not render a sidebar — it may be planned output from Phase 2 that was not yet built, or may be at a different path.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| NETLIFY_DATABASE_URL | DB operations | ✓ (Netlify env, set in Phase 1) | Neon Postgres | — |
| drizzle-kit | Migration generation | ✓ | devDep installed | — |
| vitest | Test runner | ✓ | devDep installed | — |
| Node.js | Scripts | ✓ | Runtime present | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRICE-01 | PATCH /api/admin/pricing/packages/[id] updates row | integration (describeIfDb) | `npm test` | ❌ Wave 0 |
| PRICE-01 | PATCH returns 401 without session | unit | `npm test` | ❌ Wave 0 |
| PRICE-02 | Services page fetches from DB (not hardcoded const) | manual smoke | `npm run build && npm start` | N/A |
| PRICE-03 | PATCH /api/admin/pricing/domains/[tld] updates price | integration (describeIfDb) | `npm test` | ❌ Wave 0 |
| PRICE-04 | Domain Checker receives prices as prop (type safety) | TypeScript compile | `npx tsc --noEmit` | N/A |
| PRICE-05 | PATCH /api/admin/pricing/settings updates key/value | integration (describeIfDb) | `npm test` | ❌ Wave 0 |
| PRICE-05 | Unauthenticated PATCH returns 401 | unit | `npm test` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npm test`
- **Per wave merge:** `npx tsc --noEmit && npm test && npm run build`
- **Phase gate:** Full suite green + manual smoke of `/services`, `/domain-checker`, `/register`, `/admin/pricing` before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/app/api/admin/pricing/packages/[id]/route.test.ts` — covers PRICE-01 (PATCH auth guard + DB update)
- [ ] `src/app/api/admin/pricing/domains/[tld]/route.test.ts` — covers PRICE-03 (PATCH auth guard + DB update)
- [ ] `src/app/api/admin/pricing/settings/route.test.ts` — covers PRICE-05 (PATCH auth guard + DB update)

*(Shared fixtures: no new `conftest` needed — each test file follows the existing pattern from `route.test.ts` in login route)*

---

## Project Constraints (from CLAUDE.md)

These are binding constraints the planner must verify each task respects:

| Constraint | Rule |
|------------|------|
| Tailwind v4 syntax | Use `text-(--text-primary)` NOT `text-[var(--text-primary)]`. Fix bracket form when touching any file. |
| Dark-only theme | Fixed `bg-image.jpg` on all pages. No `bg-slate-900` or per-section fills. New admin page inherits from `src/app/admin/layout.tsx` (already provides bg-image). |
| Server components default | `"use client"` only for editor components (PackagesEditor, DomainPricesEditor, SettingsEditor) which need state. |
| `await requireAdmin()` | Must be the first call in `src/app/admin/pricing/page.tsx` and all three PATCH route handlers. |
| btn-metallic / btn-glass | Admin UI action buttons use these classes. |
| Drizzle ORM + @netlify/neon | Established pattern in `src/lib/db/index.ts` — do not introduce a second DB client. |
| Test pattern | `const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;` for DB tests. |
| No new npm dependencies | All needed libraries are already installed. |
| Pricing in two places | `HOSTING_PACKAGES` in registration-types.ts AND `packages` in services/page.tsx are BOTH deleted after migration — not just one. |
| Email templates | If any email references `HOSTING_SETUP_FEE`, it must be updated to read from site_settings. Check `src/lib/email.ts`. |
| Outgoing emails | Table-based HTML, inline styles only — no flexbox/grid, no `<style>` block. Do not add email template changes unless necessary. |
| No new per-section backgrounds | Admin pricing page sections use transparent backgrounds over the fixed bg-image. |

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection — `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `drizzle.config.ts`, `netlify/database/migrations/0000_living_mastermind.sql` — confirmed Drizzle pattern, migration path, schema conventions
- Direct code inspection — `src/lib/registration-types.ts` — confirmed exact HOSTING_PACKAGES data to seed
- Direct code inspection — `src/app/services/page.tsx` — confirmed packages array and HOSTING_SETUP_FEE_NOTE to delete
- Direct code inspection — `src/components/forms/RegistrationWizard.tsx` — confirmed import site and prop refactor scope
- Direct code inspection — `src/components/forms/steps/StepServiceSelection.tsx` — confirmed HOSTING_PACKAGES usage
- Direct code inspection — `src/components/forms/DomainChecker.tsx` — confirmed DomainRow structure for price display addition
- Direct code inspection — `src/app/api/admin/login/route.ts` + `route.test.ts` — confirmed API route pattern and test pattern
- Direct code inspection — `vitest.config.ts`, `package.json` — confirmed test framework and scripts

### Secondary (MEDIUM confidence)

- `STATE.md` — confirmed Phase 1 complete, schema at `src/lib/db/`, proxy.ts removed, auth via `requireAdmin()` only
- `CONTEXT.md` decisions — confirmed all D-01 through D-13 as locked

### Tertiary (LOW confidence)

- Admin sidebar path (`src/app/components/admin/AdminSidebar.tsx`) — referenced in CONTEXT.md but not directly verified by file read. Requires confirmation before plan execution.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed in package.json
- Architecture: HIGH — patterns taken directly from existing codebase
- Pitfalls: HIGH — derived from code inspection, not speculation
- Schema design: HIGH — follows established conventions in schema.ts exactly

**Research date:** 2026-07-01
**Valid until:** 2026-08-01 (stable stack — Drizzle, Next.js 16, Tailwind v4 all pinned)
