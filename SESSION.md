# SESSION.md

Read this before starting a new session on this project. It's a snapshot of where things stood at the end of the last session — current as of **2026-06-16**. `CLAUDE.md` has the durable architectural/workflow rules; this file has the "what's actually going on right now" context.

## Current state

- **Live site**: https://it-guru-online.netlify.app (real custom domain `it-guru.online` has no DNS pointed at it yet — don't assume it resolves).
- **`main` and `dev` are both at commit `4e061ed`** and in sync with `origin`. Last deploy is `ready` in Netlify, built from `main`.
- No uncommitted code changes pending (check `git status` to confirm this hasn't drifted since this file was written).

## What shipped this session (chronological-ish)

1. **Full visual redesign**: removed light/dark theme toggle entirely (`ThemeProvider`/`ThemeToggle` deleted) — site is dark-only now. Replaced per-page hero images with a single fixed full-bleed `bg-image.jpg` background (plus a dark blur overlay on every page including Home). Established a consistent design language: `.btn-metallic` (flat navy primary CTA with shine sweep) / `.btn-glass` (frosted secondary CTA), `#00aaff` neon-blue borders/glow on cards, gold star-rating terminal cards (Values, About), neon underline counters (Hero, About stats).
2. **Header/nav fixes**: rebuilt as a 3-column CSS grid (logo / centered nav / actions) after absolute-positioning caused overlap bugs at certain widths. Nav order is Home → About → Services → Domain Checker → Contact, with Register pulled out as its own CTA button. Reduced header height, removed the theme toggle button, added a collapsing "Questions?" floating tab (chevron-only at rest, expands on hover).
3. **Registration wizard improvements**:
   - Cell-phone field now has a custom country-code picker (flag images from flagcdn.com — native `<select>` can't render images, and emoji flags don't render on Windows). Validation is country-aware: strict SA format for `+27`, general E.164 check for everything else.
   - Fixed browser autofill duplicating the SA country code into the local-number field (defensive stripping, only triggers on long/pasted values so normal digit-by-digit typing isn't affected).
   - Wizard now scrolls back to the top of the form on every step change (was previously leaving users scrolled to wherever they'd been on the *previous* step).
   - Post-submission success card restyled to match the dark/glassy/neon theme (was still on the old light theme).
   - Nameserver step now shows the real default nameservers (`ns1-4.v-dns.net`) instead of placeholder `ns1/ns2.it-guru.online` text.
4. **Pricing restructure (real business data, not placeholders)**: replaced the old 3-tier Starter/Business/Professional hosting cards with the actual 6-tier table the client provided — Startup (R85), Basic (R99, marked Most Popular), Standard (R149), Advanced (R279), Enterprise (R399), Parked Domain (R35) — full specs (storage/websites/subdomains/databases/mailboxes/email-rate) on both the public Services page and the registration wizard's package picker. Added a setup-fee note (R395 once-off cPanel setup) and a Domain Registration callout (.co.za flagged Most Popular) linking to the Domain Checker.
   - **Before implementing, did market research** (Xneelo, HOSTAFRICA, etc.) per the client's request to sanity-check pricing. Verdict: monthly prices are at/below SA market rate (not too cheap), but storage-per-rand is below competitors and the R395 setup fee is unusual for the category (most SA hosts don't charge one) — only really justifiable framed as "we personally configure/migrate it for you." This was reported to the client but no prices were changed — implemented exactly the table given.
5. **Outgoing email redesign** (`src/lib/email.ts` `emailLayout()`): rebuilt as a proper branded, table-based HTML template (navy header banner with logo, white content card, signature block using `footer_bg.png` as a background image with a VML fallback for Outlook) — deliberately no `<style>` block or flexbox/grid since webmail clients strip/don't-support those. This one function feeds all three email types (registration confirmation, registration admin notice, contact admin notice).
6. **Found and fixed a real production bug**: `NEXT_PUBLIC_BASE_URL` was never set on Netlify, so the code fell back to `https://it-guru.online` — a domain with **no DNS at all**. This silently broke the WhatsApp/social OG image preview and the logo/signature images in every outgoing email. Fixed by setting the env var to the live netlify.app domain and updating the same fallback in `layout.tsx`/`robots.ts`/`sitemap.ts`/`email.ts`. **This required a fresh Netlify build to take effect** — env var changes don't apply retroactively to already-built deploys.
7. **Found and fixed a deploy-pipeline gap**: Netlify only builds the `main` branch (`allowed_branches: ["main"]`), but work was happening on `dev`. Several commits sat on `dev` for a while with zero deploys triggered, silently. Documented the merge/push/verify workflow in `CLAUDE.md`.

## Known/accepted gaps — not bugs, just not done

- **Domain registration TLD pricing**: no specific per-TLD prices were ever provided by the client, so the Domain Registration callout and TLD table link out to "get a quote" / the Domain Checker rather than showing real numbers. If the client provides actual TLD pricing, add it to the Domain Checker's TLD table and the Services page callout.
- **Section-respective CTA buttons on Home page**: at one point the user asked to "add more buttons to other pages on home page sections respective to the section" (e.g. ServiceCards/TechStack → link to `/services`, Values → link to `/about`). This was acknowledged but not completed before later requests took priority — pick this up if asked again, or proactively if doing more Home page work.
- **`it-guru.online` custom domain**: not pointed at Netlify yet. Once it is, update `NEXT_PUBLIC_BASE_URL` (see CLAUDE.md) and redeploy.
- The hosting/domain pricing email "Add-ons" line and `ADDONS` array in `StepServiceSelection.tsx` still has an old placeholder price ("From R 150/yr" for domain registration) predating this session's pricing work — wasn't explicitly flagged by the client, left as-is, but worth confirming with them.

## Useful commands/IDs for this project

```
# Netlify site
netlify api getSite --data '{"site_id":"2cb84145-76d9-4916-ae7d-9df49a5a348c"}'
netlify api listSiteDeploys --data '{"site_id":"2cb84145-76d9-4916-ae7d-9df49a5a348c"}'
netlify env:list --site 2cb84145-76d9-4916-ae7d-9df49a5a348c

# Deploy (see CLAUDE.md "Deployment — branch strategy" for the full rule)
git checkout main && git merge dev --ff-only && git push origin main && git checkout dev
```
