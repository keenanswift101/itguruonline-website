# Phase 1 — Provisioning Notes

> Records answers to the four RESEARCH Open Questions that could not be resolved by static analysis alone.

---

## OQ1 — proxy.ts fires under @netlify/plugin-nextjs on a real Netlify build

**Status:** PENDING — requires a real Netlify build (not `next dev`)

VERIFIED: <yes/no>, deploy URL: <fill in after Task 4 checkpoint>

**Context:** Local `next dev` does not exercise the adapter. A Netlify deploy-preview or production build is required.

---

## OQ2 — @netlify/neon installed version

**Installed version:** 0.1.2 (confirmed by `npm view @netlify/neon version` on 2026-06-30 — matched latest)

---

## OQ3 — `netlify database init` behavior

**CLI version used:** 26.1.0 (upgraded from 25.6.1 — the old extension-based DB creation was removed in 26.x)

**Packages installed by CLI:**
- `@netlify/database` — new built-in DB interface (added as dependency)
- `drizzle-orm`, `drizzle-kit` — already present, confirmed ✓

**Files scaffolded:**
- `drizzle.config.ts` — generated at repo root (we accepted overwrite):
  ```
  schema: './db/schema.ts'
  out: 'netlify/database/migrations'
  dbCredentials.url: process.env.NETLIFY_DATABASE_URL!
  ```
- `db/schema.ts` — sample schema with a `posts` table (to be replaced in Plan 02)
- `db/index.ts` — Drizzle client using `@netlify/neon` + `drizzle-orm/neon-http` (HTTP driver — correct for serverless)

**PATH DEVIATION (important for Plan 02 executor):**
The Netlify CLI scaffolded `db/schema.ts` and `db/index.ts` at the **repo root** (`db/`), not at `src/lib/db/` as originally planned. Plan 02 must write schema and auth helpers to `db/` (keeping Netlify's convention) rather than `src/lib/db/`. The `drizzle.config.ts` already points there correctly.

**NETLIFY_DATABASE_URL:** Auto-injected by the CLI — see OQ4 for confirmation.

---

## OQ4 — POPIA data region

**No region prompt was offered.** The new built-in Netlify Database (post-extension) did not present a region selector during `netlify database init`.

**Action taken:** Documented as "region non-configurable — inherited from Netlify platform default for the site." The it-guru-online site is hosted on Netlify's global CDN; the database region is provisioned automatically by Netlify. Per STATE.md POPIA decision: we accept EU or equivalent-protection region as the default and will document explicitly once the region is observable (e.g. via `netlify database status` or connection string inspection).

---

## @netlify/plugin-nextjs version note

Installed in devDependencies: `^5.15.9` (current)

OQ1 (proxy.ts on real Netlify) will determine if a bump to 5.15.11+ is needed:
- If proxy.ts fires on deploy: 5.15.9 is fine; bump is nice-to-have.
- If proxy.ts does NOT fire: bump immediately and re-test before Plan 03.

---

*Last updated: 2026-06-30*
