---
phase: 1
slug: auth-database-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — no `pytest`/`jest`/`vitest` in `package.json`. Only existing test tooling is the `webapp-testing` Claude Code skill (Playwright-based, agent-driven, not CI-runnable). |
| **Config file** | none — Wave 0 decides whether to install one |
| **Quick run command** | none — see Wave 0 |
| **Full suite command** | none — see Wave 0 |
| **Estimated runtime** | N/A until Wave 0 resolved |

This is the first phase introducing stateful, security-sensitive behavior (auth, lockout) to a codebase with zero automated test infrastructure. AUTH-04 ("lockout survives a server restart") is specifically hard to verify by manual clicking alone and well-suited to a DB-state-assertion test.

---

## Sampling Rate

- **After every task commit:** Manual verification via `netlify dev` + curl/Playwright for the specific behavior just built (no automated quick-run exists pre-Wave-0)
- **After every plan wave:** Full manual pass through all four AUTH-0x success criteria, plus the `proxy.ts` smoke test (Open Question 1 in RESEARCH.md)
- **Before `/gsd:verify-work`:** All four phase success criteria manually verified against a **real Netlify deploy** (not just local `next dev`/`netlify dev`) — local dev cannot validate the `proxy.ts`-under-`@netlify/plugin-nextjs` question this phase exists partly to resolve
- **Max feedback latency:** N/A pre-framework; if Wave 0 adopts a framework, target <30s for the quick-run command

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 0 | AUTH-01 | integration | `npm test -- auth/login.test.ts` (proposed) | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | AUTH-02 | Playwright (webapp-testing skill) | login → reload → assert still authenticated | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | AUTH-03 | Playwright + real Netlify deploy smoke test | unauthenticated `page.goto('/admin/dashboard')` → assert redirect | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | AUTH-04 | integration, DB-state-based | `npm test -- auth/lockout.test.ts` (proposed) — must assert against real DB rows, not in-process state | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs/Plan/Wave columns to be filled in by the planner once PLAN.md files exist.*

---

## Wave 0 Requirements

- [ ] **Decide whether to adopt a test framework in this phase.** Reasonable inflection point (first stateful/security-sensitive phase, never had automated tests before) — recommend `vitest` for low setup overhead with Next.js Route Handlers, but this is a judgment call for the planner, not dictated by research.
- [ ] If adopted: `vitest.config.ts` — does not exist, needs creation
- [ ] If adopted: a way to point tests at a real (or test-branch) `NETLIFY_DATABASE_URL` rather than mocking the DB — the lockout logic's entire value is in its DB-persistence behavior, so mocking it away would defeat the point
- [ ] Regardless of framework decision: a Playwright script (reusing the existing `.claude/skills/webapp-testing/` pattern, zero new dependencies) covering AUTH-02/AUTH-03's browser-observable behavior (cookie persistence across refresh, redirect-when-unauthenticated)
- [ ] First implementation task should be a minimal `proxy.ts` smoke test (simple redirect rule, deployed to a real Netlify build) to confirm the version-alignment evidence in RESEARCH.md (Open Question 1) before building real auth logic on top of it

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `proxy.ts` correctly intercepts requests under the real `@netlify/plugin-nextjs` adapter (not just local `next dev`) | AUTH-03 | Local dev cannot exercise the actual Netlify Edge/Function routing layer this question is about — only a real deploy can confirm it | Deploy to a Netlify preview/branch build, visit `/admin/dashboard` unauthenticated, confirm redirect to `/admin/login` |
| Password-reset email renders correctly in real email clients (Outlook desktop, Gmail, etc.) | (supports AUTH-01 recovery flow per CONTEXT.md D-02/D-03) | Email rendering across clients can't be meaningfully unit-tested; this codebase's existing `email.ts` pattern is already manually verified this way per `CLAUDE.md` | Trigger a real password-reset email to `ambrose@it-guru.co.za`, visually inspect rendering |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (once framework adopted)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
