# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Admin Portal

**Completed:** 2026-07-04 (production deploy of Phase 5 pending)
**Phases:** 5 | **Plans:** 22 | **Commits:** 131 over 5 days (2026-06-30 → 2026-07-04)

### What Was Built
- Single-admin portal (JWT auth, Neon Postgres via Netlify DB) at /admin and admin.it-guru.co.za
- CRM auto-capture of all registrations/enquiries with search, statuses, notes, CSV export
- Live-editable hosting/domain pricing + site settings (killed the hard-coded two-file sync)
- Full invoicing lifecycle with SARS-compliant gapless numbering and PDF generation
- Scheduled automation: reminder emails + idempotent recurring draft invoices (cron + manual triggers)

### What Worked
- Wave-based executor agents with atomic per-task commits — 22 plans landed with clean history and every deviation documented in SUMMARYs
- Deviation discipline: executors caught and fixed plan errors (wrong migration number, wrong env var, missing tsconfig coverage) instead of blindly following plans
- Live end-to-end verification of Phase 5 (real Resend emails, dedupe re-runs) gave far more confidence than unit tests alone
- Owner-in-the-loop checkpoints (05-05 human-verify) caught the local-DB/login friction early enough to fix it properly

### What Was Inefficient
- The NETLIFY_DB_URL / NETLIFY_DATABASE_URL confusion caused a real production outage and burned most of a day; local/draft-deploy signals were misleading throughout
- Local dev had no working database story for most of the milestone; executor and owner testing was repeatedly blocked until the NETLIFY_DB_DRIVER=server driver branch was built (final session)
- ROADMAP.md progress table drifted badly out of sync with reality (parallel worktree agents never syncing back) — required manual forensic correction
- Executor agents dying on session limits mid-plan required orchestrator spot-checks (git log + SUMMARY existence) to recover state

### Patterns Established
- All multi-statement writes through withTxDb(); neon-http for everything else
- requireAdmin() first in every admin route, before parse/DB
- Netlify Scheduled Functions as thin wrappers over shared job modules, each with a manual admin trigger (AUTOMATE-04 pattern)
- Idempotency via DB unique constraint + onConflictDoNothing inside a transaction, never application-level checks alone
- Table-based inline-style email HTML only; all outgoing mail BCC'd to the business inbox
- Local dev: netlify dev + NETLIFY_DB_DRIVER=server branch + DEV_AUTH_BYPASS (never on Netlify)

### Key Lessons
1. Only real git-triggered production builds tell the truth for platform-injected env/bindings — budget a verification deploy into any phase touching them
2. Verify the toolchain sees your files: tsc silently skipped .mts until tsconfig include was fixed; test-skip gates checked a legacy env var for 18 files
3. When a plan's assumptions conflict with the codebase (column names, file paths, API shapes), the codebase is the source of truth and the deviation gets documented
4. Cross-check generated progress tables against on-disk VERIFICATION/SUMMARY files before trusting them

### Cost Observations
- Model mix: opus orchestrator/planner, sonnet executors/verifier (per project profile)
- Sessions: ~6 substantive build sessions across 5 days
- Notable: small plans (2-3 tasks) executed in 3-10 min each; the outage debugging session cost more than any planned work

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 (pre-GSD) | — | — | No planning structure; retroactively captured |
| v2.0 | ~6 | 5 | Full GSD adoption: waves, checkpoints, verification, archives |

### Top Lessons (Verified Across Milestones)

1. Platform-specific bundling (Turbopack + Netlify) is this project's recurring failure class — proxy.ts, @netlify/database, and pg all hit it; keep risky packages in serverExternalPackages and verify on real deploys
2. Security review after each significant surface expansion (v1.0 had OWASP audit; v2.0's is still owed)
