---
phase: 03-live-pricing-migration
plan: 03
subsystem: admin-pricing-portal
tags: [admin, pricing, patch-routes, inline-editing, auth-gated]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [admin-pricing-write-side]
  affects: [public-pricing-reads, client-registrations]
tech_stack:
  added: []
  patterns:
    - "auth-gated PATCH routes (requireAdmin first, 401 before DB)"
    - "use-client inline-editing with per-field SaveState"
    - "auto-save on blur + router.refresh() for server revalidation"
    - "vi.mock(next/headers) for unit testing requireAdmin in vitest"
    - "force-dynamic server page + Promise.all for parallel DB reads"
key_files:
  created:
    - src/app/api/admin/pricing/packages/[id]/route.ts
    - src/app/api/admin/pricing/packages/route.test.ts
    - src/app/api/admin/pricing/domains/[tld]/route.ts
    - src/app/api/admin/pricing/domains/route.test.ts
    - src/app/api/admin/pricing/settings/route.ts
    - src/app/api/admin/pricing/settings/route.test.ts
    - src/app/admin/pricing/PricingPackagesTable.tsx
    - src/app/admin/pricing/DomainPricesTable.tsx
    - src/app/admin/pricing/SiteSettingsForm.tsx
    - src/app/admin/pricing/page.tsx
  modified: []
decisions:
  - "requireAdmin() is called FIRST in every route before any JSON parse or DB access — 401 before any side effect"
  - "vi.mock('next/headers') pattern required for vitest to test routes that call cookies() — established by Phase 2 CRM tests"
  - "Build failure (Missing RESEND_API_KEY) is a pre-existing env issue from module-level new Resend() in src/lib/email.ts — unrelated to pricing files; TypeScript compilation succeeds"
metrics:
  duration: ~10 minutes
  completed: 2026-07-02
  tasks: 3
  files: 10
---

# Phase 03 Plan 03: Admin Pricing Portal Summary

**One-liner:** Auth-gated admin pricing portal at /admin/pricing with three PATCH routes + inline-editing components that auto-save on blur and persist to the DB.

## What Was Built

Three PATCH API routes protected by `requireAdmin()`, three `"use client"` inline-editing components with per-field save state and fading "Saved ✓" indicators, and a server-rendered `/admin/pricing` page that fetches all three pricing tables and renders the editor components. Together these fulfill the write half of Phase 3's "owner edits pricing without a code deploy" promise.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wave 0 tests + three admin PATCH routes | c045201 | 6 files (3 routes + 3 tests) |
| 2 | Three use-client inline-editing components | a613510 | 3 files |
| 3 | /admin/pricing server page | e09f2dd | 1 file |

## Requirements Fulfilled

- **PRICE-01**: Owner edits hosting package price/description/features/is_popular inline; auto-saves via `PATCH /api/admin/pricing/packages/[id]`
- **PRICE-03**: Owner edits per-TLD domain price inline (blank clears to NULL); auto-saves via `PATCH /api/admin/pricing/domains/[tld]`
- **PRICE-05**: Owner edits contact_email + hosting_setup_fee_note; auto-saves via `PATCH /api/admin/pricing/settings`

## Architecture

### PATCH Routes
Each route follows the same pattern:
1. `requireAdmin()` first — returns 401 if no valid session cookie
2. Parse route params (id/tld)
3. Parse + validate JSON body with Zod
4. `db.update(table).set(data).where(eq(...))`
5. Return `{ ok: true }`

The domains route uses `decodeURIComponent(tldParam)` to handle `.co.za` encoded as `%2Eco.za` in the URL path. `priceRands` in the domains schema is nullable — the route accepts `null` explicitly via `.nullable()` in the Zod schema.

The settings route maintains an allow-list (`["contact_email", "hosting_setup_fee_note"]`) to prevent pollution of the `site_settings` table with arbitrary keys.

### Editor Components
Each component manages local editable state initialized from props and compares on blur — only PATCHes if the value actually changed. Per-field `SaveState = "idle" | "saving" | "saved" | "error"` drives inline status indicators that fade back to idle after 1.5s. `router.refresh()` is called after each successful save so the server page re-fetches from DB on the next navigation.

### Test Pattern
All three test files use `vi.mock("next/headers", ...)` to simulate an empty cookie store (no session), confirming the 401 gate fires before any DB access. DB tests are gated behind `describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip`.

## Deviations from Plan

### Pre-existing Build Issue (out of scope — not fixed)

`npm run build` fails in the local environment with `Error: Missing API key. Pass it to the constructor new Resend("re_123")`. This happens during Next.js's "Collecting page data" phase for `/api/contact` — the Resend client is instantiated at module level in `src/lib/email.ts` (line 3: `const resend = new Resend(process.env.RESEND_API_KEY)`), and without `RESEND_API_KEY` set in the build environment, the module throws on import.

- **Scope**: This issue predates Plan 03-03 entirely (email.ts was introduced in an early commit). It is not caused by any pricing changes.
- **Status**: TypeScript compilation succeeds (`✓ Compiled successfully`). The failure is at runtime data collection for `/api/contact`, not in any pricing file.
- **Build on Netlify**: Passes because `RESEND_API_KEY` is set as a Netlify environment variable.
- **Action**: Logged to deferred-items — the fix is to lazy-initialize the Resend client inside `sendEmail()` rather than at module level.

### Test Mock Pattern (auto-fixed — Rule 1)

The plan's test action described non-DB guard tests that would "always run" and verify 401. Initial implementation without `vi.mock("next/headers")` caused `cookies was called outside a request scope` — the same issue the Phase 2 CRM tests solved. Applied the established `vi.mock("next/headers")` + dynamic `import()` pattern from `src/app/api/admin/crm/[id]/route.test.ts`. No behavior change — just the correct test setup for vitest.

## Known Stubs

None. All three editor components are wired to real PATCH routes, which update real DB rows. The server page fetches from the same DB tables via the `pricing.ts` helpers from Plan 03-02.

## Self-Check: PASSED

All created files confirmed present. All commits confirmed in git log.

| Check | Result |
|-------|--------|
| src/app/api/admin/pricing/packages/[id]/route.ts | FOUND |
| src/app/api/admin/pricing/domains/[tld]/route.ts | FOUND |
| src/app/api/admin/pricing/settings/route.ts | FOUND |
| src/app/admin/pricing/PricingPackagesTable.tsx | FOUND |
| src/app/admin/pricing/DomainPricesTable.tsx | FOUND |
| src/app/admin/pricing/SiteSettingsForm.tsx | FOUND |
| src/app/admin/pricing/page.tsx | FOUND |
| Commit c045201 (Task 1) | FOUND |
| Commit a613510 (Task 2) | FOUND |
| Commit e09f2dd (Task 3) | FOUND |
