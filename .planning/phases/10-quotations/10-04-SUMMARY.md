---
phase: 10-quotations
plan: 04
subsystem: api
tags: [drizzle, withTxDb, resend, react-pdf, quotations, next-app-router, vitest]

# Dependency graph
requires:
  - phase: 10-quotations
    provides: "quotations schema + ALLOWED_TRANSITIONS/converted_invoice_id (10-01), generateQuotationPdfBuffer (10-02), quotation CRUD backend (10-03)"
  - phase: 08-linked-invoicing-delivery
    provides: "status route email-on-send + 422 no_client_email + resend-route pattern to mirror (08-04)"
  - phase: 06-clients-entity-crm-integration
    provides: "withTxDb + AlreadyConvertedError-thrown-inside-the-tx idempotency pattern (06-04)"
provides:
  - "PATCH /api/admin/quotations/[id]/status — lifecycle transitions (ALLOWED_TRANSITIONS, accepted terminal) + best-effort email-on-send with 422 no_client_email guard"
  - "POST /api/admin/quotations/[id]/resend — re-emails the current quotation PDF, no status mutation"
  - "POST /api/admin/quotations/[id]/convert — accepted quotation to new draft invoice via withTxDb, race-proof idempotency via converted_invoice_id"
affects: [10-06-quotation-status-detail-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status route omits the invoice route's gapless-numbering UPDATE entirely — quotations are not a SARS fiscal document, so a plain db.update(quotations).set({ status }) replaces the invoice route's atomic sequence_number SQL block"
    - "Convert route mirrors 06-04's select-check -> insert child rows -> update parent back-link shape, but inside one db.transaction(async (tx) => ...) covering quotation read, invoice insert, line-item insert, AND the converted_invoice_id stamp"

key-files:
  created:
    - "src/app/api/admin/quotations/[id]/status/route.ts"
    - "src/app/api/admin/quotations/[id]/resend/route.ts"
    - "src/app/api/admin/quotations/[id]/convert/route.ts"
  modified:
    - "src/app/api/admin/quotations/[id]/status/route.test.ts"
    - "src/app/api/admin/quotations/[id]/resend/route.test.ts"
    - "src/app/api/admin/quotations/[id]/convert/route.test.ts"

key-decisions:
  - "Did NOT mark QUOTE-03/QUOTE-04/QUOTE-05 complete in REQUIREMENTS.md — this plan delivers only the backend routes; all three requirements are phrased as owner-facing actions (\"Owner can mark a quotation Sent\", \"Owner can track...\", \"Owner can convert...in one click\") that need 10-06's QuotationStatusActions UI to actually trigger these routes from the admin portal. Mirrors the 06-01/06-02/08-01/08-02/10-01/10-02 correction pattern already logged in STATE.md."
  - "Non-DB guard tests follow the invoice status route's exact convention (real signSession() for the authed 400/422 cases, makeRequest/params helpers) rather than a fake session-token string, since requireAdmin() fully verifies JWTs and a fake token would still 401 before reaching the id/body validation the test is meant to exercise."

patterns-established:
  - "Quotation delivery/conversion routes are near-verbatim structural mirrors of their invoice counterparts, with exactly two deltas: no gapless numbering (status route) and terminal `accepted` status enforced by ALLOWED_TRANSITIONS (no invoice equivalent)."

requirements-completed: []

# Metrics
duration: 14min
completed: 2026-07-05
---

# Phase 10 Plan 04: Quotation Delivery + Conversion Backend Summary

**PATCH .../status (ALLOWED_TRANSITIONS enforcement + best-effort email-on-send with 422 no_client_email, no gapless numbering), POST .../resend (re-email current PDF, zero status mutation), and POST .../convert (accepted quotation to draft invoice via withTxDb, race-proof converted_invoice_id idempotency) — all three routes are near-verbatim structural mirrors of their Phase 8/Phase 6 counterparts.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-05T14:33:00+02:00 (first commit)
- **Completed:** 2026-07-05T14:47:00+02:00 (last commit)
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- `PATCH /api/admin/quotations/[id]/status` enforces `ALLOWED_TRANSITIONS` from `quotation-status.ts` (409 on any transition not in the map, `accepted` fully terminal), blocks any transition into `sent` with 422 `no_client_email` when `clientEmail` is null, and on a successful draft→sent transition emails the quotation PDF (`generateQuotationPdfBuffer`, labeled "Quotation", `QUO-{id}` reference) best-effort via `sendEmail` after the status commits — no gapless-numbering side effect anywhere in the route (Pitfall 5 avoided by construction, not by deletion, since this was written fresh from the invoice template rather than copy-pasted).
- `POST /api/admin/quotations/[id]/resend` re-emails the current quotation's PDF (409 if not `sent`, 422 `no_client_email` if no client email) with zero `.update(quotations)` calls anywhere in the route — confirmed by grep count 0.
- `POST /api/admin/quotations/[id]/convert` wraps the entire read-check/insert/insert/stamp sequence in one `withTxDb((db) => db.transaction(...))` call: selects the quotation, throws `AlreadyConvertedError` inside the tx if `converted_invoice_id` is already set (race-proof — checked inside the transaction, not pre-checked outside it), throws `InvalidStateError` if not `accepted`, inserts a new draft invoice (client_id/clientName/clientEmail/billingAddress carried over, 30-day due date, `totalRands` copied), inserts copied `invoiceLineItems`, and stamps `quotations.converted_invoice_id` — all mapped to 409/409/404 respectively outside the tx.
- All three routes' non-DB guard tests (401 without a session, 400 for a non-numeric id when authed, plus a 422-invalid-enum case for the status route) are real assertions using the established `signSession()` + `makeRequest`/`params` helper convention from the invoice route tests; DB-gated transition/email/conversion cases remain `it.todo()` under `describeIfDb`, per plan instruction.

## Task Commits

Each task was committed atomically:

1. **Task 1: PATCH status route (transitions + email-on-send) + fill test** - `4298510` (feat)
2. **Task 2: POST resend route (re-email current PDF) + fill test** - `63ce8d3` (feat)
3. **Task 3: POST convert route (accepted quotation → draft invoice) + fill test** - `2256a1e` (feat)

**Plan metadata:** (pending) - docs: complete plan

_Note: no TDD tasks in this plan — all three were single-commit `auto` tasks, matching the plan's own task typing._

## Files Created/Modified
- `src/app/api/admin/quotations/[id]/status/route.ts` - `PATCH` handler: `ALLOWED_TRANSITIONS` enforcement, 422 `no_client_email` guard, best-effort email-on-send via `generateQuotationPdfBuffer` + `sendEmail`, no numbering block
- `src/app/api/admin/quotations/[id]/status/route.test.ts` - filled non-DB guards (401, 400 non-numeric id, 422 invalid enum), function-form `vi.mock("resend")` kept from the Wave 0 stub
- `src/app/api/admin/quotations/[id]/resend/route.ts` - `POST` handler: 404/409/422 guards, re-emails current PDF, zero status mutation
- `src/app/api/admin/quotations/[id]/resend/route.test.ts` - filled non-DB guards (401, 400 non-numeric id)
- `src/app/api/admin/quotations/[id]/convert/route.ts` - `POST` handler: single `withTxDb` transaction, `AlreadyConvertedError`/`InvalidStateError` thrown inside the tx, draft invoice + line items + `converted_invoice_id` stamp
- `src/app/api/admin/quotations/[id]/convert/route.test.ts` - filled non-DB guards (401, 400 non-numeric id)

## Decisions Made
- Did not mark QUOTE-03/QUOTE-04/QUOTE-05 complete in REQUIREMENTS.md — this plan only builds the backend routes those requirements depend on; all three are phrased as owner-facing actions requiring 10-06's UI wiring to actually trigger them from the admin portal. Left all three unchecked/"Pending", consistent with the correction pattern already logged for 06-01/06-02/08-01/08-02/10-01/10-02 in STATE.md.
- Followed the invoice status route test's exact non-DB-guard convention (`signSession()` for real authed requests, `makeRequest`/`params` helpers) instead of a placeholder fake session-token string, since `requireAdmin()` fully verifies the JWT and a malformed token would 401 before the id/body-validation logic the test targets is ever reached.

## Deviations from Plan

None - plan executed exactly as written. All acceptance-criteria greps (ALLOWED_TRANSITIONS, no_client_email, generateQuotationPdfBuffer, zero numbering/update-status calls, AlreadyConvertedError, converted_invoice_id, 30-day due-date math) matched on the first pass; no auto-fixes were needed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. `RESEND_API_KEY` was already a required env var from prior phases; no new env vars introduced.

## Next Phase Readiness

- All three routes (`status`, `resend`, `convert`) are stable and ready for 10-06's `QuotationStatusActions` UI to wire up: draft→sent/accept/decline/revert transitions, re-send, and one-click convert.
- `npx tsc --noEmit` clean; full `npx vitest run` suite green (161 passed, 48 skipped, 45 todo).
- Manual end-to-end verification (real Resend send + inbox check under `netlify dev`) not performed in this automated execution — recommended before considering QUOTE-03/04/05 fully verified live, matching the same recommendation left on 08-04.
- No blockers for 10-05 (form/list UI) or 10-06 (status/detail UI) — both can build directly against these three routes.

---
*Phase: 10-quotations*
*Completed: 2026-07-05*

## Self-Check: PASSED

- FOUND: src/app/api/admin/quotations/[id]/status/route.ts
- FOUND: src/app/api/admin/quotations/[id]/resend/route.ts
- FOUND: src/app/api/admin/quotations/[id]/convert/route.ts
- FOUND commit: 4298510
- FOUND commit: 63ce8d3
- FOUND commit: 2256a1e
