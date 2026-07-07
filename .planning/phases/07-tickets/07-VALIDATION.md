---
phase: 7
slug: tickets
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-07
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (existing) |
| **Config file** | vitest.config.ts (existing at repo root) |
| **Quick run command** | `npx vitest run src/app/api/admin/tickets src/lib/ticket-status.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds full suite |

---

## Sampling Rate

- **After every task commit:** quick command for the touched area + `npx tsc --noEmit`
- **After every plan wave:** `npx vitest run` (full suite)
- **Before `/gsd:verify-work`:** full suite green + `npx tsc --noEmit` clean
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

*(DB-dependent tests gate on `process.env.NETLIFY_DB_URL`; auth-guard (401) and pure-logic tests always run.)*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 07-01 T1 | 07-01 | 0 | TICKET-01..05 | schema/typecheck | `npx tsc --noEmit` | ⬜ pending |
| 07-01 T2 | 07-01 | 0 | TICKET-01..05 | migration/typecheck | `npx tsc --noEmit` | ⬜ pending |
| 07-01 T3 | 07-01 | 0 | TICKET-02 (+stubs 01/03/04/05) | pure-logic unit + stub gates | `npx vitest run src/lib/ticket-status.test.ts src/app/api/admin/tickets` | ⬜ pending |
| 07-02 T1 | 07-02 | 1 | TICKET-04/05 | query/typecheck | `npx tsc --noEmit` | ⬜ pending |
| 07-02 T2 | 07-02 | 1 | TICKET-01/04 | route guard (401/422) | `npx vitest run src/app/api/admin/tickets/route.test.ts` | ⬜ pending |
| 07-02 T3 | 07-02 | 1 | TICKET-05 | route guard (401) | `npx vitest run src/app/api/admin/tickets/[id]/route.test.ts` | ⬜ pending |
| 07-03 T1 | 07-03 | 1 | TICKET-02 | route guard (401/422) | `npx vitest run src/app/api/admin/tickets/[id]/status/route.test.ts` | ⬜ pending |
| 07-03 T2 | 07-03 | 1 | TICKET-03 | route guard (401) | `npx vitest run src/app/api/admin/tickets/[id]/notes/route.test.ts` | ⬜ pending |
| 07-04 T1 | 07-04 | 2 | TICKET-01 | typecheck (client form) | `npx tsc --noEmit` | ⬜ pending |
| 07-04 T2 | 07-04 | 2 | TICKET-04 | typecheck (list/nav) | `npx tsc --noEmit` | ⬜ pending |
| 07-05 T1 | 07-05 | 2 | TICKET-02/03 | typecheck (status/note UI) | `npx tsc --noEmit` | ⬜ pending |
| 07-05 T2 | 07-05 | 2 | TICKET-05, CLIENT-06 | typecheck (detail + seam) | `npx tsc --noEmit` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note: TICKET-01..05 owner-facing behaviors (create via picker, status lifecycle, notes chronology, list ordering, client Tickets Card) are UI + live-DB — covered by the Manual-Only table below. Automated tests cover the route guards, the status transition map (pure logic), and typecheck across every task.*

---

## Wave 0 Requirements

- [x] Test stub files for the new ticket routes (create/list/get, status, notes) — created in 07-01 Task 3
- [x] ticket-status.ts unit test (ALLOWED_TRANSITIONS) — created in 07-01 Task 3
- [x] Reuse existing vitest infra + `vi.mock("next/headers")` + `NETLIFY_DB_URL` gate

*Existing vitest infrastructure covers the framework; Wave 0 only adds new stub files (all in 07-01).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Create ticket linked to client via picker | TICKET-01 | Visual + live DB | New ticket under `netlify dev`; pick a client, set priority, save → redirects to detail |
| Status lifecycle open→in-progress→resolved | TICKET-02 | Visual + live DB | Change status via the select; confirm badge + toast; confirm resolved stamps resolved_at |
| Notes chronological, reuse crm_notes | TICKET-03 | Visual parity | Add notes; confirm oldest→newest like client/lead notes |
| List filter + open-first ordering | TICKET-04 | Visual | Filter by status; confirm open/in-progress surfaced before resolved |
| Detail view (client, priority, status, notes) | TICKET-05 | Visual + live DB | Open a ticket; confirm client link, priority/status badges, description, note history |
| Client detail shows linked tickets | CLIENT-06 (tickets half) | Visual + live DB | Open a client with tickets; confirm the Tickets Card lists them |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner-complete (pending execution)
