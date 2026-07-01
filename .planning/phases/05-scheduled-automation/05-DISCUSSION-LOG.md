# Phase 5: Scheduled Automation — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 05 — Scheduled Automation
**Areas discussed:** Active client data model, idempotency mechanism, reminder threshold config, manual trigger mechanism

---

## Active Client Data Model (AUTOMATE-03)

| Option | Description | Selected |
|--------|-------------|----------|
| New billing_schedules table | Dedicated table: client_name, client_email, package_id FK, billing_start, cycle, is_active. Owner manually manages entries. Invoices get nullable billing_schedule_id FK + billing_period_start. | ✓ |
| CRM registration status = active | Add billing fields to client_registrations. Status 'Active' = billable. No new table, but couples billing to CRM model. | |

**User's choice:** New `billing_schedules` table

---

## Idempotency Mechanism (AUTOMATE-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Unique DB constraint on (billing_schedule_id, billing_period_start) | INSERT ... ON CONFLICT DO NOTHING. DB-enforced. Safe under concurrent execution. | ✓ |
| Application-level check before insert | SELECT COUNT before INSERT. Simpler but has race condition risk. | |

**User's choice:** Unique DB constraint — DB-enforced idempotency

---

## Reminder Threshold Configuration (AUTOMATE-01)

| Option | Description | Selected |
|--------|-------------|----------|
| site_settings table | Two new keys: enquiry_stale_days (default 7) + invoice_overdue_reminder_days (default 1). Owner edits via existing Phase 3 SiteSettingsForm. | ✓ |
| Hardcoded constants | Fixed STALE_AFTER_DAYS = 7 in job code. Requires redeploy to change. Not 'configurable'. | |

**User's choice:** site_settings table — extend existing Phase 3 infrastructure

---

## Manual Trigger Mechanism (AUTOMATE-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Admin /admin/automations page with Run Now buttons | Per-job cards with Run Now button (POSTs to trigger endpoint). Shows last run time + result. Discoverable by owner. | ✓ |
| POST endpoints only (no admin UI) | requireAdmin()-protected endpoints, called via curl. No admin page. Simpler but not visible to owner. | |

**User's choice:** Admin page with Run Now buttons

---

## Claude's Discretion

- Billing schedule CRUD UI layout (inline edit vs separate page vs modal)
- Package_id dropdown for billing schedules (uses Phase 3 hosting_packages)
- Billing period start date calculation (calendar month 1st vs anniversary of billing_start)
- Recurring invoice status: Draft (recommended) vs Sent
- Deduplication of reminder emails per enquiry (last_reminded_at column or check automation_runs)
- automation_runs retention/pruning (last N rows per job)
- Email HTML template content for reminder emails

## Deferred Ideas

- Multi-cadence dunning reminders (AUTOMATE-06, v2+)
- Auto-status-transitions (AUTOMATE-05, v2+)
- Client-facing invoice delivery automation
- Annual billing cycle (monthly only in scope)
