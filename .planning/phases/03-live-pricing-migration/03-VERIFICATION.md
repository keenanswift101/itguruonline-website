---
phase: 03-live-pricing-migration
verified: 2026-07-02T08:30:00Z
status: passed
score: 11/11 must-haves verified
gaps: []
human_verification:
  - test: "Open /admin/pricing after login, edit a package price, blur the field, confirm 'Saved ✓' appears then fades"
    expected: "The change persists to the DB and the public Services page reflects the new price on next load"
    why_human: "Auto-save on blur, router.refresh(), and live DB write require a running server + live DB"
  - test: "Open Domain Checker, run a search for a domain with a non-NULL priceRands, confirm 'R{price}/yr' appears next to available TLDs"
    expected: "Price shown only for available TLDs whose DB priceRands is not NULL; nothing shown for NULL-priced TLDs"
    why_human: "Requires live DB with at least one TLD priced + running RDAP domain availability API"
---

# Phase 3: Live Pricing Migration Verification Report

**Phase Goal:** All public-facing pricing (hosting packages, domain prices, setup fees) is now read from the database, and the owner can edit it live from the admin at /admin/pricing without a code deploy.
**Verified:** 2026-07-02T08:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Requirement ID Note

The verification prompt referenced requirement IDs `PRICING-01` through `PRICING-06`. The canonical IDs in both REQUIREMENTS.md and all three PLANs are `PRICE-01` through `PRICE-05`. There is no `PRICE-06` / `PRICING-06` in the requirements document. All five actual requirements (`PRICE-01` to `PRICE-05`) are verified below.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `hosting_packages`, `domain_prices`, and `site_settings` tables exist in schema.ts with correct columns | VERIFIED | `src/lib/db/schema.ts` lines 76–109: all three `pgTable` exports present with correct columns (id, slug, name, priceRands, pricePeriod, description, features, isPopular, sortOrder for packages; tld PK + priceRands nullable for domains; key PK + value for settings) |
| 2 | Migration 0002_pricing_tables.sql creates all three tables and seeds 6 packages, 6 TLD rows, 2 settings rows — idempotently | VERIFIED | `netlify/database/migrations/0002_pricing_tables.sql`: 3 `CREATE TABLE` statements + 3 `INSERT ... ON CONFLICT DO NOTHING` blocks with all required seed rows; journal entry `"tag": "0002_pricing_tables"` matches filename |
| 3 | Public Services page renders hosting packages fetched from the DB, not from a hardcoded array | VERIFIED | `src/app/services/page.tsx`: `export default async function ServicesPage()` calls `await getHostingPackages()` and `await getSiteSettings()`; renders `packages.map((pkg) => ...)` using `pkg.slug`, `pkg.priceRands`, `pkg.pricePeriod`, `pkg.isPopular`, `pkg.features`; `{settings.hosting_setup_fee_note}` at line 312; `export const dynamic = "force-dynamic"` present |
| 4 | Registration wizard renders packages fetched from DB via server-side prop chain (no HOSTING_PACKAGES import anywhere) | VERIFIED | `src/app/register/page.tsx`: async, calls `getHostingPackages()`, passes `packages={packages}` to `<RegistrationWizard>`; wizard accepts `{ packages: HostingPackageDTO[] }`; StepServiceSelection accepts `packages: HostingPackageDTO[]` and maps `packages.map((pkg) => ...)`; `grep -rn HOSTING_PACKAGES src/` returns nothing |
| 5 | Domain Checker page passes DB domain price map to DomainChecker; price shown next to available TLDs when non-NULL | VERIFIED | `src/app/domain-checker/page.tsx`: async, calls `getDomainPriceMap()`, passes `domainPrices={domainPrices}` to `<DomainChecker>`; `DomainChecker.tsx` threads it to `DomainRow`; `DomainRow` renders `<span>R{domainPrices[result.tld]}/yr</span>` gated by `domainPrices[result.tld] != null` |
| 6 | HOSTING_PACKAGES, HOSTING_SETUP_FEE, and services-page hardcoded pricing constants no longer exist in the codebase | VERIFIED | `src/lib/registration-types.ts`: `HostingPackage = string` (widened, no union literal list), no HOSTING_PACKAGES or HOSTING_SETUP_FEE const; no hardcoded `const packages = [...]` in services/page.tsx; no HOSTING_SETUP_FEE_NOTE in any src/ file |
| 7 | Owner can open /admin/pricing (after login) and see three sections fed by DB data | VERIFIED | `src/app/admin/pricing/page.tsx`: calls `requireAdmin()` first, redirects to login if null; fetches all three tables with `Promise.all([getHostingPackages(), getDomainPriceMap(), getSiteSettings()])`; renders `<PricingPackagesTable>`, `<DomainPricesTable>`, `<SiteSettingsForm>`; sidebar entry `{ href: "/admin/pricing", label: "Pricing" }` present in AdminSidebar.tsx |
| 8 | Owner can edit hosting package fields inline; auto-saves on blur via PATCH /api/admin/pricing/packages/[id] | VERIFIED | `PricingPackagesTable.tsx`: per-field `onBlur` handlers call `save(field, body, newValue, originalValue)` which PATCHes `/api/admin/pricing/packages/${pkg.id}`; `isPopular` checkbox fires immediately on `onChange`; all fields (name, priceRands, pricePeriod, description, features textarea) wired |
| 9 | Owner can edit per-TLD domain price; blank clears to NULL, a number sets it; auto-saves on blur | VERIFIED | `DomainPricesTable.tsx`: `handleBlur` parses blank as null, number as Number(value); PATCHes `/api/admin/pricing/domains/${encodeURIComponent(tld)}`; `domains/[tld]/route.ts` schema accepts `.nullable()` and stores null or integer |
| 10 | Owner can edit contact_email and hosting_setup_fee_note; auto-saves on blur | VERIFIED | `SiteSettingsForm.tsx`: two fields with `onBlur` calling `save()` which PATCHes `/api/admin/pricing/settings`; `settings/route.ts` allow-list guards against unknown keys |
| 11 | All three PATCH routes return 401 for unauthenticated requests before touching the DB | VERIFIED | All three routes call `requireAdmin()` as first statement; tests in 3 test files confirm 401 without session cookie; `npm run vitest` shows 58 tests pass |

**Score: 11/11 truths verified**

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/schema.ts` | Drizzle table definitions for hostingPackages, domainPrices, siteSettings | VERIFIED | All three tables exported; integer, varchar, text, boolean, timestamp columns match spec; lines 76–109 |
| `netlify/database/migrations/0002_pricing_tables.sql` | CREATE TABLE + seed INSERT statements (3 tables, 6 packages, 6 TLDs, 2 settings) | VERIFIED | File exists, 3 CREATE TABLE, 3 INSERT...ON CONFLICT DO NOTHING blocks; journal tag matches |
| `src/lib/pricing.ts` | Server-only DB read helpers: getHostingPackages, getDomainPriceMap, getSiteSettings | VERIFIED | All three exports present; features split to string[]; `?? null` (not `|| null`); HostingPackageDTO excludes Date fields |
| `src/app/services/page.tsx` | Async server component reading packages + settings from DB | VERIFIED | async function, getHostingPackages + getSiteSettings called, `settings.hosting_setup_fee_note` rendered, `force-dynamic`, no hardcoded packages array |
| `src/app/register/page.tsx` | Async server component fetching packages and passing to RegistrationWizard | VERIFIED | async function, getHostingPackages, `packages={packages}` prop, `force-dynamic` |
| `src/components/forms/RegistrationWizard.tsx` | Wizard accepting packages prop instead of importing HOSTING_PACKAGES | VERIFIED | `{ packages: HostingPackageDTO[] }` prop, `p.slug === state.data.stepC.hostingPackage`, `R{selectedPkg.priceRands}/{selectedPkg.pricePeriod}` in summary |
| `src/components/forms/steps/StepServiceSelection.tsx` | Renders DB packages from prop | VERIFIED | `packages: HostingPackageDTO[]` in StepCProps, `packages.map((pkg) => ...)`, `pkg.slug` used as key and selector |
| `src/app/domain-checker/page.tsx` | Async server component fetching domainPrices from DB | VERIFIED | async function, getDomainPriceMap, `domainPrices={domainPrices}` passed to DomainChecker, `force-dynamic` |
| `src/components/forms/DomainChecker.tsx` | Shows R{price}/yr for priced available TLDs | VERIFIED | `domainPrices?: Record<string, number | null>` prop, `domainPrices[result.tld] != null` guard, `R{domainPrices[result.tld]}/yr` span |
| `src/lib/registration-types.ts` | HOSTING_PACKAGES deleted; HostingPackage widened to string | VERIFIED | No HOSTING_PACKAGES const, no HOSTING_SETUP_FEE const, `export type HostingPackage = string` |
| `src/app/admin/pricing/page.tsx` | requireAdmin + three DB fetches + three editor components | VERIFIED | requireAdmin first, redirect to login, Promise.all fetches, three editor components rendered, `force-dynamic`, inherits admin layout bg |
| `src/app/admin/pricing/PricingPackagesTable.tsx` | "use client" inline-editing table for packages | VERIFIED | `"use client"`, all 6 fields editable with onBlur save, isPopular via onChange, `features.join("\n")` for textarea, router.refresh(), "Saved ✓" indicator |
| `src/app/admin/pricing/DomainPricesTable.tsx` | "use client" inline-editing table for domain prices | VERIFIED | `"use client"`, encodeURIComponent(tld), blank = null, router.refresh(), "Saved ✓" |
| `src/app/admin/pricing/SiteSettingsForm.tsx` | "use client" two-field form for site settings | VERIFIED | `"use client"`, contact_email + hosting_setup_fee_note, PATCH /api/admin/pricing/settings, router.refresh(), "Saved ✓" |
| `src/app/api/admin/pricing/packages/[id]/route.ts` | Auth-gated PATCH updating one hosting_packages row | VERIFIED | requireAdmin first → 401; zod PatchSchema with refine; db.update(hostingPackages).where(eq(hostingPackages.id, id)); 200 {ok:true} |
| `src/app/api/admin/pricing/domains/[tld]/route.ts` | Auth-gated PATCH updating one domain_prices row (nullable price) | VERIFIED | requireAdmin first → 401; decodeURIComponent(tldParam); .nullable() on priceRands schema; db.update |
| `src/app/api/admin/pricing/settings/route.ts` | Auth-gated PATCH updating site_settings key/value rows | VERIFIED | requireAdmin first → 401; ALLOWED_KEYS allow-list; loops updating each provided key |
| `src/app/api/admin/pricing/packages/route.test.ts` | Non-DB guard tests + describeIfDb block | VERIFIED | 401 guard tests always run; describeIfDb gated on NETLIFY_DATABASE_URL |
| `src/app/api/admin/pricing/domains/route.test.ts` | Non-DB guard tests + describeIfDb block | VERIFIED | 401 guard tests always run; describeIfDb pattern present |
| `src/app/api/admin/pricing/settings/route.test.ts` | Non-DB guard tests + describeIfDb block | VERIFIED | 401 guard tests always run; describeIfDb pattern present |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/services/page.tsx` | `src/lib/pricing.ts` | `await getHostingPackages()` + `await getSiteSettings()` | WIRED | Both imports present and called in async function body |
| `src/app/register/page.tsx` | `src/lib/pricing.ts` | `await getHostingPackages()` | WIRED | Import + call + result passed as prop |
| `src/app/register/page.tsx` | `src/components/forms/RegistrationWizard.tsx` | `packages={packages}` prop | WIRED | `<RegistrationWizard packages={packages} />` at line 52 |
| `src/components/forms/RegistrationWizard.tsx` | `src/components/forms/steps/StepServiceSelection.tsx` | `packages={packages}` prop | WIRED | `<StepServiceSelection data={...} packages={packages} ...>` at line 261 |
| `src/app/domain-checker/page.tsx` | `src/lib/pricing.ts` | `await getDomainPriceMap()` | WIRED | Import + call |
| `src/app/domain-checker/page.tsx` | `src/components/forms/DomainChecker.tsx` | `domainPrices={domainPrices}` prop | WIRED | `<DomainChecker domainPrices={domainPrices} />` at line 49 |
| `src/components/forms/DomainChecker.tsx` | `DomainRow` (internal) | `domainPrices={domainPrices}` prop | WIRED | Threaded to both primary and alternate DomainRow renders |
| `src/app/admin/pricing/page.tsx` | `src/lib/pricing.ts` | `getHostingPackages / getDomainPriceMap / getSiteSettings` | WIRED | Promise.all with all three helpers |
| `src/app/admin/pricing/PricingPackagesTable.tsx` | `src/app/api/admin/pricing/packages/[id]/route.ts` | `fetch PATCH /api/admin/pricing/packages/${pkg.id}` | WIRED | `patch(url, body)` called from save() on all field blurs |
| `src/app/admin/pricing/DomainPricesTable.tsx` | `src/app/api/admin/pricing/domains/[tld]/route.ts` | `fetch PATCH /api/admin/pricing/domains/${encodeURIComponent(tld)}` | WIRED | encodeURIComponent present; handleBlur calls patch() |
| `src/app/admin/pricing/SiteSettingsForm.tsx` | `src/app/api/admin/pricing/settings/route.ts` | `fetch PATCH /api/admin/pricing/settings` | WIRED | `SETTINGS_URL = "/api/admin/pricing/settings"` used in save() |
| `AdminSidebar.tsx` | `/admin/pricing` | nav link `{ href: "/admin/pricing", label: "Pricing" }` | WIRED | Link present in sidebar nav array |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `src/app/services/page.tsx` | `packages` | `db.select().from(hostingPackages).orderBy(asc(hostingPackages.sortOrder))` in `getHostingPackages()` | Yes — real DB query | FLOWING |
| `src/app/services/page.tsx` | `settings.hosting_setup_fee_note` | `db.select().from(siteSettings)` in `getSiteSettings()` | Yes — real DB query | FLOWING |
| `src/components/forms/RegistrationWizard.tsx` | `packages` | Passed from `register/page.tsx` which calls `getHostingPackages()` | Yes — server-side DB query before client render | FLOWING |
| `src/app/domain-checker/page.tsx` | `domainPrices` | `db.select().from(domainPrices)` in `getDomainPriceMap()` | Yes — real DB query | FLOWING |
| `src/app/admin/pricing/page.tsx` | `packages`, `domainPrices`, `settings` | All three `src/lib/pricing.ts` helpers — real DB queries | Yes | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| vitest suite passes (58 tests, 34 skipped) | `npx vitest run` | 15 test files, 58 passed, 34 skipped (DB tests without NETLIFY_DATABASE_URL) | PASS |
| Three PATCH routes export `PATCH` function | `grep -rl "export async function PATCH" src/app/api/admin/pricing/` | All three route.ts files returned | PASS |
| No HOSTING_PACKAGES constant remains in src/ | `grep -rn "HOSTING_PACKAGES" src/` | No output | PASS |
| Migration file exists with seeded data | File `0002_pricing_tables.sql` contents | 3 CREATE TABLE + 3 INSERT blocks with all 6 packages, 6 TLDs, 2 settings rows | PASS |
| Migration journal tag matches filename | `_journal.json` entry idx=2 | `"tag": "0002_pricing_tables"` matches file `0002_pricing_tables.sql` | PASS |
| No bracket-form Tailwind in new files | `grep -rn "text-\[var(--" src/app/admin/pricing/ src/app/api/admin/pricing/ src/lib/pricing.ts` | No output | PASS |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PRICE-01 | 03-01, 03-03 | Owner can edit a hosting package's price, description, features, and "Most Popular" label | SATISFIED | `PricingPackagesTable.tsx` exposes all four fields with onBlur auto-save to PATCH `/api/admin/pricing/packages/[id]` |
| PRICE-02 | 03-02 | Hosting price edits appear on the public Services page and registration wizard within seconds, with no code deploy | SATISFIED | Services page and register page are both `force-dynamic` and call `getHostingPackages()` from DB on every request; admin edit updates DB, next public page load reflects it |
| PRICE-03 | 03-01, 03-03 | Owner can add/edit per-TLD domain registration prices (.co.za, .com, .net, .org, .online, .africa) | SATISFIED | 6 TLD rows seeded in migration; `DomainPricesTable.tsx` renders all 6 with editable price inputs; PATCH route updates `domain_prices` table |
| PRICE-04 | 03-02 | Domain prices appear on the public site in place of "request a quote" | SATISFIED | `DomainChecker.tsx` renders `R{price}/yr` conditionally when `domainPrices[result.tld] != null`; page fetches from DB via `getDomainPriceMap()` |
| PRICE-05 | 03-01, 03-02, 03-03 | Owner can update site settings (contact email, hosting setup-fee note) without a code change | SATISFIED | `SiteSettingsForm.tsx` edits both settings; PATCH route updates `site_settings` rows; Contact page and Services page read from DB (`getSiteSettings()`) not from hardcoded strings |

No orphaned requirements found. All five Phase 3 requirements (`PRICE-01` to `PRICE-05`) are claimed by plans and verified in code. Note: the verification prompt referenced `PRICING-01` to `PRICING-06` (6 items) — there are only 5 actual requirements (`PRICE-01` to `PRICE-05`) in REQUIREMENTS.md; this is a prompt naming discrepancy, not a gap in implementation.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `PricingPackagesTable.tsx` | 32 | `return null` in SaveIndicator "idle" branch | INFO | Intentional — idle state shows nothing; not a stub |
| `DomainPricesTable.tsx` | 31 | `return null` in SaveIndicator "idle" branch | INFO | Intentional — same pattern |
| `SiteSettingsForm.tsx` | 31 | `return null` in SaveIndicator "idle" branch | INFO | Intentional — same pattern |

No blockers or warnings. The `return null` instances are in the `SaveIndicator` helper component when `state === "idle"` — this is deliberate (show nothing until a save is triggered). All three editor components have active PATCH paths producing non-empty responses.

---

### Human Verification Required

#### 1. Admin Pricing Edit End-to-End

**Test:** Log in to `/admin/login`, navigate to `/admin/pricing`, change a hosting package's price (e.g. Startup from R85 to R90), click away to blur the field.
**Expected:** "Saved ✓" appears in green next to the field and fades within 1.5s. Then navigate to `/services` and confirm the new price is shown.
**Why human:** Requires running Next.js server + live Netlify Postgres DB + authenticated session cookie. Auto-save on blur, router.refresh(), and cross-page DB consistency cannot be confirmed by static analysis.

#### 2. Domain Price Display on Domain Checker

**Test:** Set a non-NULL priceRands for `.co.za` via the admin pricing page, then go to `/domain-checker`, search for a domain name, confirm an available `.co.za` result shows `R{price}/yr`.
**Expected:** Price badge appears for available TLDs with a set price; nothing appears for TLDs with NULL price.
**Why human:** Requires live DB with set price + RDAP domain availability API returning results + running server.

---

### Gaps Summary

No gaps. All 11 observable truths verified. All 20 artifacts exist, are substantive, and are wired. All 12 key links confirmed. All 5 requirements satisfied. Test suite passes (58/58 non-skipped tests). No blocker anti-patterns.

The one structural note: the migration file is named `0002_pricing_tables.sql` (not `0001_pricing_tables.sql` as originally planned), because an intermediate migration `0001_nosy_lady_mastermind.sql` was generated before the pricing migration. The journal tag `"0002_pricing_tables"` correctly matches the filename — this is a cosmetic deviation from the plan filename, not a functional gap.

---

_Verified: 2026-07-02T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
