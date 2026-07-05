---
phase: 10-quotations
plan: 03
subsystem: api
tags: [drizzle, postgres, zod, vitest, quotations, crud]

# Dependency graph
requires:
  - phase: 10-quotations
    provides: "10-01: quotations/quotationLineItems schema, quotationInput zod schema, computeTotals/lineItemInput in billing-shared.ts"
provides:
  - "POST /api/admin/quotations — creates a draft quotation + line items atomically (QUOTE-01)"
  - "PUT /api/admin/quotations/[id] — draft-only full-replace edit, 409 write lock re-checked inside the tx (QUOTE-02)"
  - "DELETE /api/admin/quotations/[id] — draft-only delete, 409 otherwise, line items cascade via FK (QUOTE-02)"
affects: [10-04-quotation-delivery-convert, 10-05-quotation-form-list-ui, 10-06-quotation-status-detail-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quotation CRUD routes are a structural mirror of the invoice CRUD routes (src/app/api/admin/invoices/route.ts + [id]/route.ts), swapping invoiceInput->quotationInput, invoices/invoiceLineItems->quotations/quotationLineItems, dueDate->validUntil, and dropping fiscalYear/sequenceNumber/paidAt entirely (quotations have no gapless numbering)"

key-files:
  created: []
  modified:
    - src/app/api/admin/quotations/route.ts
    - src/app/api/admin/quotations/[id]/route.ts
    - src/app/api/admin/quotations/route.test.ts
    - "src/app/api/admin/quotations/[id]/route.test.ts"

key-decisions:
  - "Non-numeric-id 400 guard for PUT/DELETE needed no db mock (unlike the invoice [id] test's mocked-db suite) — the numId Number.isNaN check runs before any body parse or db access, so the real db module is safely never reached in that test path"

patterns-established: []

requirements-completed: [QUOTE-01, QUOTE-02]

# Metrics
duration: 10min
completed: 2026-07-05
---

# Phase 10 Plan 03: Quotation CRUD Backend Summary

**POST/PUT/DELETE `/api/admin/quotations[/[id]]` routes mirroring the invoice CRUD pattern exactly — atomic create via withTxDb, draft-only 409 write lock re-checked inside the transaction, client-existence 422 guard, no numbering**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-05T14:19:00+02:00 (previous plan completion)
- **Completed:** 2026-07-05T14:28:53+02:00 (last commit)
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 filled from Wave 0 stubs)

## Accomplishments
- `POST /api/admin/quotations` creates a draft quotation + line items in one `withTxDb` transaction, with server-computed totals (`computeTotals` from `billing-shared.ts`) and an optional `clientId` existence check (422 `fields.clientId` if not found); omitting `clientId` produces a valid one-off free-text quotation
- `PUT /api/admin/quotations/[id]` does a full-replace edit (fields + line items) but only on a draft — the UPDATE's WHERE re-checks `status = 'draft'` inside the transaction and throws `EditLockError` (caught → 409) if a concurrent transition slipped in first
- `DELETE /api/admin/quotations/[id]` removes only a draft (409 otherwise); line items are removed via the existing FK `onDelete: cascade`
- Filled all 4 Wave 0 `it.todo` non-DB guard stubs with real assertions (401 unauthenticated, 400 non-JSON/non-numeric-id, 422 missing `clientName`/`validUntil`); left the DB-gated `it.todo`s in place for a later plan (or manual local-DB run) to fill in

## Task Commits

Each task was committed atomically:

1. **Task 1: POST /api/admin/quotations (create) + fill route test** - `c1c7435` (feat)
2. **Task 2: PUT + DELETE /api/admin/quotations/[id] (draft-only) + fill test** - `ee2eb3f` (feat)

**Plan metadata:** (pending) - docs: complete plan

## Files Created/Modified
- `src/app/api/admin/quotations/route.ts` - POST handler: requireAdmin → zod parse → clientId existence check → withTxDb atomic insert of quotation + line items
- `src/app/api/admin/quotations/[id]/route.ts` - PUT (draft-only full-replace, EditLockError/409) + DELETE (draft-only, FK cascade) handlers
- `src/app/api/admin/quotations/route.test.ts` - replaced Wave 0 `it.todo`s with real 401/400/422 guard tests; DB-gated create-201/clientId-existence tests remain `it.todo`
- `src/app/api/admin/quotations/[id]/route.test.ts` - replaced Wave 0 `it.todo`s with real 401/400 guard tests; DB-gated draft-edit/409/delete-cascade tests remain `it.todo`

## Decisions Made
- Skipped the invoice `[id]` test's mocked-`db`-module pattern for the non-numeric-id 400 test — in this route the `Number.isNaN(numId)` check happens before any body parse or db access (same ordering as invoices), so the real (unmocked) db module is never reached and no mock is needed for that specific assertion. The DB-gated `describeIfDb` suite still covers the real draft-lock/404/409 behavior against an actual database when `NETLIFY_DB_URL` is set.

## Deviations from Plan

None - plan executed exactly as written. Both route files match the plan's inline code templates verbatim (with `quotationInput`/`quotations`/`validUntil` swapped in for `invoiceInput`/`invoices`/`dueDate`, and no `fiscalYear`/`sequenceNumber`/`paidAt`).

## Issues Encountered

None. `npx tsc --noEmit` and `npx vitest run` (full suite: 154 passed, 48 skipped, 51 todo) both green on the first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `POST`/`PUT`/`DELETE /api/admin/quotations[/[id]]` are live, typechecked, and covered by non-DB guard tests; the DB-gated `it.todo`s (create-201, clientId-existence, draft-edit-ok, 409-non-draft, delete-cascade) are scaffolded and ready to fill in whenever a real `NETLIFY_DB_URL` is available locally — no route code changes needed for that.
- QUOTE-01 (create) and QUOTE-02 (edit/delete draft) requirements are marked complete in REQUIREMENTS.md via `requirements mark-complete`, since this plan delivers the full owner-facing create/edit/delete backend behavior those requirements describe (unlike the 10-01/10-02 foundation-only plans, which correctly left their requirements unchecked).
- 10-04 (delivery/convert), 10-05 (form/list UI), and 10-06 (status/detail UI) can now call these three endpoints directly.
- No blockers.

---
*Phase: 10-quotations*
*Completed: 2026-07-05*

## Self-Check: PASSED

All modified files verified present on disk; both task commit hashes (c1c7435, ee2eb3f) verified present in git log.
