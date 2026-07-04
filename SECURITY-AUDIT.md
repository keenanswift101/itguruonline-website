# Security Audit — v2.0 Admin Portal — 2026-07-04

Manual OWASP Top 10 static review of the entire v2.0 admin portal (auth, CRM, live pricing, invoicing, scheduled automation) plus the same-day session additions (notification bell, global BCC, dev-only auth bypass, local pg driver branch). This is the "revisit if auth/sessions are ever added" follow-up promised in the 2026-06-16 audit below — cookie-based admin sessions now exist. `npm audit` re-run. ZAP baseline not re-run this pass (admin surface is fully auth-gated; re-run it with an authenticated session when convenient).

## Result summary

- **Access control**: all 17 protected `/api/admin/*` routes call `requireAdmin()` before any body parse or DB access (verified exhaustively); the 4 uncovered routes are the auth endpoints themselves (login/logout/forgot/reset), each with `isTrustedOrigin()` and — where unauthenticated — IP rate limiting. All 10 admin pages/layouts call `requireAdmin()` + redirect. Live-verified in production: unauthenticated `/admin/*` 307s to login; new API routes 401.
- **CSRF (the promised revisit)**: session cookie is `httpOnly`, `secure` (prod), **`sameSite: "strict"`** — browsers attach it to zero cross-site requests, so every `requireAdmin()` route is CSRF-immune by construction. `isTrustedOrigin()` additionally covers the sessionless auth endpoints. No token needed.
- **Injection**: no `dangerouslySetInnerHTML` anywhere; all Drizzle queries parameterized (the one raw `db.execute(sql\`...\`)` — gapless invoice numbering — uses drizzle's tagged template, which binds `${}` as parameters); CRM notes strip HTML/`javascript:` URIs on write; all email HTML built via `escapeHtml()`; CSV exports have RFC 4180 + formula-injection (`=+-@` prefix) defenses in `csvEscape()`.
- **Auth internals**: bcrypt cost 12; lockout 5 fails/15 min checked *before* bcrypt; reset tokens are 32 random bytes stored bcrypt-hashed, 60-min TTL, single-use, and the reset email goes to a fixed owner address regardless of input (no email-redirect takeover); change-password requires the current password; sessions 8h HS256 JWTs.
- **SSRF**: domain checker only ever fetches fixed hosts (`dns.google`, known RDAP endpoints) with the user's domain URL-encoded into the query string — no user-controlled host.
- **DEV_AUTH_BYPASS** (added this session): double-gated on `NODE_ENV === "development"` AND `DEV_AUTH_BYPASS === "1"` (.env.local only). Empirically confirmed inert on production the same day it shipped (live 307-to-login test). Never set it as a Netlify env var.
- **npm audit**: 6 moderate, all in two dev-only chains — see Accepted risk.

## Fixed (2026-07-04)

| Finding | Fix |
|---|---|
| `POST /api/admin/automations/[job]/run` returned `String(err)` in its 500 body — raw driver/DB errors can leak internals (hosts, SQL fragments) even to an authenticated admin's browser | Generic `"Job failed — check function logs."` response; full error now `console.error`'d server-side only. Test updated to assert non-leakage. |
| Login timing enumeration: unknown email skipped the bcrypt compare (~0ms) vs wrong password (~250ms), leaking account existence via response time despite identical bodies | Dummy bcrypt compare against a real throwaway hash when the user is missing — both paths now pay one full-cost compare |
| JWT verification didn't pin the algorithm (safe today — symmetric key restricts jose to HMAC — but fragile if the key type ever changes) | `jwtVerify(..., { algorithms: ["HS256"] })` |
| `POST /api/admin/billing-schedules` with a nonexistent `packageId` surfaced as a raw FK violation (500) | Existence pre-check → 422 `{ packageId: ["Unknown package"] }` |

## Accepted risk (2026-07-04 — reviewed, intentionally not changed)

- **npm audit 6× moderate**: (a) `esbuild <=0.24.2` via drizzle-kit's `@esbuild-kit` loader — dev-time tooling only, never deployed; the advisory concerns esbuild's *dev server*, which drizzle-kit doesn't run. (b) `postcss <8.5.10` flagged via Next.js — npm's proposed "fix" is downgrading to `next@9.3.3`, which is resolver nonsense; waits on an upstream Next release. Same class as the 2 moderates accepted in the v1 audit.
- **Password policy is min-8 only** (reset + change-password): single-owner system, lockout in place, owner uses a generated password. Add complexity/zxcvbn if staff accounts (AUTH-05) ever land.
- **Stateless JWT logout** (no server-side revocation): documented in STATE.md — a raw stolen still-valid token works until its 8h expiry. Consistent with the app's design; revisit with multi-user.
- **`JWT_SECRET` has no length enforcement in code**: current secret is long/random (verified set on Netlify); `getSecret()` could enforce ≥32 bytes but a hard-fail rollout risk isn't worth it right now. Recommendation only.
- **In-memory rate limiter** still per-instance (see v1 entry) — now also relevant to `forgot-password`. Lockout for login is DB-backed (`login_attempts`), which is the endpoint that matters.
- **Optional `packageId` on billing schedules** permits R0 draft invoices ("Hosting Package" fallback) — business-logic choice, not a security issue.
- **Global BCC to info@it-guru.co.za** includes client-facing transactional mail — intentional owner requirement; the skip-if-direct-recipient rule prevents duplicate/looping mail, and password-reset mail already goes to the owner inbox so nothing sensitive gains new exposure.

---

# Security Audit — 2026-06-16

Combined OWASP ZAP baseline scan + manual OWASP Top 10 static code review of the Next.js app, run against a local production build (`next build && next start`). Re-tested after fixes. Read this before making changes to API routes, headers, or rate limiting — re-run the same process if those areas change significantly.

## How to re-run

```
npm run build && npm run start   # production server on :3000

# OWASP ZAP baseline scan (Docker required)
docker run --rm -v "<repo-path>/zap-report:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://host.docker.internal:3000 -r report.html -J report.json -I

npm audit
```

## Result summary

- **ZAP baseline**: 0 FAIL, 61 PASS, 6 WARN (all reviewed — see "Accepted risk" below). Before fixes: 10 WARN, 57 PASS.
- **npm audit**: 6 vulnerabilities (2 high, 3 moderate, 1 low) → fixed via `npm audit fix` (no `--force`) to 2 remaining moderate (see below). Next.js bumped 16.2.1 → 16.2.9 — patch-level, no breaking changes, full rebuild + functional retest passed.
- **Manual static review**: no injection, XSS, SSRF, open redirect, mass-assignment, or information-disclosure issues found (all already mitigated by existing `escapeHtml`/`sanitize` patterns — see `CLAUDE.md` conventions). Findings below were all hardening gaps, not exploitable vulnerabilities found in the wild.

## Fixed

| Finding | Fix |
|---|---|
| No Content-Security-Policy header | Added to `next.config.ts` (`script-src 'self' 'unsafe-inline'`, `img-src` allowing `flagcdn.com`, `frame-src` allowing Google Maps — the only two external resources the site loads) |
| `X-Powered-By: Next.js` header leak | `poweredByHeader: false` in `next.config.ts` |
| No CSRF defense on POST API routes | Added `src/lib/csrf.ts` `isTrustedOrigin()` — compares `Origin` header to `Host` header, rejects mismatches with 403. Applied to all 3 POST routes (contact, register, domain/check) |
| `X-Forwarded-For` trusted naively (spoofable in theory) | Added `src/lib/client-ip.ts` `getClientIp()` — prefers Netlify's own `x-nf-client-connection-ip` (set by Netlify's edge from the real TCP connection, not client-controllable), falls back to `x-forwarded-for` for local dev |
| `hostingPackage` field accepted any string | `validateStepC` in `registration-validators.ts` now whitelists against the 6 known package ids |
| `additionalServices` field had no length cap | Capped at 2000 chars in `validateStepC`, matching the existing `message` cap in the contact form |
| 2 high + 1 low npm vulnerabilities (Next.js DoS/SSRF/cache-poisoning advisories, picomatch ReDoS) | `npm audit fix` → Next.js 16.2.1 → 16.2.9, picomatch patched. Full rebuild + 8-page console-error check + 2 end-to-end form submissions retested clean |

## Accepted risk (reviewed, intentionally not changed)

- **`script-src 'unsafe-inline'` in the CSP**: Next.js App Router injects inline hydration scripts without a nonce by default. Removing `unsafe-inline` requires a nonce-based CSP via middleware (`next/headers`), which adds real complexity/build risk for a mostly-static marketing site with no external script tags and very little reflected user input. The CSP still blocks loading scripts from *third-party origins* — the main XSS exfiltration vector — which is the meaningful win here.
- **No CSRF token in the contact form**: there is no session/cookie-based authentication anywhere in the app, so classic CSRF (which relies on a victim's ambient credentials) has low real impact — a forged cross-site POST can only submit the form anonymously, same as any visitor could do directly. The `Origin` check (see Fixed table) covers the cheap drive-by case. Revisit if auth/sessions are ever added.
- **No `Cross-Origin-Embedder-Policy` header**: enabling `require-corp` COEP would very likely break the Google Maps iframe on the Contact page and the `flagcdn.com` flag images on the registration form, since neither third party is guaranteed to send a `Cross-Origin-Resource-Policy` header. Not worth the breakage risk for a site with no `SharedArrayBuffer`/cross-origin-isolation requirement.
- **In-memory rate limiter** (`src/lib/rate-limiter.ts`): resets on every serverless cold start and doesn't share state across concurrent function instances on Netlify — acknowledged in the code's own comment. Still better than nothing, and replacing it with a Redis/Upstash-backed limiter means adding paid infrastructure, which should be a deliberate choice, not a side effect of an audit. Revisit if contact/register form spam becomes a real problem.
- **`User Controllable HTML Element Attribute` ZAP warning on `/contact`**: false positive — it's flagging the Netlify Forms hidden `form-name` field (required by Netlify's own static-form spam detection), not a real reflected-input sink.
- **`Storable and Cacheable Content` ZAP warning**: intentional — these are public marketing pages with no PII or session-specific content; caching them is the correct, desired behavior, not a leak.
