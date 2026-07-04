---
created: 2026-07-04
source: owner request (mid-Phase-5 session)
priority: high
---

# Notification bell for new registrations in admin portal

Owner request (2026-07-04, during Phase 5 execution): "add a bell icon that shows new registrations."

## Context / already-done half of the request

The owner also asked that "client registration applications get captured from the website into the portal and capture all details from the registration form" — **this already exists** (Phase 2 CRM capture):
- `/api/register` inserts every wizard field (Steps A–D: personal info, domain + nameservers, package + add-ons, signature/terms) into `client_registrations` before sending emails.
- `/admin/crm` lists records; `/admin/crm/[id]` renders all fields.
- Verified in code 2026-07-04 (`src/app/api/register/route.ts:125-147`, `src/app/admin/crm/[id]/page.tsx`).
- If the owner reports fields missing in the portal, get a concrete example — the schema and detail page cover the full form.

## New work — the bell

- Bell icon in the admin portal chrome (AdminSidebar or a header slot) showing a count of **new** registrations (status = "new" in `client_registrations`; consider including new `contact_enquiries` too — same "new" status convention).
- Clicking it should navigate to `/admin/crm` (possibly pre-filtered to status=new).
- Needs a small authed count endpoint (e.g. `GET /api/admin/crm/new-count`) or a server-component query; sidebar is a client component so likely fetch + poll (lightweight interval) or refresh-on-navigation.
- Respect existing auth pattern: `requireAdmin()` first in any new route.
- Suggested treatment per design system: neon cobalt (#00aaff) badge/glow consistent with the site's signature highlight style.

Recommend: `/gsd:insert-phase` as Phase 5.1 after Phase 5 completes, or fold into a quick task via `/gsd:quick`.
