---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Clients, Tickets & Linked Invoicing
status: verifying
stopped_at: Completed 06-05-PLAN.md
last_updated: "2026-07-04T17:02:17.377Z"
last_activity: 2026-07-04
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-04)

**Core value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.
**Current focus:** Phase 06 — clients-entity-crm-integration

**v2.1 design decisions (locked with owner):** Clients = new first-class entity (add manual OR convert enquiry/registration); build lightweight in-portal ticketing (tickets linked to clients); invoice→client via optional `client_id` FK with auto-fill (free-text one-off invoices stay valid); dashboard reworked to show open tickets + new leads + unpaid/overdue invoices + revenue-this-month + recent activity. Research skipped (standard CRUD on the established v2.0 stack).

**v2.1 phase structure (dependency chain: clients → tickets → linked invoicing → dashboard):**

- Phase 6: Clients Entity + CRM Integration (foundation — clients table, manual create, convert from lead, list/edit/notes)
- Phase 7: Tickets (tickets table with client_id FK, CRUD, status, notes, list/detail)
- Phase 8: Linked Invoicing (invoices.client_id FK + searchable picker + auto-fill; free-text path stays valid; CLIENT-06 client-detail history view lands here since it needs both tickets and invoice links to exist)
- Phase 9: Dashboard Rework (tiles reading from tickets/clients/invoices/leads)

## Current Position

Phase: 06 (clients-entity-crm-integration) — COMPLETE (5/5 plans executed: 06-01, 06-02, 06-04, 06-03, 06-05 — 06-04 ran out of sequence since it only depended on 06-01)
Plan: 5 of 5 — all executed
Status: Phase complete — ready for verification
Last activity: 2026-07-04

Progress: v2.0 complete (22/22 plans, shipped, 5/5 phases). v2.1 roadmap defined (4 phases, 18 requirements, 0 plans yet).

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

- Total plans completed: 22 (all v2.0)
- v2.1: 0 plans completed yet (roadmap just created)

**By Phase (v2.0, historical):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Auth + DB Foundation | 4/4 | ~2h | ~2h (P01 had tooling friction) |
| 2. CRM Capture + Viewing | 4/4 | - | - |
| 3. Live Pricing Migration | 3/3 | - | - |
| 4. Invoicing | 5/5 | ~67min | ~13min |
| 5. Scheduled Automation | 6/6 | ~54min | ~9min |

*Updated after each plan completion*
| Phase 06 P01 | 12min | 3 tasks | 7 files |
| Phase 06 P02 | 16min | 3 tasks | 5 files |
| Phase 06 P04 | 15min | 2 tasks | 4 files |
| Phase 06 P04 | 15min | 2 tasks | 4 files |
| Phase 06 P03 | 13min | 2 tasks | 5 files |
| Phase 06 P05 | 14min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Database/auth provider: **RESOLVED** — Netlify Database (Neon Postgres, built-in `@netlify/database`) + hand-rolled JWT/cookie auth. Provisioned 2026-06-30.
- **CRITICAL, read before touching src/lib/db/***: connection string is `NETLIFY_DB_URL` (+ `NETLIFY_DB_DRIVER`), NOT the legacy `NETLIFY_DATABASE_URL`. Driver branches on `NETLIFY_DB_DRIVER`: `serverless` (prod, Neon HTTP) vs `server` (local `netlify dev`, node-postgres + `pg`). Never revert to a bare `neon()` call or import `@netlify/database` (breaks Turbopack packaging in deployed functions).
- Transactions: neon-http driver throws on `db.transaction()` — any multi-statement atomic write MUST use `withTxDb()` (`src/lib/db/tx.ts`).
- Migrations live in `netlify/database/migrations/`, auto-applied on deploy. Last applied: `0004` (automation). v2.1's new `clients`/`tickets` tables and `invoices.client_id` column will need `0005`+.
- Single-admin auth only — no multi-staff roles (deferred).
- Invoicing generates/tracks only, no payment gateway — clients keep paying via manual EFT.
- IT-Guru is not VAT-registered — invoices use plain "Invoice" labeling, no VAT fields.
- Local dev: `netlify dev` (NOT `npm run dev`) + `DEV_AUTH_BYPASS=1` in `.env.local` for zero-login local testing.
- Every outgoing email is BCC'd to `info@it-guru.co.za` centrally in `sendEmail()`.
- [v2.1, roadmap]: Clients-first dependency chain locked: Phase 6 (clients) → Phase 7 (tickets, client_id FK) → Phase 8 (invoices.client_id FK + CLIENT-06 history, needs both prior phases) → Phase 9 (dashboard, needs all three).
- [v2.1, roadmap]: CLIENT-06 (client detail shows linked invoices+tickets) placed in Phase 8 rather than Phase 6, since it depends on tickets (Phase 7) and invoice linking (Phase 8 itself) both existing first.
- [Phase 06]: clients.email has no unique() constraint — duplicate-client tolerance is intentional, dedupe tooling out of scope
- [Phase 06]: clients table placed at end of schema.ts (Drizzle .references() lazy thunks allow forward refs from earlier-defined lead tables)
- [Phase 06, 06-01 correction]: 06-01-PLAN.md's frontmatter listed all 5 CLIENT requirements even though it only built Wave 0 foundation (schema/types/test-stubs, no routes/UI). Reverted the `requirements mark-complete` result in REQUIREMENTS.md back to unchecked/"In Progress" for CLIENT-01..05 — they'll get marked truly Complete as 06-02 through 06-05 deliver the actual create/list/edit/notes/convert functionality.
- [Phase 06]: 06-02: Non-DB guard tests assert 401 for all unauthenticated cases (POST/GET/PUT), since requireAdmin() fires before body/id validation — matches crm/[id]/notes/route.test.ts convention.
- [Phase 06, 06-02 correction]: 06-02-PLAN.md's frontmatter listed CLIENT-01/03/04 as requirements even though it only built the API route layer (no owner-facing UI). Reverted the `requirements mark-complete` result in REQUIREMENTS.md back to unchecked/"In Progress" for CLIENT-01/03/04 — the traceability table now notes routes done in 06-02, UI still pending in 06-03 (create/list) and 06-05 (edit).
- [Phase 06]: 06-04: convert-from-lead uses withTxDb + AlreadyConvertedError thrown inside the tx (not pre-checked) for race-proof idempotency, mirroring the Phase 4 invoice draft-lock pattern
- [Phase 06]: 06-04: lead status field intentionally left untouched by convert — only convertedClientId is stamped, per 06-RESEARCH.md
- [Phase 06]: 06-03: ClientForm built create+edit-capable from the start (clientId?+initial? props) so 06-05 reuses it verbatim for editing, mirroring InvoiceForm's dual-mode pattern
- [Phase 06]: 06-05: Client notes route hardcodes recordType='client' string literal directly (no CrmRecordType union change needed); guard-order convention confirmed for non-numeric-id 401-before-404 case

### Pending Todos

- Remove leftover `include:zoho.com` from the apex SPF TXT record — RESOLVED by owner (see Session Continuity below).
- Remove old `neon` Netlify extension from team dashboard — INTENTIONALLY left installed (uninstall is irreversible + risks DB outage for a cosmetic warning; do not revisit).

### Blockers/Concerns

- None currently blocking v2.1 roadmap/planning. Full historical blocker log preserved in git history of this file (v2.0 security audit, testing-methodology traps, etc. — all resolved).
- Reminder for Phase 6 planning: new `clients` table migration will be `0005` (0000 initial, 0001 CRM, 0002 pricing, 0003 invoices, 0004 automation).

## Session Continuity

Last session: 2026-07-04T17:02:17.372Z
Stopped at: Completed 06-05-PLAN.md
NEXT: Phase 06 (clients-entity-crm-integration) is fully executed (5/5 plans) — run /gsd:verify-work for the phase, then proceed to Phase 7 (Tickets) planning.
Resume file: None
