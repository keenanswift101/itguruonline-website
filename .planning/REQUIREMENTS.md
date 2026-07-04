# Requirements: IT-Guru Online — v2.0 Admin Portal

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
- [x] **CRM-03**: Owner can view a searchable, filterable list of all enquiries/clients
- [x] **CRM-04**: Owner can open a record to see full submitted details
- [x] **CRM-05**: Owner can set a record's status (New, Contacted, In Progress, Completed)
- [x] **CRM-06**: Owner can add free-text, timestamped notes to a record
- [x] **CRM-07**: Owner can export the enquiry/client list as CSV

### Pricing

- [x] **PRICE-01**: Owner can edit a hosting package's price, description, features, and "Most Popular" label
- [x] **PRICE-02**: Hosting price edits appear on the public Services page and registration wizard within seconds, with no code deploy
- [x] **PRICE-03**: Owner can add/edit per-TLD domain registration prices (.co.za, .com, .net, .org, .online, .africa)
- [x] **PRICE-04**: Domain prices appear on the public site in place of "request a quote"
- [x] **PRICE-05**: Owner can update site settings (contact email, hosting setup-fee note) without a code change

### Invoicing

- [x] **INVOICE-01**: Owner can manually create an invoice from the admin dashboard for any client (line items, amount, due date) — not only via recurring auto-generation
- [x] **INVOICE-02**: Owner can edit a Draft invoice's line items, amount, and due date before it's sent
- [x] **INVOICE-03**: Invoices use sequential, gapless numbering and plain "Invoice" labeling (no VAT fields or "Tax Invoice" wording — IT-Guru is not VAT-registered)
- [x] **INVOICE-04**: Owner can track invoice status (Draft, Sent, Paid); Overdue is computed automatically from the due date
- [x] **INVOICE-05**: Owner can mark an invoice as paid manually (no payment gateway — clients pay via existing manual EFT)
- [x] **INVOICE-06**: Owner can generate/download a single invoice as PDF (for sending to the client)
- [x] **INVOICE-07**: Owner can export the invoice list as CSV or PDF, for the owner's own review/record-keeping

### Automation

- [x] **AUTOMATE-01**: System sends the owner a reminder when an enquiry has had no status change/contact after a configurable number of days
- [x] **AUTOMATE-02**: System sends the owner a reminder when an invoice is overdue
- [x] **AUTOMATE-03**: System automatically generates a recurring invoice for active hosting clients on their billing cycle, without creating duplicates on retry/re-run
- [x] **AUTOMATE-04**: Each scheduled automation has a manually-triggerable equivalent for testing on the `dev` branch (Netlify Scheduled Functions only run on production deploys)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### CRM

- **CRM-08**: Domain Checker searches are captured as soft leads in the CRM

### Auth

- **AUTH-05**: Multiple staff logins with role-based access levels (full admin vs limited)

### Invoicing

- **INVOICE-08**: Online payment collection via a South African payment gateway (e.g. PayFast, Yoco, Paystack) *(renumbered 2026-07-04 — this was originally mislabeled INVOICE-07, colliding with the v1 CSV/PDF export requirement of the same ID; no code references this ID, so renumbering is safe)*

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
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| CRM-01 | Phase 2 | Complete |
| CRM-02 | Phase 2 | Complete |
| CRM-03 | Phase 2 | Complete |
| CRM-04 | Phase 2 | Complete |
| CRM-05 | Phase 2 | Complete |
| CRM-06 | Phase 2 | Complete |
| CRM-07 | Phase 2 | Complete |
| PRICE-01 | Phase 3 | Complete |
| PRICE-02 | Phase 3 | Complete |
| PRICE-03 | Phase 3 | Complete |
| PRICE-04 | Phase 3 | Complete |
| PRICE-05 | Phase 3 | Complete |
| INVOICE-01 | Phase 4 | Complete |
| INVOICE-02 | Phase 4 | Complete |
| INVOICE-03 | Phase 4 | Complete |
| INVOICE-04 | Phase 4 | Complete |
| INVOICE-05 | Phase 4 | Complete |
| INVOICE-06 | Phase 4 | Complete |
| INVOICE-07 | Phase 4 | Complete |
| AUTOMATE-01 | Phase 5 | Complete |
| AUTOMATE-02 | Phase 5 | Complete |
| AUTOMATE-03 | Phase 5 | Complete |
| AUTOMATE-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27/27 ✓
- Unmapped: 0

---
*Requirements defined: 2026-06-30*
*Last updated: 2026-07-04 — corrected against actual phase VERIFICATION.md files: AUTH-01–04, CRM-01/02/03/07 were fully implemented and verified back in their respective phases but never had their checkboxes/traceability status updated (Phase 2's own verifier flagged this discrepancy at the time — see 02-VERIFICATION.md — but it was never fixed). Also removed a corrupted duplicate traceability table that had been jammed onto line 1 before the file's own title, and renumbered a duplicate INVOICE-07 ID (v2 payment-gateway idea) to INVOICE-08 to stop colliding with the v1 CSV/PDF export requirement.*
