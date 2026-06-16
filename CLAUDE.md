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
- Header nav is absolutely centered (`absolute left-1/2 -translate-x-1/2`) with the Register link pulled out as a `.btn-metallic` CTA pinned to the far right — not part of the regular nav-link list.

## Conventions

- Server components by default; add `"use client"` only where state/effects are needed (Header, ServiceCards, Hero-adjacent interactive bits).
- Section components accept no props and own their copy/data arrays at the top of the file (see `Hero.tsx`, `TechStack.tsx`, `Values.tsx`) — keep new sections consistent with this pattern rather than threading props through pages.
- Decorative images/icons get `aria-hidden="true"`; keep accessible labels (`aria-label` on `<section>`, real `alt` text on content images) intact when editing.
