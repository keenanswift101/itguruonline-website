---
phase: 8
slug: linked-invoicing-delivery
status: draft
nyquist_compliant: true
wave_0_complete: false  # Wave 0 stubs land in 08-01
created: 2026-07-04
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (existing) |
| **Config file** | vitest.config.ts (existing at repo root) |
| **Quick run command** | `npx vitest run src/app/api/admin/invoices src/lib/invoice-pdf.ts` |
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

*(Filled by the planner. DB-dependent tests gate on `process.env.NETLIFY_DB_URL`; auth-guard (401) and pure-logic tests always run. Email send is mocked via `vi.mock("resend")` per the repo pattern.)*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 08-01-T1 | 08-01 | 0 | INVOICE-09/10 | migration/schema + typecheck | `npx tsc --noEmit` | ⬜ pending |
| 08-01-T2 | 08-01 | 0 | INVOICE-11 | route (pdf) + typecheck | `npx vitest run src/app/api/admin/invoices/[id]/pdf` | ⬜ pending |
| 08-01-T3 | 08-01 | 0 | INVOICE-09/11/13 | Wave 0 stubs | `npx vitest run src/app/api/admin/invoices/[id]/resend src/lib/invoice-pdf.test.ts` | ⬜ pending |
| 08-02-T1 | 08-02 | 1 | INVOICE-09/10 | route (POST) | `npx vitest run src/app/api/admin/invoices/route.test.ts` | ⬜ pending |
| 08-02-T2 | 08-02 | 1 | INVOICE-09/10 | route (PUT) | `npx vitest run src/app/api/admin/invoices/[id]/route.test.ts` | ⬜ pending |
| 08-03-T1 | 08-03 | 2 | INVOICE-09 | component + typecheck | `npx tsc --noEmit` | ⬜ pending |
| 08-03-T2 | 08-03 | 2 | INVOICE-09/10 | form + typecheck | `npx tsc --noEmit` | ⬜ pending |
| 08-03-T3 | 08-03 | 2 | INVOICE-09 | pages + full suite | `npx vitest run` | ⬜ pending |
| 08-04-T1 | 08-04 | 1 | INVOICE-11/12 | route (status) + resend mock | `npx vitest run src/app/api/admin/invoices/[id]/status/route.test.ts` | ⬜ pending |
| 08-04-T2 | 08-04 | 1 | INVOICE-13 | route (resend) + resend mock | `npx vitest run src/app/api/admin/invoices/[id]/resend` | ⬜ pending |
| 08-04-T3 | 08-04 | 1 | INVOICE-12/13 | component + full suite | `npx vitest run` | ⬜ pending |
| 08-05-T1 | 08-05 | 1 | CLIENT-06 | query (DB-gated) | `npx vitest run src/lib/client-query.test.ts` | ⬜ pending |
| 08-05-T2 | 08-05 | 1 | CLIENT-06 | page + full suite | `npx vitest run` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stub files for the new/changed routes: invoice status (email-on-send + block-no-email), resend route, invoice create/edit (client_id threading)
- [ ] Reuse existing vitest infra + `vi.mock("next/headers")` + `vi.mock("resend")` + `NETLIFY_DB_URL` gate

*Existing vitest infrastructure covers the framework; Wave 0 only adds new stub files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Invoice PDF actually arrives by email with attachment | INVOICE-11 | Real Resend send + inbox | Mark a real invoice Sent under `netlify dev`; confirm client (test) inbox gets the PDF + info@ BCC |
| Client picker auto-fills + links | INVOICE-09 | Visual + live DB | Create invoice, pick a client, confirm fields fill and client_id persists |
| Block-on-no-email prompt | INVOICE-12 | Visual UX | Try Mark Sent on an invoice with no client email; confirm blocked + prompt |
| Client detail shows linked invoices | CLIENT-06 | Visual + live DB | Open a client with invoices; confirm invoice history list |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
