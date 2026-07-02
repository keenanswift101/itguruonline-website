---
phase: 03-live-pricing-migration
plan: 02
subsystem: public-pricing-reads
tags: [pricing, db, refactor, wizard, services, domain-checker, contact]
dependency_graph:
  requires: [03-01 schema (hostingPackages/domainPrices/siteSettings tables), src/lib/db/index.ts]
  provides: [src/lib/pricing.ts, async ServicesPage, async RegisterPage, async DomainCheckerPage, async ContactPage]
  affects: [registration wizard package selection, services pricing grid, domain checker price display, contact email]
tech_stack:
  added: [src/lib/pricing.ts (server-only DB read helpers)]
  patterns: [server component async fetch + client component prop drilling, DTO pattern (Date-free serializable shape), ?? null for nullable DB integers]
key_files:
  created:
    - src/lib/pricing.ts
  modified:
    - src/lib/db/schema.ts (added hostingPackages, domainPrices, siteSettings table defs)
    - src/app/register/page.tsx
    - src/components/forms/RegistrationWizard.tsx
    - src/components/forms/steps/StepServiceSelection.tsx
    - src/lib/registration-types.ts
    - src/app/api/register/route.ts
    - src/app/services/page.tsx
    - src/app/domain-checker/page.tsx
    - src/components/forms/DomainChecker.tsx
    - src/app/contact/page.tsx
decisions:
  - "Used HostingPackageDTO (Date-free) to pass server->client safely — excludes createdAt/updatedAt to avoid Next.js serialization error"
  - "Used ?? null (not || null) in getDomainPriceMap to preserve 0-price semantics"
  - "HostingPackage type widened to string (DB slug is now authority, not a TS union)"
  - "register/route.ts: HOSTING_PACKAGES.find replaced with best-effort DB fetch + slug-capitalization fallback — email still sends even if DB is momentarily unavailable"
  - "schema.ts pricing tables added here (parallel to 03-01) — 03-01 adds same tables; merge will be a no-op or trivial conflict"
metrics:
  duration: ~35min
  completed: 2026-07-02
  tasks: 3
  files: 10
---

# Phase 03 Plan 02: Public Pricing Read Migration Summary

Migrated all four public-facing pricing reads from hardcoded TypeScript constants to live DB fetches via a shared `src/lib/pricing.ts` helper. Deleted every hardcoded pricing constant (`HOSTING_PACKAGES`, `HOSTING_SETUP_FEE`, services-page `packages` array, `HOSTING_SETUP_FEE_NOTE`). The RegistrationWizard 3-file refactor (register page async + wizard prop + step prop) landed atomically in one commit. Build compiles cleanly at every task boundary.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create shared pricing read helper + extend schema | 075fc52 | src/lib/pricing.ts, src/lib/db/schema.ts |
| 2 | Atomic RegistrationWizard refactor + delete HOSTING_PACKAGES | 7bb5f19 | register/page.tsx, RegistrationWizard.tsx, StepServiceSelection.tsx, registration-types.ts, register/route.ts |
| 3 | Migrate Services, DomainChecker, Contact pages | bd749b2 | services/page.tsx, domain-checker/page.tsx, DomainChecker.tsx, contact/page.tsx |

## Decisions Made

- **DTO shape (no Dates):** `HostingPackageDTO` excludes `createdAt`/`updatedAt` (Date objects) — Next.js throws when passing non-serializable values from server to `"use client"` components. The DTO is the safe boundary.
- **`?? null` not `|| null`:** `getDomainPriceMap` uses nullish coalescing so a legitimate price of `0` is preserved; `|| null` would incorrectly treat `0` as falsy.
- **`HostingPackage` type widened to `string`:** The old union `"startup" | "basic" | ...` was a compile-time mirror of the hardcoded array. With the DB as authority, the slug can be any string — tightening it again would require a code change whenever a package is added via admin UI.
- **register/route.ts email lookup:** Rather than making the email hard-depend on DB availability, a best-effort `getHostingPackages()` call resolves the display name with a slug-capitalization fallback (`"startup"` -> `"Startup"`). Email confirmation still sends even if the DB is momentarily unavailable.
- **Schema added in this plan:** `hostingPackages`, `domainPrices`, `siteSettings` table definitions were added to `schema.ts` here because the worktree was branched before Plan 03-01 ran. Plan 03-01 adds the same definitions — the merge will be a trivial no-op conflict.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `src/app/api/register/route.ts` still imported `HOSTING_PACKAGES`**
- **Found during:** Task 2 (post-deletion `tsc --noEmit`)
- **Issue:** `HOSTING_PACKAGES` import + `.find()` call in the email-send section — would cause TS compile error after deletion
- **Fix:** Replaced with best-effort `getHostingPackages()` DB call and slug-capitalization fallback; import removed
- **Files modified:** src/app/api/register/route.ts
- **Commit:** 7bb5f19

**2. [Rule 1 - Tailwind v4 syntax] Bracket-form `[var(--...)]` classes fixed throughout**
- **Found during:** All tasks (IDE diagnostic hook reported warnings on every edit)
- **CLAUDE.md enforcement:** "Tailwind v4 canonical arbitrary-value syntax: use `text-(--text-secondary)` — not `text-[var(--text-secondary)]`"
- **Fix:** Converted all bracket-form usages in touched files (RegistrationWizard.tsx, DomainChecker.tsx, register/page.tsx)
- **Files modified:** src/components/forms/RegistrationWizard.tsx, src/components/forms/DomainChecker.tsx, src/app/register/page.tsx
- **Commits:** 7bb5f19, bd749b2

**3. [Rule 3 - Blocking] Pricing table definitions missing from schema.ts**
- **Found during:** Task 1 (worktree was branched before 03-01 ran)
- **Issue:** `hostingPackages`, `domainPrices`, `siteSettings` tables not in schema — pricing.ts could not compile
- **Fix:** Added table definitions to schema.ts (mirrors what 03-01 does — merge will reconcile)
- **Files modified:** src/lib/db/schema.ts
- **Commit:** 075fc52

## Known Stubs

None — all four pricing reads are fully wired to DB queries with appropriate fallbacks. The domain prices table starts with NULL values (set by 03-01 seed) — this is intentional and expected until the admin sets prices via Plan 03-03.

## Self-Check: PASSED

- All 10 modified/created files exist on disk
- All 3 task commits verified in git log (075fc52, 7bb5f19, bd749b2)
- `npx tsc --noEmit` exits 0 (verified after each task)
- `HOSTING_PACKAGES` and `HOSTING_SETUP_FEE` absent from entire `src/` tree
