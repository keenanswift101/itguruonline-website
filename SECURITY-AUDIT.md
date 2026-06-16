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
