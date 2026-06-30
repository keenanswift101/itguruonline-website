# Stack Research

**Domain:** Admin portal addition (auth + database + CRM + invoicing + automation) for an existing Next.js 16 / Netlify marketing site
**Researched:** 2026-06-30
**Confidence:** MEDIUM-HIGH (Netlify-native pieces verified against official docs; library choices cross-verified across multiple 2026 sources, no Context7 MCP available this session so versions are WebSearch/official-docs verified, not Context7-verified)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Netlify Database (Neon Postgres) | GA as of 2026-04-28 | Primary datastore for CRM/pricing/invoicing | Native to the platform this site already deploys on — provisioned through the Netlify dashboard/CLI with zero separate vendor signup, automatic migrations, and automatic preview-branch databases for `deploy previews`. It's literally Neon Postgres under the hood, so if the native integration ever changes you can fall back to a standalone Neon project without changing drivers. Storage is free until 2026-07-01 and compute/bandwidth draw from Netlify's existing credit-based plans — fits the "start free/low-cost" budget constraint without adding a new billing relationship. |
| Drizzle ORM | ^0.44.x (`drizzle-orm`) + `drizzle-kit` ^0.31.x | Schema definition, migrations, typed queries | TypeScript-first, has an official Neon + Netlify tutorial, generates SQL migrations as plain files (auditable, fits Git-based Netlify deploys), and stays lightweight enough to bundle into Netlify's serverless function size limits. Prisma's binary engine has a worse track record in constrained serverless bundles; Drizzle ships no native binary. |
| `@neondatabase/serverless` | ^1.x | Postgres driver (HTTP-based) for serverless functions | Netlify (like Vercel) spins up a fresh, isolated function instance per invocation — a normal TCP connection pool (e.g. `pg`) can't be kept warm reliably. Neon's serverless driver queries over HTTP/WebSocket instead, which is the documented pattern for serverless+Neon and is what Netlify Database expects you to use. |
| Custom session auth (`jose` for JWT + `bcryptjs` for hashing) | `jose` ^6.x, `bcryptjs` ^3.x | Single-admin login | This is a **single hardcoded admin account**, not a multi-user system — no signup, no OAuth, no password reset flow, no roles. Pulling in a full auth library (Auth.js/Better Auth) buys session/account-management machinery this project doesn't need and adds an extra dependency surface to the OWASP-audited app. A small `lib/auth.ts` (verify credentials → sign a JWT with `jose` → set an `httpOnly`, `Secure`, `SameSite=strict` cookie → verify in middleware/route handlers) is ~100 lines, has no edge-runtime native-module issues, and is easy to re-audit. See "Alternatives Considered" for when to upgrade to a library instead. |
| Netlify Scheduled Functions (`netlify/functions/`, cron config) | Netlify Functions runtime (current GA) | Reminder emails + recurring invoice generation | This is the **only** Netlify-native way to run code on a timer without a third-party scheduler. Available on all plans (no Pro upgrade needed), cron-expression based, executes in UTC. Must be written as plain Netlify Functions in `netlify/functions/`, not as Next.js Route Handlers — Netlify's docs are explicit that **sites using `@netlify/plugin-nextjs` (the adapter this project already uses) must implement background/scheduled work as regular Netlify Functions**, since the Next.js API-route scheduling sugar only applies to specific advanced-runtime configurations this project isn't using. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-pdf/renderer` | ^4.x | Generate invoice PDFs | Pure-JS PDF generation from JSX — no headless Chromium/Puppeteer binary to ship into a serverless function (which would blow past Netlify Function size/cold-start budgets). Render inside a Route Handler (not a Server Component) since the response is binary, not a server-rendered page. |
| `exceljs` | ^4.x | Spreadsheet export (enquiries/clients/invoices) | Chosen over `xlsx` (SheetJS) specifically for serverless: ExcelJS uses materially less memory at the cost of slightly more CPU time, which matters under Netlify Function memory ceilings. Use its streaming `WorkbookWriter` if exports could grow beyond a few hundred rows; for this project's likely scale (one SME's clients/invoices) the simple in-memory API is sufficient too. |
| `resend` (existing) | already in use | Reminder emails, invoice-sent emails, recurring-invoice notifications | No new email vendor — reuse `src/lib/email.ts`'s existing `emailLayout()` table-based template pattern for any new transactional email (reminder, invoice issued, invoice overdue). Scheduled Functions call the same Resend API the registration wizard already uses. |
| `zod` | ^4.x (if not already a dependency — check `package.json`) | Validate admin-portal form payloads (pricing edits, invoice line items, CRM notes) server-side | Same rationale as any Next.js form: never trust client input, especially on routes that mutate priced/public-facing data. |
| `date-fns` | ^4.x | Billing-cycle date math for recurring invoices, "stale after N days" reminder logic | Avoids hand-rolled date arithmetic bugs (month-end billing cycles, timezone handling for SAST vs UTC cron) — small, tree-shakeable, no moment.js-style global mutation footguns. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `drizzle-kit` | Generate/run SQL migrations from Drizzle schema | Run `drizzle-kit generate` then apply via Netlify Database's migration tooling or `drizzle-kit migrate` against the `DATABASE_URL` Netlify injects. Keep migration files committed to Git so `main`'s deploy history matches schema history. |
| Netlify CLI (`netlify dev`, `netlify functions:invoke`) | Local testing of scheduled functions and DB-backed routes | `netlify dev` will **not** fire scheduled functions on their actual cron schedule locally — always test logic via `netlify functions:invoke <name>` manually, then verify real scheduling only after deploy (use the dashboard's "Run now" button on the deployed function to confirm wiring). |
| `netlify env:list` / `netlify db` commands (existing pattern) | Confirm `DATABASE_URL` and other secrets are present per-environment | Same verification discipline already used for `NEXT_PUBLIC_BASE_URL` in this repo — env var changes only take effect on the next build, so check after provisioning the database and again after the first deploy with auth/DB code. |

## Installation

```bash
# Core: database + ORM
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Auth (no auth framework — just primitives)
npm install jose bcryptjs
npm install -D @types/bcryptjs

# Invoicing / exports
npm install @react-pdf/renderer exceljs

# Validation / dates (skip if already present — check package.json first)
npm install zod date-fns
```

Netlify Database itself is provisioned via the Netlify dashboard ("Add a database" on the site) or `netlify db init`/equivalent CLI command — it is not an npm package, it injects a `DATABASE_URL`/`NETLIFY_DATABASE_URL` environment variable into the site's build and function environments.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Netlify Database (Neon) | Standalone Neon project (signed up directly, not via Netlify) | If you want a database that survives a future move away from Netlify hosting with zero migration, or need finer-grained region control / autoscaling tiers Netlify's wrapper doesn't expose yet. Functionally near-identical since Netlify Database *is* Neon — the only cost is one extra vendor dashboard. |
| Netlify Database (Neon, Postgres) | Turso (SQLite, edge-replicated) | If read latency at the edge mattered more than relational query power — it doesn't here (single admin, low write volume, needs real joins for CRM/invoicing relations). Postgres's relational model fits invoicing line-items and CRM status/notes better than SQLite's weaker concurrent-write story. |
| Drizzle ORM | Prisma | If the team strongly prefers Prisma's DX/migration UI and is willing to manage its binary engine's cold-start and bundle-size overhead in Netlify Functions. Workable, but Drizzle's zero-binary footprint is a better fit for a small serverless deployment. |
| Custom JWT/cookie auth (`jose` + `bcryptjs`) | Better Auth | If this milestone's "single-admin" scope expands sooner than expected to multi-staff logins with roles — Better Auth's plugin model (2FA, RBAC, magic links) directly serves that future need and is explicitly designed to be lightweight-by-default with features opt-in. Revisit this choice if/when the deferred "multi-staff logins" item in PROJECT.md is pulled into scope. |
| Custom JWT/cookie auth | Auth.js / NextAuth v5 | Only if social/OAuth login (e.g. "Sign in with Google") becomes a requirement — Auth.js's main strength is broad OAuth provider support, which a single hardcoded admin account doesn't need. Also note Next.js 16 renamed `middleware.ts` → `proxy.ts`, which affects Auth.js's middleware-based session checks; confirm compatibility before adopting if this path is taken later. |
| `@react-pdf/renderer` | Puppeteer/headless Chromium (`@sparticuz/chromium` for serverless) | If invoices need pixel-perfect HTML/CSS layout fidelity (complex multi-page tables, exact print styling) that React-PDF's Yoga-based flexbox layout engine can't replicate. Adds a much heavier function (Chromium binary), longer cold starts, and closer attention to Netlify Function size limits — avoid unless React-PDF's layout model proves insufficient. |
| `exceljs` | SheetJS (`xlsx`) | If you need to also *import* legacy `.xls` files or support 20+ spreadsheet formats — this project only needs to *export* CRM/invoice data, so ExcelJS's lower memory footprint wins for the serverless export use case. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Vercel-specific features (Vercel Postgres, Vercel Cron, Vercel Blob, Vercel KV) | This site is deployed on Netlify via `@netlify/plugin-nextjs`, not Vercel — these products are unavailable and any tutorial/example assuming them will not work without substituting a Netlify-native equivalent. | Netlify Database (cron→Scheduled Functions, blob storage→Netlify Blobs if ever needed). |
| `bcrypt` (native, the C++-binding version) | Requires node-gyp/native compilation at install and deploy time, which is a common source of broken Netlify Function builds (wrong platform binary bundled). | `bcryptjs` — pure JS, identical algorithm, zero build step risk. |
| Standard `pg` driver with a persistent connection pool | Netlify Functions are stateless and short-lived per invocation; a traditional TCP pool either fails to connect reliably or leaks connections against Neon's connection limits under bursty traffic. | `@neondatabase/serverless` (HTTP/WebSocket driver), or the `-pooler` Neon endpoint with PgBouncer if a pooled TCP connection is specifically needed for a long-running migration script. |
| Next.js Route Handlers' `export const config = { schedule: ... }` sugar for cron, as documented for "Next.js Background/Scheduled API Routes" | That feature applies to Netlify's newer Next.js runtime configurations; sites running the standard `@netlify/plugin-nextjs` adapter (this project) are explicitly told in Netlify's own docs to implement scheduled/background work as plain functions in `netlify/functions/` instead — relying on the Route Handler sugar risks the schedule silently never firing in production. | Plain Netlify Functions (`netlify/functions/send-reminders.mts` etc.) with `export const config: Config = { schedule: "..." }`, or a `netlify.toml` `[functions."name"] schedule = "..."` entry. |
| A full auth framework (Auth.js, Better Auth, Clerk, Authgear) for this milestone's single-admin scope | All of these are built around multi-user account management (signup, password reset, OAuth, sessions-per-user) — correct tools for a future multi-staff portal, but unnecessary complexity and an extra dependency to security-audit for one hardcoded login. | Custom `jose`-based JWT session, ~100 lines, easy to read end-to-end in the upcoming security review. |
| Storing invoice PDFs or spreadsheet exports on the Netlify Functions' local filesystem as "persistent" storage | Netlify Functions are ephemeral — anything written to disk during one invocation is gone by the next. | Generate PDFs/exports on-demand and stream the response directly (Route Handler returning a binary `Response`), or persist source data in Postgres and regenerate the file per request rather than caching it on disk. |

## Stack Patterns by Variant

**If multi-staff roles get pulled into scope sooner than planned (currently deferred per PROJECT.md):**
- Migrate from the custom JWT session to Better Auth (its Drizzle adapter is officially documented) rather than hand-rolling RBAC on top of the custom solution.
- Because Better Auth's plugin model (roles, 2FA, magic links) is purpose-built for exactly that expansion, and retrofitting permissions onto a single-admin JWT scheme is more error-prone than swapping the auth layer at a clean milestone boundary.

**If invoice volume or export size grows well beyond a single SME's current scale:**
- Switch `exceljs`'s in-memory `Workbook` API to its streaming `WorkbookWriter`, and consider moving recurring-invoice generation from a single Scheduled Function invocation into a queued/batched pattern (still within Netlify's 30-second Scheduled Function execution ceiling) if the client list grows large enough to risk timing out.
- Because Scheduled Functions hard-cap execution at 30 seconds (Background Functions exist for longer jobs but require Netlify's Pro plan or above — confirm current plan tier before relying on that).

**If POPIA data-region requirements turn out to require data to stay in/near South Africa specifically:**
- Re-verify Netlify Database's region options at provisioning time (the docs confirm region is tied to where your functions deploy, but didn't surface an explicit South Africa/EU-South region list at time of research) — if no suitably local region exists, evaluate a standalone Neon project with explicit region selection, or another Postgres provider with a confirmed African/EU region, before committing to the native Netlify Database for compliance-sensitive client PII.
- Because the PROJECT.md constraint specifically calls out "appropriate data region" for POPIA compliance, and this was the one point research could not fully confirm — flag for validation before building the data layer.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `drizzle-orm` ^0.44.x | `@neondatabase/serverless` ^1.x | This is the officially documented Drizzle+Neon serverless pairing; use Drizzle's Neon-HTTP driver mode (`drizzle-orm/neon-http`), not the node-postgres adapter, when running inside Netlify Functions. |
| `@react-pdf/renderer` ^4.x | Next.js 16 Route Handlers (Node runtime) | Must run in a Route Handler returning a binary `Response`, not a Server Component or Server Action used for page rendering — confirmed pattern across multiple 2026 sources. Ensure the route is not configured for the Edge runtime, since PDF rendering needs Node APIs. |
| `jose` ^6.x | Edge and Node runtimes | Pure-JS, works identically in middleware/proxy (`proxy.ts` in Next.js 16) and in Node-based Route Handlers — no split logic needed between edge and server contexts, unlike `bcryptjs` which needs the Node runtime. |
| `bcryptjs` | Node runtime only (not Edge) | If any auth check needs to run in `proxy.ts` (Next.js 16's renamed middleware) on the Edge runtime, do password verification in a Node-runtime Route Handler instead and only check the signed JWT cookie's presence/validity (via `jose`, which is edge-safe) in the proxy/middleware layer. |
| Netlify Scheduled Functions | `@netlify/plugin-nextjs` (already in use) | Confirmed via Netlify docs: scheduled/background work must be authored as standalone functions in `netlify/functions/`, separate from the Next.js App Router code — do not attempt to colocate cron logic inside `src/app/api/`. |

## Sources

- [Netlify Database docs](https://docs.netlify.com/build/data-and-storage/netlify-database/) — GA status, Postgres/Neon backing, migrations/branching behavior (MEDIUM-HIGH confidence, official docs, region-specifics not fully covered)
- [Netlify Database changelog (2026-04-28 GA announcement)](https://www.netlify.com/changelog/2026-04-28-netlify-database/) — GA date, free-storage-until date
- [Netlify Scheduled Functions docs](https://docs.netlify.com/build/functions/scheduled-functions/) — cron syntax, 30-second execution limit, plan availability, `netlify/functions/` placement (HIGH confidence, official docs)
- [Netlify: New Background and Scheduled API Routes for Next.js (blog)](https://www.netlify.com/blog/new-background-scheduled-api-routes-nextjs/) — clarifies the Route-Handler-based scheduling sugar vs standalone Functions requirement for `@netlify/plugin-nextjs` sites (MEDIUM confidence — blog post, cross-checked against Functions docs)
- [Drizzle ORM: Neon connection guide](https://orm.drizzle.team/docs/connect-neon) and [Drizzle + Netlify Edge Functions + Neon tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-netlify-edge-functions-neon) — driver selection, serverless HTTP pattern (HIGH confidence, official ORM docs)
- [Neon docs: connect from Drizzle](https://neon.com/docs/guides/drizzle) — pooled vs HTTP driver guidance (HIGH confidence, official docs)
- [Better Auth: Next.js integration docs](https://better-auth.com/docs/integrations/next) — Next.js 16 proxy runtime behavior, Node-runtime requirement for full session validation (MEDIUM confidence — official docs but didn't explicitly confirm Netlify support; used to inform the "alternative, not primary" recommendation)
- WebSearch (multiple queries, cross-referenced 3+ sources each): Better Auth vs NextAuth/Auth.js comparisons, bcrypt/bcryptjs/argon2 serverless compatibility, `@react-pdf/renderer` vs Puppeteer for serverless PDF generation, ExcelJS vs SheetJS memory tradeoffs, custom JWT/cookie session patterns with `jose` (MEDIUM confidence — multiple independent 2026 sources agreed; flagged as WebSearch-derived, not Context7-verified, since no Context7 MCP tool was available this session)
- POPIA data-region requirement: research could not confirm a specific South Africa/EU-South Netlify Database region option — flagged as a gap in "Stack Patterns by Variant" above, needs validation before the database is provisioned

---
*Stack research for: Admin portal (auth, database, CRM, invoicing, automation) on existing Netlify-hosted Next.js 16 site*
*Researched: 2026-06-30*
