---
phase: 01-auth-database-foundation
plan: 01
status: complete
completed: 2026-06-30
---

# Plan 01 Summary — Foundation Setup

## What was delivered

- All Phase 1 runtime dependencies installed: `drizzle-orm`, `@neondatabase/serverless`, `@netlify/neon`, `@netlify/database`, `jose`, `bcryptjs`, `zod`
- Dev dependency: `drizzle-kit`, `vitest`, `@types/bcryptjs`
- `vitest.config.ts` created, `npm test` script added, smoke test passes
- Netlify Database provisioned (production branch live, auto-injects `NETLIFY_DATABASE_URL` at build time)
- `drizzle.config.ts` pointing migrations at `netlify/database/migrations/` (Netlify auto-apply)
- `db/schema.ts` + `db/index.ts` scaffolded by `netlify database init` (Drizzle + `@netlify/neon` HTTP driver)
- `.env.example` with `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_SEED_PASSWORD` placeholders (non-public scoped)
- `netlify/database/migrations/.gitkeep` so the auto-apply directory is git-tracked
- `@netlify/plugin-nextjs` bumped 5.15.9 → 5.15.12
- Draft deploy verified: build succeeds, DB provisioned

## Open Question resolutions

| OQ | Question | Answer |
|----|----------|--------|
| OQ1 | proxy.ts fires on real Netlify build? | **NO** — removed. Next.js 16 Turbopack emits `[turbopack]_runtime.js` chunks; Netlify edge bundler cannot resolve them. No `--no-turbopack` flag exists in Next.js 16. |
| OQ2 | `@netlify/neon` installed version | 0.1.2 (matched latest) |
| OQ3 | `netlify database init` behavior | CLI 25.x used old extension (failed); 26.1.0 uses built-in feature. Installs `@netlify/database`. Scaffolds `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`. |
| OQ4 | POPIA region | No region prompt offered. Non-configurable — inherited from Netlify platform default. |

## Path deviation for Plan 02 executor

`netlify database init` scaffolded `db/schema.ts` and `db/index.ts` at the **repo root** (`db/`), not at `src/lib/db/` as originally planned. Plan 02 must write the admin schema and auth helpers to `db/` (keeping Netlify's convention).

## Path deviation for Plan 03 executor

`src/proxy.ts` does not exist and must NOT be created. The `/admin/*` auth boundary is enforced exclusively via page-level `requireAdmin()` calls — one in `src/app/admin/layout.tsx` (covers all admin pages) and one per `/api/admin/*` route handler. There is no edge/proxy pre-check layer.
