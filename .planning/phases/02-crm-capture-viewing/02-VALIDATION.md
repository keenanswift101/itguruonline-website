---
phase: 2
slug: crm-capture-viewing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-01
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npm test` (runs `vitest run`) |
| **Full suite command** | `npm test` (all `src/**/*.test.ts`) |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-xx | 01 | 0 | CRM-01 | integration (DB) | `npm test -- src/app/api/register/route.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-xx | 01 | 0 | CRM-01 | integration (DB+mock) | `npm test -- src/app/api/register/route.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-xx | 01 | 0 | CRM-02 | integration (DB) | `npm test -- src/app/api/contact/route.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-xx | 02 | 0 | CRM-03 | unit (401) | `npm test -- src/app/api/admin/crm/route.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-xx | 02 | 0 | CRM-03 | integration (DB) | `npm test -- src/app/api/admin/crm/route.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-xx | 02 | 0 | CRM-04 | integration (DB) | `npm test -- "src/app/api/admin/crm/[id]/route.test.ts"` | ❌ W0 | ⬜ pending |
| 2-03-xx | 03 | 0 | CRM-05 | unit (422) | `npm test -- "src/app/api/admin/crm/[id]/status/route.test.ts"` | ❌ W0 | ⬜ pending |
| 2-03-xx | 03 | 0 | CRM-05 | integration (DB) | `npm test -- "src/app/api/admin/crm/[id]/status/route.test.ts"` | ❌ W0 | ⬜ pending |
| 2-03-xx | 03 | 0 | CRM-06 | integration (DB) | `npm test -- "src/app/api/admin/crm/[id]/notes/route.test.ts"` | ❌ W0 | ⬜ pending |
| 2-04-xx | 04 | 0 | CRM-07 | unit (headers) | `npm test -- src/app/api/admin/crm/export/route.test.ts` | ❌ W0 | ⬜ pending |
| 2-04-xx | 04 | 0 | CRM-07 | unit (CSV escape) | `npm test -- src/app/api/admin/crm/export/route.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/register/route.test.ts` — extend with DB capture assertions for CRM-01 (insert-before-email ordering)
- [ ] `src/app/api/contact/route.test.ts` — new file; contact route currently has no tests (CRM-02)
- [ ] `src/app/api/admin/crm/route.test.ts` — 401 without session + merged list query (CRM-03)
- [ ] `src/app/api/admin/crm/[id]/route.test.ts` — 401 without session + full record detail (CRM-04)
- [ ] `src/app/api/admin/crm/[id]/status/route.test.ts` — 422 invalid status + DB update (CRM-05)
- [ ] `src/app/api/admin/crm/[id]/notes/route.test.ts` — 401 without session + crm_notes insert (CRM-06)
- [ ] `src/app/api/admin/crm/export/route.test.ts` — Content-Type/Content-Disposition headers + CSV RFC 4180 escaping (CRM-07)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar active-link highlight | CRM-03 (list UI) | `usePathname()` requires browser — IntersectionObserver/router not available in Vitest | Navigate to `/admin/crm`, verify CRM link highlighted; navigate to `/admin/crm/registration-123`, verify still highlighted |
| Status badge colours | CRM-05 | Visual colour rendering — no automated assertion | Verify neon accents: new=cobalt `#00aaff`, contacted=amber, in_progress=purple, completed=green |
| CSV opens correctly in spreadsheet | CRM-07 | Requires desktop spreadsheet app | Download export, open in Excel/LibreOffice, verify columns, check that `=SUM(1+1)` in a message renders as text not formula |

---

## Nyquist Auditor Checklist

Items the `gsd-nyquist-auditor` should verify after execution:

- [ ] All five new API routes return 401 without a valid session cookie
- [ ] `register/route.ts` DB insert executes BEFORE `sendEmail` (spy/mock order assertion)
- [ ] `contact/route.ts` DB insert executes BEFORE `sendEmail`
- [ ] PATCH `/api/admin/crm/[id]/status` rejects values outside `["new","contacted","in_progress","completed"]` with 422
- [ ] GET `/api/admin/crm/export` response has `Content-Type: text/csv` and `Content-Disposition: attachment`
- [ ] CSV output correctly escapes a field containing commas and double-quotes (RFC 4180)
- [ ] CSV output handles formula-injection: field starting with `=` is escaped
- [ ] `client_registrations` rows have non-null `reference_id` after insert
- [ ] `crm_notes` rows have correct `record_type` and `record_id` after POST `/notes`

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 stub
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING file references
- [ ] No watch-mode flags in test commands
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter when all boxes checked

**Approval:** pending
