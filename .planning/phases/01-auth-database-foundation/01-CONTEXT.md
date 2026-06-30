# Phase 1: Auth + Database Foundation - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers: a working `/admin/login` page, a single hardcoded admin account, a session that persists across browser refresh via a secure cookie, redirect-away behavior for unauthenticated visitors hitting any `/admin/*` route, and DB-backed login throttling/lockout. It also delivers the underlying database (Netlify Database / Neon Postgres) and core schema that every later phase (CRM, pricing, invoicing, automation) reads and writes through.

This phase does NOT deliver: any CRM/pricing/invoicing UI (later phases), multi-staff accounts/roles (out of scope per PROJECT.md), or a client-facing login (out of scope per PROJECT.md).

</domain>

<decisions>
## Implementation Decisions

### Login page look & feel
- **D-01:** `/admin/login` matches the public site's existing dark theme — reuse `.btn-metallic`/`.btn-glass` button classes and the fixed full-bleed `bg-image.jpg` background pattern from `globals.css`, rather than building a separate visual language for the admin area.

### Password recovery
- **D-02:** A "Forgot password" flow sends a one-time reset link via the existing Resend integration (`src/lib/email.ts`), rather than requiring manual database intervention by a developer if the owner is locked out.
- **D-03:** The reset link is sent to `ambrose@it-guru.co.za` (confirmed working mailbox, verified live earlier this session after the DNS mail fix).

### Admin entry point visibility
- **D-04:** No link to `/admin` appears anywhere on the public site (no footer link, no nav entry). The owner accesses it via direct URL/bookmark only. The public site's HTML/markup should have zero trace of the admin area's existence.

### Initial credential setup
- **D-05:** The first admin email/password is environment-variable-seeded, not set through a one-time setup web page. The owner picks the email/password, the developer sets them as Netlify environment variables during deployment, and a one-time seed script/migration creates the account in the database directly. No first-run setup UI needs to be built.

### Claude's Discretion
- Exact lockout duration/threshold (e.g. N failed attempts → locked for M minutes) — no specific numbers were requested; pick a reasonable, documented default (e.g. 5 attempts / 15 minute lockout) and note it clearly in the implementation.
- Exact reset-link expiry window (e.g. 1 hour) — standard practice, not specified by the owner.
- Cookie name, JWT claims structure, exact schema column types/constraints — technical implementation, not owner-facing.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project conventions & design system
- `CLAUDE.md` — design system rules (`.btn-metallic`/`.btn-glass` button classes, `data-theme="dark"`, fixed `bg-image.jpg` background pattern, Tailwind v4 `bg-(--var)` arbitrary-value syntax) that the login page (D-01) must follow
- `SECURITY-AUDIT.md` — existing OWASP ZAP + manual security review findings/fixes/accepted-risks; read before touching auth, rate limiting, or anything security-adjacent, per CLAUDE.md's own instruction

### Milestone planning artifacts
- `.planning/PROJECT.md` — Core Value, Active requirements, Key Decisions (DB/auth provider already locked: Netlify Database/Neon + custom JWT, not Supabase)
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04 (this phase's exact requirements)
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria
- `.planning/research/SUMMARY.md` — synthesized research; Phase 1 section explicitly flags the build order and pitfalls below
- `.planning/research/STACK.md` — recommended libraries: Drizzle ORM + `@neondatabase/serverless`, `jose` + `bcryptjs` for JWT/password hashing, Netlify Scheduled Functions note (not relevant until Phase 5, but the `netlify/functions/` directory convention should be established now if practical)
- `.planning/research/ARCHITECTURE.md` — `proxy.ts` (Next.js 16's `middleware.ts` replacement, Node runtime) + per-route `requireAdmin()` defense-in-depth pattern; suggested file structure for `/admin` route segment, `src/lib/auth.ts`, `src/lib/db.ts`
- `.planning/research/PITFALLS.md` — Pitfall 1 (reusing in-memory rate limiter for login — must NOT reuse `src/lib/rate-limiter.ts` as-is for `/admin/login`), Pitfall 2 (DB driver must be serverless-native, not a TCP pool), Pitfall 7 (secrets scoping — this project has a documented history of a `NEXT_PUBLIC_BASE_URL` scoping mistake per `CLAUDE.md`; new secrets like DB connection string and JWT signing key need explicit non-public scoping)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/email.ts` (`emailLayout()`) — table-based, inline-style HTML email template; the password-reset email (D-02) must follow this exact same pattern (no `<style>` blocks, no flexbox/grid — Outlook compatibility), per CLAUDE.md's explicit instruction
- `src/lib/csrf.ts` (`isTrustedOrigin()`) — existing CSRF defense-in-depth check used on `/api/domain/check`; the same pattern should be applied to the new `/api/admin/login` route
- `globals.css` — `.btn-metallic`, `.btn-glass`, `--bg-primary`/`--text-secondary` design tokens for the login page (D-01)

### Established Patterns
- API routes under `src/app/api/*/route.ts` follow a consistent defense-in-depth order: CSRF origin check → rate limiting → body parsing/validation → business logic (see `src/app/api/domain/check/route.ts`). New `/api/admin/*` routes should follow the same shape, with DB-backed throttling replacing the in-memory limiter for the login route specifically (per PITFALLS.md Pitfall 1).
- `src/app/api/register/route.ts:121` has a literal `// TODO: Persist to DB (Supabase)` comment — confirms a database write was already anticipated at this exact integration point, though Phase 2 (not this phase) is where that TODO actually gets resolved. This phase only needs to stand up the DB/schema/auth foundation that Phase 2 will write through.
- No `middleware.ts` or `proxy.ts` currently exists in this codebase — this phase creates the first one.

### Integration Points
- New: `src/app/admin/login/page.tsx`, `src/app/api/admin/login/route.ts`, `src/proxy.ts` (Next.js 16 naming — verify this resolves correctly under `@netlify/plugin-nextjs`, per ARCHITECTURE.md's flagged open question), `src/lib/auth.ts`, `src/lib/db.ts`, `netlify/functions/` directory (can be created now even though first used in Phase 5)
- No existing public-site files need to change for this phase (no nav/footer link per D-04)

</code_context>

<specifics>
## Specific Ideas

No additional specific UI/copy references beyond D-01 through D-05 above — owner deferred exact lockout thresholds and JWT/cookie technical details to Claude's discretion.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope (no scope-creep attempts during this session).

</deferred>

---

*Phase: 01-auth-database-foundation*
*Context gathered: 2026-06-30*
