# Roadmap: IT-Guru Online

## Overview

v2.0 (Admin Portal) takes IT-Guru Online from a static marketing site with no backend to a fully data-backed business: a single-admin portal where every enquiry/registration is captured as a CRM record, hosting and domain pricing are edited live instead of hard-coded in two files, invoices are created and tracked through their lifecycle, and reminder/recurring-billing automation runs unattended on a schedule. The five phases below follow a strict dependency chain — auth and the database schema must exist before anything can read or write through them, CRM capture is sequenced before the riskier pricing cutover to prove the foundation under real write load first, pricing precedes invoicing so line items can default from live package prices, and scheduled automation (the highest-risk phase, since it can silently create duplicate financial records if shipped before its idempotency pattern is proven) ships last.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Auth + Database Foundation** - Owner can log in to a private, secured admin area backed by a real database
- [ ] **Phase 2: CRM Capture + Viewing** - Every enquiry/registration is automatically captured and the owner can view, search, filter, and annotate records
- [ ] **Phase 3: Live Pricing Migration** - Owner can edit hosting and domain pricing live, with no code deploy, in one single source of truth
- [ ] **Phase 4: Invoicing** - Owner can create, edit, track, and export client invoices with SARS-compliant numbering
- [ ] **Phase 5: Scheduled Automation** - System sends reminder emails and auto-generates recurring invoices without manual intervention

## Phase Details

### Phase 1: Auth + Database Foundation
**Goal**: Owner can log in to a private, secured admin area, and a database foundation exists for every later phase to build on
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Owner can log in to `/admin` with a single admin email/password account
  2. Owner's session persists across a browser refresh via a secure cookie, without re-entering credentials
  3. An unauthenticated visitor who requests any `/admin/*` URL is redirected away (not shown admin content)
  4. After repeated failed login attempts, further attempts are throttled/locked out, and this lockout state survives a server restart (DB-backed, not in-memory)
**Plans**: TBD
**UI hint**: yes

### Phase 2: CRM Capture + Viewing
**Goal**: Every registration and contact-form submission is automatically captured as a record, and the owner can find, review, and annotate any of them
**Depends on**: Phase 1
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, CRM-07
**Success Criteria** (what must be TRUE):
  1. Submitting the registration wizard creates a client record visible in the admin portal, even if email delivery fails
  2. Submitting the contact form creates an enquiry record visible in the admin portal, even if email delivery fails
  3. Owner can search and filter the full list of enquiries/clients (e.g. by name, email, or status)
  4. Owner can open any record and see its full submitted details, current status, and notes
  5. Owner can change a record's status among New, Contacted, In Progress, and Completed
  6. Owner can add a free-text note to a record and see it timestamped
  7. Owner can export the current enquiry/client list as a CSV file
**Plans**: 4 plans (2 waves)
Plans:
- [x] 02-01-PLAN.md — DB schema (3 CRM tables) + capture: DB insert before email in register/contact routes (CRM-01, CRM-02)
- [ ] 02-02-PLAN.md — Admin sidebar shell + CRM list page + GET list route + filterable table (CRM-03)
- [ ] 02-03-PLAN.md — CRM detail page + status PATCH + append-only notes POST (CRM-04, CRM-05, CRM-06)
- [ ] 02-04-PLAN.md — CSV export route + reusable csvEscape helper (CRM-07)
**UI hint**: yes

### Phase 3: Live Pricing Migration
**Goal**: Owner can edit hosting and domain pricing from the admin portal and see changes reflected live on the public site within seconds, with no code deploy
**Depends on**: Phase 1
**Requirements**: PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05
**Success Criteria** (what must be TRUE):
  1. Owner can edit a hosting package's price, description, features, and "Most Popular" label from the admin portal
  2. A hosting price edit appears on both the public Services page and the registration wizard within seconds, with no code deploy, and the two stay identical (single source of truth, not two hard-coded files)
  3. Owner can add or edit a per-TLD domain registration price (.co.za, .com, .net, .org, .online, .africa)
  4. The public site shows a real domain price instead of "request a quote" for any TLD with a price set
  5. Owner can update site settings (contact email, hosting setup-fee note) from the admin portal without a code change
**Plans**: 3 plans (2 waves)
Plans:
- [ ] 03-01-PLAN.md — DB schema (hosting_packages, domain_prices, site_settings) + seeded migration (PRICE-01, PRICE-03, PRICE-05)
- [ ] 03-02-PLAN.md — Public reads: Services/register/domain-checker/contact from DB + delete hardcoded pricing consts (PRICE-02, PRICE-04, PRICE-05)
- [ ] 03-03-PLAN.md — Admin /admin/pricing inline-edit portal + 3 PATCH routes (PRICE-01, PRICE-03, PRICE-05)
**UI hint**: yes

### Phase 4: Invoicing
**Goal**: Owner can create, edit, and track client invoices through their full lifecycle, with SARS-compliant numbering, and export them for record-keeping
**Depends on**: Phase 2 (clients must exist to invoice), Phase 3 (line items can default from live pricing)
**Requirements**: INVOICE-01, INVOICE-02, INVOICE-03, INVOICE-04, INVOICE-05, INVOICE-06, INVOICE-07
**Success Criteria** (what must be TRUE):
  1. Owner can manually create an invoice for any client from the admin dashboard, with line items, amount, and due date — independent of any recurring/automated generation
  2. Owner can edit a Draft invoice's line items, amount, and due date before it is sent
  3. Every invoice has a sequential, gapless number and uses plain "Invoice" labeling with no VAT fields or "Tax Invoice" wording
  4. Owner can move an invoice through Draft, Sent, and Paid status, and an invoice past its due date automatically shows as Overdue without manual action
  5. Owner can mark an invoice as paid manually, with no payment gateway involved
  6. Owner can download a single invoice as a PDF suitable for sending to the client
  7. Owner can export the invoice list as CSV or PDF for their own review/record-keeping
**Plans**: 5 plans (2 waves)
Plans:
- [ ] 04-01-PLAN.md — DB schema (invoices + invoice_line_items) + 0002 migration + @react-pdf/renderer install + Wave 0 test stubs + PDF smoke-test route
- [ ] 04-02-PLAN.md — POST create + PUT update (409 edit lock) + DELETE draft API routes
- [ ] 04-03-PLAN.md — PATCH status (gapless numbering, mark paid) + PDF document/route + CSV export
- [ ] 04-04-PLAN.md — Admin invoice list page (filter + overdue badge + CSV export) + create form
- [ ] 04-05-PLAN.md — Admin invoice detail page (edit Draft / read-only + status actions + PDF download)
**UI hint**: yes

### Phase 5: Scheduled Automation
**Goal**: The system proactively reminds the owner about stale enquiries and overdue invoices, and automatically generates recurring hosting invoices on schedule, without creating duplicates
**Depends on**: Phase 2 (enquiry data), Phase 4 (invoice data and idempotency-ready schema)
**Requirements**: AUTOMATE-01, AUTOMATE-02, AUTOMATE-03, AUTOMATE-04
**Success Criteria** (what must be TRUE):
  1. Owner receives a reminder email when an enquiry has had no status change/contact after a configurable number of days
  2. Owner receives a reminder email when an invoice is overdue
  3. A recurring invoice is automatically generated for each active hosting client on their billing cycle, and re-running the same job does not create a duplicate invoice for a period already billed
  4. Each scheduled automation (reminders, recurring billing) has a manually-triggerable equivalent the owner/developer can run on demand, so it can be tested on the `dev` branch where Netlify Scheduled Functions don't run
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth + Database Foundation | 4/4 | Complete | 2026-06-30 |
| 2. CRM Capture + Viewing | 1/4 | Executing | - |
| 3. Live Pricing Migration | 0/3 | Planned | - |
| 4. Invoicing | 0/5 | Planned | - |
| 5. Scheduled Automation | 0/TBD | Not started | - |
