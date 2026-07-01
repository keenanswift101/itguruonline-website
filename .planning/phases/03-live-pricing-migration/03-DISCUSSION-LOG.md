# Phase 3: Live Pricing Migration — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 03 — Live Pricing Migration
**Areas discussed:** Source-of-truth cutover, Admin package editor UI, Domain price structure, Public site freshness, Site settings

---

## Source-of-Truth Cutover

| Option | Description | Selected |
|--------|-------------|----------|
| Direct DB fetch in server components | Services page and wizard import `db` and query directly — same pattern as admin pages | ✓ |
| New public API endpoint | GET /api/pricing/packages; public pages call via fetch — extra network hop | |
| TypeScript const + DB override | Keep const as fallback; DB overrides when rows exist — harder to reason about | |

**User's choice:** Direct DB fetch in server components

| Option | Description | Selected |
|--------|-------------|----------|
| Delete it — DB is the only source | Seed DB from const, then delete. Clean single source of truth. | ✓ |
| Keep as seed reference only | Mark deprecated; never consumed at runtime | |
| Keep as TypeScript type definitions only | Strip prices/features, keep HostingPackage union type only | |

**User's choice:** Delete HOSTING_PACKAGES const — DB is the only runtime source

---

## Admin Package Editor UI

| Option | Description | Selected |
|--------|-------------|----------|
| Inline table editing | Click a cell, type, blur to auto-save. Fastest for quick price tweaks. | ✓ |
| Edit form per package | Table row → Edit button → full form. More room for features. More clicks. | |
| Edit all packages at once | One large form with all 6 packages. Single Submit. | |

**User's choice:** Inline table editing

| Option | Description | Selected |
|--------|-------------|----------|
| Textarea — one feature per line | Simple textarea, each line = one feature. Easy add/remove/reorder. | ✓ |
| Dynamic list with add/remove buttons | List of inputs with +/- controls. More polished but complex client state. | |
| Claude's discretion | Let planner decide approach. | |

**User's choice:** Textarea — one feature per line

---

## Domain Price Structure

| Option | Description | Selected |
|--------|-------------|----------|
| TLD + registration price only | Simple flat model — one price per TLD. Blank = no price shown. | ✓ |
| TLD + registration + renewal prices | Separate registration vs renewal prices. More realistic. More complex admin UI. | |

**User's choice:** TLD + registration price only (flat model)

| Option | Description | Selected |
|--------|-------------|----------|
| Domain Checker page only | Price shown next to available TLD badge in checker results. | ✓ |
| Domain Checker + Services page | Prices on checker AND a new pricing table on Services. | |
| Claude's discretion | Let planner decide placement. | |

**User's choice:** Domain Checker page only

---

## Public Site Freshness

| Option | Description | Selected |
|--------|-------------|----------|
| no-store fetch — always fresh | `{ cache: 'no-store' }`. Every request hits DB. Zero staleness. No invalidation logic. | ✓ |
| On-demand revalidation | Admin save triggers revalidatePath(). Cached until edit. More code. | |
| Short ISR — 60s revalidation | Pages regenerate every 60s automatically. Up to 60s stale. | |

**User's choice:** no-store — always fresh

---

## Site Settings

| Option | Description | Selected |
|--------|-------------|----------|
| Contact email (required) | Email shown on Contact page and used for enquiry notifications. | ✓ |
| Hosting setup-fee note (required) | Once-off R395 cPanel setup note shown on Services page and wizard. | |
| Business phone number | Phone shown on contact page. | |
| Business address | Physical address in footer/contact. | |

**User's choice:** Contact email (required)
**Notes:** PRICE-05 also mandates the hosting setup-fee note — included in CONTEXT.md per requirements.

---

## Claude's Discretion

- Exact DB column names and types for hosting packages
- Features storage format (TEXT newline-separated vs JSONB array)
- Admin UI section layout and visual treatment
- Save feedback UX (inline "Saved ✓" vs toast)
- Whether to use single `/admin/pricing` page or sub-routes

## Deferred Ideas

None raised during discussion.
