# Phase 3: Live Pricing Migration — Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 replaces two hard-coded pricing data sources with a database-backed single source of truth, adds a domain registration price table, and adds a site-settings table. An admin UI at `/admin/pricing` lets the owner edit all of these without a code deploy. The public Services page and Domain Checker read from the DB at request time with `no-store` caching so changes appear within seconds.

**In scope:**
- `hosting_packages` table in DB (replacing `HOSTING_PACKAGES` TS const + services page `packages` array)
- `domain_prices` table in DB (6 TLDs; new — no equivalent exists in code today)
- `site_settings` table in DB (contact email + hosting setup-fee note)
- Admin `/admin/pricing` page with inline table editing for all three
- Public Services page reads packages from DB
- Domain Checker page shows per-TLD price when set
- Registration wizard receives packages as props (server component parent fetches from DB)

**Out of scope:** Payment processing, billing cycles, invoice line-item defaults (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Source-of-Truth Cutover
- **D-01:** Public Services page and registration wizard both read hosting packages via **direct DB fetch in server components** — same pattern as admin pages. No public API endpoint needed.
- **D-02:** The `HOSTING_PACKAGES` TypeScript constant in `src/lib/registration-types.ts` is **deleted** after the DB is seeded from its data. DB is the only runtime source. The `HostingPackage` union type and `HOSTING_PACKAGES` seed data are used to populate the DB migration seed, then the const is removed.
- **D-03:** `RegistrationWizard.tsx` (currently `"use client"`) imports `HOSTING_PACKAGES` directly. After the migration, the `/register` page (server component) fetches packages from DB and passes them as a `packages` prop to `RegistrationWizard`. `RegistrationWizard` passes them down to `StepServiceSelection`. Both components gain a `packages` prop (typed from DB row type) and drop the direct import of `HOSTING_PACKAGES`.
- **D-04:** The hardcoded `packages` array in `src/app/services/page.tsx` is also **deleted** and replaced with a DB fetch.

### Admin Package Editor UI
- **D-05:** Hosting package editing uses **inline table editing** — one row per package, cells are editable inline. The owner clicks a cell, types the new value, and blurs/presses Enter to save (auto-save on blur via PATCH to the API). No Edit button or separate form page.
- **D-06:** The features list for each package is edited as a **textarea — one feature per line**. The textarea opens when the features cell is clicked. Saved as a newline-separated string in the DB (or JSON array — Claude's discretion on storage format). Displayed as a bullet list on the public site by splitting on newlines.
- **D-07:** The "Most Popular" label is a `boolean` `is_popular` column per package row — toggled via a checkbox in the inline table. Only one package should be popular at a time (the admin is responsible for maintaining this; no enforced uniqueness constraint).

### Domain Price Structure
- **D-08:** Domain prices use a **simple flat model**: `tld VARCHAR` + `price_rands INTEGER` (price in rand, not cents — avoids decimal complexity for this market). Two columns only. No registration vs renewal distinction, no year-based tiers.
- **D-09:** Six TLDs in scope: `.co.za`, `.com`, `.net`, `.org`, `.online`, `.africa`. These are the 6 fixed rows (upserted at seed time). The admin can edit the `price_rands` value per TLD — they cannot add or remove TLDs from this UI (adding new TLDs is a code change, out of scope for Phase 3).
- **D-10:** Domain prices appear **on the Domain Checker page only**. When a domain is available, show `R{price}/yr` next to the TLD badge. If no price is set for a TLD (`price_rands` is NULL), show nothing (no "request a quote" text needed — just omit the price).

### Public Site Freshness
- **D-11:** All server component DB fetches for pricing data use `{ cache: 'no-store' }` (or Drizzle's equivalent — no Next.js fetch cache). Every request hits the DB. Changes made in the admin portal appear on the public site immediately on next page load. Acceptable for this traffic level; no cache invalidation logic needed.

### Site Settings
- **D-12:** Site settings table stores at minimum: `contact_email` (editable, shown on Contact page) and `hosting_setup_fee_note` (editable text shown on Services page and registration wizard — currently hardcoded as "New hosting accounts include a once-off R395 cPanel account setup, configuration, and migration-assistance fee."). These are the two items required by PRICE-05.
- **D-13:** The admin `/admin/pricing` page has three sections: Hosting Packages, Domain Prices, and Site Settings — all on one page with the same inline-edit pattern for settings (two text fields with auto-save on blur).

### Claude's Discretion
- Exact `hosting_packages` DB column names and types (price as varchar "R85/mo" or separate integer + period columns — Claude's choice, pick what makes public display and editing simplest)
- Whether features are stored as `TEXT` (newline-separated) or `JSONB` array — recommend TEXT as simpler
- Admin UI visual treatment: section headers, save feedback (toast vs inline "Saved ✓"), loading states
- Exact URL structure within `/admin/pricing` (one page vs sub-routes — one page recommended given three small sections)
- Whether the `/admin/pricing` nav link is added to the existing `AdminSidebar.tsx` in this phase (yes — sidebar already lists "Pricing" as Phase 3 link, just remove the `// Phase 3` comment)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Pricing Data (to migrate then delete)
- `src/lib/registration-types.ts` — Contains `HOSTING_PACKAGES` const (6 packages with id, name, price, features), `HOSTING_SETUP_FEE` const, `HostingPackage` union type. **Delete** after DB seeding; keep only `HostingPackage` type if still needed by DB query return type.
- `src/app/services/page.tsx` — Contains hardcoded `packages` array (6 packages with name, price, period, description, features, highlight) and `HOSTING_SETUP_FEE_NOTE` const. **Replace** with DB fetch.

### Registration Wizard (needs props refactor)
- `src/components/forms/RegistrationWizard.tsx` — `"use client"` component; imports and uses `HOSTING_PACKAGES`. Must gain a `packages` prop; pass down to StepServiceSelection.
- `src/components/forms/steps/StepServiceSelection.tsx` — `"use client"` step that renders package cards; imports `HOSTING_PACKAGES`. Must gain a `packages` prop instead.
- `src/app/register/page.tsx` — Server component that renders `<RegistrationWizard />`. After Phase 3, fetches packages from DB and passes as prop.

### Database Layer
- `src/lib/db/schema.ts` — Extend with `hostingPackages`, `domainPrices`, `siteSettings` tables (follow existing Drizzle patterns: serial PK, varchar, text, boolean, timestamp)
- `src/lib/db/index.ts` — Lazy proxy DB client; import `db` from here in new routes
- `drizzle.config.ts` — Migration output path: `netlify/database/migrations/`

### Admin Auth Pattern
- `src/lib/auth.ts` — `requireAdmin()` must be called first in every new admin server component page
- `src/app/admin/layout.tsx` — Sidebar shell (Phase 2); Pricing link already listed with `// Phase 3` comment — activate it

### Design System
- `CLAUDE.md` — All binding constraints: Tailwind v4 syntax, bg-image.jpg, btn-metallic/btn-glass, no per-section bg fills, server components by default

### Requirements
- `.planning/REQUIREMENTS.md` — PRICE-01 through PRICE-05 (all must be covered)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db/schema.ts` + `src/lib/db/index.ts` — Drizzle ORM patterns (serial, varchar, text, boolean, timestamp) — extend, don't replace
- `src/components/ui/Card.tsx` — Optional for settings section cards; fix bracket-form Tailwind syntax when touched
- `src/lib/csrf.ts` — `isTrustedOrigin()` — available for admin API routes (optional defense-in-depth)
- `src/lib/auth.ts` — `requireAdmin()` — same pattern as Phase 2 admin pages/routes
- `src/app/components/admin/AdminSidebar.tsx` (Phase 2 output) — Add Pricing link by removing the `// Phase 3` placeholder comment

### Established Patterns
- Server components fetch from DB directly (no API layer for admin reads) — established in Phase 2
- `"use client"` only where state/interactivity required
- `await requireAdmin()` at top of every admin server component
- Auto-save on blur for inline editing (no explicit Save button per cell — same pattern as Google Sheets-style editing)
- `router.refresh()` after mutation to revalidate server component data — established in Phase 2 NoteForm

### Integration Points
- `/admin/pricing` is a new route under the existing admin layout (sidebar + bg-image already provided)
- Public `/services` and `/domain-checker` pages gain a DB fetch at the top of their server component
- `src/app/register/page.tsx` gains a DB fetch + passes packages prop to `<RegistrationWizard packages={...} />`
- New admin API routes: `PATCH /api/admin/pricing/packages/[id]`, `PATCH /api/admin/pricing/domains/[tld]`, `PATCH /api/admin/pricing/settings`
- All admin API routes: `await requireAdmin()` + return 401 if null

</code_context>

<specifics>
## Specific Ideas

- The six TLD rows in `domain_prices` should be pre-seeded by the migration itself (not a separate seed script), so the admin UI shows all six rows even before any prices are set — with empty/null price fields the owner fills in.
- Status feedback for inline edits: a brief "Saved ✓" inline next to the field, fading out after 1.5s — not a toast notification (keeps the admin UI lightweight).
- `HOSTING_SETUP_FEE_NOTE` is currently two separate hardcodings: one in `registration-types.ts` as `HOSTING_SETUP_FEE = "R395.00 once-off"` and one in `services/page.tsx` as `HOSTING_SETUP_FEE_NOTE = "New hosting accounts include a once-off R395..."`. Both move to the `site_settings` DB row after Phase 3.
- The `is_popular` column drives the "Most Popular" badge on the Services page pricing grid.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-live-pricing-migration*
*Context gathered: 2026-07-01*
