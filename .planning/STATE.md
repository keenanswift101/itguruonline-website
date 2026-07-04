---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: verified
stopped_at: Phase 4 verified complete and LIVE IN PRODUCTION for the first time (all of Phases 1-4). Currently mid-way through an ad-hoc, out-of-roadmap task -- serving the admin portal at admin.it-guru.co.za. Edge function + domain alias deployed; waiting on user to add a CNAME DNS record in cPanel before it resolves. NEXT (after DNS verified) - plan/execute Phase 5, OR resume the admin-subdomain verification if picking this session back up first.
last_updated: "2026-07-04T04:31:05.000Z"
last_activity: 2026-07-04
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 22
  completed_plans: 16
  percent: 73
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-04)

**Core value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.
**Current focus:** Phase 05 — scheduled automation. Already fully planned (6 plans in `.planning/phases/05-scheduled-automation/`, plus CONTEXT/RESEARCH/VALIDATION docs) but not yet executed — ready to go straight to `/gsd:execute-phase 5`. Read "In-Progress Side Task" below first, though — there's unfinished ad-hoc work from the last session.

## Current Position

Phase: 05
Plan: Not started (already planned — 6 plans ready, see .planning/phases/05-scheduled-automation/)
Status: Phase 4 complete and verified (7/7 must-haves, VERIFICATION.md passed). Production deploy of Phases 1-4 succeeded after a same-day incident (see Blockers/Concerns) -- the whole admin portal is genuinely live at https://it-guru.co.za for the first time.
Last activity: 2026-07-04

Progress: [███████░░░] 73% (of plans; phases 1-4 of 5 complete)

## Side Task: admin.it-guru.co.za subdomain — DONE (2026-07-04)

The user asked mid-session (outside the roadmap/phase structure) to serve the admin portal on its own subdomain instead of `/admin/*` on the main domain. **Fully complete and verified working end-to-end:**

- `admin.it-guru.co.za` added as a domain alias on the Netlify site.
- `netlify/edge-functions/admin-subdomain.ts` (Deno, not Next.js middleware — same reason `proxy.ts` was removed) rewrites bare paths on that hostname to `/admin/*` internally; strict no-op for every other hostname.
- Owner had initially created `admin.it-guru.co.za` via cPanel's **Subdomain** tool, which auto-generated A/AAAA records pointing at the cPanel server itself (wrong — that's for hosting content directly on cPanel, not proxying to Netlify). Owner removed that subdomain and added a plain CNAME (`admin` → `it-guru-online.netlify.app`) via Zone Editor instead — that's the correct mechanism when the actual app is hosted elsewhere.
- DNS propagated within minutes (confirmed via Google's `8.8.8.8` well before the owner's local/ISP resolver caught up — that's normal, differing resolvers update on their own schedules).
- Netlify auto-issued a new Let's Encrypt certificate covering the subdomain (confirmed via `netlify api showSiteTLSCertificate`) within about 40 minutes of DNS going live; a manual `provisionSiteTLSCertificate` trigger 422'd every time it was tried, so this just needs patience, not a workaround.
- Verified via `curl --resolve` (bypassing local DNS cache, which lagged behind Google's): unauthenticated `/` → rewrites to `/admin/dashboard` → 307s to `/admin/login` (correct); `/login` → 200; authenticated (real session cookie from a real login POST) `/` → 200 dashboard, `/invoices` → 200 with clean URL. Full lifecycle confirmed working.

No outstanding follow-up here. If a future session sees this section, the subdomain is live and working — no action needed unless something changes.

## Performance Metrics

**Velocity:**

- Total plans completed: 1
- Average duration: ~2h (Plan 01 had significant tooling friction — CLI upgrades, Turbopack discovery)
- Total execution time: ~2h

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 (in progress) | 1/4 | ~2h | ~2h |

**Recent Trend:**

- Last 5 plans: Plan 01 complete
- Trend: -

*Updated after each plan completion*
| Phase 02 P03 | 1014 | 3 tasks | 10 files |
| Phase 03 P02 | 35 | 3 tasks | 10 files |
| Phase 03 P03 | 578 | 3 tasks | 10 files |
| Phase 04-invoicing P02 | 9min | 2 tasks | 8 files |
| Phase 04-invoicing P03 | 8min | 3 tasks | 7 files |
| Phase 04-invoicing P04 | ~30min | 2 tasks | 8 files |
| Phase 04-invoicing P05 | 20min | 3 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Database/auth provider: **RESOLVED** — Netlify Database (Neon Postgres, built-in `@netlify/database`) + hand-rolled JWT/cookie auth. Provisioned 2026-06-30.
- Schema location: `db/schema.ts` and `db/index.ts` at repo root (Netlify CLI convention, not `src/lib/db/` as originally planned). Plan 02 executor must write to `db/`.
- Single-admin auth only for v2.0 — no multi-staff roles (deferred to v2+).
- Invoicing generates/tracks only, no payment gateway — clients keep paying via manual EFT.
- IT-Guru is not VAT-registered — invoices must use plain "Invoice" labeling, no VAT fields or "Tax Invoice" wording.
- POPIA data-region: no region prompt offered by Netlify — non-configurable, inherited from platform default. Documented in PROVISIONING-NOTES.md.
- **proxy.ts REMOVED** — Next.js 16 Turbopack emits chunks Netlify's edge bundler cannot resolve. `/admin/*` auth enforced exclusively via page-level `requireAdmin()` (layout + route handler calls). No proxy layer. See PROVISIONING-NOTES.md OQ1.
- [Phase 02]: parseCrmId used in both API routes and page to keep disambiguation logic in one place (crm-types.ts)
- [Phase 02]: Card.tsx upgraded to Tailwind v4 canonical syntax per CLAUDE.md enforcement
- [Phase 02]: Notes route strips HTML and javascript: URIs inline (append-only, stored XSS prevention)
- [Phase 03]: HostingPackageDTO excludes Date fields for safe server->client serialization; HostingPackage type widened to string (DB slug is authority); getDomainPriceMap uses ?? null to preserve 0-price semantics
- [Phase 03]: requireAdmin() called first in every pricing PATCH route — 401 returned before any JSON parse or DB access
- [Phase 03]: vi.mock(next/headers) required for vitest to test routes using cookies() — same pattern as Phase 2 CRM tests
- [Phase 04-invoicing]: neon-http db.transaction() throws in drizzle-orm 0.45.2 — all multi-statement atomic writes must use withTxDb() (src/lib/db/tx.ts, per-request WebSocket Pool)
- [Phase 04-invoicing]: PUT invoice 409 draft-lock re-checked inside the transaction UPDATE where-clause (EditLockError rollback) — race-proof beyond the pre-check
- [Phase 04-invoicing]: Status transitions enforced via server-side allowed-transition map; draft->sent assigns gapless number in single atomic UPDATE with correlated MAX+1 subquery on neon-http (no FOR UPDATE)
- [Phase 04-invoicing]: sent->draft clears fiscal_year/sequence_number — re-sending assigns a fresh invoice number (D-06 recommendation)
- [Phase 04-invoicing]: InvoiceDocument.tsx bank footer — ~~bracketed placeholders~~ RESOLVED 2026-07-04: real EFT details filled in (two options: Discovery Bank + First National Bank, both under A.P Isaacs), rendered side by side in the PDF footer.
- [Phase 04-invoicing]: AdminSidebar already exists on this branch and already lists an active Invoices link -- kept a simple back-link on invoice pages anyway for consistency with dashboard/CRM pattern
- [Phase 04-invoicing]: Invoice status badge colors: draft=gray glass, sent=cobalt #00aaff, paid=green, overdue=red -- overdue renders as a SECOND badge alongside the stored status badge, never replacing it
- [Phase 04-invoicing]: InvoiceForm 422 handling maps zod fieldErrors ({field: string[]}) onto the same FieldErrors state used for client-side validation, so server and client validation errors render identically
- [Phase 04-invoicing]: InvoiceStatusActions guards double-submit with a single pending flag; 409 surfaces as 'Invalid transition.' distinct from generic errors
- [Phase 04-invoicing]: Detail page renders read-only Sent/Paid view as a dedicated block (not a disabled InvoiceForm) for unambiguous edit-lock UX, defense-in-depth on top of server 409
- [Phase 04-invoicing]: InvoiceForm serves both create (POST) and edit (PUT) via optional initial/invoiceId props rather than a duplicate edit-form component
- **[2026-07-04, CRITICAL — read before touching src/lib/db/*]**: Netlify's current database provisioning injects the connection string as **`NETLIFY_DB_URL`** (with `NETLIFY_DB_DRIVER=serverless` for this project), NOT the legacy `NETLIFY_DATABASE_URL` that `@netlify/neon`'s bare `neon()` call falls back to. The legacy var is never set, in any context, and this was the root cause of a real production outage the first time Phases 1-4 were deployed (public pages doing DB reads 500'd). Fix: `src/lib/db/index.ts` and `src/lib/db/tx.ts` now explicitly pass `process.env.NETLIFY_DB_URL` to `neon()`/`Pool`. Do NOT "helpfully" revert this back to a bare `neon()` call or to reading `NETLIFY_DATABASE_URL` — it will silently break again in production (it can look fine locally/in draft deploys and still be broken for real users). Also: do NOT import the `@netlify/database` package (`getConnectionString()`/`getDatabase()`) as an alternative fix — it statically imports `pg` even on the serverless driver path, and Turbopack mangles that into an unresolvable external module name in the deployed Netlify function (same class of bug that already forced `proxy.ts` out of this project). Confirmed only via a real git-triggered production build + `netlify logs --source functions` — local dev, `netlify dev:exec`, and `netlify deploy` draft builds all gave misleading signals (see Blockers/Concerns).
- **[2026-07-04]**: `JWT_SECRET` and `ADMIN_SEED_PASSWORD` also had to be set as real Netlify site env vars for the `production` context — they were never configured either (this project's admin auth had literally never been exercised in production before this session). Both are now set as secrets on Netlify. The real admin login (`info@it-guru.co.za`) works end-to-end in production — password was shown once to the owner in-session; if it's lost, reset via a fresh temporary seed-style endpoint (see the pattern used in commit `8a77d2e`, since `netlify dev:exec` cannot reach the real production DB binding — only actual deployed functions can).
- **[2026-07-04]**: Admin portal now also servable at `admin.it-guru.co.za` via a Netlify Edge Function — **DONE and verified working end-to-end**, see "Side Task" section above. Owner's first attempt used cPanel's Subdomain tool (wrong — creates A/AAAA records pointing at cPanel itself); corrected to a plain CNAME via Zone Editor.

### Pending Todos

- Remove leftover `include:zoho.com` from the apex SPF TXT record (`it-guru.co.za`). Exact edit: change `v=spf1 ip4:102.216.79.206 +a +mx include:zoho.com include:it-guru.co.za ~all` to `v=spf1 ip4:102.216.79.206 +a +mx include:it-guru.co.za ~all`.
- Remove old `neon` Netlify extension from team dashboard (cosmetic — it logs a warning on every build but doesn't block it).
- Local dev now has no working local database story again: the `USE_LOCAL_PG` / Docker Postgres workaround built earlier this session was fully reverted (it was masking the real `NETLIFY_DB_URL` bug during testing — see the CRITICAL decision above). `npm run dev` / plain `next dev` currently cannot reach any database at all. Before next local DB-dependent work: either re-establish a local Postgres + explicit `NETLIFY_DB_URL` override in `.env.local` (works — same driver code path as production, since both read `NETLIFY_DB_URL`), or decide on a cleaner permanent local-dev story. Do NOT reintroduce the `USE_LOCAL_PG` branching — it's gone from the codebase now, and the confusion it caused during debugging is exactly why it was removed.

### Blockers/Concerns

- A fresh security review (OWASP-style, per existing `SECURITY-AUDIT.md` precedent) is owed now that the whole admin portal is genuinely live — don't defer to milestone end.
- Phase 5 (Scheduled Automation) needs reminder-cadence thresholds confirmed with owner during that phase's planning (already researched/planned — 6 plans exist — but confirm this was addressed before executing).
- ~~Pre-existing, project-wide vitest breakage~~ -- CORRECTED 2026-07-03: re-ran `npx vitest run` directly and got a clean pass (21/21 test files, 91 passed, 0 failed). Not reproducible; the 04-05 executor's git-stash isolation likely collided with a concurrently-running dev server / in-flight npm install. No action needed before Phase 5.
- **Testing methodology trap (learned the hard way, 2026-07-04):** `netlify deploy` (draft/CLI deploys) builds *locally* on the developer's machine and can leak local `.env.local` values into the deployed function's environment, producing false-positive test results. `netlify dev:exec` runs a bare script, not a real deployed function, and does NOT receive the same database/runtime bindings a real deployed function gets. The ONLY reliable way to test Netlify-Database-dependent behavior is a real git-triggered build (push to `main`) or an actual deployed function endpoint called over HTTPS. Budget for this — draft-deploy "verification" of DB-touching code is not trustworthy on this project.
- Netlify CLI (`gh`) on this machine has three logged-in GitHub accounts; pushes to this repo need the `keenanswift101` account active (`gh auth switch --user keenanswift101`) or `git push` 403s. This reset at least once mid-session — check `gh auth status` if a push unexpectedly fails with a permission error.

## Session Continuity

Last session: 2026-07-04T05:10:00.000Z
Stopped at: Phase 4 verified complete and deployed to production for real (after diagnosing and fixing a same-day production outage — see the CRITICAL NETLIFY_DB_URL decision above). admin.it-guru.co.za subdomain task fully complete and verified end-to-end. Owner then reported losing/being unable to find the production admin password (generated once and shown in-session, per usual practice for one-time secrets) -- if a future session sees this, check chat history isn't available, so the fix is a password reset, not a search: log into the Netlify dashboard, generate a new password, `netlify env:set ADMIN_SEED_PASSWORD <new> --context production --secret`, then either update the existing admin_users row directly (no reset-password flow may exist yet -- check src/app/admin/forgot-password first) or via a temporary one-time endpoint following the seedonce pattern from commit 8a77d2e. NEXT: resolve the password issue, then either continue any other ad-hoc requests or move to `/gsd:plan-phase 5` (note: Phase 5 is already fully planned/researched -- go straight to `/gsd:execute-phase 5` unless the plan needs revisiting first).
Resume file: None
