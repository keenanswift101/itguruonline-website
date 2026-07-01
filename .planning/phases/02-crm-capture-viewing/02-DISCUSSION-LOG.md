# Phase 2: CRM Capture + Viewing — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 02 — CRM Capture + Viewing
**Areas discussed:** Admin navigation structure, Record data model, CRM list UI, Record detail + notes, CSV export

---

## Admin Navigation Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar nav | Persistent left sidebar with CRM / Pricing / Invoices / Settings links on all admin pages | ✓ |
| Top nav / breadcrumbs | Horizontal top bar with section links | |
| Dashboard hub — no nav | Big clickable tiles on the dashboard home | |

**User's choice:** Sidebar nav
**Notes:** Sets the layout pattern for Phases 3–5 so each future phase just adds a nav entry without reworking the layout.

| Option | Description | Selected |
|--------|-------------|----------|
| /admin/crm — dedicated route | CRM has its own section; dashboard remains a summary/home page | ✓ |
| /admin/dashboard becomes the CRM | Dashboard IS the CRM list | |

**User's choice:** /admin/crm — dedicated route

---

## Record Data Model

| Option | Description | Selected |
|--------|-------------|----------|
| Two separate tables | client_registrations + contact_enquiries, merged in code | ✓ |
| One unified table + JSONB payload | Single crm_records table with type + payload column | |

**User's choice:** Two separate tables

| Option | Description | Selected |
|--------|-------------|----------|
| Individual typed columns | All registration fields as discrete columns | ✓ |
| JSONB for service/add-on block | Common fields as columns, services as JSONB | |

**User's choice:** Individual typed columns

| Option | Description | Selected |
|--------|-------------|----------|
| Status + notes per table | Status column on each table + shared crm_notes table | ✓ |
| Shared crm_records parent table | Polymorphic parent with FK from each record type | |

**User's choice:** Status + notes per table (status column on each + crm_notes with record_type/record_id)

---

## CRM List UI

| Option | Description | Selected |
|--------|-------------|----------|
| Table rows | Spreadsheet-style rows | ✓ |
| Card grid | Each record as a Card component | |

**User's choice:** Table rows

| Option | Description | Selected |
|--------|-------------|----------|
| Name / Email / Type / Status / Date | Five core columns | ✓ |
| Name / Email / Phone / Type / Subject / Status / Date | Wider column set, requires scroll | |

**User's choice:** Name / Email / Type / Status / Date

| Option | Description | Selected |
|--------|-------------|----------|
| Live client-side filter | All records loaded once, filtered in browser | ✓ |
| Server-side search via API | Submit/enter triggers DB query | |

**User's choice:** Live client-side filter

---

## Record Detail + Notes

| Option | Description | Selected |
|--------|-------------|----------|
| Full page — /admin/crm/[id] | Dedicated route, back-link to list | ✓ |
| Slide-out drawer | Side panel without leaving list | |
| Modal dialog | Popup over list | |

**User's choice:** Full page — /admin/crm/[id]

| Option | Description | Selected |
|--------|-------------|----------|
| Append-only log | Textarea + "Add note" appends timestamped entries; no edit/delete | ✓ |
| Single editable field | One textarea the owner can overwrite | |

**User's choice:** Append-only log

---

## CSV Export

| Option | Description | Selected |
|--------|-------------|----------|
| Single merged CSV | One file, all record types, type-specific columns with empty cells where not applicable | ✓ |
| Two separate CSVs | Separate export buttons for registrations and enquiries | |

**User's choice:** Single merged CSV

---

## Claude's Discretion

- Exact SQL column names and types beyond the specified schema decisions
- Loading skeleton / loading state for CRM list
- Pagination approach (start with "load all" given client-side filter choice)
- Status badge colour scheme
- Sidebar collapse behaviour
- Empty state design when no records exist

## Deferred Ideas

None raised during discussion.
