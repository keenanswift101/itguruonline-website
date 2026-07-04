# Requirements: IT-Guru Online — v2.1 Clients, Tickets & Linked Invoicing

**Defined:** 2026-07-04
**Core Value:** Every enquiry and client interaction is captured and actionable in one place, with hosting/domain pricing editable live.

**Milestone goal:** Turn the portal from lead-capture into real client management — a first-class Clients entity, lightweight support-ticket tracking, invoices linked to stored clients, and a dashboard that surfaces open work.

## v2.1 Requirements

Requirements for the v2.1 milestone. Each maps to exactly one roadmap phase (Phase 6+, continuing from v2.0).

### Clients

- [x] **CLIENT-01**: Owner can create a client record manually (name, email, phone, company, physical/postal address)
- [x] **CLIENT-02**: Owner can convert an existing enquiry or registration into a client, carrying over the captured details
- [x] **CLIENT-03**: Owner can view a list of clients in the CRM area, visually separated from leads (enquiries + registrations)
- [x] **CLIENT-04**: Owner can open and edit an individual client's details
- [x] **CLIENT-05**: Owner can add private notes to a client record (same notes machinery as leads)
- [ ] **CLIENT-06**: Owner can see a client's linked invoices and tickets on the client detail page (history view)

### Tickets

- [ ] **TICKET-01**: Owner can create a support ticket linked to a client, with subject, description, and priority
- [ ] **TICKET-02**: Owner can set and update a ticket's status (open → in-progress → resolved)
- [ ] **TICKET-03**: Owner can add follow-up notes/updates to a ticket over time
- [ ] **TICKET-04**: Owner can view a list of all tickets, filterable by status (and see open ones first)
- [ ] **TICKET-05**: Owner can open an individual ticket to see its full detail and history

### Linked Invoicing

- [ ] **INVOICE-09**: Owner can create an invoice by selecting a stored client from a searchable picker, which auto-fills client name/email/address and links the invoice to that client (`client_id`)
- [ ] **INVOICE-10**: Owner can still create a one-off invoice with free-text client details (no stored client); existing free-text invoices remain valid and editable

### Dashboard

- [ ] **DASH-01**: Dashboard shows a count and short list of open tickets
- [ ] **DASH-02**: Dashboard shows count of new/uncontacted leads (enquiries + registrations not yet actioned)
- [ ] **DASH-03**: Dashboard shows unpaid + overdue invoices (count and total amount)
- [ ] **DASH-04**: Dashboard shows revenue for the current month (paid) and/or amount invoiced this month
- [ ] **DASH-05**: Dashboard shows a recent-activity feed (latest leads, tickets, and invoices)

## Future Requirements (deferred, not this milestone)

- **CLIENT-07**: Client-facing self-service portal (clients log in to see their own invoices/tickets) — deferred; owner-only for now
- **TICKET-06**: Email notifications to the client when a ticket status changes — deferred; internal tracking first
- **TICKET-07**: SLA / due-date tracking and overdue-ticket reminders (automation) — deferred; revisit after basic tickets prove useful
- **DASH-06**: Configurable/customisable dashboard tiles — deferred; ship a fixed sensible set first

## Out of Scope

- **Multi-staff logins / role-based access** — still deferred (single-admin); tickets/clients are owner-managed only.
- **Online payment collection** — still deferred; invoices remain generate-and-track with manual EFT.
- **External helpdesk integration (Zendesk/Freshdesk/etc.)** — explicitly rejected; ticketing is built in-portal to match single-admin scale.
- **Time tracking / billing tickets by hours** — not requested; tickets are status tracking, not a billing timesheet.
- **Client merge/dedupe tooling** — not needed at current volume; revisit if duplicate clients become a problem.

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| CLIENT-01 | Phase 6 | Complete (06-01 foundation + 06-02 POST/GET routes + 06-03 create UI) |
| CLIENT-02 | Phase 6 | Complete (06-01 foundation + 06-04 convert route/UI) |
| CLIENT-03 | Phase 6 | Complete (06-01 foundation + 06-02 GET route + 06-03 list UI) |
| CLIENT-04 | Phase 6 | In Progress (foundation done in 06-01; GET/PUT routes done in 06-02; edit UI in 06-05) |
| CLIENT-05 | Phase 6 | In Progress (foundation done in 06-01; notes route/UI in 06-05) |
| CLIENT-06 | Phase 8 | Pending |
| TICKET-01 | Phase 7 | Pending |
| TICKET-02 | Phase 7 | Pending |
| TICKET-03 | Phase 7 | Pending |
| TICKET-04 | Phase 7 | Pending |
| TICKET-05 | Phase 7 | Pending |
| INVOICE-09 | Phase 8 | Pending |
| INVOICE-10 | Phase 8 | Pending |
| DASH-01 | Phase 9 | Pending |
| DASH-02 | Phase 9 | Pending |
| DASH-03 | Phase 9 | Pending |
| DASH-04 | Phase 9 | Pending |
| DASH-05 | Phase 9 | Pending |

**Coverage:** 18/18 v2.1 requirements mapped to a phase. No orphans.
