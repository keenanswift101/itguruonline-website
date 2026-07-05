---
phase: 10
slug: quotations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-05
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (existing) |
| **Config file** | vitest.config.ts (existing at repo root) |
| **Quick run command** | `npx vitest run src/app/api/admin/quotations src/lib/quotations.ts` |
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

*(Filled by the planner. DB-dependent tests gate on `process.env.NETLIFY_DB_URL`; auth-guard (401) tests always run. Email send mocked via `vi.mock("resend")`.)*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| TBD | — | — | QUOTE-01..06 | route/unit + typecheck | `npx vitest run` / `npx tsc --noEmit` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stub files for the new quotation routes (create/list/get/edit/delete, status/send, resend, convert)
- [ ] Reuse existing vitest infra + `vi.mock("next/headers")` + `vi.mock("resend")` + `NETLIFY_DB_URL` gate

*Existing vitest infrastructure covers the framework; Wave 0 only adds new stub files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Quotation PDF arrives by email with attachment | QUOTE-03 | Real Resend send + inbox | Mark a quotation Sent under `netlify dev`; confirm test inbox gets the "Quotation" PDF + info@ BCC |
| PDF labeled "Quotation", shows valid-until, no invoice number | QUOTE-03 | Visual PDF check | Download a quotation PDF; confirm labeling |
| Convert accepted quote → draft invoice | QUOTE-05 | Live DB round-trip | Accept a quote, click Convert; confirm a draft invoice with same client + line items; re-convert blocked (409) |
| Status lifecycle | QUOTE-04 | Visual + live DB | Move a quote draft→sent→accepted/declined; confirm badges/actions |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
