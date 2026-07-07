---
created: 2026-07-07
source: owner request (mid Phase-7 execution)
priority: high
---

# Pricing admin: add packages + edit/save-confirm UX

Owner request (2026-07-07):

1. **Add new packages** on the Pricing admin page — and any new possible add-on/item for packages — which must then **update on the public website too** (live, like the existing price edits). Today the admin can edit existing packages' fields but (verify) likely cannot CREATE a brand-new package row; the public site reads `hosting_packages` from the DB, so a new package should appear there automatically.

2. **Save-changes confirmation flow** for existing packages:
   - Each package card is **read-only by default** (persisted "card form") to prevent accidental changes.
   - An **Edit** button puts that package into edit mode.
   - A **Save Changes** button confirms the edits before the website updates (no auto-save-on-blur / no live-write on every keystroke).
   - After saving, the package returns to the read-only card form.

## Notes / where this lives
- Admin pricing UI: `src/app/admin/pricing/` (PricingPackagesTable.tsx and friends). Public pricing: `src/app/services/page.tsx` reads `hosting_packages` from DB via `src/lib/pricing.ts` (getHostingPackages).
- Pricing is real business data — kept in DB (`hosting_packages` table). CLAUDE.md notes pricing historically lived in two code places kept in sync by hand, then migrated to DB (Phase 3). New "add package" must write to `hosting_packages`.
- Domain prices (`domain_prices`) have a similar admin surface — consider whether "add item" applies there too (owner said "any new possible item for packages").
- Reuse the toast+spinner feedback system + scheme-dark selects.
- Consider: delete/deactivate a package too? (not explicitly requested — confirm.)

Recommend handling as a small phase (e.g. Phase 9.x or after v2.1) via /gsd:insert-phase or a /gsd:quick task once Phase 7 (Tickets) + Phase 9 (Dashboard) land, OR sooner if owner prioritises.
