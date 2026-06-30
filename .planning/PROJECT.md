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

### Active

<!-- This milestone: v2.0 Admin Portal -->

- [ ] Owner can log in to a private, secured admin area
- [ ] Every registration/contact-form submission is automatically captured as a record in the portal
- [ ] Owner can view, search, and filter all enquiries/clients
- [ ] Owner can set a status on each client/enquiry (new, contacted, in progress, completed)
- [ ] Owner can add private notes to a client/enquiry record
- [ ] Owner can edit hosting package price, description, features, and "Most Popular" label, reflected live on the public site
- [ ] Owner can add/edit per-TLD domain registration prices, shown live on the public site instead of "request a quote"
- [ ] Owner can update site settings (contact email, hosting setup-fee note) without code changes
- [ ] Owner can generate an invoice for a client (line items, amount, due date)
- [ ] Owner can track invoice status (draft, sent, paid, overdue) — no online payment collection, clients pay via existing manual EFT
- [ ] Owner can export enquiries/clients/invoices as a spreadsheet
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

## Constraints

- **Tech stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 — portal should extend this stack, not introduce a separate framework.
- **Hosting**: Netlify, not Vercel — any database/auth provider choice must work from Netlify's serverless functions.
- **Compliance**: Customer personal information must be handled in line with South Africa's POPIA requirements, including appropriate data region.
- **Security**: A fresh security review is expected once the portal's login system ships (per the original proposal commitment to the client).
- **Budget**: Running costs should start on a free/low-cost tier for current scale; proposal flagged "a few hundred rand per month" as the eventual ceiling, not a starting cost.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-admin auth for v2.0 (no multi-staff roles yet) | Keeps auth/permissions model simple for first build; team access can be layered on later without redesigning the data model | — Pending |
| Invoicing generates/tracks only, no payment gateway in v2.0 | Avoids PCI/compliance and reconciliation overhead until invoicing volume justifies it; clients keep paying via existing manual EFT | — Pending |
| Automation scoped to reminder emails + recurring billing only (no auto status transitions) | Matches concrete pain points described, avoids speculative automation build | — Pending |
| Invoicing/accounts/automation folded into v2.0 architecture now rather than added later | Avoids reworking auth/database/roles after the fact once CRM + pricing ship | — Pending |
| IT-Guru is not VAT-registered — invoices must NOT use "Tax Invoice" labeling or VAT fields | Confirmed by owner; SARS rules differ by VAT-registration status, and mislabeling has compliance implications | ✓ Good |
| Database/auth provider: Netlify Database (Neon Postgres), with hand-rolled JWT/cookie auth (not a full auth framework) | Native to the existing Netlify deployment — no new vendor relationship, automatic preview-branch databases; single-admin login doesn't need multi-user auth framework overhead. Chosen over Supabase despite an existing TODO comment anticipating it. Verify current Netlify Database pricing before provisioning — research flagged free storage "until 2026-07-01" which may be a launch-promo snapshot, not a permanent tier | — Pending |

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
*Last updated: 2026-06-23 after starting milestone v2.0*
