# Phase 04 — Deferred Items

Out-of-scope discoveries logged during execution. Not fixed inline per scope boundary rules.

## From 04-02 execution (2026-07-02)

- **Direct `npx eslint <files>` fails to load config** — the eslintrc-based config chain (`eslint-config-next` via `@eslint/eslintrc`) throws a config-validator error when eslint is invoked directly. Pre-existing tooling condition, not caused by 04-02 changes. The project's `npm run lint` script is `next lint`, which was removed/deprecated in Next.js 16 — the lint toolchain likely needs migration to flat-config `eslint .`. Affects all plans, not invoice routes specifically.
