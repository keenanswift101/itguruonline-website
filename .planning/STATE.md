---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: Clients, Tickets, Invoicing & Quotations
status: executing
stopped_at: Completed 07-01-PLAN.md
last_updated: "2026-07-07T09:40:16.149Z"
last_activity: 2026-07-07
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 21
  completed_plans: 17
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-04)

**Core value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.
**Current focus:** Phase 07 — tickets

**v2.1 design decisions (locked with owner):** Clients = new first-class entity (add manual OR convert enquiry/registration); build lightweight in-portal ticketing (tickets linked to clients); invoice→client via optional `client_id` FK with auto-fill (free-text one-off invoices stay valid); dashboard reworked to show open tickets + new leads + unpaid/overdue invoices + revenue-this-month + recent activity. Research skipped (standard CRUD on the established v2.0 stack).

**v2.1 phase structure (dependency chain: clients → tickets → linked invoicing → dashboard):**

- Phase 6: Clients Entity + CRM Integration (foundation — clients table, manual create, convert from lead, list/edit/notes)
- Phase 7: Tickets (tickets table with client_id FK, CRUD, status, notes, list/detail)
- Phase 8: Linked Invoicing (invoices.client_id FK + searchable picker + auto-fill; free-text path stays valid; CLIENT-06 client-detail history view lands here since it needs both tickets and invoice links to exist)
- Phase 9: Dashboard Rework (tiles reading from tickets/clients/invoices/leads)

## Current Position

Phase: 07 (tickets) — EXECUTING
Plan: 2 of 5
Status: Ready to execute
Last activity: 2026-07-07

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
| Phase 08 P01 | 12min | 3 tasks | 10 files |
| Phase 08 P04 | 12min | 3 tasks | 5 files |
| Phase 08 P02 | 8min | 2 tasks | 4 files |
| Phase 08 P05 | 10min | 2 tasks | 4 files |
| Phase 08 P03 | 6min | 3 tasks | 4 files |
| Phase 10 P01 | 16min | 3 tasks | 15 files |
| Phase 10 P02 | 20min | 3 tasks | 7 files |
| Phase 10 P03 | 10min | 2 tasks | 4 files |
| Phase 10 P04 | 14min | 3 tasks | 6 files |
| Phase 10 P05 | 10min | 2 tasks | 4 files |
| Phase 07 P01 | 14min | 3 tasks | 9 files |

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
- [Phase 08]: Migration 0006 generated via drizzle-kit (not hand-written) to guarantee constraint-naming/style parity with 0005; verified additive-only (ADD COLUMN + ADD CONSTRAINT, no DROP)
- [Phase 08]: invoice-pdf.tsx uses .tsx extension (not .ts) since it renders JSX directly, shared by pdf download route and future send/resend paths
- [Phase 08]: 08-01 correction: 08-01-PLAN.md's frontmatter listed INVOICE-09/10/11 as requirements even though it only built Wave 0 foundation (schema/helper/query/test-stubs, no routes/UI). Reverted requirements mark-complete result in REQUIREMENTS.md back to unchecked/"In Progress" — they'll get marked truly Complete as 08-02..08-04 deliver the actual linking routes, picker UI, and email-on-send functionality.
- [Phase 08]: [Phase 08, 08-04]: vi.mock('resend') mock factory must use a function expression not an arrow function inside vi.fn() (arrow fns can't be constructed via new Resend())
- [Phase 08]: [Phase 08, 08-04]: INVOICE-11/12/13 delivered - Mark Sent emails PDF best-effort after numbering commits, blocked 422 no_client_email when missing, Resend + Revert to Draft replace Unpublish
- [Phase 08]: 08-02: Client-existence guard runs as a plain db.select outside withTxDb (pre-condition read, not part of the atomic write); 422 shape reuses the existing zod fieldErrors format ({ fields: { clientId: [...] } }) rather than a new error type
- [Phase 08]: 08-02 correction: 08-02-PLAN.md's frontmatter listed INVOICE-09 as a requirement even though it only built the POST/PUT backend route half (client-existence check + persist) — the picker UI is 08-03's job and INVOICE-09's acceptance criteria requires it. Reverted REQUIREMENTS.md's INVOICE-09 checkbox back to unchecked/In Progress; INVOICE-10 (free-text one-off) is genuinely complete end-to-end
- [Phase 08]: 08-05 (PARTIAL): CLIENT-06's invoices half delivered (getClientInvoices + Invoices Card); tickets half stays deferred to Phase 7 per plan design, with an explicit seam comment left on the client detail page for zero-rework Phase 7 addition.
- [Phase 08]: [Phase 08, 08-03]: clientId is only ever set inside handleClientSelect (never handleFieldChange) so editing auto-filled fields keeps the client link, per the locked decision
- [Phase 10]: 10-01: quotations.status is varchar(10) not varchar(8) (avoids invoices' tight-fit risk for 8-char statuses)
- [Phase 10]: 10-01: accepted quotation status is terminal (no outgoing transitions) so future QUOTE-05 convert-to-invoice idempotency stays simple
- [Phase 10]: 10-01 correction: did not mark QUOTE-01/QUOTE-04 complete — this plan only built Wave 0 foundation (schema/libs/test-stubs), not the owner-facing routes; mirrors the 06-01/08-01 correction pattern
- [Phase 10]: 10-02: pdf-shared.ts extracted (react-pdf StyleSheet + formatRands), imported whole by both InvoiceDocument and QuotationDocument per Pitfall 6 (never spread/merge style keys)
- [Phase 10]: 10-02 correction: did not mark QUOTE-03/QUOTE-06 complete - this plan only builds the PDF generation + download-route building block, not the full sent-email flow (10-04) or list/filter UI (10-05/10-06)
- [Phase 10]: 10-03: Skipped mocked-db-module pattern for non-numeric-id 400 test — Number.isNaN check runs before any db access, so the real db module is safely never reached
- [Phase 10]: 10-04: status route omits invoice's gapless-numbering UPDATE entirely (not a SARS document); accepted stays terminal via ALLOWED_TRANSITIONS
- [Phase 10]: 10-04: convert route mirrors 06-04's withTxDb + AlreadyConvertedError-thrown-inside-the-tx idempotency pattern; converted_invoice_id race-proof
- [Phase 10]: 10-04 correction: did not mark QUOTE-03/04/05 complete - backend routes only, owner-facing trigger needs 10-06's UI; mirrors 06-01/06-02/08-01/08-02/10-01/10-02 pattern
- [Phase 10]: 10-05: QuotationForm/list UI executed exactly per plan (no deviations) - structural mirror of InvoiceForm/invoices list with dueDate->validUntil swap and PDF-download-link addition
- [Phase 07]: 07-01: tickets.clientId NOT NULL + onDelete restrict (no free-text ticket concept); status varchar(12) not 8 for in_progress headroom; resolved->open/in_progress reopen allowed
- [Phase 07]: 07-01 correction: did not mark TICKET-01..05 complete - this plan only built Wave 0 foundation (schema/types/test-stubs, no routes/UI); mirrors 06-01/08-01/10-01 pattern

### Pending Todos

- Remove leftover `include:zoho.com` from the apex SPF TXT record — RESOLVED by owner (see Session Continuity below).
- Remove old `neon` Netlify extension from team dashboard — INTENTIONALLY left installed (uninstall is irreversible + risks DB outage for a cosmetic warning; do not revisit).

### Blockers/Concerns

- None currently blocking v2.1 roadmap/planning. Full historical blocker log preserved in git history of this file (v2.0 security audit, testing-methodology traps, etc. — all resolved).
- Reminder for Phase 6 planning: new `clients` table migration will be `0005` (0000 initial, 0001 CRM, 0002 pricing, 0003 invoices, 0004 automation).

## Session Continuity

Last session: 2026-07-07T09:40:16.141Z
Stopped at: Completed 07-01-PLAN.md
NEXT: Phase 08 (linked-invoicing-delivery) — 08-01 and 08-04 complete; 08-02 (linking routes), 08-03 (picker UI), and 08-05 (client invoice history) still remain before the phase is done.
Resume file: None
