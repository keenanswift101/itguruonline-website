# IT-Guru Online

Marketing site and client onboarding portal for IT-Guru Online — an IT support company based in Kuils River, Western Cape, South Africa.

**Live site:** https://it-guru.co.za

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 — dark-only theme, single fixed background image
- **Deployment:** Netlify (`@netlify/plugin-nextjs`) — `main` branch only
- **Email:** Resend (transactional — contact form + registration confirmation)

## Getting started

```bash
npm install
npm run dev       # dev server at localhost:3000 (Turbopack)
npm run build     # production build
npm run lint      # ESLint
npx tsc --noEmit  # typecheck
```

## Deploying

Work on `dev`. Only merge to `main` when ready to ship — Netlify only builds `main`.

```bash
git checkout main && git merge dev --ff-only && git push origin main && git checkout dev
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — Hero, ServiceCards, TechStack, Values, CTABanner |
| `/services` | Hosting packages + service cards |
| `/about` | Company info, values, team |
| `/contact` | Contact form + Google Maps |
| `/register` | Multi-step client onboarding wizard |
| `/domain-checker` | Domain availability search |
| `/privacy` | Privacy policy |
| `/terms` | Terms and conditions |

## Key files

- `src/lib/registration-types.ts` — hosting packages + pricing (keep in sync with `src/app/services/page.tsx`)
- `src/lib/email.ts` — branded email template (table-based, all styles inline for Outlook)
- `next.config.ts` — security headers (CSP, HSTS, etc.)
- `SECURITY-AUDIT.md` — OWASP ZAP audit findings and accepted risks
- `SESSION.md` — current project state and known gaps
- `CLAUDE.md` — AI assistant guidance

## Environment variables (Netlify)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `https://it-guru.co.za` — used for OG images, sitemap, email logos |
| `NEXT_PUBLIC_SITE_URL` | `https://it-guru.co.za` |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | `IT-Guru Online <info@it-guru.co.za>` |
| `ADMIN_EMAIL` | `info@it-guru.co.za` — receives form submission copies |
