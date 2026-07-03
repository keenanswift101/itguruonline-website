---
phase: 04-invoicing
plan: 04
subsystem: ui
tags: [invoicing, admin-ui, forms, tailwind-v4, next-router, csv]

# Dependency graph
requires:
  - phase: 04-invoicing plan 02
    provides: POST /api/admin/invoices, invoiceInput/computeTotals/formatInvoiceNumber (src/lib/invoices.ts)
  - phase: 04-invoicing plan 03
    provides: GET /api/admin/invoices/csv (status filter), status/pdf routes for the future detail page
provides:
  - src/lib/invoice-status.ts — isOverdue() + STATUS_BADGE/OVERDUE_BADGE shared badge helpers
  - /admin/invoices — invoice list page (status filter, computed overdue badge, CSV export button)
  - /admin/invoices/new — create page wrapping InvoiceForm
  - src/components/forms/InvoiceForm.tsx — client-side create form with auto-summing line item editor
affects: [04-05 invoice detail UI reuses invoice-status.ts badges and the same table/panel styling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared status/overdue helpers in src/lib (not co-located in a page) so the list page (04-04) and detail page (04-05) render identical badges"
    - "InvoiceForm computes line/invoice totals client-side for live display only; server route.ts (04-02) recomputes via computeTotals() before writing — client never dictates totals"

key-files:
  created:
    - src/lib/invoice-status.ts
    - src/app/admin/invoices/page.tsx
    - src/app/admin/invoices/new/page.tsx
    - src/components/forms/InvoiceForm.tsx
  modified:
    - src/app/globals.css
    - src/components/ui/Input.tsx
    - src/components/forms/steps/StepApplicantInfo.tsx
    - src/components/forms/steps/StepDomainDetails.tsx

key-decisions:
  - "AdminSidebar already exists on this branch (src/components/admin/AdminSidebar.tsx) and already lists an active Invoices link — the plan's fallback 'no sidebar, add a manual back-link' guidance did not apply; kept a simple back-link anyway for consistency with the dashboard/CRM page pattern"
  - "Status badge colors per D-06/plan: draft=gray glass, sent=cobalt #00aaff, paid=green, overdue=red — overdue renders as a SECOND badge alongside the stored status badge, never replacing it"
  - "InvoiceForm 422 handling maps zod's fieldErrors shape ({field: string[]}) onto the same FieldErrors state used for client-side validation, so server and client validation errors render identically"

patterns-established:
  - "InvoiceForm client state shape: ClientFields (clientName/clientEmail/billingAddress/issueDate/dueDate) + LineItemRow[] ({description, quantity, unitPriceRands}); lineTotal(item) = quantity * unitPriceRands computed inline per row and summed for the invoice total display"

requirements-completed: [INVOICE-01, INVOICE-04, INVOICE-07]

# Metrics
duration: ~25min (tasks 1-2 + blocking site-wide fix)
completed: 2026-07-02
---

# Phase 4 Plan 04: Invoice List + Create Form Summary

**Invoice list page with status filter/overdue badge/CSV export, and a create form with a live auto-summing line item editor — both auth-guarded, both awaiting human checkpoint verification.**

## Performance

- **Duration:** ~25 min (2 auto tasks + 1 blocking site-wide CSS/dev-server fix required to reach the checkpoint)
- **Started:** 2026-07-02T07:38:10Z
- **Completed (auto tasks):** 2026-07-02T07:49:00Z
- **Tasks:** 2/2 auto tasks complete; checkpoint task reached and paused (not yet approved)
- **Files modified:** 8 (4 created, 4 modified as part of a Rule 3 blocking-issue fix)

## Accomplishments

- `src/lib/invoice-status.ts`: `isOverdue(status, dueDate)` (D-06: `status === 'sent' && dueDate < today`) plus `STATUS_BADGE`/`OVERDUE_BADGE` color-coded badge definitions, shared for reuse by the 04-05 detail page.
- `/admin/invoices`: server component, `requireAdmin()` first, status filter (`?status=draft|sent|paid`), table (Invoice #, Client Name, Due Date, Total, Status+Overdue badges, View action), "New Invoice" `.btn-metallic` CTA, "Export CSV" `.btn-glass` link that carries the active filter to `/api/admin/invoices/csv`, empty state, back-link to dashboard.
- `src/components/forms/InvoiceForm.tsx`: `"use client"` form with client info fields (name/email/address/issueDate defaulting to today/dueDate required), a line item table with Add/Remove rows, live per-line and invoice-total auto-sum, POST to `/api/admin/invoices`, `router.push` to the detail page on 201, 422 field-error mapping, generic error fallback.
- `/admin/invoices/new`: server component wrapping `InvoiceForm` in the same glass-panel styling as the list page.

## Task Commits

Each task was committed atomically:

1. **Task 1: invoice-status helpers + invoice list page** — `c508c61` (feat)
2. **Task 2: InvoiceForm + /admin/invoices/new page** — `e9d5587` (feat)
3. **Blocking fix (Rule 3, pre-checkpoint):** site-wide `npm run dev` 500 — `46c6429` (fix)

## Files Created/Modified

- `src/lib/invoice-status.ts` — `isOverdue()`, `STATUS_BADGE`, `OVERDUE_BADGE`
- `src/app/admin/invoices/page.tsx` — list page with filter/badges/CSV export
- `src/app/admin/invoices/new/page.tsx` — create page, wraps `InvoiceForm`
- `src/components/forms/InvoiceForm.tsx` — line item editor, auto-sum, POST + redirect
- `src/app/globals.css` — added `@source not "../../CLAUDE.md"` and `@source not "../../.planning/**/*.md"` exclusions (blocking-issue fix, see Deviations)
- `src/components/ui/Input.tsx`, `src/components/forms/steps/StepApplicantInfo.tsx`, `src/components/forms/steps/StepDomainDetails.tsx` — converted legacy bracket-syntax `text-[var(--x)]`/`bg-[var(--x)]`/`border-[var(--x)]` classes to canonical Tailwind v4 `text-(--x)` form (blocking-issue fix, see Deviations)

## Decisions Made

- Reused the existing `AdminSidebar`/`admin/layout.tsx` (already provides `requireAdmin()`, the fixed bg-image, and an active "Invoices" nav link) rather than assuming no sidebar exists, since the plan flagged this as uncertain on this branch. Confirmed it exists and needed no changes.
- Kept `.btn-glass`/`.btn-metallic` and Tailwind v4 `text-(--var)` syntax throughout new files, per CLAUDE.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npm run dev` 500'd on every route, blocking the mandatory checkpoint verification**

- **Found during:** Pre-checkpoint automation check (before handing off to the human-verify checkpoint)
- **Issue:** Two-layered root cause. (a) `src/components/ui/Input.tsx`, `src/components/forms/steps/StepApplicantInfo.tsx`, and `src/components/forms/steps/StepDomainDetails.tsx` — files untouched by any 04-* plan — still used legacy bracket-syntax `text-[var(--x)]` classes. (b) Even after converting those, the exact same crash persisted: Tailwind v4's automatic content scanner (no `@source` restriction configured) scans the entire project including markdown, and picked up the literal example string `text-[var(--text-secondary)]` from CLAUDE.md's own prose (the sentence explaining what syntax NOT to use), attempting to generate CSS for it and producing an unparsable `--...` placeholder token that crashed Turbopack's PostCSS pass for every single route (`/`, `/admin/login`, `/admin/invoices` all 500'd — not scoped to invoicing).
- **Fix:** (a) Converted all bracket-syntax classes in the 3 affected files to canonical `text-(--x)`/`bg-(--x)`/`border-(--x)` form — mechanical, no visual change. (b) Added `@source not "../../CLAUDE.md";` and `@source not "../../.planning/**/*.md";` to the top of `src/app/globals.css` so Tailwind's scanner never treats documentation prose as class-name candidates.
- **Files modified:** `src/app/globals.css`, `src/components/ui/Input.tsx`, `src/components/forms/steps/StepApplicantInfo.tsx`, `src/components/forms/steps/StepDomainDetails.tsx`
- **Verification:** Cleared `.next` cache, restarted `npm run dev`; `GET /`, `/admin/login` → 200, `/admin/invoices` → 307 redirect (unauthenticated) — no 500s anywhere. `npx tsc --noEmit` still exits 0 after the fix.
- **Committed in:** `46c6429`
- **Full write-up:** `.planning/phases/04-invoicing/deferred-items.md` ("From 04-04 execution — FIXED")

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking, pre-existing and site-wide — not caused by 04-01/02/03/04's invoicing changes)
**Impact on plan:** Required to make the checkpoint's `npm run dev` verification possible at all. No scope creep — fix was minimal (syntax conversion + 2-line source-scan exclusion), no behavioral/visual change to any page.

## Issues Encountered

None beyond the blocking issue documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both auto tasks (Task 1, Task 2) are complete, committed, and `tsc`-clean.
- **Checkpoint approved.** The owner manually verified the list page (heading, filter links, New Invoice + Export CSV buttons, empty state), the create form (live per-line and invoice-total auto-sum), the create → redirect → list-shows-Draft flow, the CSV export download, and the overdue badge rendering alongside a Sent status badge — all per the plan's `how-to-verify` steps. No follow-up issues reported.
- Plan 04-04 is now fully complete.
- 04-05 (invoice detail page) can build on `src/lib/invoice-status.ts` directly — no changes needed there.

## Checkpoint Verification

**Type:** human-verify
**Result:** Approved — no changes requested.
**Verified:** invoice list page load + filters + empty state, create form live auto-sum, create → redirect → Draft on list, CSV export download, overdue badge alongside Sent badge.

## Self-Check: PASSED

- `src/lib/invoice-status.ts` — FOUND
- `src/app/admin/invoices/page.tsx` — FOUND
- `src/app/admin/invoices/new/page.tsx` — FOUND
- `src/components/forms/InvoiceForm.tsx` — FOUND
- Commit `c508c61` — FOUND in git log
- Commit `e9d5587` — FOUND in git log
- Commit `46c6429` — FOUND in git log
- Commit `4d4973f` — FOUND in git log
- `npx tsc --noEmit` — exits 0 (post-checkpoint final verification)

---
*Phase: 04-invoicing*
*Plan complete — checkpoint approved*
