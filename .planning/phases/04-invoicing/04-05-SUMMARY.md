---
phase: 04-invoicing
plan: 05
subsystem: ui
tags: [invoicing, admin-ui, forms, tailwind-v4, next-router]

# Dependency graph
requires:
  - phase: 04-invoicing plan 02
    provides: "PUT/DELETE /api/admin/invoices/[id] routes (409 draft-lock enforced server-side)"
  - phase: 04-invoicing plan 03
    provides: "PATCH /api/admin/invoices/[id]/status (allowed-transition map), GET /api/admin/invoices/[id]/pdf"
  - phase: 04-invoicing plan 04
    provides: "src/lib/invoice-status.ts (isOverdue, STATUS_BADGE, OVERDUE_BADGE), InvoiceForm.tsx create form, list/new pages"
provides:
  - "/admin/invoices/[id] — invoice detail page: edit-for-Draft (reuses InvoiceForm in edit mode), read-only for Sent/Paid"
  - "src/components/forms/InvoiceStatusActions.tsx — client status-transition + delete button group"
  - "InvoiceForm.tsx extended with initial/invoiceId props for edit mode (PUT instead of POST)"
affects: [phase 5 — reminder/recurring automation will read the same invoices/status data this page displays]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single form component (InvoiceForm) serves both create (POST, no invoiceId) and edit (PUT, invoiceId set) via optional props — avoids a duplicate edit-form component"
    - "Defense-in-depth edit lock: server 409 (04-02) is the authority, but the detail page also conditionally renders InvoiceForm only when status === 'draft', so a non-draft invoice never even mounts an editable form client-side"
    - "Status action buttons are visibility-gated per current status (not shown-then-disabled) so an invalid transition is never clickable"

key-files:
  created:
    - src/components/forms/InvoiceStatusActions.tsx
  modified:
    - src/app/admin/invoices/[id]/page.tsx (new file, detail page)
    - src/components/forms/InvoiceForm.tsx (added initial + invoiceId props, PUT branch)

key-decisions:
  - "InvoiceStatusActions guards double-submit with a single `pending` boolean shared across patch()/del(), and surfaces a 409 as \"Invalid transition.\" vs other failures as a generic error — matches the plan's D-06 transition-map contract without duplicating server logic client-side"
  - "Detail page loads invoice + line items with two plain db.select() queries (no join) since line item count per invoice is small and this is an admin-only, low-traffic read"
  - "Read-only view (Sent/Paid) renders a full line-item table + total rather than reusing InvoiceForm in a disabled state — keeps the edit-lock unambiguous (no disabled-but-visible form fields) per the design_constraints"

patterns-established:
  - "Button-visibility matrix drives InvoiceStatusActions: draft -> [Mark Sent, Delete]; sent -> [Mark Paid, Unpublish]; paid -> [Undo Paid]. No button renders for a transition not currently legal."

requirements-completed: [INVOICE-02, INVOICE-04, INVOICE-05, INVOICE-06]

# Metrics
duration: ~20min (tasks 1-2) + checkpoint verification session
completed: 2026-07-03
---

# Phase 4 Plan 05: Invoice Detail Page Summary

**Invoice detail page at /admin/invoices/[id] closing the lifecycle loop — Draft renders an editable, prefilled InvoiceForm (PUT), Sent/Paid render a read-only line-item view, with status-transition buttons (Mark Sent/Paid/Unpublish/Undo Paid), Draft delete, and a Download PDF link, all gated by requireAdmin().**

## Performance

- **Duration:** ~20 min (Tasks 1-2, auto) + a full human-verify checkpoint session (approved, no rework)
- **Started:** 2026-07-03 (continuation session; Tasks 1-2 were executed and committed in a prior session)
- **Completed:** 2026-07-03
- **Tasks:** 3/3 (2 auto tasks + 1 blocking checkpoint, approved)
- **Files modified:** 2 created/modified in this plan (InvoiceStatusActions.tsx new, page.tsx new, InvoiceForm.tsx extended)

## Accomplishments

- `src/components/forms/InvoiceStatusActions.tsx`: `"use client"` component driving the full status lifecycle — `Mark Sent` (draft→sent), `Mark Paid`/`Unpublish` (sent→paid / sent→draft), `Undo Paid` (paid→sent), and `Delete` (draft only, with a confirm dialog). Each PATCH/DELETE call guards against double-submit via a shared `pending` flag, calls `router.refresh()` on success, and surfaces a specific "Invalid transition." message on a 409.
- `src/app/admin/invoices/[id]/page.tsx`: server component, `requireAdmin()` called first (redirects to `/admin/login` if absent), loads the invoice + ordered line items, shows the computed invoice number (`formatInvoiceNumber`), status badge + a second `OVERDUE_BADGE` when `isOverdue()` is true, a "Paid on {date}" line when `status === "paid"`, `InvoiceStatusActions`, and a `Download PDF` link to `/api/admin/invoices/[id]/pdf`. Body conditionally renders the editable `InvoiceForm` (Draft only) or a read-only client-info + line-items table + total (Sent/Paid).
- `src/components/forms/InvoiceForm.tsx` extended (this plan's third modified file) with two new optional props: `initial?: { clientName; clientEmail; billingAddress; issueDate; dueDate; lineItems: {description; quantity; unitPriceRands}[] }` and `invoiceId?: number`. When `invoiceId` is present, the form prefills its state from `initial` and submits via `PUT /api/admin/invoices/${invoiceId}` instead of `POST /api/admin/invoices`; a 409 response (invoice status changed to non-draft in another tab/session) surfaces "This invoice can no longer be edited."

## Button-visibility matrix (final, as-built)

| Current status | Buttons rendered | Target action |
|---|---|---|
| `draft` | Mark Sent (`.btn-metallic`), Delete (`.btn-glass`, red text) | Mark Sent → PATCH status=`sent`; Delete → confirm → DELETE → redirect to list |
| `sent` (incl. overdue — overdue is computed, not a separate stored status) | Mark Paid (`.btn-metallic`), Unpublish (`.btn-glass`) | Mark Paid → PATCH status=`paid`; Unpublish → PATCH status=`draft` |
| `paid` | Undo Paid (`.btn-glass`) | Undo Paid → PATCH status=`sent` |

Download PDF (`.btn-glass`, links to `/api/admin/invoices/[id]/pdf`) is always shown regardless of status. The edit form only renders when `status === "draft"`; all other statuses render the read-only details block instead (defense-in-depth on top of the server's 409 lock).

## Task Commits

Each task was committed atomically (Tasks 1-2 were completed and committed in the prior session that reached the checkpoint; this session verified them and finalized the plan):

1. **Task 1: InvoiceStatusActions client component** — `dd0b552` (feat)
2. **Task 2: Invoice detail page + InvoiceForm edit-mode extension** — `6e944dd` (feat)
3. **Task 3: Checkpoint: Human verification** — approved this session, no code changes required

## Files Created/Modified

- `src/components/forms/InvoiceStatusActions.tsx` — status-transition + delete button group, PATCH/DELETE + router.refresh()/router.push()
- `src/app/admin/invoices/[id]/page.tsx` — detail page, auth-guarded, edit-for-Draft / read-only otherwise
- `src/components/forms/InvoiceForm.tsx` — added `initial`/`invoiceId` props, PUT branch, 409 edit-lock handling

## Decisions Made

- No changes requested at the checkpoint — the owner verified the entire lifecycle (edit Draft → Mark Sent with number assignment → PDF download with correct SARS labeling and no VAT row → Mark Paid → Undo Paid → Draft delete → overdue badge on a past-due Sent invoice) and approved as-built. No rework, no deviations beyond what was already recorded in Tasks 1-2's commits.
- Kept the read-only Sent/Paid view as a dedicated block (not a disabled `InvoiceForm`) — see `key-decisions` in frontmatter.

## Deviations from Plan

None new in this finalization session. (Tasks 1-2 themselves reported no deviations when originally executed — see commit messages `dd0b552`/`6e944dd`; both were pure `feat` commits with no auto-fixes.)

## Issues Encountered

- **Pre-existing, out-of-scope vitest breakage discovered during this plan's final verification pass:** `npx vitest run` (project-wide, not just `src/app/api/admin/invoices`) fails all 21 test files with `Error: Vitest failed to find the runner`. Isolated via `git stash` to a fully clean checkout at the last committed hash (`6e944dd`) — the failure reproduces identically with zero working-tree changes, proving it is NOT caused by this plan's Task 1/2 changes (neither touches a test file or the vitest toolchain) and is NOT specific to invoice routes. A `node_modules/.vite` cache clear did not resolve it either. Root cause not conclusively isolated within the fix-attempt budget; a plausible but unproven contributing factor is the pre-existing, uncommitted `package.json`/`package-lock.json` drift on this branch (a `pg`/`@types/pg` addition with unusual `peer: true`/`devOptional: true` lockfile entries) that this plan was explicitly instructed not to touch. Logged in full in `.planning/phases/04-invoicing/deferred-items.md` under "From 04-05 execution — deferred, out of scope."
  - **Substitute verification used:** `npx tsc --noEmit` (exits 0 — full type-safety check across the new detail page, status actions component, and extended `InvoiceForm`) plus the human-verify checkpoint, which exercised the full invoice lifecycle in a real browser against a running dev server (a path that does not go through vitest at all) and was approved with zero issues.
  - **Recommendation:** a maintainer should run `npm ci` from a clean `node_modules` (or otherwise resolve the `package.json`/`package-lock.json` drift) and re-run `npx vitest run` before relying on the test suite again; this is unrelated to invoicing code and should be tracked as its own fix, not blocked on this plan.

## User Setup Required

**Carried over from 04-01 (still outstanding, unrelated to this plan's UI work):** the owner must run `npm run db:migrate` (via `netlify dev:exec`) against the **live/production** database before invoicing is usable there. All of Phase 4 (04-01 through 04-05) was built and tested against a local dev Postgres; the migration (`netlify/database/migrations/0003_invoices.sql`) was generated and journal-registered but deliberately never run against production, since that requires the live `NETLIFY_DATABASE_URL`. Production still uses the unmodified `neon-http` driver (the `src/lib/db/index.ts`/`tx.ts` changes currently sitting unstaged in the working tree are local-dev-only and explicitly out of scope for this plan — not committed, not touched).

**@react-pdf/renderer mitigation status (carried over from 04-01):** none needed. 04-01's smoke test proved `renderToBuffer` works cleanly on Next.js 16 with no `serverExternalPackages` config change required; this held true through 04-03 (the real `InvoiceDocument` PDF route) and was re-verified at this plan's checkpoint (Download PDF produced a correct PDF with SARS-compliant "Invoice"/"Draft Invoice" labeling, no VAT row).

## Next Phase Readiness

- **Phase 4 (invoicing) is now 5/5 plans complete.** The full invoice lifecycle — create (04-04), edit/view/status-transition/delete/PDF (04-05), server-side enforcement + PDF generation + CSV export (04-01/02/03) — is built, human-verified end-to-end, and committed.
- Known outstanding items before invoicing is usable in production: (1) run `npm run db:migrate` against the live DB (see User Setup Required above); (2) fill in real EFT/bank details in `InvoiceDocument.tsx`'s footer (currently bracketed placeholders — see STATE.md decision log); (3) the SPF-record cleanup deferred to "Phase 4 live" per STATE.md pending todos.
- Phase 5 (Scheduled Automation) can now build reminder/recurring-invoice logic on top of a complete, stable `invoices`/`invoiceLineItems` schema and status lifecycle — no further invoicing UI/API work is needed as a prerequisite.
- The pre-existing vitest tooling breakage (see Issues Encountered) should be resolved before Phase 5's automation logic is written with TDD, since that phase will need a working test runner.

## Checkpoint Verification

**Type:** human-verify
**Result:** Approved — all 6 verification steps confirmed working, including the overdue badge behaving correctly once an invoice is marked Sent with a past due date.
**Verified:** editable Draft form (prefilled, live total update on line-item change), Mark Sent → number assignment + read-only switch, Download PDF (Sent invoice — "Invoice" heading, correct number, no VAT row, bank details + footer present), Mark Paid → paid timestamp + Undo Paid availability, Draft PDF ("Draft Invoice" heading, no number) + Draft delete removes it from the list, red Overdue badge on a past-due Sent invoice (list + detail).

## Self-Check: PASSED

- `src/components/forms/InvoiceStatusActions.tsx` — FOUND
- `src/app/admin/invoices/[id]/page.tsx` — FOUND
- `src/components/forms/InvoiceForm.tsx` (invoiceId/initial props) — FOUND
- Commit `dd0b552` — FOUND in git log
- Commit `6e944dd` — FOUND in git log
- `npx tsc --noEmit` — exits 0
- `npx vitest run src/app/api/admin/invoices` — FAILED (pre-existing, project-wide, out-of-scope tooling issue; see Issues Encountered and deferred-items.md)

---
*Phase: 04-invoicing*
*Plan complete — checkpoint approved — Phase 4 now 5/5 plans complete*
