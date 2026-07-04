# IT-Guru Online

## What This Is

IT-Guru Online is the marketing site and client onboarding portal for an IT support company in Kuils River, South Africa, live at https://it-guru.co.za. It showcases services (IT support, domain registration, web hosting, network solutions, hardware procurement, web design) and lets visitors self-register for hosting/domain services through a multi-step wizard. This milestone adds a private Admin Portal so the business owner can manage enquiries, clients, pricing, and invoicing from one dashboard instead of by hand.

## Core Value

Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live — no more losing leads in an inbox or needing a developer to change a price.

## Requirements

### Validated

- ✓ Marketing site (Home, Services, About, Contact, Domain Checker, Register, Privacy, Terms) — pre-milestone
- ✓ Multi-step registration wizard (applicant info, domain, service selection, declaration) with SA + international phone validation — pre-milestone
- ✓ Real 6-tier hosting pricing (Startup → Enterprise + Parked Domain), kept in sync across two locations — pre-milestone
- ✓ Transactional email via Resend with branded HTML templates — pre-milestone
- ✓ OWASP ZAP + manual OWASP Top 10 security audit, all findings resolved — pre-milestone (2026-06-16)
- ✓ Domain availability checker (RDAP + DNS-over-HTTPS hybrid across .co.za/.com/.net/.org/.online/.africa) — pre-milestone
- ✓ Owner can generate an invoice for a client (line items, amount, due date), edit/delete Drafts, and download a SARS-compliant PDF (no VAT fields/"Tax Invoice" wording) — Phase 4 (Invoicing)
- ✓ Owner can track invoice status through its full lifecycle (draft → sent → paid, with gapless invoice numbering assigned on send, and a computed Overdue indicator) — Phase 4 (Invoicing)
- ✓ Owner can log in to a private, secured admin area — Phase 1, live in production 2026-07-04 (also servable at admin.it-guru.co.za pending a DNS CNAME the owner is adding — see STATE.md)
- ✓ Every registration/contact-form submission is automatically captured as a record in the portal — Phase 2
- ✓ Owner can view, search, and filter all enquiries/clients — Phase 2
- ✓ Owner can set a status on each client/enquiry (new, contacted, in progress, completed) — Phase 2
- ✓ Owner can add private notes to a client/enquiry record — Phase 2
- ✓ Owner can edit hosting package price, description, features, and "Most Popular" label, reflected live on the public site — Phase 3
- ✓ Owner can add/edit per-TLD domain registration prices, shown live on the public site instead of "request a quote" — Phase 3
- ✓ Owner can update site settings (contact email, hosting setup-fee note) without code changes — Phase 3
- ✓ Owner can export enquiries/clients as a spreadsheet — Phase 2 (CRM-07, CSV). This was actually complete from Phase 2 onward but its checkbox/traceability status was never updated to match — see REQUIREMENTS.md's 2026-07-04 correction note.

### Active

<!-- This milestone: v2.0 Admin Portal -->

- [ ] System sends automated reminder emails for stale enquiries (no contact after N days) and overdue invoices
- [ ] System automatically generates recurring invoices for active hosting clients on their billing cycle

### Out of Scope

- Multi-staff logins / role-based access — deferred; v2.0 is single-admin (owner) only. Revisit as a later milestone if team grows.
- Client-facing login/self-service portal — deferred; clients continue to interact via email/EFT, not their own account. Revisit if client volume justifies it.
- Online payment collection (PayFast/Yoco/Paystack integration) — deferred; v2.0 only generates and tracks invoices, payment stays manual EFT. Revisit once invoicing volume justifies gateway integration/compliance overhead.
- Auto status transitions (e.g. auto-flagging stale enquiries as a status change, not just a reminder) — not requested for v2.0; only reminder emails and recurring billing were scoped as automation.

## Context

- No backend, database, or auth exists in the codebase today — this is a greenfield build alongside the existing static/server-rendered Next.js marketing site.
- Original scope was defined in `IT-Guru-Admin-Portal-Proposal.docx` (6 stages: enquiry capture, secure login, CRM dashboard, live price control, domain pricing, settings/team management). This milestone expands that proposal to fold in invoicing and automation (reminders + recurring billing) from the start, so the architecture (auth, database schema, data model) doesn't need rework later when those are added.
- Hosting is Netlify (`@netlify/plugin-nextjs`), not Vercel — database/hosting choices for the portal need to work within that constraint (or alongside it without disrupting the existing Netlify deploy).
- Pricing currently lives in code in two places (`HOSTING_PACKAGES` in `src/lib/registration-types.ts` and `packages` array in `src/app/services/page.tsx`) kept in sync by hand — the live price-editing requirement directly replaces this manual process.
- Domain checker (`src/app/api/domain/check/route.ts`) already surfaces real-time TLD availability but not pricing — per-TLD pricing has been a known gap since project status reporting (2026-06-23).
- DNS/mail (`it-guru.co.za` mail flow via cPanel host `102.216.79.206`) was just repaired this session — unrelated to the portal but worth noting as recent infra work in the same window.
- **The whole admin portal (Phases 1-4) went genuinely live in production for the first time on 2026-07-04.** `main` had been up to 97 commits behind `dev` for weeks — all of Phases 1-4 were built, tested, and verified, but never actually deployed. The first deploy caused a real customer-facing outage (public pages doing DB reads 500'd) because the production database had never been wired up; see STATE.md's Blockers/Concerns and the CRITICAL `NETLIFY_DB_URL` decision for the full incident and fix. Lesson for future phases: verify a phase's code actually reaches production, not just that it's merged to `dev` — "planned/executed" and "live" turned out to be very different states here.
- The owner asked mid-session (unplanned, outside the roadmap) to also serve the admin portal at `admin.it-guru.co.za`. In progress — see STATE.md's "In-Progress Side Task" section for exact status (edge function deployed, DNS CNAME pending on the owner's end).

## Constraints

- **Tech stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 — portal should extend this stack, not introduce a separate framework.
- **Hosting**: Netlify, not Vercel — any database/auth provider choice must work from Netlify's serverless functions.
- **Compliance**: Customer personal information must be handled in line with South Africa's POPIA requirements, including appropriate data region.
- **Security**: A fresh security review is expected once the portal's login system ships (per the original proposal commitment to the client).
- **Budget**: Running costs should start on a free/low-cost tier for current scale; proposal flagged "a few hundred rand per month" as the eventual ceiling, not a starting cost.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-admin auth for v2.0 (no multi-staff roles yet) | Keeps auth/permissions model simple for first build; team access can be layered on later without redesigning the data model | ✓ Good — shipped Phase 1, live in production |
| Invoicing generates/tracks only, no payment gateway in v2.0 | Avoids PCI/compliance and reconciliation overhead until invoicing volume justifies it; clients keep paying via existing manual EFT | ✓ Good — shipped Phase 4, Mark Paid is a manual owner action, no gateway integration |
| Automation scoped to reminder emails + recurring billing only (no auto status transitions) | Matches concrete pain points described, avoids speculative automation build | — Pending execution (Phase 5 is fully planned — 6 plans, research, validation all done — just not yet executed) |
| Invoicing/accounts/automation folded into v2.0 architecture now rather than added later | Avoids reworking auth/database/roles after the fact once CRM + pricing ship | ✓ Good — Phases 1-4 shipped without any auth/schema rework; Phase 5 will validate the automation half of this bet |
| IT-Guru is not VAT-registered — invoices must NOT use "Tax Invoice" labeling or VAT fields | Confirmed by owner; SARS rules differ by VAT-registration status, and mislabeling has compliance implications | ✓ Good |
| Database/auth provider: Netlify Database (Neon Postgres), with hand-rolled JWT/cookie auth (not a full auth framework) | Native to the existing Netlify deployment — no new vendor relationship, automatic preview-branch databases; single-admin login doesn't need multi-user auth framework overhead. Chosen over Supabase despite an existing TODO comment anticipating it. | ✓ Good — live in production 2026-07-04, but see STATE.md's CRITICAL decision note: the actual runtime env var is `NETLIFY_DB_URL`, not `NETLIFY_DATABASE_URL` as originally assumed; getting this wrong caused a real production outage on first deploy. **Also**: the research-flagged "free storage until 2026-07-01" promo window has now passed (today is past that date) — verify current Netlify Database billing/tier before invoice volume grows, this was never actually checked. |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-04 — Phases 1-4 deployed to production for the first time (after diagnosing and fixing a same-day outage), ROADMAP.md progress table corrected to match actual state, admin.it-guru.co.za subdomain work in progress*
