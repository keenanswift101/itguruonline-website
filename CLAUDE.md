# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

IT-Guru Online — marketing site + client onboarding **+ single-admin business portal** for a Kuils River (South Africa) IT support company. Live at **https://it-guru.co.za** (admin also at **admin.it-guru.co.za**). Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4. Deployed on Netlify (`@netlify/plugin-nextjs`). Transactional email via Resend. Database is **Netlify's built-in Postgres (Neon under the hood)** accessed via Drizzle ORM.

Two halves:
- **Public marketing site** (`/`, `/services`, `/about`, `/contact`, `/register`, `/domain-checker`, `/privacy`, `/terms`) — mostly static, with three public API routes (contact, register, domain check).
- **Admin portal** (`/admin/*`, all behind `requireAdmin()`) — shipped as milestone **v2.0**: dashboard, CRM (captures every registration/enquiry), live-editable hosting/domain pricing, invoicing, and scheduled automation. See `.planning/MILESTONES.md` and `.planning/RETROSPECTIVE.md` for the full build history.

See `SECURITY-AUDIT.md` for both security reviews (2026-06-16 marketing-site OWASP pass, and the 2026-07-04 v2.0 admin-portal audit) — read it before touching API routes, auth, `next.config.ts` headers, or rate limiting.

## Commands

```
netlify dev      # ← USE THIS for local dev (provisions local Postgres + injects DB env). NOT `npm run dev`.
npm run build    # next build
npm run start    # next start
npx tsc --noEmit # typecheck (no dedicated script; note: covers **/*.mts too — see tsconfig include)
npx vitest run   # full test suite (DB-dependent tests auto-skip unless NETLIFY_DB_URL is set)

# Local database (only works while `netlify dev` is running in another terminal, or via dev:exec):
netlify database status                          # provisioning + applied migrations
netlify database migrations apply                # apply pending migrations to the LOCAL dev DB
netlify database connect --query "SELECT ..."    # one-shot SQL against the local dev DB
npm run db:generate                              # drizzle-kit generate (new migration from schema.ts diff)
```

**`npm run dev` / bare `next dev` cannot reach any database** — the app's DB layer needs the `NETLIFY_DB_URL` + `NETLIFY_DB_DRIVER` env that only `netlify dev` injects. Always use `netlify dev` (serves the whole app + functions on `http://localhost:8888`). `npm run lint` is broken repo-wide (`next lint` was removed in Next.js 16) — use `npx tsc --noEmit` + `npx vitest run` instead.

## Architecture

**Public site:**
- `src/app/` — App Router pages: `/`, `/services`, `/about`, `/contact`, `/register`, `/domain-checker`, `/privacy`, `/terms`. Each page is a server component that composes section/UI components.
- `src/components/sections/` — page-specific large sections (Hero, ServiceCards, TechStack, Values, CTABanner).
- `src/components/ui/` — small reusable pieces (Button, Card, Reveal, CTAPanelBackground, FloatingActions, QuestionTab, DomainPromo, CookieConsent).
- `src/components/forms/` — RegistrationWizard (multi-step), ContactForm, DomainChecker; wizard steps live in `forms/steps/`.
- `src/components/layout/` — Header, Footer.
- `src/app/globals.css` — design tokens (`--bg-primary`, `--text-secondary`, etc.) and the two custom button classes `.btn-metallic` (primary) and `.btn-glass` (secondary).

**Admin portal (v2.0):**
- `src/app/admin/*` — admin pages (dashboard, crm, pricing, invoices, automations, settings, login/forgot/reset). Each page and the `admin/layout.tsx` call `requireAdmin()` and redirect to `/admin/login` when unauthenticated. Sidebar is `src/components/admin/AdminSidebar.tsx` (includes the `NotificationBell` showing new-CRM-record count).
- `src/app/api/admin/*` — admin API routes. **Every one calls `requireAdmin()` first, before any body parse or DB access** (returns 401 otherwise). The auth endpoints (login/logout/forgot/reset) are the exception — they're unauthenticated by nature and instead use `isTrustedOrigin()` (+ rate limiting where applicable).
- `src/lib/db/` — `schema.ts` (Drizzle tables), `index.ts` (the `db` singleton), `tx.ts` (`withTxDb()` for transactions). **See "Database" below — the driver logic here is load-bearing and has broken production before.**
- `src/lib/auth.ts` — JWT/cookie session auth (hand-rolled, single-admin), bcrypt, lockout, reset tokens, `requireAdmin()`.
- `src/lib/automation/` — the three scheduled-job modules (`enquiry-reminder`, `invoice-reminder`, `recurring-billing`); `netlify/functions/*.mts` are thin cron wrappers calling them, and `POST /api/admin/automations/[job]/run` is the manual trigger. See "Automations" below.
- Invoicing: `src/lib/invoices.ts`, `src/lib/invoice-status.ts`, gapless SARS-compliant numbering assigned atomically on draft→sent.

## Database — read before touching `src/lib/db/*` (has caused production outages)

- **Connection string is `NETLIFY_DB_URL`** (with `NETLIFY_DB_DRIVER`), NOT the legacy `NETLIFY_DATABASE_URL`. `src/lib/db/index.ts` and `tx.ts` explicitly pass `process.env.NETLIFY_DB_URL` to the driver. Never revert to a bare `neon()` call, never read `NETLIFY_DATABASE_URL`, and never import `@netlify/database` (it static-imports `pg` and Turbopack mangles it into an unresolvable module in deployed functions — same failure class that killed the old `proxy.ts`).
- **Driver branches on `NETLIFY_DB_DRIVER`:** production injects `serverless` → uses the Neon HTTP driver (`@netlify/neon`). Local `netlify dev` injects `server` + a plain TCP Postgres → uses `drizzle-orm/node-postgres` + `pg`. `pg` is pinned in `dependencies` and listed in `serverExternalPackages` (next.config.ts) so Turbopack never bundles it. The `NETLIFY_DB_DRIVER === "server"` branch is unreachable in deployed functions.
- **Transactions:** the neon-http driver throws on `db.transaction()`. Any multi-statement atomic write MUST go through `withTxDb()` in `src/lib/db/tx.ts` (per-request Pool). It has the same server/serverless driver branch.
- **Migrations** live in `netlify/database/migrations/` and Netlify **auto-applies them on deploy**. Numbering: `0000` initial, `0001` CRM, `0002` pricing, `0003` invoices, `0004` automation. Apply locally with `netlify database migrations apply`.
- **The `neon` Netlify team extension is legacy — do NOT uninstall it.** The DB now runs on Netlify's *built-in* Database feature, but the extension's uninstall warns it removes config that "may cause errors" and is irreversible. Reward is a cosmetic build-log warning; risk is a DB outage. Leave it installed.
- **Testing trap:** only a real git-triggered production build (push to `main`) is trustworthy for DB-touching behavior. `netlify deploy` (draft/CLI) builds locally and leaks `.env.local`; `netlify dev:exec` runs a bare script without real function bindings. Both give false positives. Verify DB-touching prod changes via the real deployed endpoint over HTTPS (e.g. Run Now on `/admin/automations`, or a public pricing page).

## Local dev — auth bypass

For zero-login local testing, `requireAdmin()` auto-passes when **both** `NODE_ENV === "development"` AND `DEV_AUTH_BYPASS === "1"` (the flag lives only in `.env.local`). Double-gated: `NODE_ENV` is `"production"` in every deployed build, so it cannot activate in prod. **Never set `DEV_AUTH_BYPASS` as a Netlify env var.** Delete the `.env.local` line to test the real login flow locally. `.env.local` also carries `ADMIN_REMINDER_EMAIL` (override for who reminder emails go to; prod default is `ambrose@it-guru.co.za`).

## Automations (scheduled jobs)

- Three jobs, single source of truth in `src/lib/automation/`: **enquiry-reminder** (daily 08:00 UTC, emails owner about stale enquiries), **invoice-reminder** (daily 08:00 UTC, overdue invoices), **recurring-billing** (monthly 1st 07:00 UTC, generates draft invoices for active billing schedules).
- Each has a `netlify/functions/*.mts` cron wrapper (production trigger) AND a `POST /api/admin/automations/[job]/run` manual trigger (dev/testing). Both call the same job module with a `triggeredBy` value.
- **Idempotency is critical** — recurring-billing must never double-bill. It uses a DB unique constraint (`invoices_recurring_unique` on billing schedule + period) + `onConflictDoNothing()` inside `withTxDb()`. Reminders dedupe via a `lastRemindedAt` date column (skip if already reminded today).
- Thresholds (stale-enquiry days, overdue-reminder days) are owner-editable in `/admin` Site Settings, read from `site_settings` at job run.
- Every run writes an `automation_runs` audit row (success/error + summary), surfaced on `/admin/automations`.

## Design system — single dark theme (no light/dark toggle)

Light/dark mode was removed entirely (`ThemeProvider`, `ThemeToggle`, and all `data-theme="light"` CSS were deleted). The site is dark-only:

- `<html data-theme="dark">` is hardcoded in `src/app/layout.tsx`. Do not reintroduce a theme toggle or `useTheme` hook unless explicitly asked.
- Every page wraps its content in `<div className="relative">` with a `<div className="fixed inset-0 -z-10">` holding a full-bleed `next/image` of `/bg-image.jpg` (`fill`, `object-cover object-center`, `priority`). This is the **one** background image for the whole site — don't add per-section `bg-slate-900`/`footer_bg.png` hero overlays or `bg-(--bg-secondary)` fills; sections should be `bg-transparent` so the fixed image shows through everywhere.
- Tailwind v4 canonical arbitrary-value syntax: use `text-(--text-secondary)`, `bg-(--bg-primary)`, `border-(--border-color)` — **not** `text-[var(--text-secondary)]`. The IDE will warn on the bracket form; fix it when touched.
- Buttons: `.btn-metallic` = flat deep-navy primary CTA (no 3D press, no outer glow — just an inner highlight + shine sweep). `.btn-glass` = frosted liquid-glass secondary CTA (`bg-white/10 backdrop-blur-xl`). Both defined in `globals.css`; reuse these classes rather than one-off button styles.
- Neon accents: active nav underline and stat-card underlines use bright electric colors (`#00aaff` cobalt blue for nav, per-stat neon colors in `Hero.tsx`) with a `box-shadow` glow — this is the site's signature highlight style, prefer it over solid highlight boxes.
- `Reveal` (`src/components/ui/Reveal.tsx`) is the standard scroll-reveal wrapper (IntersectionObserver + `animate-fade-in-up`, respects `prefers-reduced-motion`). Wrap new section content in it rather than writing a new observer.
- Header uses a 3-column CSS grid (`grid-cols-[auto_1fr_auto]`: logo / centered nav / actions) — **not** absolute positioning for the nav. Absolute-centering the nav was tried and broke at viewport widths where the logo+nav+actions didn't fit (nav overlapped or clipped the logo); the grid guarantees each section gets its own space. Register is pulled out as a `.btn-metallic` CTA in the actions column, not part of the regular nav-link list.
- Country/flag pickers (e.g. registration form's cell-phone country code) **cannot** use a native `<select><option>` — `<option>` can't render `<img>`, and emoji flags don't render on Windows (show as text like "ZA" instead of 🇿🇦). Build a custom dropdown (button + listbox) with flag images from `flagcdn.com` instead, like `StepApplicantInfo.tsx`'s `CountryCodeSelect`.
- Outgoing emails (`src/lib/email.ts` `emailLayout()`) are deliberately table-based with every style inline — no `<style>` block, no flexbox/grid. Outlook desktop and other webmail clients strip `<style>` tags and don't support flexbox/grid, so anything added to email HTML must follow this same table+inline-style pattern to render consistently.
- **Every outgoing email is BCC'd to the business inbox** (`info@it-guru.co.za`, `BCC_COPY_ADDRESS` in `email.ts`) — owner requirement so IT-Guru keeps a copy of all automation + transactional mail. The BCC is skipped when the inbox is already a direct recipient (no duplicate mail). Override with `EMAIL_BCC_COPY` env var; set it to `"off"` to disable. This is applied centrally in `sendEmail()`, so any new email automatically gets it — don't re-implement per-call.

## Deployment — branch strategy

**Netlify only builds/deploys the `main` branch** (site `it-guru-online`, `build_settings.repo_branch` and `allowed_branches` are both `["main"]`). Day-to-day work happens on `dev`. Pushing to `dev` alone **will not trigger a Netlify deploy** — this caused a "nothing deployed" incident where several commits sat on `dev` with no build at all.

To ship to production:
```
git checkout main
git merge dev --ff-only   # dev should already be linear ahead of main
git push origin main
git checkout dev          # switch back to keep working
```
Verify a deploy actually fired with `netlify api listSiteDeploys --data '{"site_id":"2cb84145-76d9-4916-ae7d-9df49a5a348c"}'` (or check the Netlify dashboard) — look for `"branch": "main"` and `"state": "ready"` on the latest entry with the expected `commit_ref`.

Only merge `dev` → `main` when explicitly asked to deploy/ship/push live — don't do it automatically after every commit.

### `NEXT_PUBLIC_BASE_URL` — must be set on Netlify, and a fresh build is required for changes to take effect

`NEXT_PUBLIC_BASE_URL` is read in `layout.tsx` (metadataBase/OG), `robots.ts`, `sitemap.ts`, and `email.ts` (logo/signature-background absolute URLs), all falling back to `https://it-guru.co.za` if unset. It is currently set on Netlify to `https://it-guru.co.za` (the live custom domain). History: was previously unset (falling back to the dead domain `https://it-guru.online`) which silently broke OG image previews and email logo images for a while.

Env var changes only apply to the *next* build — if OG images or email images break, check (a) the env var is still correct (`netlify env:list --site 2cb84145-76d9-4916-ae7d-9df49a5a348c`) and (b) whether `main` has been rebuilt since the env var was set.

## Conventions

- Server components by default; add `"use client"` only where state/effects are needed (Header, ServiceCards, Hero-adjacent interactive bits).
- **Admin API routes: `requireAdmin()` is always the first line**, before body parsing or DB access — 401 before anything else. Mutation routes validate input with a zod schema (return 422 with `fieldErrors` on failure). Don't leak raw errors in responses — `console.error` server-side and return a generic message (see the automations run route).
- Auth internals (`src/lib/auth.ts`): bcrypt cost 12, DB-backed login lockout (5 fails/15 min) checked *before* bcrypt, reset tokens are random-32-byte bcrypt-hashed with 60-min single-use TTL, sessions are 8h HS256 JWTs in an `httpOnly` + `secure` + `sameSite:strict` cookie (the sameSite makes every `requireAdmin()` route CSRF-immune — no token needed). Login does a dummy bcrypt compare on unknown email to avoid timing enumeration. Logout is stateless (clears the cookie; no server-side revocation).
- `.mts` files (Netlify scheduled functions) are only type-checked because `tsconfig.json`'s `include` has `**/*.mts` — keep it there, or `tsc` silently skips them.
- Section components accept no props and own their copy/data arrays at the top of the file (see `Hero.tsx`, `TechStack.tsx`, `Values.tsx`) — keep new sections consistent with this pattern rather than threading props through pages.
- Decorative images/icons get `aria-hidden="true"`; keep accessible labels (`aria-label` on `<section>`, real `alt` text on content images) intact when editing.
- Pricing is real business data, not placeholder copy — it lives in two places that must be kept in sync by hand: `HOSTING_PACKAGES` in `src/lib/registration-types.ts` (drives the registration wizard's package picker + the `HOSTING_SETUP_FEE` note + email summaries) and the `packages` array in `src/app/services/page.tsx` (the public-facing pricing cards). If a price/tier changes, update both. The R395 once-off cPanel setup fee is intentionally surfaced as a separate note (`HOSTING_SETUP_FEE_NOTE`) rather than folded into the monthly price, since SA market research showed this fee is unusual for self-service hosts and reads better framed as a managed-onboarding line item.
- Testing scroll-reveal content with Playwright: `Reveal` (and anything else using `IntersectionObserver`) won't trigger its visible state under Playwright's `page.screenshot(full_page=True)` — that capture mode doesn't perform a real incremental scroll, so observers never fire and revealed sections silently stay at `opacity-0` (looks like "missing content" in the screenshot even though it's correctly in the DOM). To verify content lower on a page, either scroll there in small steps with `wait_for_timeout` between each (so the observer fires naturally) or check `page.eval_on_selector_all(...)` against the DOM directly instead of trusting a full-page screenshot.
