# Phase 5: Scheduled Automation — Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 adds three scheduled automations that run unattended on production: stale-enquiry reminders, overdue-invoice reminders, and recurring invoice generation. Each automation has a manually-triggerable admin UI equivalent for testing on the `dev` branch (Netlify Scheduled Functions don't run on non-production branches). The owner configures reminder thresholds via the existing site_settings admin UI.

**In scope:**
- `billing_schedules` table — tracks active hosting clients and their billing cycle
- `automation_runs` table — tracks last run time and result per job (for admin UI display)
- Phase 5 DB migration: extends `invoices` table with `billing_schedule_id` + `billing_period_start` columns + unique constraint
- Seeds two new `site_settings` keys: `enquiry_stale_days` + `invoice_overdue_reminder_days`
- 3 Netlify Scheduled Functions: enquiry reminder (daily), overdue invoice reminder (daily), recurring billing (monthly 1st)
- 3 shared job logic modules in `src/lib/automation/` (imported by both the Scheduled Function AND the admin trigger endpoint)
- 3 admin trigger API routes: `POST /api/admin/automations/[job]/run` with `requireAdmin()`
- Admin `/admin/automations` page with per-job cards, Run Now buttons, and last-run summary
- Phase 3 SiteSettingsForm extended with the two new threshold fields

**Out of scope:** Multi-cadence dunning (AUTOMATE-06, v2+), auto status transitions (AUTOMATE-05, v2+), payment gateway, client-facing notifications.

</domain>

<decisions>
## Implementation Decisions

### Billing Client Data Model
- **D-01:** Active hosting clients are tracked in a new **`billing_schedules` table** — not inferred from CRM registration status. Columns: `id SERIAL PK`, `client_name VARCHAR(128) NOT NULL`, `client_email VARCHAR(256)`, `package_id INT REFERENCES hosting_packages(id)`, `billing_start DATE NOT NULL`, `cycle VARCHAR(8) NOT NULL DEFAULT 'monthly'` (only 'monthly' in scope), `is_active BOOLEAN NOT NULL DEFAULT true`, `created_at`, `updated_at`. The owner manually creates and manages billing schedule rows via a basic CRUD UI on the `/admin/automations` page (or a sub-page `/admin/billing-schedules`). No FK from billing_schedules to CRM client_registrations (decoupled by design — not all clients are registered via the wizard).
- **D-02:** The `invoices` table gains two columns in the Phase 5 migration: `billing_schedule_id INT REFERENCES billing_schedules(id) ON DELETE SET NULL` (nullable — NULL for manually created invoices) and `billing_period_start DATE` (nullable — set only by the recurring billing job). A unique constraint `UNIQUE (billing_schedule_id, billing_period_start)` is added as `invoices_recurring_unique`. These two columns are the link between auto-generated invoices and their billing schedule.

### Idempotency (Recurring Billing)
- **D-03:** Duplicate prevention is **DB-enforced** via the unique constraint `UNIQUE (billing_schedule_id, billing_period_start)` (D-02). The recurring billing job uses `INSERT ... ON CONFLICT (billing_schedule_id, billing_period_start) DO NOTHING`. Safe under concurrent execution and safe on retry — no application-level check needed. A row is either inserted or silently skipped; the job then counts how many were actually inserted to report in the run summary.

### Reminder Threshold Configuration
- **D-04:** Reminder thresholds are stored in the **`site_settings` table** (created in Phase 3). Phase 5 migration seeds two new rows:
  - `enquiry_stale_days` → `'7'` (default: remind if no enquiry status change in 7 days)
  - `invoice_overdue_reminder_days` → `'1'` (default: remind 1 day after due date passes)
  Both are INTEGER-valued TEXT rows (parse with `parseInt`). The Phase 3 `SiteSettingsForm` component is extended with two new input fields for these keys — same inline-edit/auto-save-on-blur pattern as Phase 3. No separate UI section needed; they fit in the existing Site Settings panel.

### Manual Trigger (Dev Testing)
- **D-05:** Each scheduled automation has a corresponding **admin "Run Now" button** on the `/admin/automations` page. The button POSTs to `POST /api/admin/automations/[job]/run` (where job is `enquiry-reminder` | `invoice-reminder` | `recurring-billing`). The trigger endpoint is `requireAdmin()`-protected. The shared job logic lives in `src/lib/automation/[job].ts` and is imported by BOTH the trigger route AND the Netlify Scheduled Function — the scheduled function is a thin wrapper that calls the same logic. Result (e.g. "3 emails sent" / "2 invoices created") is returned from the trigger endpoint and displayed inline on the admin page.
- **D-06:** The `/admin/automations` page shows 3 job cards (one per automation) + a Billing Schedules section listing active billing_schedules rows with Add/Edit/Deactivate controls. Each job card shows: job name, schedule (human-readable: "Daily at 08:00"), last run timestamp, last run summary, and a "Run Now" button.

### Netlify Scheduled Functions
- **D-07:** Three Netlify Scheduled Functions live in `netlify/functions/`:
  - `enquiry-reminder.mts` — cron: `"0 8 * * *"` (daily 08:00 UTC)
  - `invoice-overdue-reminder.mts` — cron: `"0 8 * * *"` (daily 08:00 UTC)
  - `recurring-billing.mts` — cron: `"0 7 1 * *"` (monthly, 1st of month 07:00 UTC)
  All use the new Netlify Functions v2 export format: `export default async (req: Request, context: Context) => { ... }` + `export const config = { schedule: "0 8 * * *" }`. Functions call `src/lib/automation/[job].ts` shared logic, which reads DB + sends emails via Resend (existing `src/lib/email.ts`).
- **D-08:** Last-run tracking uses an **`automation_runs` table**: `id SERIAL PK`, `job_name VARCHAR(32) NOT NULL`, `ran_at TIMESTAMP WITH TIME ZONE NOT NULL`, `triggered_by VARCHAR(16) NOT NULL` ('scheduled' | 'manual'), `status VARCHAR(8) NOT NULL` ('success' | 'error'), `result_summary TEXT`, `error_message TEXT`. The admin page reads the most recent row per job_name to display last run info. Retention: last 100 rows per job (pruned on insert).

### Email Content
- **D-09 (Claude's discretion area clarified):** Reminder emails go to the owner only (`ambrose@it-guru.co.za` — same as all admin emails per existing security constraint in `src/lib/email.ts`). Not to the client. Email content:
  - Enquiry reminder: subject "Stale Enquiry Reminder — {count} enquiry(ies) need attention", lists record name + last-status-changed date
  - Invoice reminder: subject "Overdue Invoice Reminder — Invoice {number} is overdue", one email per overdue invoice
  - Recurring billing: no email — just creates the invoice; the owner sends it manually when ready

### Claude's Discretion
- Exact `/admin/automations` page layout (separate Billing Schedules sub-section vs inline vs own page)
- Billing schedule CRUD form fields and validation (package_id dropdown from Phase 3 hosting_packages)
- Admin UI for adding/editing billing schedules (inline edit matching Phase 3 pricing table pattern, or a modal)
- Whether `recurring-billing` job creates Draft invoices (recommended) or Sent invoices (more aggressive)
- Email HTML template for reminder emails (reuse existing `emailLayout()` from `src/lib/email.ts`)
- automation_runs pruning mechanism (ON INSERT trigger vs job-level cleanup)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Layer
- `src/lib/db/schema.ts` — Extend with `billingSchedules`, `automationRuns` tables; extend `invoices` table via Drizzle migration
- `src/lib/db/index.ts` — Lazy proxy DB client (import `db`)
- `drizzle.config.ts` — Migration out dir: `netlify/database/migrations/`
- `netlify/database/migrations/0001_pricing_tables.sql` (Phase 3 migration reference)
- **Phase 4 migration** (created by Phase 4 plans): `0002_invoices.sql` — invoices schema. Phase 5 migration is `0003_automation.sql`

### Netlify Scheduled Functions
- Netlify Scheduled Functions v2 format: `export default async (req: Request, context: Context) => {}` + `export const config = { schedule: "..." }`
- Existing Netlify functions live in `netlify/functions/` (check for any existing functions there)
- `netlify.toml` — verify `[functions]` section includes `netlify/functions/`

### Email
- `src/lib/email.ts` — `emailLayout()`, `sendEmail()`, and the security constraint: all admin emails go to `ambrose@it-guru.co.za` ONLY, never to the user-provided email address
- `RESEND_API_KEY` environment variable (already set on Netlify from Phase 1)

### Existing Admin Patterns
- `src/lib/auth.ts` — `requireAdmin()` — first call in every new admin page and API route
- `src/app/admin/layout.tsx` — Sidebar shell (Phase 2); Automations link listed with `// Phase 5` comment — activate it
- Phase 3 SiteSettingsForm — extend with `enquiry_stale_days` + `invoice_overdue_reminder_days` fields (same blur/PATCH/save pattern)
- Phase 3 `PATCH /api/admin/pricing/settings` — extend to accept the two new keys (or the SiteSettingsForm already sends all keys via the existing route)

### Pricing + Invoicing Layer
- `src/lib/db/schema.ts` → `hosting_packages`, `invoices`, `invoice_line_items` (Phases 3+4)
- Phase 4 CONTEXT.md — Invoice numbering: fiscal_year + sequence_number, assigned at Draft→Sent. Recurring billing creates Draft invoices (no number until owner sends them).

### Design System
- `CLAUDE.md` — Tailwind v4 syntax, bg-image.jpg, btn-metallic/btn-glass, server components by default, requireAdmin() first

### Requirements
- `.planning/REQUIREMENTS.md` — AUTOMATE-01 through AUTOMATE-04

### Security Constraints
- `requireAdmin()` on ALL admin pages and API routes (including trigger endpoints)
- All reminder emails → `ambrose@it-guru.co.za` ONLY (never to client/user email)
- Trigger endpoints protected — no unauthenticated access to job execution

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/email.ts` — `emailLayout()` and `sendEmail()` — reuse for reminder email bodies (table-based, inline styles, no flexbox/grid per CLAUDE.md email constraint)
- `src/lib/auth.ts` — `requireAdmin()` — identical pattern for trigger endpoints and admin page
- Phase 3 SiteSettingsForm + `PATCH /api/admin/pricing/settings` — extend for the two new threshold keys
- Phase 2 CRM query patterns (filter by updated_at, status) — reuse for stale enquiry detection
- Phase 4 invoice query patterns — reuse for overdue invoice detection

### New Dependencies
- None beyond what Phases 1-4 introduced. Netlify Scheduled Functions are a Netlify platform feature — no npm install needed. The `@netlify/functions` types may already be in devDependencies from Phase 1 setup.

### Integration Points
- Enquiry reminder job: `SELECT * FROM contact_enquiries WHERE status != 'completed' AND updated_at < NOW() - INTERVAL '{stale_days} days'` — reads Phase 2 CRM tables
- Overdue reminder job: `SELECT * FROM invoices WHERE status = 'sent' AND due_date < CURRENT_DATE - INTERVAL '{reminder_days} days'` — reads Phase 4 invoices table
- Recurring billing job: reads `billing_schedules WHERE is_active = true`, computes current billing period, inserts into `invoices` + `invoice_line_items` (same columns as manual invoice creation)
- All three jobs write to `automation_runs` after execution (success or error)

</code_context>

<specifics>
## Specific Ideas

- The `billing_start` date on `billing_schedules` determines which month's invoice to generate. For a client who started on 2026-03-15, the billing period for July 2026 starts on 2026-07-15. The `billing_period_start` column on the invoice stores this date. The cron job on the 1st of each month generates invoices for all active schedules whose billing day has passed or is today in the current month.
- Actually simpler: always bill on the 1st of each month regardless of billing_start day — normalized billing date. Billing period is always the current calendar month. This makes the cron schedule (1st of month) align perfectly with billing period. Claude's discretion on this simplification.
- Recurring invoices are created as **Draft** (not Sent) so the owner can review before sending the PDF to the client. Status transitions still require manual action for recurring billing.
- The enquiry reminder should deduplicate — if an enquiry already triggered a reminder today, don't send again. Simple approach: an `automation_runs` check isn't enough; a `last_reminded_at` column on `contact_enquiries` (or `client_registrations`) would prevent repeat daily reminders on the same record. Claude's discretion on this dedup mechanism.
- The SPF cleanup task from STATE.md (remove `include:zoho.com` from apex SPF) is a pending DNS todo unrelated to Phase 5 implementation, but should be noted as ready to action once Phase 4/5 email delivery is confirmed working.

</specifics>

<deferred>
## Deferred Ideas

- Multi-cadence dunning reminders (v2+ — AUTOMATE-06)
- Auto-status-transitions (v2+ — AUTOMATE-05)
- Client-facing payment notifications or invoice delivery automation
- Slack/webhook notifications (owner wants email only for now)
- Billing schedule auto-creation from CRM registration (future — too much coupling risk)
- Annual billing cycle (only monthly in scope for now)

</deferred>

---

*Phase: 05-scheduled-automation*
*Context gathered: 2026-07-01*
