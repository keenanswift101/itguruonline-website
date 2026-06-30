# Architecture Research

**Domain:** Admin portal (auth + database-backed CRM + live pricing + invoicing + scheduled automation) bolted onto an existing Next.js 16 App Router marketing site, deployed on Netlify (`@netlify/plugin-nextjs`), not Vercel.
**Researched:** 2026-06-30
**Confidence:** HIGH (Netlify/Next.js platform facts verified against official docs/blog); MEDIUM (Supabase-specific recommendation — verified for region/auth pattern, not benchmarked against alternatives in depth)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     PUBLIC SITE (existing, unauthenticated)           │
├──────────────────────────────────────────────────────────────────────┤
│  / , /services , /about , /contact , /register , /domain-checker      │
│  Server components read pricing via new src/lib/pricing.ts            │
│  (DB-backed, cached) instead of hard-coded arrays                     │
├──────────────────────────────────────────────────────────────────────┤
│                  EXISTING PUBLIC API ROUTES (modified)                │
│  /api/register  /api/contact  /api/domain/check                       │
│  Same validation/sanitize/rate-limit pipeline, now ALSO inserts a     │
│  CRM record (enquiry/client) instead of just emailing                 │
├──────────────────────────────────────────────────────────────────────┤
│                    NEW: /admin/* (authenticated, private)             │
│  /admin/login  /admin/dashboard  /admin/clients  /admin/pricing       │
│  /admin/invoices  /admin/settings                                     │
│  Protected by proxy.ts (Next.js 16's middleware.ts replacement)       │
├──────────────────────────────────────────────────────────────────────┤
│              NEW: /api/admin/* (authenticated API routes)             │
│  CRUD for clients, pricing, invoices, settings — session-checked      │
│  on every request server-side (never trust the proxy alone)           │
├──────────────────────────────────────────────────────────────────────┤
│                NEW: SCHEDULED AUTOMATION (Netlify Scheduled           │
│                Functions, separate from the Next.js app process)      │
│  app/api/cron/reminders     → stale enquiry / overdue invoice emails  │
│  app/api/cron/recurring-invoices → generates invoices on billing date │
├──────────────────────────────────────────────────────────────────────┤
│                          DATA + AUTH LAYER                            │
│  Supabase (Postgres + Auth + Row Level Security), EU region           │
│  Tables: enquiries, clients, hosting_packages, domain_prices,         │
│  site_settings, invoices, invoice_line_items, admin_users             │
├──────────────────────────────────────────────────────────────────────┤
│                       EXISTING: Resend (email)                        │
│  Reused as-is for: registration/contact confirmations (existing),     │
│  reminder emails (new), invoice-sent emails (new)                     │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `proxy.ts` (project root) | Gatekeeper for `/admin/*` — redirects unauthenticated requests to `/admin/login` before the route even renders | Next.js 16's renamed `middleware.ts`; runs on Node.js runtime now, not Edge |
| `src/lib/supabase/server.ts` | Server-side Supabase client bound to request cookies (Server Components, Route Handlers, Server Actions) | `@supabase/ssr` `createServerClient` |
| `src/lib/supabase/middleware.ts` | Refreshes the Supabase auth session cookie inside `proxy.ts` | `@supabase/ssr` `createServerClient` + `response.cookies.set` |
| `src/lib/pricing.ts` (new) | Single source of truth for hosting/domain pricing reads — replaces both hard-coded locations | Cached DB query (`unstable_cache` / `"use cache"` + `revalidateTag`) |
| `src/app/api/admin/*` | Authenticated CRUD for clients, pricing, invoices, settings | Route Handlers, every one re-checks `supabase.auth.getUser()` server-side |
| Netlify Scheduled Functions | Cron-triggered jobs outside the request/response cycle (reminders, recurring invoices) | `netlify/functions/*.ts` with `export const config = { schedule: "..." }`, or `netlify.toml` `[functions]` block |
| Supabase Postgres + RLS | Single data store for CRM, pricing, invoicing | Row Level Security policies scoped to the `admin_users` role; public site reads via an anonymous read-only policy on price tables only |

## Recommended Project Structure

```
src/
├── app/
│   ├── admin/                       # NEW — private portal, all pages require auth
│   │   ├── layout.tsx               # Admin shell (sidebar nav), checks session server-side too
│   │   ├── login/page.tsx           # Public-within-/admin: the one unauthenticated admin page
│   │   ├── dashboard/page.tsx       # Overview: counts, recent enquiries, overdue invoices
│   │   ├── clients/
│   │   │   ├── page.tsx             # List + search/filter
│   │   │   └── [id]/page.tsx        # Detail: status, notes, linked invoices
│   │   ├── pricing/
│   │   │   ├── page.tsx             # Hosting package editor
│   │   │   └── domains/page.tsx     # Per-TLD domain price editor
│   │   ├── invoices/
│   │   │   ├── page.tsx             # List + status filter
│   │   │   ├── new/page.tsx         # Create invoice (pick client, line items)
│   │   │   └── [id]/page.tsx        # Detail + status transitions
│   │   └── settings/page.tsx        # Contact email, setup-fee note, etc.
│   ├── api/
│   │   ├── register/route.ts        # MODIFIED — now also writes a CRM record
│   │   ├── contact/route.ts         # MODIFIED — now also writes a CRM record
│   │   ├── domain/check/route.ts    # UNCHANGED (availability only, no pricing dependency)
│   │   ├── admin/                   # NEW — authenticated CRUD, mirrors /admin/* pages
│   │   │   ├── clients/route.ts
│   │   │   ├── clients/[id]/route.ts
│   │   │   ├── pricing/hosting/route.ts
│   │   │   ├── pricing/domains/route.ts
│   │   │   ├── invoices/route.ts
│   │   │   ├── invoices/[id]/route.ts
│   │   │   ├── settings/route.ts
│   │   │   └── export/route.ts      # CSV/XLSX export for clients/enquiries/invoices
│   │   └── cron/                    # NEW — invoked only by Netlify Scheduled Functions, not public nav
│   │       ├── reminders/route.ts
│   │       └── recurring-invoices/route.ts
│   ├── services/page.tsx            # MODIFIED — packages array replaced with a DB read via src/lib/pricing.ts
│   └── (existing public pages unchanged)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # NEW — browser client (admin UI client components only)
│   │   ├── server.ts                # NEW — server client (RSC/Route Handlers/Server Actions)
│   │   └── middleware.ts            # NEW — session refresh helper used by proxy.ts
│   ├── pricing.ts                   # NEW — getHostingPackages(), getDomainPrices(), cached + tag-invalidated
│   ├── crm.ts                       # NEW — createEnquiry(), createOrUpdateClient() — called from register/contact routes
│   ├── invoices.ts                  # NEW — invoice numbering, line-item totals, status transitions
│   ├── auth.ts                      # NEW — requireAdmin() helper for Route Handlers (re-checks session)
│   ├── registration-types.ts        # MODIFIED — HOSTING_PACKAGES becomes a typed fallback/seed only, not the runtime source
│   ├── email.ts                     # MODIFIED — add reminder + invoice-sent templates, reuse emailLayout()
│   ├── rate-limiter.ts              # UNCHANGED but now ALSO applied to /api/admin/* and /admin/login
│   └── (csrf.ts, client-ip.ts, domain-validator.ts unchanged)
├── components/
│   ├── admin/                       # NEW — portal-only UI, mirrors existing sections/ui/forms split
│   │   ├── layout/AdminSidebar.tsx, AdminHeader.tsx
│   │   ├── clients/ClientTable.tsx, ClientStatusBadge.tsx, NotesPanel.tsx
│   │   ├── pricing/HostingPackageForm.tsx, DomainPriceTable.tsx
│   │   └── invoices/InvoiceForm.tsx, InvoiceStatusBadge.tsx, LineItemEditor.tsx
│   └── (existing sections/ui/forms/layout unchanged)
└── proxy.ts                          # NEW (project root, same level as src/app or src/) — replaces middleware.ts
netlify/
└── functions/                        # NEW — Scheduled Functions live OUTSIDE src/app, separate Netlify build target
    ├── send-reminders.ts             # schedule: "@daily" — calls the same logic as app/api/cron/reminders
    └── generate-recurring-invoices.ts # schedule: "@daily"
```

### Structure Rationale

- **`/admin` as a route group under the existing App Router, not a separate app:** Netlify's `@netlify/plugin-nextjs` deploys one Next.js app; running a second app/process would mean a second Netlify site, duplicated env vars/DNS, and losing the shared design system (`globals.css` tokens, `Reveal`, button classes). A route segment keeps one build, one deploy, one domain (`it-guru.co.za/admin`), and lets admin pages reuse `Reveal`/Tailwind tokens if desired (though the admin UI should otherwise look utilitarian, not marketing-styled).
- **`proxy.ts` at the root, not `middleware.ts`:** Next.js 16 renamed and re-platformed this file — `proxy.ts` runs on the Node.js runtime (not Edge), which matters because Supabase session-refresh logic in `@supabase/ssr` needs Node APIs that the old Edge runtime restricted. `middleware.ts` still works but is deprecated and slated for removal; building it as `proxy.ts` from day one avoids a forced rename later. Netlify provisions an Edge Function to run Next.js's request interception layer regardless of the file name — confirm this still applies post-rename when implementing (Netlify's docs reference `middleware.ts` by name as of this research date; behavior should carry over since it's a Next.js-level rename, not a Netlify-specific concept, but verify during Phase 1 build).
- **`src/lib/supabase/{client,server,middleware}.ts` split:** This is Supabase's own documented SSR pattern (`@supabase/ssr`) — Server Components can't write cookies, so a server client (read-only within RSC) and a middleware-bound client (can refresh/write the session cookie) are necessarily different objects. Mirrors the existing `src/lib/` flat-file convention (no nested `lib/supabase/` would force `client.ts`/`server.ts` name collisions with other future libs).
- **`netlify/functions/` for cron, separate from `src/app/api/cron/`:** Netlify Scheduled Functions are a distinct deployment artifact from Next.js API routes — they're discovered by `@netlify/plugin-nextjs`/Netlify's functions bundler from a dedicated directory (or declared in `netlify.toml`), not by Next.js routing. The thin `netlify/functions/*.ts` files should import and call shared logic from `src/lib/` (e.g. `src/lib/automation/reminders.ts`) so the actual business logic isn't duplicated or trapped inside a Netlify-only file — this also makes the logic unit-testable without spinning up Netlify Functions locally. Optionally, also expose `app/api/cron/*` as a manually-triggerable authenticated route for the admin to click "Send reminders now" from the dashboard, calling the same shared lib function.
- **`src/lib/pricing.ts` as the only read path for pricing:** Both currently-hard-coded locations (`HOSTING_PACKAGES` in `registration-types.ts`, `packages` array in `services/page.tsx`) get replaced by calls into this one module, which queries Supabase and uses Next.js's cache-tag system so admin price edits propagate without a redeploy. `HOSTING_PACKAGES` itself isn't deleted — it becomes the seed data for the initial DB migration and a typed fallback shape, since `registration-validators.ts` likely still needs `HostingPackage` as a union type for client-side validation.

## Architectural Patterns

### Pattern 1: Database as the single source of truth for pricing, read through a cached server-only module

**What:** Both pricing locations become thin callers of `getHostingPackages()` / `getDomainPrices()` in `src/lib/pricing.ts`, which query Supabase and wrap the result in Next.js's data cache with a tag (e.g. `"pricing"`). Admin price edits call `revalidateTag("pricing")` (or `updateTag` in a Server Action for read-your-writes) so both the registration wizard and `/services` reflect changes immediately without a rebuild.

**When to use:** Any value currently duplicated across `registration-types.ts` and `services/page.tsx`.

**Trade-offs:** Adds a DB round-trip to two previously-static pages — mitigated by caching (these pages don't need request-time freshness, just freshness-after-edit). Slightly more indirection than the current flat array, but eliminates the manual-sync-by-hand problem that's explicitly called out as a pain point in PROJECT.md.

**Example:**
```typescript
// src/lib/pricing.ts
import { unstable_cache as cache } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export const getHostingPackages = cache(
  async () => {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("hosting_packages")
      .select("*")
      .order("sort_order");
    return data ?? FALLBACK_HOSTING_PACKAGES; // seeded from old HOSTING_PACKAGES
  },
  ["hosting-packages"],
  { tags: ["pricing"] }
);
```
```typescript
// src/app/api/admin/pricing/hosting/route.ts (after a successful update)
import { revalidateTag } from "next/cache";
revalidateTag("pricing", "max"); // Next.js 16 requires a cacheLife profile as 2nd arg
```

### Pattern 2: Registration/contact routes write a CRM record, independent of email send success

**What:** `register/route.ts` and `contact/route.ts` keep their existing validate → sanitize → rate-limit pipeline untouched, but insert a row into `enquiries` (and upsert into `clients` for registrations, keyed on email) immediately after sanitization, before sending email. The `// TODO: Persist to DB (Supabase)` comment already in `register/route.ts` marks exactly where this goes.

**When to use:** Both existing public submission routes; this is the only place CRM records originate from the public site.

**Trade-offs:** Must decide failure semantics — if the DB insert fails, should the user still get a success response (since email still sends) or see an error? Recommendation: insert into DB first, and only treat a DB failure as a hard error (don't silently lose the record) — email failure should not block the DB write or fail the response (it's the secondary channel now, not the system of record).

**Example:**
```typescript
// src/app/api/register/route.ts — after `const clean = sanitizeAll(raw);`
const referenceId = generateReferenceId();

const { error: dbError } = await createRegistrationRecord({
  referenceId,
  ...clean,
});
if (dbError) {
  return NextResponse.json({ error: "Could not save your application. Please try again." }, { status: 500 });
}

// existing email sends continue unchanged below
```

### Pattern 3: `requireAdmin()` guard repeated at the route-handler level, not trusted to `proxy.ts` alone

**What:** `proxy.ts` redirects unauthenticated browser navigation away from `/admin/*` for UX, but every `/api/admin/*` Route Handler independently calls a `requireAdmin()` helper that re-validates the Supabase session server-side before touching data. This mirrors the existing defense-in-depth pattern already used for CSRF (`isTrustedOrigin`) and rate limiting in `register`/`contact`/`domain/check`.

**When to use:** Every single `/api/admin/*` route, no exceptions — middleware/proxy checks are a UX nicety, not a security boundary, since Route Handlers can in principle be reached directly.

**Trade-offs:** Minor duplication (one extra line per route) in exchange for not having a single point-of-failure auth check. Consistent with this codebase's existing layered-defense style (CSRF + rate-limit + validation + sanitize, each independently in every route).

**Example:**
```typescript
// src/lib/auth.ts
export async function requireAdmin(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const, user };
}

// src/app/api/admin/clients/route.ts
const auth = await requireAdmin(req);
if (!auth.ok) return auth.response;
```

## Data Flow

### Request Flow — Registration submission to CRM record

```
RegistrationWizard (client component)
    ↓ POST /api/register
isTrustedOrigin() → checkRateLimit() → validate*() → sanitizeAll()
    ↓
generateReferenceId()
    ↓
createRegistrationRecord() → Supabase: insert `clients` (upsert by email) + insert `enquiries` row, status="new"
    ↓ (only on DB success)
sendEmail() × 2 (client confirmation + ADMIN_EMAIL notification) — unchanged from today
    ↓
NextResponse.json({ referenceId }, 201)
```

### Request Flow — Admin price edit propagating to public pages

```
/admin/pricing (Server Action or fetch to /api/admin/pricing/hosting)
    ↓ requireAdmin() check
UPDATE hosting_packages SET ... WHERE id = ...
    ↓
revalidateTag("pricing", "max")  // Next.js 16 cacheLife-profile-required signature
    ↓
Next request to /services or /register reads getHostingPackages() → cache miss → fresh DB row → re-cached
```

### Request Flow — Scheduled automation (reminders / recurring invoices)

```
Netlify Scheduler (UTC cron, e.g. "0 6 * * *" = 06:00 UTC daily)
    ↓ invokes netlify/functions/send-reminders.ts (NOT an /api/* route — separate function)
import { sendStaleEnquiryReminders } from "@/lib/automation/reminders"
    ↓
Query Supabase: enquiries WHERE status != 'completed' AND last_contacted_at < now() - interval 'N days'
    ↓
sendEmail() per stale record (reusing emailLayout())
    ↓
UPDATE enquiries SET last_reminder_sent_at = now() (prevents duplicate sends on next run)
```

### State Management

The admin portal has no client-side global state store — Server Components fetch directly from Supabase per-request (cached where appropriate via Pattern 1), and client components (forms, interactive tables) use local `useState` + `fetch()` to `/api/admin/*`, then `router.refresh()` or Next.js 16's `refresh()` Server Action API to pull fresh server data. This matches the existing codebase's lean approach (no Redux/Zustand anywhere today) and is appropriate at single-admin scale.

### Key Data Flows

1. **Public submission → CRM:** `register`/`contact` routes become the only entry points that create `enquiries`/`clients` rows — no other path writes these tables from the public side.
2. **Admin edit → public read:** All pricing/settings edits go through `/api/admin/*` → DB write → cache tag invalidation → next public-page request sees fresh data. No public page ever talks to Supabase directly without going through `src/lib/pricing.ts` or `src/lib/settings.ts`.
3. **Scheduled jobs → email + DB:** Cron functions read CRM/invoice state, send email via the existing Resend wrapper, and write back timestamps/status to prevent duplicate notifications on the next run.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single admin, low enquiry volume) | Exactly as described above — Supabase free tier, Netlify Scheduled Functions free tier (all plans), no queue needed |
| Growth to multi-staff / higher volume | Add a `role` column to `admin_users` + RLS policies per role (data model should support this from day one per PROJECT.md's stated rationale — don't hard-code "is admin" as a boolean) |
| High invoice/reminder volume (1000s of recurring invoices/day) | 30-second Scheduled Function limit becomes a real constraint — switch the cron function to enqueue work (e.g. write "pending" rows) and process in batches across multiple scheduled runs, or move to Netlify Background Functions (15-minute limit) for the generation step |

### Scaling Priorities

1. **First likely bottleneck:** Netlify Scheduled Function's 30-second execution cap if recurring invoice generation or reminder batches grow — mitigate by keeping each cron invocation's query scoped (e.g. `LIMIT 100` per run) rather than assuming unbounded growth handles itself.
2. **Second:** In-memory `rate-limiter.ts` is process-local (already noted in its own comment) — fine for the current low-traffic public routes, but `/api/admin/*` and `/admin/login` specifically should get their own rate-limit keys and a lower threshold (login brute-force protection matters even at small scale) — still in-memory is acceptable here since each Netlify function instance is short-lived and login attempts are inherently low-volume, but flag for review during the security audit mentioned in PROJECT.md's constraints.

## Anti-Patterns

### Anti-Pattern 1: Building the admin portal as a separate Next.js app/Netlify site

**What people do:** Spin up a second repo/Netlify site for "the admin app" to keep it cleanly separated from the marketing site.
**Why it's wrong:** Doubles deploy/env-var/DNS management, breaks the single source of truth for pricing (now two codebases would both need to read the same DB, doubling integration surface), and contradicts the project's stated constraint to extend the existing stack, not introduce a separate framework/deploy target.
**Instead:** One Next.js app, one Netlify site, `/admin` as a route segment protected by `proxy.ts` + per-route auth checks.

### Anti-Pattern 2: Trusting `proxy.ts`/middleware as the only auth boundary

**What people do:** Redirect unauthenticated users away from `/admin/*` in middleware and assume that's sufficient, leaving API routes unchecked.
**Why it's wrong:** Route Handlers under `/api/admin/*` are independently reachable (e.g. via `curl` or a forged request) regardless of what middleware does for browser navigation; Netlify's own docs note headers/redirects are evaluated *after* middleware in their runtime, which is one more reason not to treat it as airtight.
**Instead:** `requireAdmin()` re-validates the session inside every `/api/admin/*` handler (Pattern 3), exactly like this codebase already does for CSRF/rate-limit/validation in every existing public route.

### Anti-Pattern 3: Keeping pricing arrays in code "for now" and writing to the DB as a secondary copy

**What people do:** Add a database and CRM, but leave `HOSTING_PACKAGES`/`packages` as the live source and try to sync DB → code on every edit (e.g. via a build hook), since it feels like a smaller change.
**Why it's wrong:** Reintroduces exactly the two-places-kept-in-sync-by-hand problem the milestone exists to solve, and requires a full Netlify rebuild (minutes, not instant) for every price change — defeating "live" pricing entirely.
**Instead:** DB is the only runtime source (Pattern 1); code constants become fallback/seed data only, used if the DB is unreachable or for the initial migration.

### Anti-Pattern 4: Building recurring invoice generation as one big scheduled function with unbounded scope

**What people do:** Write a single cron function that loops over every active hosting client and generates invoices, with no limit, assuming current scale (small) means this is fine forever.
**Why it's wrong:** Netlify Scheduled Functions hard-cap at 30 seconds; a function that works fine at 10 clients silently starts truncating/timing out as the client base grows, with no error surfaced to the admin unless explicitly monitored.
**Instead:** Scope each run's query (date-based: only clients whose billing date is today/this run), log/store a result count, and design the schema so a missed or partial run is self-correcting on the next scheduled invocation rather than silently dropping clients.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase (Postgres + Auth) | `@supabase/ssr` server/browser clients per Pattern in `src/lib/supabase/` | Choose EU region (Frankfurt/Ireland) for the project — POPIA, like GDPR, permits cross-border transfer with adequate safeguards rather than mandating in-country hosting; Supabase has no South African region as of this research. Document this choice explicitly given PROJECT.md's POPIA constraint. |
| Netlify Scheduled Functions | `netlify/functions/*.ts` with `export const config = { schedule: "@daily" }` or declared in `netlify.toml` | 30-second execution limit, UTC-only cron, no POST payload support, only runs on **production** deploys (not branch/preview deploys) — confirm reminders/recurring invoices won't accidentally fire from a `dev`-branch preview, consistent with this repo's existing main-only-deploys branch strategy noted in CLAUDE.md |
| Resend (existing) | Reused via existing `src/lib/email.ts` `sendEmail`/`emailLayout` | No new integration — just new call sites and 1-2 new email templates (reminder, invoice-sent) following the existing table-based/inline-style HTML convention |
| `@netlify/plugin-nextjs` | No change needed — already in `devDependencies` | Confirm at build time that `proxy.ts` is picked up correctly post Next.js 16 rename; Netlify's docs as of this research still reference `middleware.ts` by name, so validate this specific interaction early in the build rather than assuming |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Public pages ↔ pricing data | `src/lib/pricing.ts` cached reads only | Never query Supabase directly from `services/page.tsx` or registration components — always through this one module so cache-tag invalidation has a single point of control |
| `register`/`contact` routes ↔ CRM | `src/lib/crm.ts` (`createEnquiry`, `createOrUpdateClient`) | Keeps DB logic out of the route handlers themselves, consistent with how `email.ts` already abstracts Resend calls out of the routes |
| `/admin/*` pages ↔ `/api/admin/*` | Standard fetch + Server Actions, never direct Supabase calls from client components | Browser Supabase client (`src/lib/supabase/client.ts`) should be limited to auth state (login form, session listener) — all data mutations go through Route Handlers/Server Actions so `requireAdmin()` and audit logging stay centralized |
| Scheduled functions ↔ shared logic | `netlify/functions/*.ts` import from `src/lib/automation/*.ts` | Keeps business logic testable and avoids duplicating reminder/invoice logic between a Netlify-only function file and an admin-triggered manual-run API route |

## Suggested Build Order

Dependencies flow strictly downward — each phase needs the previous phase's data model/auth to exist first.

1. **Foundation: Supabase project + schema + auth** — Create Supabase project (EU region), define core tables (`admin_users`, `enquiries`, `clients`, `hosting_packages`, `domain_prices`, `site_settings`, `invoices`, `invoice_line_items`) with RLS policies from the start (even single-admin v2.0 should use RLS, not a service-role bypass, to avoid a rework when multi-staff roles are added later per PROJECT.md's Key Decisions table). Wire up `@supabase/ssr`, `proxy.ts`, `/admin/login`, and a bare `/admin/dashboard` that just proves an authenticated session round-trips correctly. **Nothing else can start before this.**
2. **CRM capture + viewing** — Modify `register/route.ts` and `contact/route.ts` to write `enquiries`/`clients` records (Pattern 2). Build `/admin/clients` list/detail/search/filter/status/notes. This validates the auth foundation under real write load and gives the owner immediate value (capturing leads) before pricing/invoicing exist.
3. **Live pricing migration** — Build `src/lib/pricing.ts`, seed `hosting_packages`/`domain_prices` tables from the current `HOSTING_PACKAGES` array and services-page `packages` array, build `/admin/pricing` editor, then cut over `services/page.tsx` and `registration-types.ts` consumers to read from the DB (Pattern 1). This is explicitly sequenced after CRM because it depends on the same auth/DB foundation and is lower urgency than not losing leads — but must precede invoicing since invoice line items should be able to reference live package prices.
4. **Invoicing** — Build `invoices`/`invoice_line_items` tables (if not already created in step 1's schema pass), `/admin/invoices` list/create/detail, status transitions (draft/sent/paid/overdue), and CSV/XLSX export. Depends on clients existing (step 2) and benefits from live pricing existing (step 3) so line items can default from current package prices.
5. **Scheduled automation** — Netlify Scheduled Functions for stale-enquiry reminders and overdue-invoice reminders (depends on `enquiries`/`invoices` existing), then recurring invoice generation (depends on invoicing fully working — this is the highest-risk piece since it auto-creates financial records unattended, so it should ship last and only after invoicing has been used manually for a while).
6. **Settings + export polish, fresh security review** — `/admin/settings` (contact email, setup-fee note) can technically slot in anywhere after step 1 but is low-priority/low-risk so fits naturally as a late addition. PROJECT.md's constraint commits to "a fresh security review... once the portal's login system ships" — schedule this once steps 1-2 are live (auth + first real data writes), not deferred to the very end, so any auth/RLS issues are caught before invoicing/automation depend on that foundation being sound.

This order directly follows the dependency chain implied by the milestone's own phrasing: **auth+DB foundation → CRM → pricing migration → invoicing → automation**, with the addition that CRM capture (step 2) should precede the pricing migration (step 3) since capturing leads is the more urgent, lower-risk win and exercises the new auth/DB foundation before the riskier "replace what's currently in production" pricing cutover.

## Sources

- [Netlify's New Background and Scheduled API Routes for Next.js](https://www.netlify.com/blog/new-background-scheduled-api-routes-nextjs/) — MEDIUM, blog announcement
- [Scheduled Functions | Netlify Docs](https://docs.netlify.com/build/functions/scheduled-functions/) — HIGH, official docs (30s limit, cron syntax, production-only execution, no payload support)
- [Next.js advanced API routes | Netlify Docs](https://docs.netlify.com/frameworks/next-js/runtime-v4/advanced-api-routes/) — HIGH, official docs
- [Next.js 16 | Next.js official blog](https://nextjs.org/blog/next-16) — HIGH, official, primary source for `proxy.ts` replacing `middleware.ts`, Node.js runtime change, `revalidateTag()` signature change requiring a `cacheLife` profile argument
- [Next.js Middleware on Netlify | Netlify Docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/legacy-runtime/middleware/) — HIGH, official docs; notes headers/redirects evaluated after middleware on Netlify's runtime, and that middleware runs as a Netlify Edge Function
- [File-system conventions: proxy.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — HIGH, official docs
- [Setting up Server-Side Auth for Next.js | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH, official docs, source for the client/server/middleware split pattern
- [Creating a Supabase client for SSR | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — HIGH, official docs
- [Available regions | Supabase Docs](https://supabase.com/docs/guides/platform/regions) — HIGH, official docs, confirms no South African region; EU regions (Frankfurt/Ireland) available
- [Data residency and sovereignty: What African and EU firms must know | ITWeb](https://www.itweb.co.za/article/data-residency-and-sovereignty-what-african-and-eu-firms-must-know/lLn147mQeBD7J6Aa) — LOW/MEDIUM, single industry-press source on POPIA's cross-border transfer stance; recommend the business confirm with its own compliance reading before treating as final, but directionally consistent with POPIA's published "adequate safeguards" cross-border mechanism (similar in shape to GDPR Art. 45/46)
- Existing codebase inspection (HIGH, primary source): `src/app/api/register/route.ts` (contains existing `// TODO: Persist to DB (Supabase)` comment confirming Supabase was already the intended direction), `src/app/api/contact/route.ts`, `src/app/api/domain/check/route.ts`, `src/lib/registration-types.ts`, `src/lib/rate-limiter.ts` (documents its own in-memory/process-local limitation), `src/app/services/page.tsx`, `next.config.ts`, `netlify.toml`, `package.json`, `.planning/PROJECT.md`

---
*Architecture research for: Admin portal (auth, CRM, live pricing, invoicing, automation) on existing Next.js 16 / Netlify marketing site*
*Researched: 2026-06-30*
