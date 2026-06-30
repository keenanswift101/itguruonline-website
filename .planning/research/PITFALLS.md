# Pitfalls Research

**Domain:** Adding admin auth + database + CRM + invoicing + scheduled automation to an existing live Netlify/Next.js marketing site with real customer PII already flowing through it
**Researched:** 2026-06-30
**Confidence:** HIGH (Netlify platform behavior, official docs) / MEDIUM (POPIA legal interpretation — not a law firm opinion, treat as directional)

## Critical Pitfalls

### Pitfall 1: Treating the in-memory rate limiter / serverless cold-start model as "solved" when auth comes online

**What goes wrong:**
The existing `src/lib/rate-limiter.ts` is explicitly process-local (its own comment says so) and already accepted as a known gap for the public contact/register forms. Once an admin login endpoint exists, the same in-memory approach gives **zero real protection against credential brute-forcing** — Netlify Functions are stateless and ephemeral; every cold start (or concurrent invocation on a different instance) resets/bypasses the counter. A login route is a much higher-value target than a contact form, so the risk profile changes even though the code pattern looks identical.

**Why it happens:**
The existing accepted-risk note in `SECURITY-AUDIT.md` ("revisit if contact/register form spam becomes a real problem") gets copy-pasted as precedent for the login route without re-evaluating that login endpoints are a fundamentally different threat class (account takeover, not spam).

**How to avoid:**
Once a database exists for the portal anyway, back login-attempt throttling with a DB-backed counter (table keyed by IP + username with attempt count/window, or a managed rate-limit service) rather than reusing the in-memory limiter. At minimum, add account lockout/backoff after N failed attempts persisted in the same database used for CRM data — it's already paid for and provisioned.

**Warning signs:**
Login route only protected by the existing `checkRateLimit()` from `rate-limiter.ts`; no failed-login audit trail in the database; load-testing the login endpoint from multiple concurrent requests succeeds in bypassing the limit.

**Phase to address:**
Auth/DB foundation phase — must be designed alongside the login route itself, not bolted on after.

---

### Pitfall 2: Choosing an auth approach that doesn't fit Netlify's serverless function model, then discovering it mid-build

**What goes wrong:**
Two failure modes are common here: (a) reaching for **Netlify Identity** out of platform-affinity, not realizing it was nearly deprecated in 2025 and only reinstated as supported in Feb 2026 after backlash — it's a legacy product Netlify itself tried to sunset once, a risky foundation for a new 2026 build; or (b) using a session library (e.g. NextAuth/Auth.js) with a database adapter that assumes a persistent connection pool, which doesn't exist in Netlify's per-invocation function model, causing intermittent "connection refused" or slow cold-start logins in production that don't reproduce locally with `next dev`.

**Why it happens:**
Auth tutorials and most NextAuth examples target Vercel or long-running Node servers, where a non-serverless Postgres driver and connection pooling are taken for granted. Netlify's documentation steers toward Netlify Identity by default visibility even though it's not the modern recommended path for a single-admin custom portal.

**How to avoid:**
For a single-admin portal (per PROJECT.md's "single-admin auth for v2.0" decision), prefer a stateless **JWT-based session** (signed httpOnly cookie, no server-side session store needed) over database-session strategies — this sidesteps the connection-pooling problem entirely for auth, independent of whatever DB choice is made for CRM data. If using NextAuth/Auth.js, explicitly select the JWT strategy and split Edge-safe config from full config per Auth.js's own serverless guidance. Do not adopt Netlify Identity for a fresh 2026 build given its rocky deprecation history — even though it's "free and built in," it has already once been on a sunset trajectory and offers no upgrade path that fits a custom CRM data model.

**Warning signs:**
Login works fine on `npm run dev` but times out or 500s only on deployed Netlify Functions; auth library docs assume `pg` Pool or similar long-lived connection; "works in preview, fails in production" reports after first deploy.

**Phase to address:**
Auth/DB foundation phase — the auth strategy decision must be made before any CRM/invoicing code is written against it, since session-shape decisions (JWT claims, role field even if single-admin today) ripple into every subsequent phase.

---

### Pitfall 3: Database choice that requires a persistent TCP connection pool, causing connection storms

**What goes wrong:**
Standard Postgres/MySQL clients (e.g. plain `pg`) open a new TCP connection per serverless function invocation. Netlify Functions spin up fresh, isolated instances per request — under any concurrent load (e.g. the existing register/contact forms PLUS new admin dashboard polling PLUS scheduled functions all hitting the DB around the same time) this creates a "connection storm" that can exhaust a database's max-connections limit (often ~100 on entry-tier managed Postgres), causing intermittent `too many connections` errors that are hard to reproduce locally.

**Why it happens:**
This is invisible during development (one connection, no concurrency) and during early production use (low traffic), then appears suddenly once the portal, the scheduled reminder/billing functions, and public-form traffic overlap — exactly when it's hardest to diagnose under a live business deadline.

**How to avoid:**
Pick a database with an HTTP-based or explicitly serverless-aware driver from day one — e.g. Neon's serverless driver (`@neondatabase/serverless`, used over HTTP/WebSocket, not raw TCP) or an equivalent (Turso/libSQL, PlanetScale's HTTP driver). If using standard Postgres, use the provider's pooled connection string (PgBouncer-fronted) for all Function code paths, never the direct connection string. Confirm this in the foundation phase, not after the connection-storm incident.

**Warning signs:**
Database provider's dashboard shows connection count spiking and dropping in sawtooth pattern correlated with traffic; intermittent (not constant) 500s under load; local dev never reproduces the issue.

**Phase to address:**
Auth/DB foundation phase — the database driver/connection-string choice is foundational and expensive to change once dozens of API routes depend on a particular client.

---

### Pitfall 4: Migrating pricing from two hard-coded files to a live database and breaking the public Services page or registration wizard mid-cutover

**What goes wrong:**
`HOSTING_PACKAGES` in `src/lib/registration-types.ts` and the `packages` array in `src/app/services/page.tsx` are both **typed, statically imported, compile-time data** today — `HostingPackage` is a literal union type (`"startup" | "basic" | ... | ""`) used for validation (`validateStepC` whitelists against these 6 ids per `SECURITY-AUDIT.md`). The registration wizard's Step C validation, the email summary template, and the public pricing cards all read from these files directly. If pricing moves to a database without care, the most common breakages are: (a) the wizard's package whitelist becomes stale or has to do a runtime DB call inside form validation, slowing down submission; (b) a half-migrated state where the services page reads from the DB but the wizard still reads the old hard-coded file (or vice versa), so a price edited in the admin portal doesn't match what the registration form charges/displays — the exact kind of pricing inconsistency this milestone is supposed to fix; (c) deleting a package via the admin UI orphans existing registration/invoice records that reference that package id by string, with no foreign-key or soft-delete safety net.

**Why it happens:**
The two-file sync problem being replaced is itself evidence this project has a history of these two surfaces drifting apart by hand. A naive migration ports one file to the DB and forgets the other, recreating the exact bug being fixed — just moved into a new system instead of eliminated.

**How to avoid:**
Migrate both consumption points in the **same** change, behind a single data-access function (e.g. `getHostingPackages()`) that both the wizard and the services page call — never let one stay on the static array while the other moves to the DB, even temporarily. Keep package `id` as a stable string key with **soft delete** (an `active`/`archived` flag) rather than hard delete, so historical registrations/invoices referencing an old package id still resolve to readable data. Validate `hostingPackage` server-side against the live DB list (cached/revalidated, not a query-per-keystroke) rather than the old hard-coded whitelist — but keep the **shape** of validation (reject unknown ids, cap string lengths) exactly as already hardened in `registration-validators.ts`. Use Next.js's caching/revalidation (e.g. `revalidateTag` on admin price edits) so a price change shows live on `/services` without a full redeploy, matching the "no developer needed to change a price" goal — but be deliberate about cache invalidation so a stale cached price isn't served for minutes after an edit.

**Warning signs:**
Two different prices shown for the same package on `/services` vs. inside the registration wizard at the same moment; registration succeeds with a `hostingPackage` id that no longer exists in the admin-managed list; email confirmation shows a different price than what's now live on the site.

**Phase to address:**
Live price-control phase — but the **data model** for packages (stable id, soft delete, single shared accessor) must be designed in the auth/DB foundation phase since registration and invoicing both depend on it later.

---

### Pitfall 5: Treating "POPIA compliance" as a one-time checkbox instead of an operational practice across the new PII surface area

**What goes wrong:**
This milestone roughly multiplies the PII the system holds and exposes: previously, registration/contact data flowed through once (validated, emailed, discarded by the app — Resend/inbox is the only retained copy). Now it is **persisted indefinitely** in a queryable database, **searchable/exportable** by the admin (spreadsheet export requirement), and **enriched** with private notes and invoice/billing history. Common mistakes: no documented lawful basis/retention policy for *why* data is kept and for how long; the spreadsheet export feature becoming an ungoverned copy of PII that leaves the controlled system (downloaded to a laptop, emailed, no encryption) with no audit trail of who exported what, when; no mechanism for a data subject access/deletion request (POPIA gives individuals rights to request their data or its deletion) since the original system had no concept of "a client's full record" to delete; choosing a database provider/region without checking where it actually stores data (many serverless DB providers default to US-east regions).

**Why it happens:**
POPIA's text is permissive about cross-border transfer (data doesn't strictly have to stay in South Africa if the recipient jurisdiction has equivalent protection or there's a contractual safeguard) — so it's easy to read "no hosting region requirement" as "no compliance work needed," when in practice the operational obligations (retention limits, access control, deletion capability, breach notification readiness, processor agreements) are the real compliance surface, not the database's data-center location.

**How to avoid:**
Treat these as concrete build requirements, not legal afterthought: (1) pick a database/auth provider with an EU or explicit data-protection-equivalent region option even if not strictly mandated, since it's the cheap, defensible choice and POPIA explicitly accepts "equivalent protection" jurisdictions; (2) design the schema from day one with a "delete this client and all associated records" capability (cascading delete across enquiries/notes/invoices) even though it's not in the v2.0 feature list — POPIA's deletion-on-request right doesn't disappear because it wasn't in the proposal; (3) log exports (who exported, when, what filter) even at a basic level — a row in an audit table is cheap insurance; (4) write down a retention policy (e.g. "enquiry records older than X years with no active client relationship are purged") even if enforcement is manual at first; (5) since the original proposal already commits to "a fresh security review... once the portal's login system ships" (per PROJECT.md constraints), make sure that review explicitly scopes POPIA-relevant checks (access control to PII, transport encryption, who can export) and not just OWASP Top 10 web vulnerabilities, which is a different lens.

**Warning signs:**
No documented answer to "how would we delete everything about one specific client if asked tomorrow"; the export feature has no logging; database provider's region setting was left on a default during signup and nobody checked it; admin password/session has no expiry or lockout (this is also a POPIA "appropriate security safeguards" obligation, not just good practice).

**Phase to address:**
Auth/DB foundation phase for schema/deletion-capability and region selection; CRM dashboard phase for export audit logging; explicitly flag for the "fresh security review" already promised in PROJECT.md constraints once login ships.

---

### Pitfall 6: Scheduled functions silently double-firing or not firing, corrupting reminder/recurring-billing state

**What goes wrong:**
Netlify Scheduled Functions are documented to occasionally double-invoke (a known, reported behavior on Netlify's own support forum, not just theoretical) and have a hard **30-second execution limit** with **no payload/POST body support**. For "send reminder emails for stale enquiries" this is merely annoying (a client gets two identical reminder emails). For **"automatically generate recurring invoices for active hosting clients,"** a double-invocation without idempotency protection means a client could be issued **two invoices for the same billing period** — a direct, client-visible billing error, exactly the kind of bug that damages trust in the system precisely because it concerns money. Additionally, scheduled functions only run for **published production deploys** — they silently do not fire on branch deploys or deploy previews, so testing on `dev` (per this project's branch strategy where only `main` auto-deploys) gives false confidence that the schedule is wired correctly, since it can't actually be observed firing on a preview/dev context at all.

**Why it happens:**
Scheduled/cron-style functions are conceptually treated like a traditional cron daemon (run exactly once, in-process state available) when the actual execution model is "stateless function invoked by an external trigger that has documented at-least-once, not exactly-once, semantics."

**How to avoid:**
Design every scheduled job to be **idempotent by construction**, not by hoping the trigger fires once: for recurring billing, the job should compute "which clients are due for an invoice in this billing-period window" by querying the database for clients **without** an existing invoice record for that period (e.g. `WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE client_id = ? AND billing_period = ?)`), so a duplicate invocation finds zero remaining work and is a no-op, rather than relying on the function to "only run once." Same pattern for reminder emails: a `last_reminder_sent_at` or `reminder_log` table checked before sending, not a trusted single firing. Because production scheduled functions can't be exercised on `dev`/preview deploys (per this project's existing main-only deploy strategy), build a manually-triggerable HTTP-callable version of the same idempotent logic for testing in dev/preview, sharing the core function so the scheduled trigger is just a thin wrapper around logic that's independently testable.
**Phase to address:**
Automation phase (reminders + recurring billing) — but the **idempotency pattern** (period-keyed uniqueness check before creating an invoice/sending a reminder) must be part of the invoicing data model designed in the foundation/invoicing phase, since retrofitting a uniqueness constraint after duplicate invoices already exist in production is much more painful than designing it in from the start.

---

### Pitfall 7: Secrets/credentials sprawl across a system that now has far more "moving parts" needing keys

**What goes wrong:**
The current app has one secret category (Resend API key) and the `NEXT_PUBLIC_BASE_URL` lesson already learned the hard way (per `CLAUDE.md`: it was unset, silently fell back to a dead domain, broke OG images/email logos for a while, and env var changes only apply to the *next* build). The admin portal multiplies this: database connection string, auth signing secret (JWT/session secret), possibly a separate admin password hash seed, and potentially new third-party keys for PDF generation or export. Common mistakes: accidentally prefixing a server-only secret with `NEXT_PUBLIC_` (Netlify's own docs flag this as the most damaging available mistake — anything with that prefix ships into the client JS bundle, visible in browser devtools to any site visitor, not just the admin); setting a new secret only in one deploy context (e.g. only "production" but not also needed contexts) and not realizing — exactly like the `NEXT_PUBLIC_BASE_URL` incident — that changes don't take effect until the next build; reusing the exact same secret value across local `.env`, the `dev` testing context, and `main` production (so a leaked local `.env` compromises production).

**Why it happens:**
This project has already demonstrated the specific failure mode once (the base-URL incident is documented in this repo's own `CLAUDE.md`) — the risk is repeating the same class of mistake with higher-stakes secrets (DB credentials, auth signing keys) instead of the lower-stakes one (a public base URL).

**How to avoid:**
Audit every new secret's Netlify scope explicitly (Functions scope, not Post-processing, never the `NEXT_PUBLIC_` prefix unless it is genuinely meant to be public) before first use. Use distinct secret values per deploy context (separate dev/staging DB credentials from production DB credentials) so a `dev`-branch leak can't touch production data — practical given this project already maintains a `dev`/`main` split. After setting any new secret, explicitly trigger and verify a fresh build picked it up (same lesson as the base-URL fix) rather than assuming the dashboard save is sufficient. Document every secret's purpose and scope in the same place `CLAUDE.md` already documents `NEXT_PUBLIC_BASE_URL`, so future-Claude/future-dev sessions don't have to rediscover this by breakage.

**Warning signs:**
A secret name starting with `NEXT_PUBLIC_` that holds anything sensitive; database/auth behavior differs between `dev` deploy and `main` deploy after a credential rotation; `netlify env:list` shows a secret scoped only to one context when it's needed in another.

**Phase to address:**
Auth/DB foundation phase — establish the secrets-management convention before the second and third secrets get added by habit/copy-paste.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reusing the existing in-memory rate limiter for the admin login route | Zero new code, ships faster | No real brute-force protection on the single most sensitive endpoint in the system | Never — login needs DB-backed throttling once a DB exists anyway |
| Hard-deleting a hosting package row when "removing" it from the admin UI | Simpler CRUD, no extra flag | Orphans historical registrations/invoices that reference the deleted package id; breaks "view past invoice" pages | Never for packages once any invoice/registration may reference them — use soft delete/archive from day one |
| Skipping idempotency checks on the recurring-billing job ("Netlify probably won't double-fire") | Faster to ship automation phase | Real risk of duplicate invoices sent to real clients, a trust-damaging billing bug | Never — this is cheap to build in correctly and expensive to fix after the fact |
| Storing the admin session as a long-lived JWT with no expiry/refresh | Simpler login flow, no refresh logic | A stolen/leaked token (e.g. from a compromised laptop) grants indefinite access to all client PII | Acceptable only with a short expiry (hours, not weeks) plus re-login; never "forever" tokens for an admin holding PII |
| Exporting CRM/invoice data to spreadsheet with no logging of who/when | Faster to ship the export feature | No audit trail for a POPIA access request or breach investigation ("who downloaded what") | Acceptable for an internal MVP only if a logging pass is explicitly planned before real client data accumulates — don't let it become permanent |
| Keeping pricing in only one of the two consumption points during migration ("ship the admin UI first, wire up services page later") | Faster visible admin-portal progress | Recreates the exact two-source-of-truth bug this milestone exists to fix, now with a DB in the mix too | Never — migrate both read paths in the same change |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Netlify Scheduled Functions | Assuming exactly-once execution and building reminder/billing logic that isn't idempotent | Query-driven "what's still due" logic (DB state, not function invocation count) so duplicate firings are no-ops |
| Netlify Scheduled Functions | Testing only on `dev`/preview deploys and assuming the schedule works because the code "looks right" | Scheduled functions only run on published `main` production deploys per this project's branch strategy — build a manually-callable HTTP twin of the same logic for dev/preview testing |
| Database driver (Postgres/MySQL) | Using a standard TCP client (`pg`, `mysql2`) directly in Netlify Functions | Use a serverless-native/HTTP driver (e.g. Neon's `@neondatabase/serverless`) or the provider's pooled connection string, never the direct one |
| Auth/session library | Using a database-session adapter that assumes persistent connections, or defaulting to Netlify Identity out of platform-affinity | Use stateless JWT sessions in httpOnly cookies; avoid Netlify Identity given its 2025 near-deprecation history |
| Resend (existing) | Assuming the existing transactional-email setup can also generate/attach PDF invoices without extra infrastructure | PDF generation via Puppeteer needs a Chromium binary too large for standard serverless bundles — use a lightweight renderer (e.g. `@react-pdf/renderer`, no headless browser) rather than Puppeteer/`@sparticuz/chromium` unless layout complexity truly requires it |
| Two-location pricing (existing pattern) | Migrating only `HOSTING_PACKAGES` or only the services-page array to the DB, leaving the other hard-coded | Both consumers (wizard validation + services page) must read from a single shared data-access function from the same commit |
| `NEXT_PUBLIC_BASE_URL` (existing, already burned once) | New secrets copy the existing env var pattern without checking scope/prefix | Treat every new portal secret (DB URL, auth secret) as its own explicit scoping decision; never assume "it'll just work like the last env var did" |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-request DB connection without pooling | Intermittent `too many connections` errors that don't reproduce locally | Serverless-native driver or pooled connection string from day one | As soon as admin dashboard + scheduled functions + public forms overlap in traffic — can happen even at low absolute volume since each is a separate connection burst |
| Querying live pricing on every keystroke/validation in the registration wizard | Slower form submission, unnecessary DB load on a public-facing form | Cache the package list (revalidated on admin price edit via `revalidateTag`/short TTL), don't query per validation call | Noticeable once the wizard is used concurrently by even a handful of visitors |
| Unbounded CRM export query (no pagination/row cap) | Export endpoint times out or memory-spikes as client/enquiry count grows | Stream or paginate exports; set a sane row cap with a "contact us for full export" fallback | Becomes a problem once enquiry/client count reaches the high hundreds to low thousands — plan for it now since it's cheap, not urgent at current scale |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No lockout/throttling on admin login (see Pitfall 1) | Credential brute-forcing against the single highest-value endpoint in the system | DB-backed attempt counter + lockout/backoff, audit log of failed logins |
| `NEXT_PUBLIC_`-prefixed secret (DB URL, auth secret) | Secret visible to any site visitor via browser devtools / JS bundle | Never prefix server-only secrets with `NEXT_PUBLIC_`; rely on Netlify's Secrets Controller build-time scanning as a backstop, not the primary control |
| Spreadsheet export with no access logging | No audit trail for POPIA access/breach investigations; PII leaves the controlled system ungoverned | Log exporter identity + timestamp + filter criteria; consider watermarking or at minimum recording export events in the DB |
| No documented data-deletion path for a client record | Can't honor a POPIA deletion request without ad hoc, error-prone manual DB surgery | Build cascading delete (client → enquiries → notes → invoices, or anonymize-in-place if invoice history must be retained for accounting) into the schema design from the start |
| Reusing the same secrets across `dev` and `main` deploy contexts | A `dev`-branch leak (less scrutinized, more experimental) compromises production data | Separate credentials per deploy context, especially DB connection strings |
| Treating the existing CSP/CSRF/rate-limit hardening from `SECURITY-AUDIT.md` as "already covering the portal" | The audit predates auth/sessions entirely — its own accepted-risk notes (no CSRF token, in-memory rate limiter) were explicitly justified by "no session/cookie-based auth exists... revisit if auth is ever added" | Re-run a scoped review of CSRF (now relevant, since cookies/sessions will exist), rate limiting, and CSP once login ships — already promised in PROJECT.md constraints, make sure it actually happens |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Admin session expires silently mid-task (e.g. while drafting an invoice) | Lost work, frustration, owner stops trusting the portal | Warn before expiry or auto-save drafts; redirect to login with a "your session expired" message that preserves intent where feasible |
| Price edited in admin portal doesn't reflect on `/services` for several minutes due to caching | Owner edits a price expecting it live "now" per the core value prop, then doubts whether it worked | Use `revalidateTag`/on-demand revalidation triggered by the save action itself, not a timed cache TTL, so edits feel instant |
| Recurring invoice silently fails to generate (e.g. DB hiccup during the scheduled run) with no visible signal to the owner | Owner doesn't notice a client wasn't billed until much later | Scheduled job should write a run-log/status row the admin dashboard can surface ("last billing run: succeeded/failed, N invoices created") rather than running invisibly |

## "Looks Done But Isn't" Checklist

- [ ] **Admin login:** Often missing real throttling/lockout — verify by attempting 20+ rapid failed logins and confirming the account/IP gets blocked, not just rate-limited in a way that resets on redeploy.
- [ ] **Live price editing:** Often missing the second consumption point — verify both `/services` AND the registration wizard's package picker show the exact same price within seconds of an admin edit, not just one of the two.
- [ ] **Recurring billing automation:** Often missing duplicate-prevention — verify by manually triggering the billing function twice in succession for the same period and confirming only one invoice is created, not two.
- [ ] **CRM/invoice export:** Often missing audit logging — verify there's a record of who exported what and when, not just that the CSV/XLSX downloads correctly.
- [ ] **Client/enquiry deletion:** Often entirely unbuilt — verify there is *some* path (even admin-only, even manual) to fully delete a client's data on request, since POPIA's deletion right doesn't wait for a future milestone.
- [ ] **Scheduled functions:** Often "working" only because it was never tested past the happy path — verify behavior when the function is invoked twice back-to-back and when it's invoked with stale/already-processed data.
- [ ] **Secrets scoping:** Often copy-pasted from the existing pattern without re-checking — verify no new secret is `NEXT_PUBLIC_`-prefixed and each is scoped to the correct deploy context(s).
- [ ] **Database connection handling:** Often fine in dev, broken under concurrent load — verify with a basic concurrent-request test (e.g. 20 simultaneous requests to an API route that queries the DB) before considering the foundation phase done.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|-----------------|
| Duplicate recurring invoices already sent to a client | MEDIUM | Void/cancel the duplicate in the invoice tracking system, notify the client proactively (better for trust than waiting for them to notice), retrofit the idempotency check before the next billing cycle |
| Pricing drifted between `/services` and the registration wizard post-migration | LOW | Both already read from the database in principle — fix is usually pointing both call sites at the same shared accessor function; audit for any remaining hard-coded references with a repo-wide search for the old array names |
| Connection-storm outage under load | MEDIUM | Switch the DB client to a pooled/serverless-native connection string (often a config change, not a schema change); add basic connection-count alerting with the DB provider going forward |
| Admin account compromised via brute force (no lockout in place) | HIGH | Rotate the auth signing secret immediately (invalidates all existing sessions), force password reset, review the DB for unauthorized data access/exports, then retrofit lockout before re-enabling login |
| Discovering no deletion path exists when a POPIA request arrives | MEDIUM | Manual DB-level deletion/anonymization as a one-off (with care for foreign-key integrity across enquiries/notes/invoices), then build the proper cascading-delete feature so the next request doesn't repeat the fire-drill |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|---------------|
| In-memory rate limiter reused for admin login | Auth/DB foundation | Brute-force test against deployed login route; confirm lockout persists across cold starts |
| Auth strategy incompatible with serverless function model | Auth/DB foundation | Deploy to a real Netlify preview/production build (not just `next dev`) and confirm login works under cold start |
| DB connection storm under concurrent load | Auth/DB foundation | Concurrent-request load test against any DB-backed API route before declaring foundation phase complete |
| Pricing migration breaks one of two consumption points | Live price-control phase (data model decided in foundation phase) | Manual check: edit a price in admin, confirm identical value on `/services` and inside the registration wizard within seconds |
| POPIA operational gaps (deletion, export logging, retention) | Auth/DB foundation (schema/deletion capability, region) + CRM dashboard phase (export logging) | Documented answer to "delete one client's full record" exists and is tested; export action produces an audit row |
| Scheduled function double-firing / preview-deploy blind spot | Automation phase (reminders + recurring billing); idempotency pattern designed in invoicing data model during foundation/invoicing phase | Manually invoke the scheduled function's underlying logic twice in a row; confirm zero duplicate invoices/reminders |
| Secrets sprawl / `NEXT_PUBLIC_` mistake | Auth/DB foundation | Review `netlify env:list` output for every new secret's scope and prefix before first production deploy of the portal |

## Sources

- [Netlify Scheduled Functions docs](https://docs.netlify.com/build/functions/scheduled-functions/) — 30s execution limit, no payload support, UTC cron — HIGH confidence
- [Double invocation of Scheduled function? — Netlify Support Forums](https://answers.netlify.com/t/double-invocation-of-scheduled-function/104647) — documented duplicate-firing reports — MEDIUM confidence (forum report, not official guarantee either way, which is itself the point — no exactly-once guarantee exists)
- [Netlify environment variables overview](https://docs.netlify.com/build/environment-variables/overview/) and [Secrets Controller](https://docs.netlify.com/build/environment-variables/secrets-controller/) — scope/`NEXT_PUBLIC_` exposure behavior — HIGH confidence
- [Netlify Identity is staying (Feb 2026 reversal) — Netlify Support Forums](https://answers.netlify.com/t/netlify-identity-is-staying-feb-2026-reversal-what-changed-whos-affected-and-how-to-proceed/162733) — HIGH confidence (recent, directly on-topic)
- [Building authentication in Next.js App Router: 2026 guide — WorkOS](https://workos.com/blog/nextjs-app-router-authentication-guide-2026) — JWT vs database session tradeoffs for serverless/Edge — MEDIUM confidence
- [Use Neon with Netlify Functions — Neon Docs](https://neon.com/docs/guides/netlify-functions) — serverless driver rationale for Netlify's per-request isolated instances — HIGH confidence
- [Database Load Management: Connection Pooling in Serverless Next.js](https://dohost.us/index.php/2026/06/11/database-load-management-implementing-connection-pooling-in-serverless-next-js/) — connection storm mechanics — MEDIUM confidence
- POPIA general sources: [InCountry — South Africa data sovereignty](https://incountry.com/blog/south-africas-data-sovereignty-laws-and-regulations/), [QualySec — POPIA Compliance Guide 2026](https://qualysec.com/popia-compliance/), [VDT Attorneys — Cloud regulation and POPIA](https://vdt.co.za/data-protection/south-africa-cloud-regulation-and-popia-what-remote-computing-services-need-to-know/) — MEDIUM confidence (legal-adjacent summaries, not a substitute for legal counsel; directionally consistent across multiple sources on cross-border transfer permissiveness and penalty structure)
- PDF generation pitfalls: [Generate HTML as PDF using Next.js & Puppeteer on Serverless](https://dev.to/martindanielson/generate-html-as-pdf-using-nextjs-puppeteer-running-on-serverless-vercelaws-lambda-martin-4jkp), [PDF Generation on the Server: Puppeteer vs @react-pdf/renderer](https://dev.to/iurii_rogulia/pdf-generation-on-the-server-puppeteer-vs-react-pdfrenderer-a-production-comparison-44cg) — MEDIUM confidence
- Idempotency patterns: [Idempotency Patterns Serverless Applications](https://blog.thecloudengineers.com/p/idempotency-patterns-serverless-applications), [Why Is My Job Running Twice? — Medium](https://medium.com/@surajs78/why-is-my-job-running-twice-understanding-idempotency-and-deduplication-in-distributed-systems-d56edbcad051) — MEDIUM confidence, general distributed-systems pattern applied to this project's specific billing use case
- This repository's own existing documentation, treated as primary source for project-specific patterns: `C:\Users\keena\Projects\it-guru-website\SECURITY-AUDIT.md`, `C:\Users\keena\Projects\it-guru-website\src\lib\rate-limiter.ts`, `C:\Users\keena\Projects\it-guru-website\src\lib\registration-types.ts`, `C:\Users\keena\Projects\it-guru-website\netlify.toml`, `C:\Users\keena\Projects\it-guru-website\CLAUDE.md` (NEXT_PUBLIC_BASE_URL incident, branch-deploy strategy) — HIGH confidence (verified by direct read)

---
*Pitfalls research for: Admin Portal milestone (auth, database, CRM, invoicing, automation) on existing live Netlify/Next.js site*
*Researched: 2026-06-30*
