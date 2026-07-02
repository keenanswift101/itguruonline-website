| AUTOMATE-04 | Phase 5 | Pending || AUTOMATE-03 | Phase 5 | Pending || AUTOMATE-02 | Phase 5 | Pending || AUTOMATE-01 | Phase 5 | Pending || INVOICE-07 | Phase 4 | Pending || INVOICE-06 | Phase 4 | Pending || INVOICE-05 | Phase 4 | Pending || INVOICE-04 | Phase 4 | Pending || INVOICE-03 | Phase 4 | Pending || INVOICE-02 | Phase 4 | Pending || INVOICE-01 | Phase 4 | Pending || PRICE-05 | Phase 3 | Complete || PRICE-04 | Phase 3 | Complete || PRICE-03 | Phase 3 | Pending || PRICE-02 | Phase 3 | Complete || PRICE-01 | Phase 3 | Pending || CRM-07 | Phase 2 | Pending || CRM-06 | Phase 2 | Complete || CRM-05 | Phase 2 | Complete || CRM-04 | Phase 2 | Complete || CRM-03 | Phase 2 | Pending || CRM-02 | Phase 2 | Pending || CRM-01 | Phase 2 | Pending || AUTH-04 | Phase 1 | Pending || AUTH-03 | Phase 1 | Pending || AUTH-02 | Phase 1 | Pending || AUTH-01 | Phase 1 | Pending |# Requirements: IT-Guru Online — v2.0 Admin Portal

**Defined:** 2026-06-30
**Core Value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.

## v1 Requirements

Requirements for the v2.0 Admin Portal milestone. Each maps to roadmap phases.

### Auth

- [x] **AUTH-01**: Owner can log in with a single admin account (email/password)
- [x] **AUTH-02**: Owner's session persists across browser refresh via secure cookie
- [x] **AUTH-03**: Unauthenticated visitors are redirected away from any `/admin/*` route
- [x] **AUTH-04**: Repeated failed login attempts are throttled/locked out (DB-backed, not in-memory)

### CRM

- [x] **CRM-01**: Every registration wizard submission is automatically saved as a client record
- [x] **CRM-02**: Every contact form submission is automatically saved as an enquiry record
- [ ] **CRM-03**: Owner can view a searchable, filterable list of all enquiries/clients
- [x] **CRM-04**: Owner can open a record to see full submitted details
- [x] **CRM-05**: Owner can set a record's status (New, Contacted, In Progress, Completed)
- [x] **CRM-06**: Owner can add free-text, timestamped notes to a record
- [ ] **CRM-07**: Owner can export the enquiry/client list as CSV

### Pricing

- [ ] **PRICE-01**: Owner can edit a hosting package's price, description, features, and "Most Popular" label
- [x] **PRICE-02**: Hosting price edits appear on the public Services page and registration wizard within seconds, with no code deploy
- [ ] **PRICE-03**: Owner can add/edit per-TLD domain registration prices (.co.za, .com, .net, .org, .online, .africa)
- [x] **PRICE-04**: Domain prices appear on the public site in place of "request a quote"
- [x] **PRICE-05**: Owner can update site settings (contact email, hosting setup-fee note) without a code change

### Invoicing

- [ ] **INVOICE-01**: Owner can manually create an invoice from the admin dashboard for any client (line items, amount, due date) — not only via recurring auto-generation
- [ ] **INVOICE-02**: Owner can edit a Draft invoice's line items, amount, and due date before it's sent
- [ ] **INVOICE-03**: Invoices use sequential, gapless numbering and plain "Invoice" labeling (no VAT fields or "Tax Invoice" wording — IT-Guru is not VAT-registered)
- [ ] **INVOICE-04**: Owner can track invoice status (Draft, Sent, Paid); Overdue is computed automatically from the due date
- [ ] **INVOICE-05**: Owner can mark an invoice as paid manually (no payment gateway — clients pay via existing manual EFT)
- [ ] **INVOICE-06**: Owner can generate/download a single invoice as PDF (for sending to the client)
- [ ] **INVOICE-07**: Owner can export the invoice list as CSV or PDF, for the owner's own review/record-keeping

### Automation

- [ ] **AUTOMATE-01**: System sends the owner a reminder when an enquiry has had no status change/contact after a configurable number of days
- [ ] **AUTOMATE-02**: System sends the owner a reminder when an invoice is overdue
- [ ] **AUTOMATE-03**: System automatically generates a recurring invoice for active hosting clients on their billing cycle, without creating duplicates on retry/re-run
- [ ] **AUTOMATE-04**: Each scheduled automation has a manually-triggerable equivalent for testing on the `dev` branch (Netlify Scheduled Functions only run on production deploys)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### CRM

- **CRM-08**: Domain Checker searches are captured as soft leads in the CRM

### Auth

- **AUTH-05**: Multiple staff logins with role-based access levels (full admin vs limited)

### Invoicing

- **INVOICE-07**: Online payment collection via a South African payment gateway (e.g. PayFast, Yoco, Paystack)

### Automation

- **AUTOMATE-05**: Auto status transitions (e.g. auto-flagging stale enquiries, not just reminding about them)
- **AUTOMATE-06**: Multi-stage reminder/dunning cadences (currently single-threshold reminders only)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Client-facing login/self-service portal | Clients continue to interact via email/EFT; not requested, adds significant auth/UX scope |
| Online payment gateway integration | Deferred to v2+ — avoids PCI/compliance and reconciliation overhead until invoice volume justifies it |
| Multi-staff roles/permissions | Deferred to v2+ — single-admin is sufficient for current team size |
| "Tax Invoice" labeling / VAT fields | IT-Guru is not VAT-registered; using tax-invoice language would be a SARS compliance misstep |
| Configurable/Kanban-style CRM pipeline | Anti-feature for single-operator scale per research — fixed 4-status model is the validated pattern |
| XLSX export (spreadsheet format) | CSV is sufficient and simpler to build/test; can be added later if needed |

## Traceability

Filled in by the roadmapper during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| CRM-01 | Phase 2 | Pending |
| CRM-02 | Phase 2 | Pending |
| CRM-03 | Phase 2 | Pending |
| CRM-04 | Phase 2 | Complete |
| CRM-05 | Phase 2 | Complete |
| CRM-06 | Phase 2 | Complete |
| CRM-07 | Phase 2 | Pending |
| PRICE-01 | Phase 3 | Pending |
| PRICE-02 | Phase 3 | Complete |
| PRICE-03 | Phase 3 | Pending |
| PRICE-04 | Phase 3 | Complete |
| PRICE-05 | Phase 3 | Complete |
| INVOICE-01 | Phase 4 | Pending |
| INVOICE-02 | Phase 4 | Pending |
| INVOICE-03 | Phase 4 | Pending |
| INVOICE-04 | Phase 4 | Pending |
| INVOICE-05 | Phase 4 | Pending |
| INVOICE-06 | Phase 4 | Pending |
| INVOICE-07 | Phase 4 | Pending |
| AUTOMATE-01 | Phase 5 | Pending |
| AUTOMATE-02 | Phase 5 | Pending |
| AUTOMATE-03 | Phase 5 | Pending |
| AUTOMATE-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27/27 ✓
- Unmapped: 0

---
*Requirements defined: 2026-06-30*
*Last updated: 2026-06-30 after roadmap creation (5 phases, full coverage)*
