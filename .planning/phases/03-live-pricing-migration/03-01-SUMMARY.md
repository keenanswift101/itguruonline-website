---
phase: 03-live-pricing-migration
plan: 01
subsystem: database/pricing
tags: [schema, drizzle, migration, seed, hosting-packages, domain-prices, site-settings]
dependency_graph:
  requires: [Phase 01 DB foundation (schema.ts, Netlify Postgres)]
  provides: [hostingPackages table, domainPrices table, siteSettings table, migration 0002_pricing_tables.sql]
  affects: [03-02 (reads these tables to replace TS consts), 03-03 (admin UI reads/writes these tables)]
tech_stack:
  added: []
  patterns: [Drizzle pgTable with integer price_rands, newline-separated features text, E-string escape syntax for SQL seed]
key_files:
  created:
    - netlify/database/migrations/0002_pricing_tables.sql
    - netlify/database/migrations/meta/0002_snapshot.json
  modified:
    - src/lib/db/schema.ts
    - netlify/database/migrations/meta/_journal.json
decisions:
  - "Prices stored as INTEGER rands (not cents, not decimal) — aligns with CLAUDE.md constraint and existing pattern"
  - "Migration named 0002_pricing_tables (not 0001 as plan assumed) — worktree had 0000+0001 from Phase 1/2 already"
  - "Journal tag updated to 0002_pricing_tables after drizzle-kit auto-named file to 0002_dizzy_tenebrous"
  - "db:migrate intentionally NOT run — migration runs at Netlify deploy time, before Plan 03-02 removes TS consts"
metrics:
  duration: ~8 minutes
  completed: "2026-07-02"
  tasks_completed: 2
  files_changed: 4
---

# Phase 03 Plan 01: Pricing Schema + Migration Seed Summary

**One-liner:** Drizzle schema extended with hostingPackages/domainPrices/siteSettings tables; migration 0002_pricing_tables.sql created with 3 CREATE TABLEs + idempotent seed for all 6 packages, 6 TLDs, and 2 site settings.

## What Was Built

Task 1 appended three new `pgTable` definitions to `src/lib/db/schema.ts`:

- `hostingPackages` — slug (unique), name, priceRands (integer), pricePeriod, description, features (newline-separated text), isPopular (boolean), sortOrder (integer), createdAt, updatedAt
- `domainPrices` — tld (varchar PK), nullable priceRands, updatedAt
- `siteSettings` — key (varchar PK), value (text), updatedAt

Task 2 ran `npm run db:generate` (drizzle-kit generate) to produce `0002_dizzy_tenebrous.sql`, then:
- Renamed to `0002_pricing_tables.sql`
- Appended seed INSERT blocks for all three tables with `ON CONFLICT DO NOTHING` guards
- Updated `_journal.json` tag from `0002_dizzy_tenebrous` to `0002_pricing_tables`

## Seed Data

**hosting_packages (6 rows):** startup/85, basic/99 (isPopular=true), standard/149, advanced/279, enterprise/399, parked/35 — prices in integer rands, features as E-string newline-separated.

**domain_prices (6 rows):** .co.za, .com, .net, .org, .online, .africa — all with NULL priceRands (admin fills these in via 03-03 UI).

**site_settings (2 rows):** contact_email = info@it-guru.co.za, hosting_setup_fee_note = "New hosting accounts include a once-off R395 cPanel account setup, configuration, and migration-assistance fee."

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 148ddac | feat(03-01): add hostingPackages, domainPrices, siteSettings tables to schema.ts |
| Task 2 | 39e80fb | feat(03-01): generate pricing migration and add seed INSERT statements |

## Deviations from Plan

### Auto-adapted: Migration numbered 0002 (not 0001 as plan assumed)

**Found during:** Task 2
**Issue:** The plan referenced `0001_pricing_tables.sql`, assuming only one prior migration (0000). However, Phase 1 and 2 had already produced both `0000_living_mastermind.sql` and `0001_nosy_lady_mastermind.sql`. Drizzle-kit correctly generated `0002_dizzy_tenebrous.sql` as the next migration.
**Fix:** Renamed to `0002_pricing_tables.sql` (maintaining the descriptive naming convention) and updated `_journal.json` tag to `0002_pricing_tables`. All plan acceptance criteria still satisfied — file exists with 3 CREATE TABLEs + 3 seed INSERT blocks + ON CONFLICT guards.
**Files modified:** `netlify/database/migrations/0002_pricing_tables.sql`, `netlify/database/migrations/meta/_journal.json`

### Auto-adapted: Merged dev into worktree before executing

**Found during:** Pre-task setup
**Issue:** Worktree `worktree-agent-a65acab5ec3901859` was at commit `eea6c94` (pre-Phase-1), missing `src/lib/db/schema.ts` and all Phase 1/2 DB work. Plan targets Phase 3 which builds on Phase 1/2.
**Fix:** Fast-forward merged `dev` (at `9f21a29`) into the worktree branch before starting tasks. Clean fast-forward, no conflicts.

## Verification

- `npx tsc --noEmit` exits 0 (schema compiles cleanly)
- `0002_pricing_tables.sql` contains 3 CREATE TABLE statements
- `grep -c "ON CONFLICT" 0002_pricing_tables.sql` returns 3
- `_journal.json` tag references `0002_pricing_tables`
- `db:migrate` was NOT invoked during autonomous execution

## Known Stubs

None. The migration is a pure schema + seed file — no UI or data-reading code. Domain prices seeded with NULL `priceRands` is intentional: they are meant to be NULL until the admin fills them in via the 03-03 pricing UI.

## Self-Check: PASSED
