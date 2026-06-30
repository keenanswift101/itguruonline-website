# Phase 1 — Provisioning Notes

> Records answers to the four RESEARCH Open Questions that could not be resolved by static analysis alone.

---

## OQ1 — proxy.ts fires under @netlify/plugin-nextjs on a real Netlify build

**Status:** RESOLVED — DOES NOT WORK. proxy.ts removed from codebase.

VERIFIED: **no** — proxy.ts causes a hard build failure; it cannot be used.

**Root cause (confirmed 2026-06-30):**
Next.js 16 uses Turbopack by default for **both** dev and production builds. When proxy.ts (Next.js 16's rename of middleware.ts) is present, `next build` compiles it to `.next/server/middleware.js` which references `./chunks/[turbopack]_runtime.js`. The Netlify edge function bundler (inside `@netlify/plugin-nextjs@5.15.12`, the latest release) cannot resolve this Turbopack-specific chunk and throws `MODULE_NOT_FOUND`. Attempted `next build --no-turbopack` — the flag does not exist in Next.js 16. Turbopack is not opt-in; it is the default and cannot be disabled via CLI.

**Impact on Plan 03:** The `/admin/*` auth boundary must be enforced **exclusively** via page-level `requireAdmin()` calls (server component + route handler guard pattern). There is no proxy-layer pre-check. This is the documented fallback from the Plan 01 checkpoint: "page-level requireAdmin() becomes the sole boundary." Defence-in-depth is maintained by calling `requireAdmin()` in every `/admin/*` layout and every `/api/admin/*` route handler.

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
