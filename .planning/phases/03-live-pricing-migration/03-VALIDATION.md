---
phase: 3
slug: live-pricing-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-01
---

# Phase 3 — Validation Strategy

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
| 3-01-xx | 01 | 1 | PRICE-01, PRICE-02 | integration (DB) | `npm test -- src/app/api/admin/pricing/packages/route.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-xx | 01 | 1 | PRICE-02 | integration (DB) | `npm test -- src/app/api/admin/pricing/packages/route.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-xx | 02 | 1 | PRICE-03 | integration (DB) | `npm test -- src/app/api/admin/pricing/domains/route.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-xx | 02 | 1 | PRICE-04 | unit | `npm test -- src/app/api/admin/pricing/domains/route.test.ts` | ❌ W0 | ⬜ pending |
| 3-03-xx | 03 | 2 | PRICE-05 | integration (DB) | `npm test -- src/app/api/admin/pricing/settings/route.test.ts` | ❌ W0 | ⬜ pending |
| 3-03-xx | 03 | 2 | PRICE-01, PRICE-02 | type | `npx tsc --noEmit` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/admin/pricing/packages/route.test.ts` — PATCH route tests: 401 without session, 422 invalid data, DB update succeeds (PRICE-01, PRICE-02)
- [ ] `src/app/api/admin/pricing/domains/route.test.ts` — PATCH route tests: 401 without session, 422 invalid TLD, DB update succeeds (PRICE-03, PRICE-04)
- [ ] `src/app/api/admin/pricing/settings/route.test.ts` — PATCH route tests: 401 without session, DB update contact_email and setup_fee_note (PRICE-05)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inline edit saves and shows "Saved ✓" feedback | PRICE-01, PRICE-03 | Requires browser interaction — blur event triggers save | Open /admin/pricing, edit a price cell, click away, verify "Saved ✓" appears and fades |
| Services page shows DB price, not hardcoded value | PRICE-02 | Requires live DB + browser — no Vitest for server component rendering | Change a price in admin, reload /services, confirm new price appears |
| Domain Checker shows TLD price | PRICE-04 | Requires live DB + browser + domain search | Set .co.za price in admin, search a domain, confirm price shown next to .co.za result |
| Site settings contact email update | PRICE-05 | Requires live DB + browser | Change contact email in admin, check contact page or enquiry email reflects new address |
| Registration wizard package picker uses DB packages | PRICE-02 | Requires browser — client component receives prop | Check wizard Step C shows correct package prices matching DB |

---

## Nyquist Auditor Checklist

- [ ] All three new admin PATCH routes return 401 without session cookie
- [ ] `PATCH /api/admin/pricing/packages/[id]` updates the correct row in `hosting_packages` table
- [ ] `PATCH /api/admin/pricing/domains/[tld]` rejects unknown TLDs with 422
- [ ] `PATCH /api/admin/pricing/settings` updates `contact_email` and `hosting_setup_fee_note` fields
- [ ] Services page no longer contains hardcoded package prices (grep `R85\|R99\|R149\|R279\|R399\|R35` in services/page.tsx returns nothing)
- [ ] `src/lib/registration-types.ts` no longer exports `HOSTING_PACKAGES` or `HOSTING_SETUP_FEE` (grep confirms deleted)
- [ ] `RegistrationWizard.tsx` receives packages as prop (grep `packages: ` in component signature)
- [ ] Domain Checker component receives prices prop (grep `prices` in DomainChecker props)

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 stub
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING file references
- [ ] No watch-mode flags in test commands
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter when all boxes checked

**Approval:** pending
