# Phase 2: CRM Capture + Viewing — Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers two things:

1. **Capture** — Both `register/route.ts` and `contact/route.ts` are updated to persist their submissions to the database as typed records, even if email delivery fails. This fills the existing `// TODO: Persist to DB` placeholder in the registration route.

2. **Viewing** — A CRM section at `/admin/crm` where the owner can list all records (registrations + enquiries combined), search/filter live, open a record's full detail page, change its status, append timestamped notes, and export the full list as CSV.

Phase 2 also introduces the persistent sidebar navigation structure that all subsequent admin phases (pricing, invoicing, settings) will extend.

</domain>

<decisions>
## Implementation Decisions

### Admin Navigation Structure
- **D-01:** Persistent left sidebar nav on all `/admin/*` pages. Links: CRM, Pricing (Phase 3), Invoices (Phase 4), Settings (Phase 5). The sidebar is introduced in Phase 2 so Phases 3–5 each just add a nav entry — no layout rework needed later.
- **D-02:** CRM lives at `/admin/crm` (separate route). The current `/admin/dashboard` stub remains a summary/home page, giving room to add metrics/quick-actions in a later phase without URL changes.

### Record Data Model
- **D-03:** Two separate tables — `client_registrations` and `contact_enquiries`. Each stores its full typed payload. A combined list view queries both and merges/sorts in code with a `type` label. Avoids a JSONB blob, keeps schema typed, and is cleanest for Phase 4 invoicing (find all clients on 'advanced' package).
- **D-04:** `client_registrations` uses individual typed columns for all fields (personal info, domain, hosting package, add-ons, declaration). No JSONB blobs — all fields must be queryable for Phase 4 lookups (e.g. find all 'enterprise' clients for recurring billing).
- **D-05:** Status column (`status VARCHAR`, values: `new` | `contacted` | `in_progress` | `completed`) lives on each table. Notes use a shared `crm_notes` table with `record_type TEXT` (values: `registration` | `enquiry`) + `record_id INTEGER` + `body TEXT` + `created_at TIMESTAMPTZ`. This avoids a polymorphic parent table while keeping one notes query pattern.

### CRM List UI
- **D-06:** Table/spreadsheet layout — rows, not cards. Standard for internal admin tools; most efficient for scanning 50+ records.
- **D-07:** Visible columns: **Name / Email / Type / Status / Date**. Type = "Registration" or "Enquiry" badge. Status = coloured badge. Date = submitted date. Fits on screen without horizontal scroll.
- **D-08:** Live client-side filtering — all records loaded once on page load, filtered in-browser as the owner types into a search box. No server round-trip per keystroke. Appropriate for the expected scale (hundreds of records max).

### Record Detail View
- **D-09:** Full-page route — `/admin/crm/[id]` with a back-link to `/admin/crm`. Clean URL, back-button works naturally, plenty of vertical space for rich registration data with many fields.
- **D-10:** Notes are an **append-only log**: a textarea + "Add note" button appends a new timestamped entry. All past notes shown in chronological order below the input. Notes are never edited or deleted — preserves a clean audit trail.

### CSV Export
- **D-11:** Single merged CSV (one button, one file). Columns: ID, Type, Name, Email, Phone, Status, Submitted Date, and key type-specific fields (Domain / Package / Add-ons for registrations; Subject / Message for enquiries). Empty cells where a field doesn't apply to the record type.

### Claude's Discretion
- Exact column names / SQL types beyond what D-03/D-04/D-05 specify
- Loading skeleton / loading state for the CRM list
- Pagination: start with "load all" (client-side filter chosen), add pagination only if list grows beyond a practical threshold
- Status badge colour scheme (must use Tailwind v4 CSS custom property syntax)
- Sidebar collapse/expand behavior (icon-only collapsed vs always-open is fine either way)
- Empty state when no CRM records exist yet
- `client_registrations` reference ID column name and format (matches existing `ITG-YYYYMMDD-XXXXX` from `register/route.ts`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing DB layer (extend, don't replace)
- `src/lib/db/schema.ts` — current schema (adminUsers, loginAttempts); add new CRM tables here
- `src/lib/db/index.ts` — lazy proxy DB client; import `db` from here in all new routes
- `drizzle.config.ts` — migration output path is `netlify/database/migrations/`; run `npx drizzle-kit generate` after schema changes

### Existing API routes to modify for capture
- `src/app/api/register/route.ts` — has `// TODO: Persist to DB` placeholder; Phase 2 fills this in with a DB insert BEFORE email (so capture succeeds even if email fails)
- `src/app/api/contact/route.ts` — same pattern; add DB insert before email send

### Types + validation
- `src/lib/registration-types.ts` — defines `RegistrationFormData` (StepAData, StepBData, StepCData, StepDData), `HOSTING_PACKAGES`, `HostingPackage` union — use these types when defining the DB insert payload

### Admin layout + auth pattern
- `src/app/admin/layout.tsx` — current admin layout (bg-image.jpg fixed background); Phase 2 wraps this with the sidebar nav
- `src/app/admin/dashboard/page.tsx` — existing stub to update once sidebar nav exists
- `src/lib/auth.ts` — `requireAdmin()` must be called at the top of every new admin server component page

### Design system
- `CLAUDE.md` — Tailwind v4 syntax rules (`text-(--text-primary)` NOT `text-[var(--text-primary)]`), btn-metallic/btn-glass classes, dark-only theme, bg-image.jpg as fixed background, no per-section bg fills
- `src/components/ui/Card.tsx` — reusable card (rounded-2xl, border, bg-primary); may be useful for detail page sections
- `src/app/globals.css` — CSS custom properties: `--text-primary`, `--text-secondary`, `--bg-primary`, `--border-color`

### Requirements
- `.planning/REQUIREMENTS.md` — CRM-01 through CRM-07 (all must be covered)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx` — `Card` with optional `hover` prop; useful for detail page sections (personal info block, service selection block, notes block)
- `src/lib/auth.ts` — `requireAdmin()` — already used in dashboard; same pattern for every new admin page
- `src/lib/db/index.ts` — `db` proxy client, already wired to Netlify Neon
- `src/lib/csrf.ts` — `isTrustedOrigin()` — already on login and register routes; add to any new admin API routes
- `src/lib/email.ts` — `sendEmail`, `emailLayout`, `escapeHtml` — existing pattern; capture must happen BEFORE sendEmail so a send failure doesn't skip persistence

### Established Patterns
- Server components with `async` + `await requireAdmin()` → `redirect("/admin/login")` for auth-guarded pages
- `"use client"` only where state/interactivity needed (search input, note form, status dropdown)
- Tailwind v4 `bg-(--bg-primary)/80 backdrop-blur-sm rounded-xl border border-(--border-color)` — the admin panel glass style
- Drizzle: `db.insert().values()`, `db.select().from().where()`, `db.update().set().where()` — already used in auth.ts; follow the same pattern

### Integration Points
- Sidebar nav wraps all `/admin/*` pages — Phase 2 replaces `src/app/admin/layout.tsx` to add the sidebar shell
- `register/route.ts` and `contact/route.ts` each get a DB insert block added BEFORE the email sends
- `/admin/crm` and `/admin/crm/[id]` are new routes under the existing admin layout
- New API routes: `GET /api/admin/crm` (list), `GET /api/admin/crm/[id]` (detail), `PATCH /api/admin/crm/[id]/status`, `POST /api/admin/crm/[id]/notes`, `GET /api/admin/crm/export.csv`
- All admin API routes must call `requireAdmin()` and return 401 if not authenticated

</code_context>

<specifics>
## Specific Ideas

- The registration route already generates `ITG-YYYYMMDD-XXXXX` reference IDs — store this as `reference_id` in `client_registrations` and display it prominently on the detail page
- Status badge colours should follow the site's neon-accent style: New = cobalt blue `#00aaff`, Contacted = amber, In Progress = purple, Completed = green — all with the characteristic `box-shadow` glow
- The sidebar nav should show the owner's email (from session) at the bottom, matching the existing dashboard greeting pattern

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-crm-capture-viewing*
*Context gathered: 2026-07-01*
