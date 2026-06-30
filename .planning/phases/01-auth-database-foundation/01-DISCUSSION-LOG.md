# Phase 1: Auth + Database Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 1-auth-database-foundation
**Areas discussed:** Login page look & feel, Password recovery, Admin entry point visibility, Initial credential setup

---

## Login page look & feel

| Option | Description | Selected |
|--------|-------------|----------|
| Match site theme | Reuses `.btn-metallic`/`.btn-glass` and the dark `bg-image.jpg` system already in `globals.css` — consistent brand, less new CSS to write | ✓ |
| Distinct minimal look | A plain, utilitarian login screen signaling "internal tool, not public site" — more to design from scratch | |

**User's choice:** Match site theme
**Notes:** None

---

## Password recovery

| Option | Description | Selected |
|--------|-------------|----------|
| Email reset link | A "Forgot password" link sends a one-time reset link via Resend (already integrated) | ✓ |
| Manual recovery only | No self-service flow — a developer resets the password directly in the database if locked out | |

**User's choice:** Email reset link

Follow-up — which email address should receive the reset link:

| Option | Description | Selected |
|--------|-------------|----------|
| ambrose@it-guru.co.za | The mailbox confirmed working earlier this session on the cPanel mail server | ✓ |
| info@it-guru.co.za | The general contact address already used as the public-facing contact email | |

**User's choice:** ambrose@it-guru.co.za
**Notes:** None

---

## Admin entry point visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Bookmark/URL-only | No link anywhere on the public site — direct URL navigation only | ✓ |
| Small footer link | A discreet "Admin" link in the footer | |

**User's choice:** Bookmark/URL-only
**Notes:** None

---

## Initial credential setup

| Option | Description | Selected |
|--------|-------------|----------|
| Env-var seeded | Owner picks email/password, developer sets as Netlify env vars, one-time seed script creates the DB account | ✓ |
| One-time setup page | A first-run web page where owner sets credentials directly through the browser | |

**User's choice:** Env-var seeded
**Notes:** None

---

## Claude's Discretion

- Exact lockout duration/threshold (failed-attempt count, lockout window length)
- Exact password-reset link expiry window
- Cookie name, JWT claims structure, database schema column types/constraints

## Deferred Ideas

None — discussion stayed within phase scope.
