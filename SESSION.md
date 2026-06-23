# SESSION.md

Read this before starting a new session on this project. It's a snapshot of current project state. `CLAUDE.md` has the durable architectural/workflow rules; this file has the "what's actually going on right now" context.

## Current state — 2026-06-23

- **Live site**: https://it-guru.co.za (custom domain live ✓, SSL via Let's Encrypt ✓)
- `www.it-guru.co.za` redirects to primary domain ✓
- `main` and `dev` are both at commit `8a60e00` and in sync with `origin`.
- No uncommitted code changes pending (check `git status` to confirm).

## What's been completed (this project to date)

1. **Full visual redesign**: dark-only theme (ThemeProvider/ThemeToggle removed), single fixed full-bleed `bg-image.jpg` background, `.btn-metallic`/`.btn-glass` button system, neon underline accents.
2. **Header/nav**: 3-column CSS grid layout (logo / centered nav / actions). Nav: Home → About → Services → Domain Checker → Contact. Register is a separate CTA button.
3. **Registration wizard**: multi-step (A: applicant info, B: domain, C: service selection, D: declaration). Country-code picker with flagcdn.com images (no native `<select>` — emoji flags don't render on Windows). SA phone validation + general E.164 for international. Scroll-to-top on step change.
4. **Pricing**: real 6-tier hosting packages — Startup (R85), Basic (R99), Standard (R149), Advanced (R279), Enterprise (R399), Parked Domain (R35). R395 once-off cPanel setup fee surfaced as a separate note. Pricing lives in two places kept in sync: `HOSTING_PACKAGES` in `src/lib/registration-types.ts` and `packages` in `src/app/services/page.tsx`.
5. **Outgoing email** (`src/lib/email.ts`): branded table-based HTML template (navy header, logo, signature with footer_bg.png). No `<style>` blocks — all inline for Outlook compatibility.
6. **Security audit** (2026-06-16): OWASP ZAP baseline + manual OWASP Top 10 review. All findings fixed — see `SECURITY-AUDIT.md`. `IT-Guru-Security-Audit-Report.docx` in project root.
7. **Swift Designz removed** from all customer-facing content: services page Web Design card (tagline, description, CTA now routes to `/contact`), registration form add-on description.
8. **Custom domain `it-guru.co.za`** pointed to Netlify (A record `75.2.60.5`, CNAME `www` → `it-guru-online.netlify.app`). All code fallbacks and env vars updated to `https://it-guru.co.za`.

## Known/accepted gaps

- **Domain registration TLD pricing**: no specific per-TLD prices from the client yet — Domain Checker and Services page link to "get a quote." Add real prices to the TLD table if/when provided.
- **Section CTAs on Home page**: request was made to add section-specific buttons (ServiceCards → `/services`, Values → `/about`) but wasn't completed. Pick up if asked again.
- **In-memory rate limiter**: resets on cold starts, not shared across Netlify function instances. Accepted risk — revisit if spam becomes a real problem (see `SECURITY-AUDIT.md`).

## Useful commands/IDs

```bash
# Dev
npm run dev          # localhost:3000 (Turbopack)
npx tsc --noEmit     # typecheck

# Deploy to production
git checkout main && git merge dev --ff-only && git push origin main && git checkout dev

# Netlify
netlify api listSiteDeploys --data '{"site_id":"2cb84145-76d9-4916-ae7d-9df49a5a348c"}'
netlify env:list --site 2cb84145-76d9-4916-ae7d-9df49a5a348c
```
