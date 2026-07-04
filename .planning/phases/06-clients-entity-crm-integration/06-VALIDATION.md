---
phase: 6
slug: clients-entity-crm-integration
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-04
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (existing) |
| **Config file** | vitest.config.ts (existing at repo root) |
| **Quick run command** | `npx vitest run src/app/api/admin/clients src/app/api/admin/crm/[id]/convert` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds full suite |

---

## Sampling Rate

- **After every task commit:** Run the quick command for the touched area
- **After every plan wave:** Run `npx vitest run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green + `npx tsc --noEmit` clean
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

*(Every DB-dependent test gates on `process.env.NETLIFY_DB_URL` per repo convention; auth-guard tests (401 without session) always run. Wave 0 = 06-01 creates stub files; later plans fill the non-DB guards.)*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-T1 | 06-01 | 0 | CLIENT-01..05 | typecheck (schema) | `npx tsc --noEmit` | n/a | ⬜ pending |
| 06-01-T2 | 06-01 | 0 | CLIENT-01,02 | migration gen | `npx tsc --noEmit` | ✅ 0005_clients.sql | ⬜ pending |
| 06-01-T3 | 06-01 | 0 | CLIENT-01,02,04,05 | stub create | `npx vitest run src/app/api/admin/clients src/app/api/admin/crm/[id]/convert` | ✅ 4 stubs | ⬜ pending |
| 06-02-T1 | 06-02 | 1 | CLIENT-03 | typecheck (query) | `npx tsc --noEmit` | n/a | ⬜ pending |
| 06-02-T2 | 06-02 | 1 | CLIENT-01,03 | unit/route | `npx vitest run src/app/api/admin/clients/route.test.ts` | ✅ filled | ⬜ pending |
| 06-02-T3 | 06-02 | 1 | CLIENT-04 | unit/route | `npx vitest run src/app/api/admin/clients/[id]/route.test.ts` | ✅ filled | ⬜ pending |
| 06-04-T1 | 06-04 | 1 | CLIENT-02 | unit/route | `npx vitest run src/app/api/admin/crm/[id]/convert/route.test.ts` | ✅ filled | ⬜ pending |
| 06-04-T2 | 06-04 | 1 | CLIENT-02 | typecheck (UI) | `npx tsc --noEmit` | n/a | ⬜ pending |
| 06-03-T1 | 06-03 | 2 | CLIENT-03 | typecheck (UI) | `npx tsc --noEmit` | n/a | ⬜ pending |
| 06-03-T2 | 06-03 | 2 | CLIENT-01,03 | typecheck (UI) | `npx tsc --noEmit` | n/a | ⬜ pending |
| 06-05-T1 | 06-05 | 3 | CLIENT-05 | unit/route | `npx vitest run src/app/api/admin/clients/[id]/notes/route.test.ts` | ✅ filled | ⬜ pending |
| 06-05-T2 | 06-05 | 3 | CLIENT-04,05 | typecheck (UI) | `npx tsc --noEmit` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Note: no 3 consecutive code-producing tasks lack an automated verify — every task carries either `npx tsc --noEmit` or a path-scoped `npx vitest run`.

---

## Wave 0 Requirements (all created in Plan 06-01, Task 3)

- [ ] `src/app/api/admin/clients/route.test.ts` — 401 guard + create-validation stubs (CLIENT-01)
- [ ] `src/app/api/admin/clients/[id]/route.test.ts` — 401 guard + edit stubs (CLIENT-04)
- [ ] `src/app/api/admin/clients/[id]/notes/route.test.ts` — 401 guard + client-note stubs (CLIENT-05)
- [ ] `src/app/api/admin/crm/[id]/convert/route.test.ts` — convert-from-lead stubs (CLIENT-02)
- [ ] Reuse existing vitest infra + `vi.mock("next/headers")` pattern + `NETLIFY_DB_URL` gate — no framework install needed

*Existing vitest infrastructure covers the framework; Wave 0 only adds the new test stub files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clients list visually separated from Leads | CLIENT-03 | Visual/layout, not unit-testable | Load `/admin/clients` and `/admin/crm` under `netlify dev`; confirm clients appear in their own status-free list + Clients nav entry |
| Convert carries over correct lead fields | CLIENT-02 | End-to-end DB write | Convert a real enquiry + registration under `netlify dev`; confirm the new client has the mapped details; convert twice -> "View Client"/409 |
| Notes reuse crm_notes UI | CLIENT-05 | Visual parity with leads | Add a note on a client; confirm same UI/timestamp as lead notes |
| Edit persists | CLIENT-04 | End-to-end DB write | Edit a client field and save; refresh confirms persistence |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned
