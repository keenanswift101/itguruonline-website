# Milestones

## v2.0 Admin Portal (Completed: 2026-07-04 — production deploy pending)

**Goal:** Private dashboard for the owner to manage enquiries, clients (CRM), live hosting/domain pricing, site settings, and invoicing — with automated reminder emails and recurring billing.

**Timeline:** 2026-06-23 (planning) / 2026-06-30 (first build commit) → 2026-07-04 · 5 phases, 22 plans, 131 commits, 217 files (+35,589/−4,463)

**Key accomplishments:**

- **Auth + DB foundation (Phase 1):** Netlify Database (Neon Postgres) + Drizzle, hand-rolled JWT/cookie single-admin auth with bcrypt, lockout, password reset; live at it-guru.co.za/admin and admin.it-guru.co.za.
- **CRM (Phase 2):** every registration and contact-form submission auto-captured with all form fields; searchable/filterable list, detail view, status workflow, private notes, CSV export.
- **Live pricing (Phase 3):** hosting packages, per-TLD domain prices, and site settings editable in-admin and reflected on the public site within seconds — no code deploys.
- **Invoicing (Phase 4):** full lifecycle (draft → sent → paid + computed overdue), SARS-compliant gapless numbering assigned atomically on send, PDF generation with real EFT details, CSV export; no VAT fields (not VAT-registered).
- **Scheduled automation (Phase 5):** stale-enquiry + overdue-invoice reminder emails (configurable thresholds, same-day dedupe) and idempotent monthly recurring draft invoices, via three Netlify Scheduled Functions + admin Run Now triggers on /admin/automations with billing-schedule CRUD. Verified live with real Resend sends 2026-07-04.
- **Session extras (owner-requested, 2026-07-04):** local dev story (netlify dev + NETLIFY_DB_DRIVER=server driver branch + DEV_AUTH_BYPASS), reminder-recipient env override, global BCC of all outgoing mail to info@it-guru.co.za.

**Caveats / known items:**

- Phases 1–4 are live in production; **Phase 5 exists only on `dev`** at completion time. Deploy checklist: apply migration 0004 to the production DB, confirm the three cron functions register/fire, and verify the `pg`/`serverExternalPackages` packaging change on the real production build.
- Formal `/gsd:audit-milestone` was skipped (owner opted to proceed): all 27 requirements traceable-complete, all 5 phases individually goal-verified, Phase 5 additionally exercised end-to-end live.
- Open follow-ups tracked in STATE.md/todos: notification bell for new registrations, post-launch security review, prod test invoice #1 cleanup, SPF record cleanup, stale `neon` Netlify extension removal.

---

## v1.0 — Marketing Site & Client Onboarding (shipped, pre-GSD)

**Shipped:** Full marketing site (Home, Services, About, Contact, Domain Checker, Register, Privacy, Terms), multi-step registration wizard, real hosting pricing, Resend transactional email, OWASP security audit (all findings resolved), live custom domain with SSL.

**Note:** This work predates GSD planning adoption on this project — not phase-tracked. Captured retroactively in `PROJECT.md` Validated Requirements for context. Last commit before GSD adoption: `8a60e00`.
