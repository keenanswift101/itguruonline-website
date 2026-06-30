# Project Research Summary

**Project:** IT-Guru Online — v2.0 Admin Portal
**Domain:** Single-operator SMB admin portal (auth + database-backed CRM + live pricing + invoicing + scheduled automation), bolted onto an existing live Next.js 16 / Netlify marketing site
**Researched:** 2026-06-30
**Confidence:** MEDIUM-HIGH

## Executive Summary

This milestone adds a private, single-admin portal to an existing, already-hardened (OWASP-audited) Next.js 16 marketing site deployed on Netlify. The product itself is a well-understood category — a lightweight CRM + invoicing tool for a solo operator, the same shape as Wave or Invoice Ninja's "small business" tier but purpose-built to also drive live pricing on the public site. Research across stack, features, architecture, and pitfalls converges on a clear approach: extend the existing single Next.js app (no second app/site), add a serverless-aware Postgres database as the single source of truth for CRM, pricing, and invoicing, gate `/admin/*` with a lightweight stateless JWT/cookie session (not a full multi-user auth framework — there is exactly one admin), and implement reminders/recurring billing as idempotent, query-driven Netlify Scheduled Functions rather than relying on any "runs exactly once" assumption.

The two highest-leverage decisions are (1) collapsing the current two-hard-coded-files pricing pattern into one DB-backed accessor used by both the registration wizard and the public Services page in the same change — this is both the headline feature and the most common way prior implementations of this exact migration go wrong — and (2) designing invoice idempotency and POPIA-relevant data handling (deletion path, export logging, EU/equivalent-protection region) into the schema from the foundation phase, since retrofitting either after duplicate invoices or a deletion request arrives is materially more expensive than building it in from day one. The single largest risk is treating this build like a normal long-running server app: Netlify Functions are stateless, short-lived, and have no real connection pooling or exactly-once execution guarantees, so every component (DB driver, login rate-limiting, scheduled jobs) must be designed against that serverless reality, not against tutorials that assume Vercel or a persistent Node process.

One open item from research requires an explicit decision before the foundation phase starts: **STACK.md and ARCHITECTURE.md disagree on the database/auth provider** — STACK.md recommends Netlify Database (Neon Postgres, native to the existing Netlify deployment) with custom `jose`-based JWT auth, while ARCHITECTURE.md was researched against Supabase (Postgres + Auth + RLS, EU region) as the assumed provider. Both are technically sound, serverless-compatible choices and the architectural patterns (cached pricing module, `requireAdmin()` defense-in-depth, idempotent scheduled jobs) apply equally to either — but this must be resolved as a Key Decision before schema/auth code is written, since switching later means redoing the auth and data-access layers.

## Key Findings

### Recommended Stack

STACK.md recommends Netlify Database (Neon Postgres, GA April 2026) as the primary datastore specifically because it is native to the platform this site already deploys on — zero new vendor signup, automatic preview-branch databases, and a direct fallback to standalone Neon if ever needed. Paired with Drizzle ORM (TypeScript-first, no native binary, official Neon+Netlify tutorial) and `@neondatabase/serverless` (HTTP/WebSocket driver, required because Netlify Functions can't sustain a normal TCP connection pool). For auth, STACK.md is explicit that this is a **single hardcoded admin account**, not a multi-user system, and recommends hand-rolling a ~100-line JWT session (`jose` + `bcryptjs`) over pulling in a full auth framework — with Better Auth flagged as the natural upgrade path only if multi-staff logins get pulled forward. Scheduled work (reminders, recurring invoicing) must use Netlify Scheduled Functions in `netlify/functions/`, since `@netlify/plugin-nextjs` sites cannot rely on Next.js Route Handler cron sugar. Supporting libraries: `@react-pdf/renderer` for invoice PDFs (no Chromium binary), `exceljs` for spreadsheet export (lower memory footprint than SheetJS under Function memory ceilings), and reuse of the existing Resend wrapper for all new transactional email.

**Core technologies:**
- Netlify Database (Neon Postgres) — primary datastore — native to existing Netlify deployment, free storage tier, no new vendor relationship
- Drizzle ORM + `@neondatabase/serverless` — schema/queries/migrations — zero-binary, TypeScript-first, serverless HTTP driver avoids connection-storm risk
- Custom JWT/cookie auth (`jose` + `bcryptjs`) — single-admin login — right-sized for one hardcoded account; avoids unnecessary auth-framework attack surface
- Netlify Scheduled Functions — reminders + recurring invoicing — the only Netlify-native cron mechanism compatible with `@netlify/plugin-nextjs`
- `@react-pdf/renderer` + `exceljs` — invoice PDFs + CSV/XLSX export — both avoid heavyweight serverless dependencies (Chromium, high-memory in-memory workbooks)

### Expected Features

FEATURES.md frames this as four new capability areas (CRM, pricing management, invoicing, automation) layered onto existing upstream dependencies (registration wizard, contact form, domain checker, Resend). All P1 features map directly to PROJECT.md's Active requirements — research validated the scope as appropriately bounded for a single-operator tool rather than suggesting trims or additions to the core list.

**Must have (table stakes):**
- Auto-capture every registration/contact submission as a CRM record — the entire value proposition
- Single status field per record (4 fixed values: New/Contacted/In Progress/Completed) — matches verified small-business CRM best practice of capping at 5-7 statuses
- Search/filter, timestamped free-text notes, sequential SARS-compliant invoice numbering, Draft/Sent/Paid/Overdue invoice lifecycle (Overdue computed, not manual), manual "mark as paid," CSV export, live-editable hosting and domain pricing (single source of truth replacing the two-file sync), secure single-admin login

**Should have (differentiators):**
- Recurring invoice auto-generation for hosting renewals — highest-leverage automation, but also the most technically involved (idempotency-critical)
- Stale-enquiry and overdue-invoice reminder emails to the owner (internal nudges, not lead-nurture)
- Per-TLD live domain pricing replacing "request a quote" — closes a named revenue gap
- Site settings management without code changes (small, low-risk, same infra as pricing)

**Defer (v2+):**
- Domain-checker-to-CRM lead capture (soft-lead capture from searched-but-unregistered domains)
- Multi-stage dunning/reminder cadences, invoice line-item presets
- Multi-staff roles, client-facing self-service portal, payment gateway integration — all explicitly out of scope per PROJECT.md

One open question from FEATURES.md is now resolved: **IT-Guru is confirmed not VAT-registered.** Invoice templates must use plain "Invoice" labeling with no VAT fields or "Tax Invoice" designation — using tax-invoice language without VAT registration is a real SARS compliance misstep, not a style choice. This is now a settled Key Decision (see PROJECT.md), not an open item to validate during build.

### Architecture Approach

ARCHITECTURE.md recommends extending the existing single Next.js app with `/admin` as a protected route segment (not a separate app/site), gated by `proxy.ts` (Next.js 16's `middleware.ts` replacement, now Node-runtime) for UX-level redirects, with every `/api/admin/*` Route Handler independently re-validating the session server-side — mirroring this codebase's existing defense-in-depth pattern (CSRF + rate-limit + validation, each checked independently per route). Pricing becomes the one architectural lynchpin: a single cached, tag-invalidated data-access module (`src/lib/pricing.ts`) that both the registration wizard and the public Services page read from, replacing the current two-hard-coded-files pattern in the same change, never partially.

**Major components:**
1. `proxy.ts` + per-route `requireAdmin()` checks — defense-in-depth auth boundary, never trusting the proxy layer alone
2. `src/lib/pricing.ts` (cached, tag-invalidated DB reads) — single source of truth feeding both public Services page and registration wizard
3. `src/lib/crm.ts` — enquiry/client record creation, called from existing (modified) `register`/`contact` API routes, decoupled from email-send success/failure
4. `netlify/functions/*.ts` (thin wrappers) importing shared `src/lib/automation/*.ts` logic — keeps scheduled-job business logic testable outside the Netlify Functions runtime and reusable by an admin-triggered "run now" button
5. Database (Postgres, RLS from day one even at single-admin scale) — `enquiries`, `clients`, `hosting_packages`, `domain_prices`, `site_settings`, `invoices`, `invoice_line_items`, `admin_users`

ARCHITECTURE.md's suggested build order is strictly dependency-ordered: **auth/DB foundation → CRM capture/viewing → live pricing migration → invoicing → scheduled automation**, with settings/export polish and a fresh security review (already promised in PROJECT.md) slotted in once auth and first real data writes are live, not deferred to the very end.

### Critical Pitfalls

1. **Reusing the existing in-memory rate limiter for admin login** — a login endpoint is a fundamentally different threat class (account takeover, not spam) than the contact/register forms it was accepted for; back login throttling with a DB-backed attempt counter and lockout once a database exists anyway.
2. **Picking a DB driver/auth pattern that assumes persistent connections** — standard `pg`/database-session adapters cause connection storms or intermittent "works locally, fails in production" failures under Netlify's per-invocation, stateless Function model; use a serverless-native HTTP driver and stateless JWT sessions from day one.
3. **Migrating pricing to the DB but only updating one of the two existing consumption points** — recreates the exact two-source-of-truth bug this milestone exists to fix, just moved into a new system; both the wizard and the Services page must be cut over in the same change, behind one shared accessor, with soft-delete (not hard-delete) on package records so historical invoices/registrations don't orphan.
4. **Scheduled functions silently double-firing or not firing** — Netlify Scheduled Functions have documented at-least-once (not exactly-once) semantics and only run on production deploys, not `dev`/preview; recurring invoice generation and reminder emails must be idempotent-by-construction (query "what's still due," not "did this fire"), with a manually-triggerable HTTP twin of the same logic for testing on `dev`.
5. **Treating POPIA as a checkbox rather than an operational practice** — this milestone persists, makes searchable, and makes exportable PII that previously existed only transiently (validated → emailed → discarded). Schema must support cascading deletion, exports must be logged (who/when/what), and the database/auth provider's region should default to EU or another equivalent-protection jurisdiction since no South African region exists among the serverless-friendly options researched.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Auth + Database Foundation
**Rationale:** Every other phase depends on auth and a data model existing first — pricing, CRM, invoicing, and automation all read/write through this foundation. This is also where the highest-cost-to-retrofit decisions live (DB driver choice, soft-delete schema design, RLS-from-day-one, secrets scoping, login throttling).
**Delivers:** Database provisioned (region decision made and documented), core schema (`admin_users`, `enquiries`, `clients`, `hosting_packages`, `domain_prices`, `site_settings`, `invoices`, `invoice_line_items`) with RLS and soft-delete patterns in place, working `/admin/login` + `proxy.ts` + a bare authenticated `/admin/dashboard`, DB-backed login throttling/lockout.
**Addresses:** "Owner can log in to a private, secured admin area" (PROJECT.md Active)
**Avoids:** Pitfall 1 (in-memory rate limiter reused for login), Pitfall 2 (auth strategy incompatible with serverless), Pitfall 3 (connection-storm-prone DB driver), Pitfall 7 (secrets sprawl/`NEXT_PUBLIC_` mistakes) — all flagged as foundation-phase pitfalls specifically because they're expensive to retrofit later.

### Phase 2: CRM Capture + Viewing
**Rationale:** Validates the auth/DB foundation under real write load and delivers the owner's most urgent, lowest-risk win (never losing a lead) before the riskier "replace what's live in production" pricing cutover.
**Delivers:** `register`/`contact` API routes modified to write `enquiries`/`clients` records (DB-write treated as the hard-error path, email as secondary), `/admin/clients` list/detail with search/filter/status/notes.
**Addresses:** Auto-capture, view/search/filter, status tracking, notes (PROJECT.md Active)
**Uses:** `src/lib/crm.ts` data-access pattern from ARCHITECTURE.md

### Phase 3: Live Pricing Migration
**Rationale:** Depends on the same auth/DB foundation; lower urgency than not-losing-leads but must precede invoicing so invoice line items can reference live package prices. This is the single biggest architectural lift and the most failure-prone migration in the milestone if done partially.
**Delivers:** `src/lib/pricing.ts` single-source-of-truth module (cached, tag-invalidated), `hosting_packages`/`domain_prices` seeded from current hard-coded arrays, `/admin/pricing` + `/admin/pricing/domains` editors, both `services/page.tsx` and the registration wizard cut over to read from the DB **in the same change**.
**Addresses:** Live-editable hosting pricing, live-editable domain pricing, site settings management (PROJECT.md Active)
**Avoids:** Pitfall 4 (partial pricing migration recreating the two-source-of-truth bug) — explicitly the highest-risk pitfall for this phase per PITFALLS.md's "Looks Done But Isn't" checklist (verify both consumption points show identical prices within seconds of an edit).

### Phase 4: Invoicing
**Rationale:** Depends on clients existing (Phase 2) and benefits from live pricing existing (Phase 3) so line items can default from current package prices.
**Delivers:** `invoices`/`invoice_line_items` CRUD, sequential SARS-compliant numbering (plain "Invoice," no VAT fields — confirmed not VAT-registered), Draft/Sent/Paid/Overdue lifecycle with Overdue computed, PDF generation (`@react-pdf/renderer`), CSV/XLSX export with access logging.
**Addresses:** Invoice generation, invoice status tracking, CSV export (PROJECT.md Active)
**Implements:** `src/lib/invoices.ts` from ARCHITECTURE.md project structure

### Phase 5: Scheduled Automation
**Rationale:** Highest-risk phase — recurring invoice generation auto-creates financial records unattended, so it should ship last and only after invoicing has been used and trusted manually for a period. Reminders (lower-stakes) can precede recurring billing within this phase.
**Delivers:** Netlify Scheduled Functions for stale-enquiry reminders and overdue-invoice reminders, then recurring invoice generation — all built idempotent-by-construction (period-keyed uniqueness checks, not trust in single-firing), with a manually-triggerable HTTP twin of each job's logic for `dev`/preview testing.
**Addresses:** Stale-enquiry reminder email, overdue-invoice reminder email, recurring invoice auto-generation (PROJECT.md Active)
**Avoids:** Pitfall 6 (double-firing/non-firing scheduled functions corrupting billing state) — the idempotency pattern must be designed into the invoicing schema in Phase 4, not bolted on here.

### Phase Ordering Rationale

- Strict dependency chain: nothing in Phases 2-5 can be built before auth+schema exist (Phase 1); invoicing line items benefit from live pricing existing (Phase 3 before 4); automation needs both CRM and invoicing data models finalized (Phase 5 last).
- CRM (Phase 2) is deliberately sequenced before pricing migration (Phase 3) despite pricing being the "headline" feature, because capturing leads is lower-risk (additive) than the pricing cutover (replaces what's live in production) and exercises the new auth/DB foundation under real write load first.
- Recurring invoice automation is deliberately the very last piece built, even though it's the single highest-leverage automation feature, because it's the one component that can silently create client-facing billing errors (duplicate invoices) if shipped before its idempotency pattern is proven.
- A fresh security review (already promised per PROJECT.md constraints) should be scheduled once Phase 1-2 are live — auth exists and first real data writes are happening — not deferred to the end, so RLS/auth issues are caught before invoicing/automation depend on that foundation being sound.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Auth + DB Foundation):** Needs a resolved decision between Netlify Database/Neon+custom-JWT (STACK.md) vs Supabase+RLS (ARCHITECTURE.md) before schema/auth code starts — these two research files reached different provider recommendations and this is the single most consequential unresolved choice in the research. Also needs explicit validation of the POPIA data-region question (no confirmed South African region for either candidate provider).
- **Phase 5 (Scheduled Automation):** Idempotency pattern design and Netlify Scheduled Functions' documented at-least-once/no-payload/production-only-execution behavior are well-researched at a conceptual level, but the specific implementation (period-keyed uniqueness queries, manual-trigger HTTP twin for dev testing) should be validated against real Netlify Scheduled Functions behavior early in this phase, not assumed from docs alone.

Phases with standard patterns (skip research-phase):
- **Phase 2 (CRM Capture + Viewing):** Standard CRUD + search/filter pattern, low ambiguity, existing API routes provide a clear integration point (`// TODO: Persist to DB` comment already present).
- **Phase 3 (Live Pricing Migration):** Pattern (cached DB read replacing static arrays, `revalidateTag` on edit) is well-documented in ARCHITECTURE.md with working code examples; main risk is process discipline (migrate both consumers together), not technical uncertainty.
- **Phase 4 (Invoicing):** SARS invoice field/numbering requirements and PDF generation approach (`@react-pdf/renderer`) are both well-sourced; standard CRUD + PDF-render pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Netlify-native pieces (Scheduled Functions, Netlify Database GA status) verified against official docs; library choices (Drizzle, `@react-pdf/renderer`, `exceljs`) cross-verified across multiple 2026 sources but no Context7 MCP available this session, so WebSearch-verified rather than Context7-verified |
| Features | MEDIUM-HIGH | Table stakes and anti-features verified against multiple lightweight CRM/invoicing products (Wave, Invoice Ninja) and official SARS guidance; automation cadence specifics (e.g. exact reminder-day thresholds) are best-practice ranges, not hard standards, and should be confirmed with the owner |
| Architecture | HIGH for Netlify/Next.js platform facts (official docs/blog); MEDIUM for the Supabase-specific recommendation (verified for region/auth pattern in isolation, not benchmarked against the Netlify Database alternative STACK.md recommends) |
| Pitfalls | HIGH for Netlify platform behavior (official docs, even a forum-sourced double-invocation report is directly on-topic); MEDIUM for POPIA legal interpretation (directionally consistent across multiple industry sources, explicitly not a substitute for legal counsel) |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Database/auth provider conflict (STACK.md vs ARCHITECTURE.md):** STACK.md recommends Netlify Database (Neon) + custom JWT; ARCHITECTURE.md was researched and documented against Supabase (Postgres + Auth + RLS). Both are sound, serverless-compatible choices and most architectural patterns (cached pricing, `requireAdmin()`, idempotent jobs) transfer regardless of which is chosen — but this needs an explicit Key Decision in PROJECT.md before Phase 1 schema/auth code is written. Recommend defaulting to **Netlify Database (Neon)** given its platform-native fit (zero new vendor relationship, matches this project's existing "extend the Netlify stack" constraint) unless Supabase's built-in Auth+RLS tooling is judged worth the extra vendor dependency — flag for owner/team decision during roadmap creation, not silently resolved by this synthesis.
- **POPIA data-region requirement:** Neither STACK.md nor ARCHITECTURE.md could confirm a South African or explicitly-POPIA-tailored region option for the serverless-friendly database candidates researched (Netlify Database/Neon region options weren't fully surfaced; Supabase confirmed no South African region, EU as the nearest equivalent-protection option). Treat as resolved-by-EU-region-default per PITFALLS.md's POPIA guidance (cross-border transfer is permitted with equivalent safeguards), but flag for explicit documentation in the project's compliance notes once the Phase 1 provider decision is made.
- **Multi-stage reminder/dunning cadence specifics:** FEATURES.md notes industry cadence ranges (24hrs–90 days) are wide and recommends confirming actual thresholds (e.g. "3-7 days no contact," "due date + N days overdue") with the owner rather than assuming — should be settled during Phase 5 planning, not guessed at implementation time.
- **Netlify's `proxy.ts`/`middleware.ts` rename interaction with `@netlify/plugin-nextjs`:** ARCHITECTURE.md flags that Netlify's own docs still reference `middleware.ts` by name as of this research, even though Next.js 16 renamed it to `proxy.ts` — should carry over automatically since it's a Next.js-level rename, but explicitly listed as "verify during Phase 1 build" rather than assumed.

## Sources

### Primary (HIGH confidence)
- [Netlify Database docs](https://docs.netlify.com/build/data-and-storage/netlify-database/) and [GA changelog](https://www.netlify.com/changelog/2026-04-28-netlify-database/)
- [Netlify Scheduled Functions docs](https://docs.netlify.com/build/functions/scheduled-functions/) — cron syntax, 30s execution limit, production-only execution, no payload support
- [Drizzle ORM: Neon connection guide](https://orm.drizzle.team/docs/connect-neon), [Neon docs: connect from Drizzle](https://neon.com/docs/guides/drizzle)
- [Next.js 16 official blog](https://nextjs.org/blog/next-16) — `proxy.ts` replacing `middleware.ts`, Node.js runtime change, `revalidateTag()` signature change
- [Supabase: Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs), [Available regions](https://supabase.com/docs/guides/platform/regions)
- [Netlify environment variables overview](https://docs.netlify.com/build/environment-variables/overview/) and [Secrets Controller](https://docs.netlify.com/build/environment-variables/secrets-controller/)
- [SARS Tax Invoice Checklist (official PDF)](https://www.sars.gov.za/wp-content/uploads/Docs/Government/Tax-Invoice-Checklist-Version-2-29032016.pdf)
- Existing codebase inspection: `src/app/api/register/route.ts` (existing `// TODO: Persist to DB (Supabase)` comment), `src/lib/rate-limiter.ts`, `src/lib/registration-types.ts`, `SECURITY-AUDIT.md`, `CLAUDE.md` (`NEXT_PUBLIC_BASE_URL` incident, branch-deploy strategy)

### Secondary (MEDIUM confidence)
- [Netlify: New Background and Scheduled API Routes for Next.js (blog)](https://www.netlify.com/blog/new-background-scheduled-api-routes-nextjs/)
- [Double invocation of Scheduled function — Netlify Support Forums](https://answers.netlify.com/t/double-invocation-of-scheduled-function/104647)
- [Netlify Identity is staying (Feb 2026 reversal) — Netlify Support Forums](https://answers.netlify.com/t/netlify-identity-is-staying-feb-2026-reversal-what-changed-whos-affected-and-how-to-proceed/162733)
- South Africa VAT/invoice requirement sources: [invoicedataextraction.com SARS guide](https://invoicedataextraction.com/blog/south-africa-vat-invoice-requirements), [Rebill: Invoice Numbering in South Africa](https://rebill.co.za/blog/invoice-numbering-south-africa/)
- PDF/export library comparisons: [PDF Generation: Puppeteer vs @react-pdf/renderer](https://dev.to/iurii_rogulia/pdf-generation-on-the-server-puppeteer-vs-react-pdfrenderer-a-production-comparison-44cg)
- POPIA-adjacent sources: [InCountry — SA data sovereignty](https://incountry.com/blog/south-africas-data-sovereignty-laws-and-regulations/), [QualySec POPIA Compliance Guide 2026](https://qualysec.com/popia-compliance/)

### Tertiary (LOW confidence)
- [Data residency and sovereignty: ITWeb](https://www.itweb.co.za/article/data-residency-and-sovereignty-what-african-and-eu-firms-must-know/lLn147mQeBD7J6Aa) — single industry-press source on POPIA cross-border stance, directionally consistent but not a legal opinion
- General WebSearch cross-referencing (multiple queries, 3+ sources each) on Better Auth vs NextAuth, bcrypt vs bcryptjs, ExcelJS vs SheetJS — no Context7 MCP available this research session

---
*Research completed: 2026-06-30*
*Ready for roadmap: yes — with one flagged decision (database/auth provider: Netlify Database/Neon vs Supabase) to resolve before Phase 1 begins*
