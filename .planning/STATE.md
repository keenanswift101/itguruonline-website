---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-03-PLAN.md — CRM detail view, status + notes
last_updated: "2026-07-02T05:51:20.169Z"
last_activity: 2026-07-02
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 22
  completed_plans: 8
  percent: 23
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-30)

**Core value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.
**Current focus:** Phase 02 — crm-capture-viewing (executing)

## Current Position

Phase: 03
Plan: Not started
Status: Ready to execute
Last activity: 2026-07-02

Progress: [███░░░░░░░] 23%

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

### Pending Todos

- Remove leftover `include:zoho.com` from the apex SPF TXT record (`it-guru.co.za`) — defer until Phase 4 (Invoicing) is live. Exact edit: change `v=spf1 ip4:102.216.79.206 +a +mx include:zoho.com include:it-guru.co.za ~all` to `v=spf1 ip4:102.216.79.206 +a +mx include:it-guru.co.za ~all`.
- Remove old `neon` Netlify extension from team dashboard (cosmetic — it logs a warning on every build but doesn't block it).

### Blockers/Concerns

- A fresh security review (OWASP-style, per existing `SECURITY-AUDIT.md` precedent) is owed once Phase 1-2 are live — don't defer to milestone end.
- Phase 5 (Scheduled Automation) needs reminder-cadence thresholds confirmed with owner during that phase's planning.

## Session Continuity

Last session: 2026-07-02T05:24:12.652Z
Stopped at: Completed 02-03-PLAN.md — CRM detail view, status + notes
Resume file: None
