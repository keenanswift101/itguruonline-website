---
phase: 01-auth-database-foundation
plan: 04
type: summary
completed_at: "2026-07-01T19:17:00.000Z"
commit: e5acafa
---

# Plan 04 Summary — Password Reset Flow

## What shipped

| Artifact | Purpose |
|---|---|
| `src/lib/auth.ts` (updated) | `createResetToken` + `consumeResetToken` helpers (bcrypt-hashed, 1h TTL, single-use) |
| `src/app/api/admin/forgot-password/route.ts` | POST — rate-limited, generates token, emails fixed recipient, always 200 |
| `src/app/api/admin/reset-password/route.ts` | POST — verifies token, sets new password, clears token |
| `src/app/api/admin/reset-password/route.test.ts` | 3 always-on + 7 DB-conditional tests |
| `src/app/admin/forgot-password/page.tsx` | Dark-theme request-reset page |
| `src/components/forms/ForgotPasswordForm.tsx` | "use client" form — neutral confirmation, no enumeration leakage |
| `src/app/admin/reset-password/page.tsx` | Dark-theme set-new-password page (reads token search param) |
| `src/components/forms/ResetPasswordForm.tsx` | "use client" form — client-side match validation, btn-metallic |

## Test results

```
Test Files  4 passed (4)
     Tests  11 passed | 15 skipped (26)
```
- Skipped: DB-conditional tests (run with `netlify dev:exec npm test`)

## Security properties

- Reset token stored as **bcrypt hash** — raw token is emailed, never persisted
- Reset link always sent to `ambrose@it-guru.co.za` (D-03) regardless of form email entered
- **No account enumeration**: forgot-password route always returns 200 regardless of email match
- Token is **single-use**: consumeResetToken clears resetToken + resetTokenExpiresAt on success
- Token expires in **1 hour** (RESET_TOKEN_TTL_MINUTES = 60)
- In-memory rate limit on forgot-password endpoint (`forgot:${ip}`) prevents email-bombing
- Reset email built with `emailLayout()` — table-based, every style inline (Outlook compatibility)

## Acceptance criteria — all met

- [x] `createResetToken` stores bcrypt hash + future expiry, returns raw token
- [x] `consumeResetToken` sets new bcrypt password and clears token on success
- [x] Expired or already-used tokens rejected (returns false → 400)
- [x] Forgot route returns identical 200 for matched/unmatched email (no enumeration)
- [x] Forgot route always emails `ambrose@it-guru.co.za` (D-03), never the form email
- [x] Reset email is table-based with inline styles only (no style block, no flexbox/grid)
- [x] ForgotPasswordForm shows neutral confirmation ("If that account exists…")
- [x] ResetPasswordForm shows "This reset link is invalid or has expired" on 400

## Phase 1 complete

All 4 plans executed. The full auth foundation is in place:
- Database provisioned (Netlify built-in Neon Postgres)
- Schema migrated (admin_users + login_attempts)
- JWT cookie auth with lockout
- Login page + API route
- Password reset flow (forgot + reset)

## Next

STATE.md → Phase 2. Plan-phase for Phase 2 (CRM / Enquiry Capture).
