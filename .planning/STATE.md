# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-30)

**Core value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.
**Current focus:** Phase 1 — Auth + Database Foundation

## Current Position

Phase: 1 of 5 (Auth + Database Foundation)
Plan: TBD (not yet planned)
Status: Ready to plan
Last activity: 2026-06-30 — Roadmap created (5 phases, 27/27 requirements mapped)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Database/auth provider: Netlify Database (Neon Postgres) + hand-rolled JWT/cookie auth, not Supabase — research flagged a conflict between STACK.md and ARCHITECTURE.md; default to Netlify-native per project's "extend the Netlify stack" constraint. Verify current Netlify Database pricing before provisioning (free-tier date flagged as possibly promotional).
- Single-admin auth only for v2.0 — no multi-staff roles (deferred to v2+).
- Invoicing generates/tracks only, no payment gateway — clients keep paying via manual EFT.
- IT-Guru is not VAT-registered — invoices must use plain "Invoice" labeling, no VAT fields or "Tax Invoice" wording.
- POPIA data-region: no confirmed South African region for serverless-friendly DB candidates; default to EU or equivalent-protection region, document explicitly once Phase 1 provider is provisioned.

### Pending Todos

- Remove leftover `include:zoho.com` from the apex SPF TXT record (`it-guru.co.za`) — confirmed unused (no MX points to Zoho), but owner wants to defer cleanup until Phase 4 (Invoicing) is live and sending invoices, not before. Exact edit: change `v=spf1 ip4:102.216.79.206 +a +mx include:zoho.com include:it-guru.co.za ~all` to `v=spf1 ip4:102.216.79.206 +a +mx include:it-guru.co.za ~all`.

### Blockers/Concerns

- Phase 1 must resolve the DB/auth provider decision (Netlify Database/Neon vs Supabase) before schema/auth code is written — flagged "Pending" in PROJECT.md Key Decisions, not yet finalized as "Good."
- Phase 1 must verify Netlify's `proxy.ts` (Next.js 16 rename of `middleware.ts`) works as expected with `@netlify/plugin-nextjs` — Netlify's own docs still reference the old name as of research.
- A fresh security review (OWASP-style, per existing `SECURITY-AUDIT.md` precedent) is owed once Phase 1-2 are live (auth + first real data writes) — don't defer to milestone end.
- Phase 5 (Scheduled Automation) needs reminder-cadence thresholds (days-of-no-contact, days-overdue) confirmed with the owner during that phase's planning — research only provides industry ranges, not a fixed number.

## Session Continuity

Last session: 2026-06-30
Stopped at: ROADMAP.md and STATE.md created; REQUIREMENTS.md traceability updated. Ready for `/gsd:plan-phase 1`.
Resume file: None
