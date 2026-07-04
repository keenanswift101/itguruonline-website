---
phase: 05-scheduled-automation
plan: 06
subsystem: admin-ui
tags: [zod, drizzle, react, next.js, site-settings]

# Dependency graph
requires:
  - phase: 05-01
    provides: site_settings rows for enquiry_stale_days (default 7) and invoice_overdue_reminder_days (default 1), seeded via 0004_automation.sql migration
  - phase: 05-02
    provides: runEnquiryReminderJob/runInvoiceReminderJob read these two site_settings keys at runtime
provides:
  - SiteSettingsForm two new number inputs (Stale Enquiry Reminder days, Overdue Invoice Reminder days) using the existing per-field blur-to-save pattern with SaveIndicator
  - PATCH /api/admin/pricing/settings accepts enquiry_stale_days and invoice_overdue_reminder_days (added to ALLOWED_KEYS + zod PatchSchema with z.coerce.number().int().min(1).max(365))
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Numeric site-settings fields still transmit their value as a string in the PATCH body (matching the existing named-field body shape), and the route coerces via z.coerce.number() then re-stringifies with String(value) before the DB write, since site_settings.value is a text column"

key-files:
  created: []
  modified:
    - src/app/admin/pricing/SiteSettingsForm.tsx
    - src/app/api/admin/pricing/settings/route.ts

key-decisions:
  - "The plan's <interfaces> section assumed a generic { key, value } PATCH body and a SiteSettingsForm at src/components/admin/SiteSettingsForm.tsx -- neither matched reality. The actual component lives at src/app/admin/pricing/SiteSettingsForm.tsx and PATCHes with a named-field body ({ contact_email: '...' }) validated by a zod object schema with a per-key allow-list; per deviation rules and the plan's own STEP 1 instruction ('do not invent a new pattern'), the two new fields follow this real pattern exactly instead of the plan's illustrative example"
  - "Added z.coerce.number().int().min(1).max(365) bounds for both new settings (not specified numerically in the plan) to prevent a 0/negative/absurdly-large day count from being persisted and silently breaking the two automation jobs' date-math"

patterns-established: []

requirements-completed: [AUTOMATE-01, AUTOMATE-02]

# Metrics
duration: ~10min
completed: 2026-07-04
---

# Phase 05 Plan 06: Site Settings Automation Threshold Fields Summary

**Two owner-configurable number inputs (Stale Enquiry Reminder days, Overdue Invoice Reminder days) added to the existing admin Site Settings card, wired to the pre-existing named-field PATCH /api/admin/pricing/settings route with zod-validated 1-365 day bounds.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-04T06:31:07Z (approx, per STATE.md session continuity)
- **Completed:** 2026-07-04T06:36:00Z (approx)
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `SiteSettingsForm.tsx` extended with two new fields (`enquiry_stale_days`, `invoice_overdue_reminder_days`), each a `type="number" min="1"` input following the component's existing per-field local-state + diff-checked-onBlur-save + `SaveIndicator` pattern (not the plan's illustrative generic-PATCH example)
- `PATCH /api/admin/pricing/settings` route's `ALLOWED_KEYS` and zod `PatchSchema` extended to accept both new keys, each validated with `z.coerce.number().int().min(1).max(365)` and re-stringified with `String(value)` before the `db.update(siteSettings)` write (the column is `text`)
- `npx tsc --noEmit` clean; `npx vitest run` passes (27 test files, 119 passed / 47 skipped / 3 todo) — no regressions from Plans 05-02/05-03/05-04's automation job/route/scheduled-function work

## Task Commits

Each task was committed atomically:

1. **Task 1: Read Phase 3 SiteSettingsForm and PATCH route, then extend both** - `6136292` (feat)
2. **Task 2: Verify full test suite still passes** - no code changes required (verification-only; `npx vitest run` and `npx tsc --noEmit` both passed clean on the first run, no regressions found)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/app/admin/pricing/SiteSettingsForm.tsx` - Two new number-input fields for the automation reminder thresholds, reusing the existing blur-to-save/SaveIndicator pattern
- `src/app/api/admin/pricing/settings/route.ts` - `ALLOWED_KEYS` and `PatchSchema` extended to accept `enquiry_stale_days`/`invoice_overdue_reminder_days` (coerced, bounded 1-365, re-stringified on write)

## Decisions Made
- Followed the real, already-shipped SiteSettingsForm pattern (named-field PATCH body, per-field `save()` helper with a same-value no-op guard and a `SaveIndicator`) rather than the plan's illustrative `{ key, value }` example, per the plan's own instruction to match existing code exactly and not invent a new pattern.
- Added explicit `min(1).max(365)` zod bounds on both new numeric settings — the plan didn't specify an upper bound, but leaving it unbounded would let a stray large value silently break the two reminder jobs' date arithmetic (e.g., a multi-year "stale" cutoff or overdue window). 365 comfortably covers any realistic reminder cadence while rejecting clearly invalid input.
- Numeric values are still transmitted and matched against `originalValue` as strings client-side (consistent with how `contact_email`/`hosting_setup_fee_note` already work and how `site_settings.value` is stored), with `z.coerce.number()` doing the numeric validation server-side and `String(value)` converting back before the DB write.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/Incorrect plan assumption] SiteSettingsForm location and PATCH body shape corrected**
- **Found during:** Task 1 (locating and reading the actual Phase 3 files)
- **Issue:** The plan's `<interfaces>` section stated the component lives at `src/components/admin/SiteSettingsForm.tsx` and that the PATCH route accepts a generic `{ key: string, value: string }` body with a `const ALLOWED_KEYS` flat string array. Neither matched the real Phase 3 implementation: the component is at `src/app/admin/pricing/SiteSettingsForm.tsx`, and the route validates a zod object with one optional field per settings key (`{ contact_email?: string, hosting_setup_fee_note?: string }`), with `ALLOWED_KEYS` used only to iterate `parsed.data` after schema validation, not to gate a generic key/value body.
- **Fix:** Implemented both new fields using the real named-field body shape and the real component's local-state/diff-check/`SaveIndicator` pattern instead of the plan's example code. Extended the real zod schema (adding `z.coerce.number().int().min(1).max(365).optional()` for each new key) instead of inventing a generic value-passthrough.
- **Files modified:** src/app/admin/pricing/SiteSettingsForm.tsx, src/app/api/admin/pricing/settings/route.ts
- **Verification:** `npx tsc --noEmit` clean; existing route.test.ts guard tests (401-before-validation, 401-for-unknown-keys) still pass unchanged since they only exercise the auth-gate path, which this change doesn't touch
- **Committed in:** 6136292 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (bug/incorrect plan assumption about file location and API body shape)
**Impact on plan:** Necessary correction — the plan's illustrative code would not have compiled against or matched the real, already-shipped Phase 3 SiteSettingsForm/route. No scope creep: same two settings keys, same two labels, same days-based validation intent as specified.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required. Both `site_settings` rows (`enquiry_stale_days=7`, `invoice_overdue_reminder_days=1`) were already seeded by Plan 05-01's migration; this plan only adds the UI/API surface to edit them.

## Next Phase Readiness
- Phase 5 (Scheduled Automation) is now fully implemented across all 6 plans: schema/migration (05-01), job modules (05-02), admin trigger route (05-03), Netlify Scheduled Functions (05-04), and this plan's owner-configurable threshold UI (05-06). Plan 05-05 remains unexecuted as of this plan's completion (no 05-05-SUMMARY.md on disk) — confirm its status before considering Phase 5 fully closed out.
- No blockers. Owner can now change both reminder cadences from `/admin/pricing` without a code deploy, per D-04.

---
*Phase: 05-scheduled-automation*
*Completed: 2026-07-04*

## Self-Check: PASSED

`src/app/admin/pricing/SiteSettingsForm.tsx` and `src/app/api/admin/pricing/settings/route.ts` verified present on disk with the new fields/keys. Task 1 commit `6136292` verified present in `git log`. `npx tsc --noEmit` exits 0. `npx vitest run` passes (27 test files, 119 passed, 47 skipped, 3 todo, 0 failed).
