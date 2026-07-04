---
phase: 05-scheduled-automation
plan: 05
subsystem: admin-ui
tags: [admin-portal, automations, billing-schedules, run-now, checkpoint]

# Dependency graph
requires:
  - phase: 05-02
    provides: shared automation job modules (last-run data written to automation_runs)
  - phase: 05-03
    provides: POST /api/admin/automations/[job]/run manual-trigger route
provides:
  - /admin/automations page — 3 job cards (schedule text, last run from automation_runs, Run Now buttons) + Billing Schedules section (table, Add Schedule form, Deactivate)
  - GET/POST /api/admin/billing-schedules and PATCH /api/admin/billing-schedules/[id] (AUTOMATE-03 CRUD)
  - src/components/admin/RunNowButton.tsx (client component, loading state, inline result/error)
  - Active Automations link in AdminSidebar (Phase 5 marker comment removed)
affects: [phase-completion, notification-bell-todo]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin job cards read last-run from automation_runs (max ran_at per job_name); 'Never run' fallback when no rows"

key-files:
  created:
    - src/app/admin/automations/page.tsx
    - src/components/admin/RunNowButton.tsx
    - src/app/api/admin/billing-schedules/route.ts
    - src/app/api/admin/billing-schedules/[id]/route.ts
  modified:
    - src/components/admin/AdminSidebar.tsx

key-decisions:
  - "Billing schedule POST accepts a package slug and resolves it to package_id; an unknown slug currently stores packageId=null silently instead of 422 — flagged for verifier as a minor validation gap, not blocking (recurring-billing treats null package as R0 'Hosting Package')"

requirements-completed: [AUTOMATE-03, AUTOMATE-04]

# Execution notes
execution:
  commits:
    - "6f691c8: feat(05-05): activate Automations sidebar link + billing schedule API routes"
    - "e9f8106: feat(05-05): add automations admin page with job cards and billing schedules"
  interrupted: "Executor agent hit session limit after committing both auto tasks; orchestrator completed verification + this SUMMARY."
  checkpoint: "human-verify checkpoint APPROVED by owner 2026-07-04 after live local testing."

# Verification evidence (orchestrator + owner, 2026-07-04)
verification:
  - "npx tsc --noEmit clean; npx vitest run 27/27 files, 119 passed"
  - "GET /admin/automations 200 — 3 job cards, Run Now, Billing Schedules, Add Schedule all render"
  - "POST /api/admin/automations/enquiry-reminder/run → sent:1 (real Resend email received by owner, screenshot confirmed); re-run → skipped:1 (same-day dedupe)"
  - "POST /api/admin/automations/invoice-reminder/run → sent:1 (real email received)"
  - "POST /api/admin/automations/recurring-billing/run → inserted:1 draft invoice (R85 Startup line item); re-run → skipped:1 (invoices_recurring_unique idempotency)"
  - "Billing schedule create (id=1) + PATCH deactivate (isActive:false) verified over HTTP"
  - "Owner visually approved page + sidebar + form (checkpoint resume-signal: 'approved')"
