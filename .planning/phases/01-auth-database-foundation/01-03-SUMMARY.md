---
phase: 01-auth-database-foundation
plan: 03
type: summary
completed_at: "2026-06-30T18:45:00.000Z"
commit: b1683c7
---

# Plan 03 Summary — Login API + Login Page + Admin Layout

## What shipped

| Artifact | Purpose |
|---|---|
| `src/app/api/admin/login/route.ts` | POST handler — CSRF → parse → zod → lockout → DB lookup → bcrypt → cookie |
| `src/app/api/admin/login/route.test.ts` | 3 always-on tests (CSRF/parse/validate) + 4 DB-conditional |
| `src/app/admin/layout.tsx` | Admin segment layout with fixed bg-image.jpg background |
| `src/app/admin/dashboard/page.tsx` | Stub dashboard — requireAdmin() guard, redirect → /admin/login |
| `src/app/admin/login/page.tsx` | Dark-theme server component shell for the login form |
| `src/components/forms/AdminLoginForm.tsx` | "use client" login form — 200/401/429/500 handling, btn-metallic CTA |

## Test results

```
Test Files  3 passed (3)
     Tests  8 passed | 8 skipped (16)
```
- Skipped: 4 auth.test.ts DB tests + 4 login route DB tests (require `NETLIFY_DATABASE_URL`)
- Run full suite with: `netlify dev:exec npm test`

## Decisions / deviations

- No proxy.ts auth layer — page-level `requireAdmin()` only (Turbopack incompatibility, documented in PROVISIONING-NOTES.md)
- Defense-in-depth order: CSRF → body parse → zod → isLockedOut (DB) → DB lookup → bcrypt.compare
- No user enumeration: unknown email and wrong password return identical 401 body
- Cookie: `httpOnly`, `secure` in production, `sameSite: strict`, 8h maxAge

## Acceptance criteria — all met

- [x] POST /api/admin/login rejects cross-site requests (403)
- [x] Malformed JSON → 400; invalid schema → 422
- [x] Lockout after 5 failed attempts → 429 + Retry-After: 900
- [x] Correct creds → 200 + httpOnly cookie (verified by test)
- [x] Unknown email and wrong password return identical 401 response
- [x] AdminLoginForm uses btn-metallic, calls /api/admin/login, handles 200/401/429
- [x] /admin/dashboard redirects to /admin/login when no valid session

## Next

Plan 04 — Password reset flow (forgot-password + reset-password pages/API, reset email via Resend/emailLayout)
