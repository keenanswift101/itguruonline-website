# Phase 04 — Deferred Items

Out-of-scope discoveries logged during execution. Not fixed inline per scope boundary rules.

## From 04-02 execution (2026-07-02)

- **Direct `npx eslint <files>` fails to load config** — the eslintrc-based config chain (`eslint-config-next` via `@eslint/eslintrc`) throws a config-validator error when eslint is invoked directly. Pre-existing tooling condition, not caused by 04-02 changes. The project's `npm run lint` script is `next lint`, which was removed/deprecated in Next.js 16 — the lint toolchain likely needs migration to flat-config `eslint .`. Affects all plans, not invoice routes specifically.

## From 04-04 execution (2026-07-02) — FIXED (Rule 3, blocking)

- **`npm run dev` (Turbopack) crashed site-wide with a 500 on every route** — `src/app/globals.css` failed to parse. Root cause had two layers:
  1. `src/components/ui/Input.tsx`, `src/components/forms/steps/StepApplicantInfo.tsx`, and `src/components/forms/steps/StepDomainDetails.tsx` still used legacy bracket-syntax utility classes (`text-[var(--text-primary)]`, `bg-[var(--bg-primary)]`, `border-[var(--border-color)]`, etc.) instead of the canonical Tailwind v4 `text-(--var)` form. These are not files touched by any 04-* plan, but CLAUDE.md's "fix it when touched" rule applied once discovered as the crash's proximate cause. Converted all occurrences in the 3 files to canonical syntax (mechanical find/replace, no visual/behavioral change) — verified via `grep -rln '\[var(--' src/` returning no matches.
  2. Even after that fix the crash persisted with the exact same error (`.text-\[var\(--\.\.\.\)\]`, an invalid `--...` placeholder token) — traced to **`CLAUDE.md` itself**: Tailwind v4's automatic content/source scanner (no `@source` restriction was configured) scans the *entire project*, including markdown docs, for candidate class names. CLAUDE.md's own prose contains the literal example string `text-[var(--text-secondary)]` (in the sentence explaining NOT to use that syntax), which the scanner picked up as a real class and tried to generate CSS for, producing the same unparsable `--...` token crash.
  - **Fix applied:** added two `@source not "..."` exclusions to the top of `src/app/globals.css` (`../../CLAUDE.md` and `../../.planning/**/*.md`) so Tailwind's JIT scanner skips documentation/planning markdown entirely. No component code lives in these paths, so this is safe and has no visual/behavioral impact on any page.
  - **Verification:** `.next` cache cleared, `npm run dev` restarted — `GET /`, `/admin/login`, `/admin/invoices` all return 200/307 (no more 500s). `npx tsc --noEmit` still exits 0.
  - **Why fixed inline instead of deferred:** this crash blocked the entire site, not just `/admin/invoices` — it made the plan's mandatory `npm run dev` + browser checkpoint impossible to complete for ANY route. Rule 3 (auto-fix blocking issues) applies; the fix was minimal, mechanical, and did not touch CLAUDE.md's content or any documented convention.
