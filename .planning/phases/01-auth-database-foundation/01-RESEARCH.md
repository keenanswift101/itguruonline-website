# Phase 1: Auth + Database Foundation - Research

**Researched:** 2026-06-30
**Domain:** Single-admin auth (JWT/cookie) + serverless Postgres foundation on Next.js 16 App Router, deployed via `@netlify/plugin-nextjs` on Netlify (not Vercel)
**Confidence:** HIGH for Netlify/Next.js platform facts (official docs, version-pinned against this repo's installed packages); HIGH for Drizzle+Neon driver pattern (official docs); MEDIUM for exact Netlify Database CLI/env-var details (some conflicting docs/blog signals, reconciled below) — see Open Questions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `/admin/login` matches the public site's existing dark theme — reuse `.btn-metallic`/`.btn-glass` button classes and the fixed full-bleed `bg-image.jpg` background pattern from `globals.css`, rather than building a separate visual language for the admin area.
- **D-02:** A "Forgot password" flow sends a one-time reset link via the existing Resend integration (`src/lib/email.ts`), rather than requiring manual database intervention by a developer if the owner is locked out.
- **D-03:** The reset link is sent to `ambrose@it-guru.co.za` (confirmed working mailbox, verified live earlier this session after the DNS mail fix).
- **D-04:** No link to `/admin` appears anywhere on the public site (no footer link, no nav entry). The owner accesses it via direct URL/bookmark only. The public site's HTML/markup should have zero trace of the admin area's existence.
- **D-05:** The first admin email/password is environment-variable-seeded, not set through a one-time setup web page. The owner picks the email/password, the developer sets them as Netlify environment variables during deployment, and a one-time seed script/migration creates the account in the database directly. No first-run setup UI needs to be built.

### Claude's Discretion

- Exact lockout duration/threshold (e.g. N failed attempts → locked for M minutes) — no specific numbers were requested; pick a reasonable, documented default (e.g. 5 attempts / 15 minute lockout) and note it clearly in the implementation.
- Exact reset-link expiry window (e.g. 1 hour) — standard practice, not specified by the owner.
- Cookie name, JWT claims structure, exact schema column types/constraints — technical implementation, not owner-facing.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 1 scope (no scope-creep attempts during this session).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Owner can log in with a single admin account (email/password) | bcryptjs hashing pattern, `admin_users` schema, `/api/admin/login` route pattern (Code Examples) |
| AUTH-02 | Owner's session persists across browser refresh via secure cookie | jose `SignJWT`/`jwtVerify` pattern, httpOnly/Secure/SameSite cookie config (Code Examples) |
| AUTH-03 | Unauthenticated visitors are redirected away from any `/admin/*` route | `proxy.ts` verified-supported pattern + `requireAdmin()` defense-in-depth (Architecture Patterns, Validation Architecture) |
| AUTH-04 | Repeated failed login attempts are throttled/locked out (DB-backed, not in-memory) | `login_attempts`/lockout schema + query pattern (Code Examples, Don't Hand-Roll) |
</phase_requirements>

## Summary

This phase stands up the entire backend for the v2.0 milestone: a Netlify Database (Neon Postgres) instance, Drizzle ORM schema/migrations, and a hand-rolled JWT/cookie auth system protecting `/admin/*`. The milestone-level research (STACK.md/ARCHITECTURE.md) left two things genuinely unresolved that this phase must close out: (1) the DB/auth provider conflict (Netlify Database vs Supabase) — **resolved here in favor of Netlify Database**, per `STATE.md`'s already-logged decision and PROJECT.md's "extend the Netlify stack" constraint; (2) whether Next.js 16's `proxy.ts` actually works under `@netlify/plugin-nextjs` — **verified here as yes**, with version-specific evidence.

The critical finding for AUTH-03: this project's installed `@netlify/plugin-nextjs@5.15.9` (confirmed via `npm list`) is **at or above** the exact two changelog versions (5.15.8, 5.15.9) where Netlify's adapter shipped specific "Node.js Middleware/proxy" bundling fixes, on top of the 5.13.0 release that introduced "Node.js Middleware support" in the first place. Next.js's own official docs confirm `proxy.ts` defaults to (and only supports) the Node.js runtime as of v16.0.0 — which lines up with, not against, Netlify's Node-middleware support added in 5.13.0+. No conflicting GitHub issue or forum report was found describing `proxy.ts` silently failing to fire specifically on Netlify (the one closely-named issue found, vercel/next.js#86122, is about Cloudflare Proxy, not Netlify, and is unrelated to this stack). Net: build `proxy.ts` as the primary spec, with `requireAdmin()` re-validation in every `/api/admin/*` route as the actual security boundary (already the project's established defense-in-depth convention) — this satisfies AUTH-03 even in the hypothetical case proxy behavior surprises us, since the route-handler check is independently sufficient.

For the database: Netlify Database is confirmed GA, backed by Neon Postgres, provisioned with `netlify database init` (or automatically on `@netlify/database`/`@netlify/neon` install + deploy). The connection env var is `NETLIFY_DATABASE_URL` (confirmed via the `@netlify/neon` package's documented default-env-var behavior), consumed by Drizzle's `drizzle-orm/neon-http` driver via the `@netlify/neon` `neon()` client — this is the officially-documented pairing, not the raw `@neondatabase/serverless` `neon()` constructor (functionally near-identical, but `@netlify/neon` reads the Netlify-injected var automatically rather than requiring you to pass `process.env.DATABASE_URL` by hand). One genuinely unresolved detail to flag for the planner: Netlify Database ships its **own** opinionated migration system (`netlify/database/migrations/`, auto-applied at deploy time) that is independent of `drizzle-kit migrate` — the plan must explicitly choose one (recommendation: point `drizzle-kit generate --out netlify/database/migrations` so Netlify's own deploy-time migration runner applies Drizzle-generated SQL, avoiding two competing migration systems).

**Primary recommendation:** Provision Netlify Database via `netlify database init` (creates `NETLIFY_DATABASE_URL` across all contexts), define schema with Drizzle (`drizzle-orm/pg-core`) targeting `netlify/database/migrations/` as the `drizzle-kit` output directory, connect via `@netlify/neon`'s `neon()` + `drizzle-orm/neon-http`, build `proxy.ts` (verified compatible with the installed `@netlify/plugin-nextjs@5.15.9`) for UX-level `/admin/*` redirects, back every `/api/admin/*` route with a `requireAdmin()` re-check using `jose`'s `jwtVerify`, hash the single admin password with `bcryptjs`, and implement DB-backed login throttling via a dedicated `login_attempts` table queried before every login attempt — never the existing in-memory `rate-limiter.ts`.

## User Constraints

(See `<user_constraints>` above — duplicated here per template; this is the canonical, first-class section.)

## Project Constraints (from CLAUDE.md)

- Server components by default; `"use client"` only where state/effects are needed — the login form (interactive) needs it, the admin layout/shell generally does not.
- Tailwind v4 canonical arbitrary-value syntax: `bg-(--bg-primary)`, `text-(--text-secondary)`, `border-(--border-color)` — not the bracket `text-[var(--x)]` form. Applies to the `/admin/login` page per D-01.
- `<html data-theme="dark">` is hardcoded — no theme toggle. The login page must not reintroduce one.
- Single full-bleed `bg-image.jpg` via `fixed inset-0 -z-10` + `next/image` `fill` pattern is the one background for the whole site, including `/admin/login` per D-01 — do not add a separate admin background.
- `.btn-metallic` (primary) / `.btn-glass` (secondary) are the only button classes to reuse — no new one-off button styles for the login form's submit button.
- Outgoing email HTML (`emailLayout()` in `src/lib/email.ts`) is table-based with inline styles only, no `<style>` blocks/flexbox/grid — the password-reset email (D-02) must follow this exact pattern.
- `isTrustedOrigin()` from `src/lib/csrf.ts` is the established CSRF-defense pattern for state-changing routes — apply to `/api/admin/login` and `/api/admin/*` mutation routes.
- API routes follow defense-in-depth ordering: CSRF origin check → rate limiting → body parsing/validation → business logic (see `src/app/api/register/route.ts`). New `/api/admin/*` routes should follow the same shape, substituting DB-backed throttling for the login route specifically.
- `SECURITY-AUDIT.md` must be read before touching auth, rate limiting, or `next.config.ts` headers — its accepted-risk notes ("no CSRF token," "in-memory rate limiter," both justified by "no session/cookie-based auth exists") become **invalid** the moment this phase ships a cookie-based session; the planner should flag a follow-up security review, consistent with `STATE.md`'s already-logged blocker.
- Netlify only builds/deploys the `main` branch — day-to-day work happens on `dev`; merging to `main` is a separate, explicit step never done automatically.
- Secrets scoping discipline: the project has a documented history (`NEXT_PUBLIC_BASE_URL` incident) of secrets silently misconfigured/mis-scoped, only taking effect on the next build. New secrets (`NETLIFY_DATABASE_URL` is auto-injected; `JWT_SECRET`/`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` must be manually set) must never use the `NEXT_PUBLIC_` prefix and must be verified post-deploy.

## Standard Stack

### Core

| Library | Version (verified via `npm view`, 2026-06-30) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | 0.45.2 | Schema definition, typed queries | TypeScript-first, zero native binary, official Neon HTTP driver support |
| `drizzle-kit` | 0.31.10 | Migration generation (`drizzle-kit generate`) | Companion CLI to drizzle-orm; generates plain SQL files |
| `@neondatabase/serverless` | 1.1.0 | Underlying HTTP/WebSocket Postgres driver | What `drizzle-orm/neon-http` is built on; `@netlify/neon` wraps this with auto env-var resolution |
| `@netlify/neon` | (install via `npm install @netlify/neon`, no pinned version checked — verify at install time) | Netlify-native Neon client wrapper, auto-reads `NETLIFY_DATABASE_URL` | Documented pairing for Netlify Database + Drizzle; avoids manually wiring `process.env.NETLIFY_DATABASE_URL` |
| `jose` | 6.2.3 | JWT signing (`SignJWT`) + verification (`jwtVerify`) | Edge **and** Node runtime compatible, no native deps; works identically in `proxy.ts` (Node runtime as of Next.js 16) and Route Handlers |
| `bcryptjs` | 3.0.3 | Password hashing or admin account + reset tokens | Pure JS, zero build-step risk (unlike native `bcrypt`'s node-gyp compile step, which has broken Netlify Function builds before) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.4.3 | Validate login payload server-side (email/password shape) | Every `/api/admin/*` route accepting a body, consistent with existing `registration-validators.ts` discipline |
| `date-fns` | 4.4.0 | Lockout window math, reset-token expiry math | Avoids hand-rolled date arithmetic; only pull in if plain `Date`/`Date.now()` arithmetic becomes unwieldy — for simple "N minutes from now" lockout math, native `Date` is likely sufficient and adds zero new dependency. Defer adding `date-fns` until Phase 5 (recurring billing) actually needs it, unless the planner finds lockout-window math non-trivial. |
| `@types/bcryptjs` | (devDependency, install alongside) | TypeScript types for `bcryptjs` | Always — bcryptjs ships without bundled types in some versions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@netlify/neon` + `drizzle-orm/neon-http` | `drizzle-orm/netlify-db` (newer, found in one Netlify doc snippet using `drizzle-orm@beta`) | The `netlify-db` adapter appears to be an emerging/beta-tagged integration (`drizzle-orm@beta` required in the doc example found) — riskier for a foundation phase. The `@netlify/neon` + `neon-http` pairing is the better-evidenced, non-beta path and was independently corroborated by the Drizzle+Neon official docs (same `neon-http` driver, same usage shape, just swapping the client constructor's source package). Recommend `@netlify/neon`; flag the beta adapter as worth re-checking if `@netlify/neon` proves awkward in practice. |
| Netlify's own deploy-time migration runner (`netlify/database/migrations/`) | Run `drizzle-kit migrate` manually/in CI against `NETLIFY_DATABASE_URL`, ignore Netlify's auto-apply | Netlify's docs explicitly support pointing your own migration tool at a different directory to avoid the auto-apply system entirely. Manual `drizzle-kit migrate` gives more explicit control (you decide when migrations run) but loses the "migrations block a bad deploy from publishing" safety net Netlify's auto-apply provides. Recommend using Netlify's auto-apply (point `drizzle-kit generate --out netlify/database/migrations`) for this project specifically, since it matches the existing git-based deploy discipline already documented in CLAUDE.md (deploys are deliberate, not constant) and the safety net (bad migration blocks publish) is valuable for a single-developer project with no staging environment beyond Netlify's own deploy-preview branches. |
| Hand-rolled `Date.now()` lockout window math | `date-fns` | See Supporting table above — likely unnecessary for Phase 1's scope alone. |

**Installation:**
```bash
# Core: database + ORM
npm install drizzle-orm @neondatabase/serverless @netlify/neon
npm install -D drizzle-kit

# Auth (no auth framework — just primitives)
npm install jose bcryptjs
npm install -D @types/bcryptjs

# Validation (zod likely not yet a dependency — verify against package.json first)
npm install zod
```

**Version verification (run before planning locks in numbers):**
```bash
npm view drizzle-orm version          # 0.45.2 confirmed 2026-06-30
npm view drizzle-kit version          # 0.31.10 confirmed 2026-06-30
npm view @neondatabase/serverless version  # 1.1.0 confirmed 2026-06-30
npm view jose version                 # 6.2.3 confirmed 2026-06-30
npm view bcryptjs version             # 3.0.3 confirmed 2026-06-30
npm view zod version                  # 4.4.3 confirmed 2026-06-30 (check package.json — not currently a dependency)
npm view @netlify/neon version        # NOT checked this session — verify before locking a version in the plan
```

Note: this project's `package.json` currently has **zero** of these dependencies (`dependencies`: only `next`, `react`, `react-dom`, `resend`). All packages above are net-new additions for this phase.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── login/page.tsx           # NEW — public-within-/admin, the one unauthenticated page
│   │   └── dashboard/page.tsx       # NEW — bare authenticated page proving the session round-trips
│   └── api/
│       └── admin/
│           └── login/route.ts       # NEW — POST: verify credentials, set JWT cookie, DB-backed lockout
├── lib/
│   ├── db/
│   │   ├── index.ts                 # NEW — Drizzle client (neon-http + @netlify/neon)
│   │   └── schema.ts                # NEW — admin_users, login_attempts (+ groundwork tables, see below)
│   ├── auth.ts                      # NEW — signSession(), verifySession(), requireAdmin() helper
│   └── rate-limiter.ts              # UNCHANGED — explicitly NOT reused for /admin/login (Pitfall 1)
├── proxy.ts                          # NEW (project root, sibling to src/app or at repo root per Next.js convention — confirm exact placement during scaffolding) — UX-layer /admin/* redirect
drizzle.config.ts                     # NEW — drizzle-kit config, out: netlify/database/migrations
netlify/
└── database/
    └── migrations/                  # NEW — drizzle-kit generate output, auto-applied by Netlify at deploy time
```

### Pattern 1: `proxy.ts` for UX redirect + `requireAdmin()` for the real security boundary

**What:** `proxy.ts` at the project root (verified location: same level as `app/` — for this project that's the repo root, since `src/app` exists, so `proxy.ts` belongs at `src/proxy.ts` per Next.js's "same level as `pages` or `app`" rule, **not** the bare repo root — confirm exact location matches this project's `src/` layout when scaffolding) checks for a valid session cookie and redirects unauthenticated `/admin/*` requests to `/admin/login`. Every `/api/admin/*` Route Handler independently re-verifies the JWT via `requireAdmin()` — this is the actual security boundary, matching the project's existing CSRF/rate-limit-per-route convention.

**When to use:** `proxy.ts` for every `/admin/*` page route (better UX — redirect before render). `requireAdmin()` for every `/api/admin/*` Route Handler (the real auth check) — no exceptions.

**Verified compatibility:** This project's installed `@netlify/plugin-nextjs` is `5.15.9` (confirmed via `npm list @netlify/plugin-nextjs`). The adapter's own changelog shows:
- `5.13.0` (2025-09-02): "Node.js Middleware support" added as a major feature
- `5.15.8` (2026-02-05): fix for "resolving commonjs with nested package.json in Node Middleware/proxy"
- `5.15.9` (2026-03-09): "workaround tarball bundling issues with virtual CJS modules for Node.js middleware/proxy"

Next.js's own official docs (`nextjs.org/docs/app/api-reference/file-conventions/proxy`, version 16.2.9, last updated 2026-05-13) confirm `proxy.ts` defaults to **and cannot be configured away from** the Node.js runtime as of v16.0.0. Since this project's installed adapter version is the exact version where Netlify shipped two consecutive proxy-specific bundling fixes for Node.js middleware, and Next.js 16's proxy *requires* Node.js runtime (no Edge option), the versions are aligned, not in conflict. The platform-support table in Next.js's own docs lists "Adapters" support as "Platform-specific" (i.e., depends on the adapter, not blanket-unsupported) — Netlify's adapter changelog is the evidence that it is, in fact, supported as of the version already installed in this repo.

**Residual uncertainty:** No first-party Netlify documentation page was found that explicitly states "proxy.ts is supported" in those words (Netlify's docs still reference `middleware.ts` by name on some pages, as milestone research flagged) — the conclusion above is inferred from changelog version alignment + Next.js's own Node-runtime requirement, not a direct "yes, supported" statement from Netlify. **Recommend the plan's first executable task be a smoke test:** create a minimal `proxy.ts` that redirects `/admin/smoke-test` → `/`, deploy to a Netlify preview/production build (not just `next dev`, which doesn't exercise the adapter), and confirm the redirect fires. This converts a MEDIUM-confidence inference into a HIGH-confidence verified fact before building the real auth logic on top of it — cheap insurance given this was explicitly flagged as the one item milestone research could not resolve.

**Example:**
```typescript
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

### Pattern 2: Stateless JWT session (jose) — no server-side session store

**What:** On successful login, sign a JWT containing `{ sub: adminUserId, email }` with a short expiry (recommend hours, not days/weeks per PITFALLS.md's explicit warning against "forever" admin tokens holding PII access), set it as an `httpOnly`, `Secure`, `SameSite=strict` cookie. No session table needed — verification is pure signature/expiry check via `jose`.

**When to use:** The only session mechanism for this phase — single admin, no multi-user session management needed.

**Example (Source: jose's own documented `SignJWT`/`jwtVerify` API shape, applied to this project):**
```typescript
// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = "admin_session";
const SESSION_DURATION = "8h"; // claude's-discretion: short-lived, re-login daily

export interface SessionPayload {
  sub: string;   // admin_users.id
  email: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null; // expired, malformed, or bad signature
  }
}

// Used inside Route Handlers (Node runtime) — cookies() is async in Next.js 15+/16
export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { COOKIE_NAME };
```

```typescript
// src/app/api/admin/login/route.ts — cookie-setting on successful login
import { cookies } from "next/headers";
import { signSession, COOKIE_NAME } from "@/lib/auth";

// ...after verifying credentials...
const token = await signSession({ sub: adminUser.id, email: adminUser.email });
const cookieStore = await cookies();
cookieStore.set(COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 8, // 8 hours, matches SESSION_DURATION above — keep in sync
});
```

### Pattern 3: bcryptjs password hashing

**What:** Hash the seeded admin password with `bcryptjs` at seed-script time; compare on login.

**Example (Source: bcryptjs documented async API):**
```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12; // ~400ms/hash — acceptable for a single-admin login, stronger than the 10-round minimum

// Seed script (one-time, run by developer per D-05)
const passwordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD!, SALT_ROUNDS);

// Login route
const isValid = await bcrypt.compare(submittedPassword, storedHash);
```

### Pattern 4: Database client (Drizzle + Neon HTTP driver via @netlify/neon)

**Example (Source: Drizzle official Neon connection guide + `@netlify/neon` documented usage, reconciled):**
```typescript
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";
import * as schema from "./schema";

// neon() with no arguments reads NETLIFY_DATABASE_URL automatically —
// this is @netlify/neon's documented default behavior, no manual env wiring needed.
export const db = drizzle({ client: neon(), schema });
```

```typescript
// drizzle.config.ts (project root)
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./netlify/database/migrations", // Netlify's auto-apply directory — see Standard Stack "Alternatives Considered"
  dbCredentials: {
    url: process.env.NETLIFY_DATABASE_URL!,
  },
});
```

### Pattern 5: Drizzle schema — `admin_users` + `login_attempts` (+ groundwork conventions)

**What:** Phase 1 needs exactly two tables to satisfy AUTH-01 through AUTH-04, but should establish column/naming conventions later phases (CRM, pricing, invoicing) will follow — specifically: `serial` primary keys, `timestamp with timezone` for all datetime columns (avoids the SAST/UTC ambiguity PITFALLS.md flags for cron jobs later), and soft-delete-friendly patterns even though `admin_users` itself never needs soft delete (single row).

**Example (Source: Drizzle official `pg-core` column type docs, applied to this project's schema needs):**
```typescript
// src/lib/db/schema.ts
import { pgTable, serial, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  resetToken: text("reset_token"),                       // D-02: forgot-password flow
  resetTokenExpiresAt: timestamp("reset_token_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  // Groundwork: not used in v2.0 (single-admin only, per REQUIREMENTS.md AUTH-05 deferred to v2+),
  // but ARCHITECTURE.md's Scaling Considerations explicitly recommends a role column from day one
  // so multi-staff doesn't require an auth-layer rework later. Nullable/unused now.
  role: varchar("role", { length: 32 }).notNull().default("admin"),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),   // attempted email, even if it doesn't match a real account
  ipAddress: varchar("ip_address", { length: 64 }),       // reuse getClientIp() pattern from existing codebase
  succeeded: boolean("succeeded").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Lockout query pattern (Don't Hand-Roll-adjacent — this IS the hand-built part, but the query shape is the standard DB-backed throttle pattern):**
```typescript
// src/lib/auth.ts (continued)
const LOCKOUT_THRESHOLD = 5;       // claude's-discretion default, per CONTEXT.md
const LOCKOUT_WINDOW_MINUTES = 15; // claude's-discretion default, per CONTEXT.md

export async function isLockedOut(email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);
  const recentFailures = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.attemptedAt, windowStart),
      ),
    );
  return recentFailures.length >= LOCKOUT_THRESHOLD;
}
```

This survives a server restart by construction (it's a DB query, not an in-process counter) — directly satisfies AUTH-04's explicit "survives a server restart" success criterion.

### Anti-Patterns to Avoid

- **Reusing `src/lib/rate-limiter.ts` for `/admin/login`:** Explicitly flagged in PITFALLS.md Pitfall 1 and this phase's own CONTEXT.md canonical refs — it's in-memory/process-local, resets on every cold start, and a login endpoint is a fundamentally different threat class (account takeover) than the contact/register forms it was accepted for.
- **Using `@neondatabase/serverless`'s raw `neon()` constructor with manually-passed `process.env.DATABASE_URL`:** Works, but bypasses `@netlify/neon`'s documented auto-resolution of `NETLIFY_DATABASE_URL` and reintroduces the exact "did the env var name match" footgun this project has already been burned by once (`NEXT_PUBLIC_BASE_URL` incident).
- **Letting both Netlify's auto-migration system and a manually-run `drizzle-kit migrate` apply migrations independently:** Pick one (recommended: Netlify's auto-apply, pointed at Drizzle-generated SQL) — running both risks double-applying or conflicting migration state.
- **Long-lived/no-expiry JWT cookies:** PITFALLS.md's Technical Debt Patterns table explicitly flags this — "forever" tokens for an admin holding client PII are a real risk if a laptop is compromised. Keep `SESSION_DURATION` in hours.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| JWT signing/verification | Custom HMAC signing code | `jose`'s `SignJWT`/`jwtVerify` | Handles edge cases (clock skew tolerance, algorithm confusion attacks, claim validation) that hand-rolled HMAC code routinely gets wrong |
| Password hashing | Custom salted-hash scheme | `bcryptjs` | bcrypt's adaptive cost factor and built-in salt generation are the industry-standard defense against rainbow-table/brute-force attacks; reinventing this is a classic security mistake |
| Postgres connection management in serverless functions | Custom connection pooling/retry logic | `@netlify/neon` + `drizzle-orm/neon-http` (HTTP-based, no persistent TCP connection to manage) | Netlify Functions are stateless per-invocation; a hand-rolled pool either leaks connections or fails to reconnect reliably — this is PITFALLS.md Pitfall 3's exact warning |
| Login throttling state | In-memory counter (even a "smarter" one) | DB-backed `login_attempts` table query | The explicit AUTH-04 requirement is "survives a server restart" — only a persisted store satisfies this by definition, no in-memory approach can |
| Schema migrations | Hand-written ALTER TABLE scripts run manually | `drizzle-kit generate` + Netlify's auto-apply (or `drizzle-kit migrate`) | Auditable, versioned, ordered migration files are cheap to get from the tool and expensive to maintain by hand once later phases (CRM, pricing, invoicing) add their own tables |

**Key insight:** Every "don't hand-roll" item above maps to a documented Netlify/serverless-specific failure mode in PITFALLS.md (Pitfalls 1, 2, 3) — this isn't generic best-practice advice, it's specifically what goes wrong on this exact platform if you build it yourself.

## Common Pitfalls

### Pitfall 1: In-memory rate limiter copy-pasted to `/admin/login`

**What goes wrong:** Already documented in milestone PITFALLS.md as the single most likely mistake for this phase — see that file for full detail. Restated here because it's this phase's responsibility to prevent it, not a later phase's.
**How to avoid:** DB-backed `login_attempts` table (Pattern 5 above), queried before processing every login attempt.
**Warning signs:** `/api/admin/login/route.ts` imports `checkRateLimit` from `src/lib/rate-limiter.ts`.

### Pitfall 2: `proxy.ts` placed at the wrong directory level

**What goes wrong:** Next.js's file-convention docs specify `proxy.ts` must be "at the same level as `pages` or `app`." This project uses `src/app/`, so `proxy.ts` belongs at `src/proxy.ts`, not the bare repository root (`./proxy.ts`) — a mistake here means the file is silently never picked up, page render proceeds unauthenticated, and the only thing actually protecting `/admin/*` is `requireAdmin()` in the API routes (which is fine for API security, but `/admin/dashboard` itself — a Server Component page, not a Route Handler — would render without `proxy.ts` doing its job, unless the page itself also calls `requireAdmin()`).
**How to avoid:** Place at `src/proxy.ts`. Additionally, per Anti-Pattern 2 already established in ARCHITECTURE.md, do not rely on `proxy.ts` alone even when correctly placed — each `/admin/*` **page** (Server Component), not just `/api/admin/*` routes, should also call a session check before rendering sensitive content, exactly mirroring the `/api/admin/*` `requireAdmin()` pattern.
**Warning signs:** Visiting `/admin/dashboard` directly without a cookie still renders the page content (even briefly) instead of redirecting.

### Pitfall 3: `bcryptjs` or `jose` accidentally imported into a file that runs in `proxy.ts`'s Node runtime vs. a context expecting Edge

**What goes wrong:** This project's `proxy.ts` will run on Node.js runtime by default (confirmed — Next.js 16 proxy cannot be configured to anything else), so `bcryptjs` works fine there if ever needed. The actual risk is the inverse historical footgun (relevant if this code is ever ported/referenced against older Next.js patterns): `bcryptjs` needing Node and not working in an Edge-runtime middleware. Since Next.js 16's proxy is Node-only by definition, this specific failure mode is **structurally avoided** for this project — flagging it here only so the planner doesn't second-guess putting `bcryptjs` calls in `proxy.ts` if a future password-related check is ever added there (it would work).
**How to avoid:** No action needed given Next.js 16's proxy runtime guarantee — just don't assume Edge-runtime constraints from older Auth.js/NextAuth tutorials apply here.

### Pitfall 4: Netlify Database's auto-migration system and `drizzle-kit migrate` both configured, double-applying migrations

**What goes wrong:** See Architecture Patterns Pattern 4/Alternatives Considered above — Netlify's docs confirm migrations in `netlify/database/migrations/` are auto-applied at deploy time (production deploys and deploy previews), independent of any drizzle-kit invocation. If the plan also wires a CI/local `drizzle-kit migrate` step against the same database without realizing Netlify already ran it, behavior is at minimum confusing (which migrations actually ran becomes unclear) and at worst could cause a migration to attempt re-applying state that already exists.
**How to avoid:** Pick exactly one mechanism (recommended: Netlify's auto-apply, fed by `drizzle-kit generate --out netlify/database/migrations`) and document the choice explicitly in the plan so it isn't silently doubled-up later.
**Warning signs:** A migration file shows as already-applied in Netlify's deploy log but a manual `drizzle-kit migrate` run reports it as pending (or vice versa).

### Pitfall 5: Forgetting `cookies()` is async in this Next.js version

**What goes wrong:** `next/headers`'s `cookies()` function must be `await`ed (this has been the case since Next.js 15 and remains true in 16) — omitting `await` produces a Promise where code expects a `ReadonlyRequestCookies` object, causing a runtime TypeError on `.get()`/`.set()` calls.
**How to avoid:** Always `const cookieStore = await cookies();` before calling `.get()`/`.set()` — shown correctly in Pattern 2/3 examples above.
**Warning signs:** TypeScript error "Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'" if `await` is omitted (TypeScript will actually catch this at compile time given correct typing, which is a helpful safety net here).

## Code Examples

See Architecture Patterns section above (Patterns 1-5) for the full set of verified, source-cited code patterns covering: `proxy.ts` redirect logic, JWT sign/verify, password hashing, DB client setup, and schema definition. All examples are synthesized from official documentation (Next.js docs, Drizzle docs, jose/bcryptjs documented APIs) applied to this project's specific file structure and conventions — not copy-pasted generic tutorial code.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16.0.0 (per official changelog) | File must be named/located per the new convention; exported function renamed from `middleware` to `proxy`; runtime is now Node.js-only (was configurable Edge/Node in 15.5+) |
| Edge runtime for middleware (optional in 15.5+) | Node.js runtime only for proxy, not configurable | Next.js 16.0.0 | Removes the historical "bcrypt doesn't work in Edge middleware" class of bugs entirely for this codebase — proxy.ts can safely call Node-only libraries if ever needed |
| Standalone Neon project + manual `DATABASE_URL` env var | Netlify Database (native Neon integration) + `NETLIFY_DATABASE_URL` auto-injected | Netlify Database GA, 2026-04-28 | Zero separate vendor signup; `@netlify/neon` package auto-resolves the connection string instead of requiring a hand-set env var — directly reduces this project's documented secrets-misconfiguration risk pattern |
| `revalidateTag('tag')` single-argument | `revalidateTag('tag', 'max')` — cacheLife profile required | Next.js 16 | Not directly relevant to Phase 1 (no cached pricing reads yet — that's Phase 3), but the planner should be aware this exists before Phase 3 research, since it's a hard breaking change, not a deprecation warning |

**Deprecated/outdated:**
- `middleware.ts`: still functions in Next.js 16 (backward-compatible, shows a warning) but is deprecated — building net-new as `proxy.ts` avoids a forced rename later, per Next.js's own migration guidance.
- Netlify Identity: explicitly NOT a candidate per milestone PITFALLS.md — had a near-deprecation scare in 2025, only reinstated Feb 2026; not the modern recommended path for a custom single-admin portal regardless.

## Open Questions

1. **Exact `proxy.ts` behavior on Netlify — verified by version alignment, not by an explicit "yes, supported" statement from Netlify**
   - What we know: Next.js 16 proxy.ts requires Node.js runtime (official docs); `@netlify/plugin-nextjs@5.15.9` (installed in this repo) includes two changelog entries specifically fixing Node.js middleware/proxy bundling, built on top of 5.13.0's "Node.js Middleware support." No GitHub issue or forum report was found describing proxy.ts failing specifically on Netlify (the one similarly-named issue found is Cloudflare-specific, unrelated).
   - What's unclear: No first-party Netlify doc page explicitly says "proxy.ts works" in those words — this is an inference from version/changelog alignment, not a direct confirmation.
   - Recommendation: Make the plan's first task a minimal smoke test (a no-op `proxy.ts` redirect deployed to a real Netlify build, confirmed working) before building real auth logic on top of it. This is cheap (minutes) and converts the single highest-risk unknown in this phase from inferred to verified before any other work depends on it.

2. **`@netlify/neon` exact current version**
   - What we know: The package exists, is the documented pairing for Netlify Database + Drizzle's `neon-http` driver, and auto-resolves `NETLIFY_DATABASE_URL`.
   - What's unclear: `npm view @netlify/neon version` was not run this session (the npm registry page returned 403 to WebFetch, and a direct GitHub repo fetch 404'd under the guessed URL).
   - Recommendation: Run `npm view @netlify/neon version` (or `npm install @netlify/neon` and check `package.json` post-install) as a first step when implementation begins — trivial to resolve, just wasn't completed in this research pass due to fetch-tool access limits, not a substantive ambiguity.

3. **Exact `netlify database init` interactive prompts and whether it auto-installs `@netlify/neon` vs. requiring it manually**
   - What we know: `netlify database init` installs `@netlify/database`, scaffolds a starter migration, and offers a choice between "Drizzle ORM" and "direct SQL" query style during setup.
   - What's unclear: Whether choosing "Drizzle ORM" in that prompt auto-installs `@netlify/neon` specifically, or a different package (`@netlify/database` itself appears to also expose a `getConnectionString()` helper per one source, suggesting there may be more than one valid wiring path).
   - Recommendation: Run `netlify database init` interactively as the actual first implementation step (not `--yes`, despite that flag's convenience) specifically to observe what it installs and scaffolds, then reconcile against the `@netlify/neon` + `neon-http` pattern documented in this research. If it diverges, prefer whatever `netlify database init` itself wires up by default — it's the more current, more authoritative signal than any doc snippet.

4. **POPIA data region for Netlify Database**
   - What we know: Milestone research (STACK.md, PITFALLS.md) already flagged that no explicit South African/EU-South region option was confirmed for Netlify Database at time of research, and recommended treating EU-or-equivalent as the default per POPIA's cross-border-transfer-permitted stance.
   - What's unclear: Whether `netlify database init` exposes any region selection at all, or whether Netlify Database's region is implicitly tied to wherever the Netlify site's functions/edge already deploy.
   - Recommendation: Check for a region flag/prompt during `netlify database init`; if none exists, document that fact explicitly (Netlify Database's region is non-configurable / inherited from the site) in the plan's output, satisfying STATE.md's "document explicitly once Phase 1 provider is provisioned" blocker.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling | ✓ | Not checked this session (project requires ≥20.12.2 per Netlify CLI's own prerequisite) | — |
| Netlify CLI | `netlify database init`, local DB testing | Not checked this session | Requires ≥26.0.0 per Netlify Database CLI docs | Install via `npm install -g netlify-cli` if missing |
| `npm` | Package installation | ✓ (used throughout this research session) | — | — |
| Netlify Database (Neon Postgres) | All of Phase 1 — this phase's core deliverable | Not yet provisioned (greenfield) | GA since 2026-04-28; free storage until 2026-07-01 per Netlify's changelog — **verify this date hasn't passed before relying on free-tier storage, since "today" per system context is 2026-06-30, one day before that promotional window closes** | None — this is the phase's foundational dependency, not optional |
| Resend | D-02 password-reset email | ✓ (already in use, `resend` is an existing `package.json` dependency) | `^6.12.4` (existing) | — |

**Missing dependencies with no fallback:**
- Netlify Database itself must be provisioned as this phase's first concrete step — nothing else in the phase can proceed without it.

**Missing dependencies with fallback:**
- None identified — Netlify CLI version, if below 26.0.0, has a trivial fallback (upgrade via npm).

**Time-sensitive note:** Netlify's changelog states Netlify Database storage is "free until 2026-07-01." Given the current date context (2026-06-30), this window closes within roughly 24 hours of this research being conducted — the planner/implementer should verify current pricing terms at `https://docs.netlify.com/build/data-and-storage/netlify-database/billing-and-usage/` before assuming free storage applies, since the promotional period may have lapsed by the time Phase 1 is actually executed.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — no `pytest`, `jest`, `vitest`, or similar found in `package.json`/repo. Only testing tool present is the `webapp-testing` Claude Code skill (Playwright-based, agent-driven browser automation, not a CI-runnable unit/integration test suite). |
| Config file | none — see Wave 0 |
| Quick run command | none — see Wave 0 |
| Full suite command | none — see Wave 0 |

This project currently has **zero automated test infrastructure** of any kind (no `npm run test` script exists in `package.json`; only `dev`, `build`, `start`, `lint`, `scrape`). Given this phase introduces auth and a database for the first time, this is a meaningful gap — auth bugs (lockout not persisting, session not expiring, proxy not redirecting) are exactly the class of regression an automated test would catch on every future change, and the codebase has never had this safety net before.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Owner can log in with correct email/password | integration (route handler) | `npm test -- auth/login.test.ts` (proposed) | ❌ Wave 0 |
| AUTH-02 | Session cookie persists across refresh, is httpOnly/secure/sameSite | manual + Playwright | Playwright script via `webapp-testing` skill: login, reload page, confirm still authenticated | ❌ Wave 0 (Playwright script, not a framework gap) |
| AUTH-03 | Unauthenticated `/admin/*` request redirects to `/admin/login` | integration + manual smoke test on real Netlify deploy (per Open Question 1) | Playwright script: unauthenticated `page.goto('/admin/dashboard')`, assert redirected URL | ❌ Wave 0 |
| AUTH-04 | 6th rapid failed login attempt is rejected even after a simulated process restart | integration (route handler), DB-state-based | `npm test -- auth/lockout.test.ts` (proposed) — must verify against actual DB rows, not in-process state, to meaningfully test the "survives restart" requirement | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual verification via `netlify dev` + curl/Playwright for the specific behavior just built (no automated quick-run exists yet)
- **Per wave merge:** Full manual pass through all four AUTH-0x success criteria from ROADMAP.md, plus the proxy.ts smoke test from Open Question 1
- **Phase gate:** All four success criteria from the phase description manually verified against a real Netlify deploy (not just `next dev`/`netlify dev` locally) before `/gsd:verify-work`, since the one thing local dev cannot validate is the proxy.ts-under-the-real-adapter question this phase exists partly to resolve

### Wave 0 Gaps

- [ ] **Decide whether to introduce a test framework in this phase.** Given this is the first phase to introduce stateful, security-sensitive behavior (auth, lockout), and the project has never had automated tests, this is a reasonable inflection point to add one (e.g. `vitest`, which has minimal setup overhead and works well with Next.js Route Handlers tested in isolation). This is a judgment call for the planner/owner, not dictated by research — flagging it here since AUTH-04 in particular ("survives a server restart") is genuinely hard to verify with manual clicking alone and well-suited to an automated DB-state-assertion test.
- [ ] If a framework is adopted: `vitest.config.ts` — none exists, would need creation
- [ ] If a framework is adopted: a way to point tests at a real (or test-branch) `NETLIFY_DATABASE_URL` rather than mocking the DB entirely, since the lockout logic's entire value is in its DB-persistence behavior
- [ ] Regardless of framework decision: a Playwright script (per the `webapp-testing` skill's existing pattern in this repo) covering AUTH-02/AUTH-03's browser-observable behavior (cookie persistence across refresh, redirect-when-unauthenticated) — this is achievable with zero new framework dependencies, using the tooling already present in `.claude/skills/webapp-testing/`

## Sources

### Primary (HIGH confidence)
- [proxy.js | Next.js official docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — version 16.2.9, last updated 2026-05-13; full API, runtime requirement, platform support table, migration codemod
- [opennextjs-netlify CHANGELOG.md](https://github.com/opennextjs/opennextjs-netlify/blob/main/CHANGELOG.md) — version-specific entries for Node.js middleware/proxy support (5.13.0, 5.15.8, 5.15.9), cross-referenced against this repo's installed `5.15.9`
- `npm list @netlify/plugin-nextjs` (direct command against this repo) — confirms installed version `5.15.9`
- [Netlify changelog: Next.js 16 is ready to deploy on Netlify](https://www.netlify.com/changelog/next-js-16-deploy-on-netlify/) — official, confirms zero-config Next.js 16 support as of plugin v5.15.11+ (this repo is on 5.15.9, slightly behind; flag for the plan to consider bumping to 5.15.11+ before/during this phase)
- [Drizzle ORM: Neon connection guide](https://orm.drizzle.team/docs/connect-neon) — official, exact `drizzle-orm/neon-http` client setup, `drizzle.config.ts` shape, migration commands
- [Drizzle ORM: PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) and [Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) — official, schema syntax verified
- [Netlify Database docs](https://docs.netlify.com/build/data-and-storage/netlify-database/) — GA status, free-storage-until date
- [Netlify Database migrations docs](https://docs.netlify.com/build/data-and-storage/netlify-database/migrations/) — exact migration directory (`netlify/database/migrations`), auto-apply behavior at deploy time, explicit support for using a different tool/directory
- [Netlify Database CLI reference](https://docs.netlify.com/build/data-and-storage/netlify-database/cli/) — exact `netlify database init/connect/status` command syntax and flags
- [Netlify Database tooling docs](https://docs.netlify.com/build/data-and-storage/netlify-database/tooling/) — Drizzle ORM setup steps, `drizzle.config.ts` example pointing `out` at the Netlify migrations directory
- `npm view` direct registry checks (this session, 2026-06-30): `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `@neondatabase/serverless@1.1.0`, `jose@6.2.3`, `bcryptjs@3.0.3`, `zod@4.4.3`, `date-fns@4.4.0`
- Existing codebase inspection (direct file reads, this session): `package.json`, `netlify.toml`, `next.config.ts`, `src/lib/rate-limiter.ts`, `src/lib/csrf.ts`, `src/app/api/register/route.ts` — confirms zero existing DB/auth/JWT dependencies, existing defense-in-depth route pattern, existing CSP/security headers that must remain compatible with new `/admin/*` routes

### Secondary (MEDIUM confidence)
- WebSearch synthesis on `@netlify/neon` README content (env var `NETLIFY_DATABASE_URL`, `neon()` + `drizzle-orm/neon-http` pairing) — the npm page itself returned HTTP 403 to direct fetch and a guessed GitHub repo URL 404'd, so this is WebSearch-snippet-derived rather than directly read from the source; internally consistent across multiple independent search results and consistent with the official Drizzle Neon guide's driver choice, but flagged as not independently fetched-and-confirmed this session (see Open Question 2)
- WebSearch synthesis on jose's `SignJWT`/`jwtVerify` exact method chaining (`.setProtectedHeader()`, `.setSubject()`, `.setExpirationTime()`, `.sign()`) — cross-referenced against jose's GitHub README structure, consistent with multiple 2026 tutorial sources, but the direct GitHub README fetch returned a rendering error rather than clean markdown
- WebSearch synthesis on bcryptjs salt-round recommendations (10 = ~100ms minimum, 12 = ~400ms recommended 2026 default) — multiple 2026 sources agreed, not independently benchmarked this session

### Tertiary (LOW confidence)
- None included as authoritative claims in this document — items that could not be cross-verified are listed in Open Questions instead of stated as fact.

## Metadata

**Confidence breakdown:**
- Standard stack (package choice/versions): HIGH — direct `npm view` registry checks performed this session, not relying on training-data version numbers
- proxy.ts/Netlify adapter compatibility (AUTH-03's core technical risk): MEDIUM-HIGH — strong circumstantial/version-alignment evidence, no direct "Netlify confirms proxy.ts works" statement found; explicitly de-risked via a recommended first-task smoke test in Open Questions
- Drizzle + Netlify Database integration shape: MEDIUM-HIGH — official Drizzle docs are HIGH confidence for the generic Neon pattern; the Netlify-specific `@netlify/neon` wrapper details are MEDIUM (WebSearch-derived, direct source fetch blocked by 403/404)
- Auth code patterns (jose/bcryptjs): HIGH for jose/bcryptjs's well-established APIs (extensively documented, stable libraries), MEDIUM for exact method-chaining syntax not independently re-verified against a clean GitHub README fetch this session
- Pitfalls: HIGH — inherited directly from milestone PITFALLS.md (already HIGH-confidence-rated there) plus two new phase-specific pitfalls (proxy.ts placement, migration-system double-apply) reasoned from this session's own direct findings

**Research date:** 2026-06-30
**Valid until:** 2026-07-14 (14 days) — shorter than the default 30-day stable-domain window specifically because (a) Netlify Database is freshly GA (2026-04-28) and its free-storage promotional window closes 2026-07-01, one day after this research; (b) Next.js 16 and its proxy.ts convention are recent (within the last few months per the version-history table), and the Netlify adapter is still shipping proxy-specific bundling fixes release-to-release (5.15.8, 5.15.9) — re-verify the installed `@netlify/plugin-nextjs` version and changelog before implementation if more than two weeks pass before this phase is executed.
