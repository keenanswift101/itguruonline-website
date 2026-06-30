# Requirements: IT-Guru Online — v2.0 Admin Portal

**Defined:** 2026-06-30
**Core Value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.

## v1 Requirements

Requirements for the v2.0 Admin Portal milestone. Each maps to roadmap phases.

### Auth

- [ ] **AUTH-01**: Owner can log in with a single admin account (email/password)
- [ ] **AUTH-02**: Owner's session persists across browser refresh via secure cookie
- [ ] **AUTH-03**: Unauthenticated visitors are redirected away from any `/admin/*` route
- [ ] **AUTH-04**: Repeated failed login attempts are throttled/locked out (DB-backed, not in-memory)

### CRM

- [ ] **CRM-01**: Every registration wizard submission is automatically saved as a client record
- [ ] **CRM-02**: Every contact form submission is automatically saved as an enquiry record
- [ ] **CRM-03**: Owner can view a searchable, filterable list of all enquiries/clients
- [ ] **CRM-04**: Owner can open a record to see full submitted details
- [ ] **CRM-05**: Owner can set a record's status (New, Contacted, In Progress, Completed)
- [ ] **CRM-06**: Owner can add free-text, timestamped notes to a record
- [ ] **CRM-07**: Owner can export the enquiry/client list as CSV

### Pricing

- [ ] **PRICE-01**: Owner can edit a hosting package's price, description, features, and "Most Popular" label
- [ ] **PRICE-02**: Hosting price edits appear on the public Services page and registration wizard within seconds, with no code deploy
- [ ] **PRICE-03**: Owner can add/edit per-TLD domain registration prices (.co.za, .com, .net, .org, .online, .africa)
- [ ] **PRICE-04**: Domain prices appear on the public site in place of "request a quote"
- [ ] **PRICE-05**: Owner can update site settings (contact email, hosting setup-fee note) without a code change

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
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| CRM-01 | TBD | Pending |
| CRM-02 | TBD | Pending |
| CRM-03 | TBD | Pending |
| CRM-04 | TBD | Pending |
| CRM-05 | TBD | Pending |
| CRM-06 | TBD | Pending |
| CRM-07 | TBD | Pending |
| PRICE-01 | TBD | Pending |
| PRICE-02 | TBD | Pending |
| PRICE-03 | TBD | Pending |
| PRICE-04 | TBD | Pending |
| PRICE-05 | TBD | Pending |
| INVOICE-01 | TBD | Pending |
| INVOICE-02 | TBD | Pending |
| INVOICE-03 | TBD | Pending |
| INVOICE-04 | TBD | Pending |
| INVOICE-05 | TBD | Pending |
| INVOICE-06 | TBD | Pending |
| INVOICE-07 | TBD | Pending |
| AUTOMATE-01 | TBD | Pending |
| AUTOMATE-02 | TBD | Pending |
| AUTOMATE-03 | TBD | Pending |
| AUTOMATE-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0 (pending roadmap creation)
- Unmapped: 27 ⚠️ (expected before roadmap step)

---
*Requirements defined: 2026-06-30*
*Last updated: 2026-06-30 after initial definition*
