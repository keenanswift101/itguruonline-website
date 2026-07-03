---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: verifying
stopped_at: Completed 04-05-PLAN.md (invoice detail page) -- checkpoint approved. Phase 04-invoicing now 5/5 plans complete. NEXT - verify phase 4, then plan/execute phase 5
last_updated: "2026-07-03T05:56:02.786Z"
last_activity: 2026-07-03
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 22
  completed_plans: 16
  percent: 68
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-30)

**Core value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.
**Current focus:** Phase 04 — invoicing

## Current Position

Phase: 04 (invoicing) — COMPLETE (5/5 plans)
Plan: 5 of 5 (04-05 complete, checkpoint approved — invoice detail page shipped)
Status: Phase complete — ready for verification
Last activity: 2026-07-03

Progress: [███████░░░] 73%

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
- [Phase 04-invoicing]: InvoiceDocument.tsx bank footer uses bracketed placeholder EFT values — owner must fill real account details before first live invoice
- [Phase 04-invoicing]: AdminSidebar already exists on this branch and already lists an active Invoices link -- kept a simple back-link on invoice pages anyway for consistency with dashboard/CRM pattern
- [Phase 04-invoicing]: Invoice status badge colors: draft=gray glass, sent=cobalt #00aaff, paid=green, overdue=red -- overdue renders as a SECOND badge alongside the stored status badge, never replacing it
- [Phase 04-invoicing]: InvoiceForm 422 handling maps zod fieldErrors ({field: string[]}) onto the same FieldErrors state used for client-side validation, so server and client validation errors render identically
- [Phase 04-invoicing]: InvoiceStatusActions guards double-submit with a single pending flag; 409 surfaces as 'Invalid transition.' distinct from generic errors
- [Phase 04-invoicing]: Detail page renders read-only Sent/Paid view as a dedicated block (not a disabled InvoiceForm) for unambiguous edit-lock UX, defense-in-depth on top of server 409
- [Phase 04-invoicing]: InvoiceForm serves both create (POST) and edit (PUT) via optional initial/invoiceId props rather than a duplicate edit-form component

### Pending Todos

- Remove leftover `include:zoho.com` from the apex SPF TXT record (`it-guru.co.za`) — defer until Phase 4 (Invoicing) is live. Exact edit: change `v=spf1 ip4:102.216.79.206 +a +mx include:zoho.com include:it-guru.co.za ~all` to `v=spf1 ip4:102.216.79.206 +a +mx include:it-guru.co.za ~all`.
- Remove old `neon` Netlify extension from team dashboard (cosmetic — it logs a warning on every build but doesn't block it).

### Blockers/Concerns

- A fresh security review (OWASP-style, per existing `SECURITY-AUDIT.md` precedent) is owed once Phase 1-2 are live — don't defer to milestone end.
- Phase 5 (Scheduled Automation) needs reminder-cadence thresholds confirmed with owner during that phase's planning.
- ~~Pre-existing, project-wide vitest breakage~~ -- CORRECTED same day: re-ran `npx vitest run` directly and got a clean pass (21/21 test files, 91 passed, 0 failed). Not reproducible; the 04-05 executor's git-stash isolation likely collided with a concurrently-running dev server / in-flight npm install. No action needed before Phase 5.

## Session Continuity

Last session: 2026-07-03T05:55:34.046Z
Stopped at: Completed 04-05-PLAN.md (invoice detail page) -- checkpoint approved. Phase 04-invoicing now 5/5 plans complete. NEXT - verify phase 4, then plan/execute phase 5
Resume file: None
