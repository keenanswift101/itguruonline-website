# Roadmap: IT-Guru Online

## Milestones

- ✅ **v1.0 Marketing Site & Client Onboarding** — pre-GSD (shipped; see MILESTONES.md)
- ✅ **v2.0 Admin Portal** — Phases 1-5 (completed 2026-07-04; Phase 5 production deploy pending) — [archive](milestones/v2.0-ROADMAP.md)
- 🚧 **v2.1 Clients, Tickets & Linked Invoicing** — Phases 6-9 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v2.0 Admin Portal (Phases 1-5) — COMPLETED 2026-07-04</summary>

- [x] Phase 1: Auth + Database Foundation (4/4 plans) — completed 2026-06-30
- [x] Phase 2: CRM Capture + Viewing (4/4 plans) — completed 2026-07-02
- [x] Phase 3: Live Pricing Migration (3/3 plans) — completed 2026-07-02
- [x] Phase 4: Invoicing (5/5 plans) — completed 2026-07-03
- [x] Phase 5: Scheduled Automation (6/6 plans) — completed 2026-07-04

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

### 🚧 v2.1 Clients, Tickets & Linked Invoicing (In Progress)

**Milestone Goal:** Turn the portal from lead-capture into real client management — a first-class Clients entity, lightweight support-ticket tracking, invoices linked to stored clients, and a dashboard that surfaces open work.

- [ ] **Phase 6: Clients Entity + CRM Integration** - Owner can manage clients as a distinct entity, separate from leads, with full CRUD and notes
- [ ] **Phase 7: Tickets** - Owner can track support work for a client from creation through resolution
- [ ] **Phase 8: Linked Invoicing** - Owner can invoice a stored client (auto-filled) or go one-off free-text, and see a client's full invoice+ticket history
- [ ] **Phase 9: Dashboard Rework** - Dashboard surfaces open tickets, new leads, unpaid/overdue invoices, monthly revenue, and recent activity

## Phase Details

### Phase 6: Clients Entity + CRM Integration
**Goal**: Owner can manage clients as a first-class entity — distinct from leads — with manual creation, conversion from an enquiry/registration, editing, and private notes
**Depends on**: Phase 1 (auth/DB foundation), Phase 2 (CRM leads exist to convert from)
**Requirements**: CLIENT-01, CLIENT-02, CLIENT-03, CLIENT-04, CLIENT-05
**Success Criteria** (what must be TRUE):
  1. Owner can manually add a new client record (name, email, phone, company, physical/postal address) with no originating enquiry/registration
  2. Owner can convert an existing enquiry or registration into a client, and the new client record carries over the details captured on the original lead
  3. Owner can view a Clients list in the CRM area that is visually separated from the Leads (enquiries + registrations) list
  4. Owner can open a client record and edit any of its details
  5. Owner can add a private, timestamped note to a client record using the same notes UI/pattern already used for leads (`crm_notes`)
**Plans**: 5 plans (4 waves)
Plans:
- [x] 06-01-PLAN.md — Foundation: clients table + converted_client_id columns, 0005 migration, client-types contract, Wave 0 test stubs
- [x] 06-02-PLAN.md — Client query layer + CRUD API (create/list/get/edit)
- [ ] 06-03-PLAN.md — Clients list + manual-create UI (ClientsTable, ClientForm, nav entry)
- [ ] 06-04-PLAN.md — Convert-from-lead (withTxDb atomic write + ConvertButton on CRM detail)
- [ ] 06-05-PLAN.md — Client detail + edit + notes (crm_notes recordType 'client')
**UI hint**: yes

### Phase 7: Tickets
**Goal**: Owner can track support work for a client from creation through resolution, with priority, status, and a running note history
**Depends on**: Phase 6 (clients must exist for a ticket to link to)
**Requirements**: TICKET-01, TICKET-02, TICKET-03, TICKET-04, TICKET-05
**Success Criteria** (what must be TRUE):
  1. Owner can create a support ticket linked to a specific client, with subject, description, and priority
  2. Owner can change a ticket's status among open, in-progress, and resolved
  3. Owner can add follow-up notes to a ticket over time and see them in chronological order (same notes machinery as clients/leads)
  4. Owner can view a list of all tickets, filter it by status, with open tickets surfaced first
  5. Owner can open an individual ticket and see its full detail — client, priority, status, and note history
**Plans**: TBD
**UI hint**: yes

### Phase 8: Linked Invoicing
**Goal**: Owner can create an invoice tied to a stored client (auto-filled) while free-text one-off invoicing remains fully supported, and can see a client's complete invoice + ticket history in one place
**Depends on**: Phase 6 (clients to link to), Phase 7 (tickets must exist for the client history view)
**Requirements**: INVOICE-09, INVOICE-10, CLIENT-06
**Success Criteria** (what must be TRUE):
  1. Owner can search for and select a stored client from a picker when creating an invoice, and the form auto-fills that client's name/email/address
  2. An invoice created via the client picker stores a `client_id` link back to that client
  3. Owner can still create a one-off invoice by typing free-text client details, with no stored client attached
  4. Every invoice created before this phase (free-text, `client_id` null) continues to open, edit, and display correctly — no destructive migration
  5. Owner can open a client's detail page and see that client's linked invoices and tickets listed together as a history
**Plans**: TBD
**UI hint**: yes

### Phase 9: Dashboard Rework
**Goal**: The dashboard surfaces the business's current open work and financial position at a glance, replacing whatever v2.0 tiles existed with data drawn from clients, tickets, invoices, and leads
**Depends on**: Phase 6 (clients/leads split), Phase 7 (tickets), Phase 8 (invoice-client links)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. Dashboard shows a count and short list of currently open tickets
  2. Dashboard shows a count of new/uncontacted leads (enquiries + registrations not yet actioned)
  3. Dashboard shows the count and total amount of unpaid + overdue invoices
  4. Dashboard shows revenue collected (paid) and/or amount invoiced for the current calendar month
  5. Dashboard shows a combined recent-activity feed listing the latest leads, tickets, and invoices
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
| ----- | --------- | -------------- | ------ | --------- |
| 1. Auth + Database Foundation | v2.0 | 4/4 | Complete | 2026-06-30 |
| 2. CRM Capture + Viewing | v2.0 | 4/4 | Complete | 2026-07-02 |
| 3. Live Pricing Migration | v2.0 | 3/3 | Complete | 2026-07-02 |
| 4. Invoicing | v2.0 | 5/5 | Complete | 2026-07-03 |
| 5. Scheduled Automation | v2.0 | 6/6 | Complete | 2026-07-04 |
| 6. Clients Entity + CRM Integration | v2.1 | 1/5 | In Progress | - |
| 7. Tickets | v2.1 | 0/? | Not started | - |
| 8. Linked Invoicing | v2.1 | 0/? | Not started | - |
| 9. Dashboard Rework | v2.1 | 0/? | Not started | - |
