# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

IT-Guru.Online — marketing site + client onboarding for a Kuils River (South Africa) IT support company. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4. Deployed on Netlify (`@netlify/plugin-nextjs`). Transactional email via Resend.

## Commands

```
npm run dev      # next dev (Turbopack)
npm run build    # next build
npm run start    # next start
npm run lint     # next lint
npx tsc --noEmit # typecheck (no dedicated script)
```

## Architecture

- `src/app/` — App Router pages: `/`, `/services`, `/about`, `/contact`, `/register`, `/domain-checker`, `/privacy`, `/terms`. Each page is a server component that composes section/UI components.
- `src/components/sections/` — page-specific large sections (Hero, ServiceCards, TechStack, Values, CTABanner).
- `src/components/ui/` — small reusable pieces (Button, Card, Reveal, CTAPanelBackground, FloatingActions, QuestionTab, DomainPromo, CookieConsent).
- `src/components/forms/` — RegistrationWizard (multi-step), ContactForm, DomainChecker; wizard steps live in `forms/steps/`.
- `src/components/layout/` — Header, Footer.
- `src/app/globals.css` — design tokens (`--bg-primary`, `--text-secondary`, etc.) and the two custom button classes `.btn-metallic` (primary) and `.btn-glass` (secondary).

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

`NEXT_PUBLIC_BASE_URL` is read in `layout.tsx` (metadataBase/OG), `robots.ts`, `sitemap.ts`, and `email.ts` (logo/signature-background absolute URLs), all falling back to `https://it-guru-online.netlify.app` if unset. It was previously unset on Netlify and the old fallback was the dead domain `https://it-guru.online` (no DNS at all) — this silently broke the WhatsApp/social OG image preview *and* the logo/signature images in outgoing emails for a while. It's now set correctly via `netlify env:set NEXT_PUBLIC_BASE_URL "https://it-guru-online.netlify.app" --site 2cb84145-76d9-4916-ae7d-9df49a5a348c`. Env var changes only apply to the *next* build — if OG images or email images break again, check (a) the env var is still correct and (b) whether `main` has actually been rebuilt since the env var was set (see branch strategy above).

If `it-guru.online` (the real custom domain) ever gets DNS pointed at this Netlify site, update `NEXT_PUBLIC_BASE_URL` to that domain instead and redeploy.

## Conventions

- Server components by default; add `"use client"` only where state/effects are needed (Header, ServiceCards, Hero-adjacent interactive bits).
- Section components accept no props and own their copy/data arrays at the top of the file (see `Hero.tsx`, `TechStack.tsx`, `Values.tsx`) — keep new sections consistent with this pattern rather than threading props through pages.
- Decorative images/icons get `aria-hidden="true"`; keep accessible labels (`aria-label` on `<section>`, real `alt` text on content images) intact when editing.
- Pricing is real business data, not placeholder copy — it lives in two places that must be kept in sync by hand: `HOSTING_PACKAGES` in `src/lib/registration-types.ts` (drives the registration wizard's package picker + the `HOSTING_SETUP_FEE` note + email summaries) and the `packages` array in `src/app/services/page.tsx` (the public-facing pricing cards). If a price/tier changes, update both. The R395 once-off cPanel setup fee is intentionally surfaced as a separate note (`HOSTING_SETUP_FEE_NOTE`) rather than folded into the monthly price, since SA market research showed this fee is unusual for self-service hosts and reads better framed as a managed-onboarding line item.
- Testing scroll-reveal content with Playwright: `Reveal` (and anything else using `IntersectionObserver`) won't trigger its visible state under Playwright's `page.screenshot(full_page=True)` — that capture mode doesn't perform a real incremental scroll, so observers never fire and revealed sections silently stay at `opacity-0` (looks like "missing content" in the screenshot even though it's correctly in the DOM). To verify content lower on a page, either scroll there in small steps with `wait_for_timeout` between each (so the observer fires naturally) or check `page.eval_on_selector_all(...)` against the DOM directly instead of trusting a full-page screenshot.
