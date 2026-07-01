# Phase 5: Scheduled Automation - Research

**Researched:** 2026-07-01
**Domain:** Netlify Scheduled Functions v2, Drizzle ORM migrations, reminder deduplication, recurring billing idempotency
**Confidence:** HIGH (Netlify docs + @netlify/neon source + existing codebase verified)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `billing_schedules` table — `id SERIAL PK`, `client_name VARCHAR(128) NOT NULL`, `client_email VARCHAR(256)`, `package_id INT REFERENCES hosting_packages(id)`, `billing_start DATE NOT NULL`, `cycle VARCHAR(8) NOT NULL DEFAULT 'monthly'`, `is_active BOOLEAN NOT NULL DEFAULT true`, `created_at`, `updated_at`. No FK to `client_registrations`.
- **D-02:** `invoices` table extended with `billing_schedule_id INT REFERENCES billing_schedules(id) ON DELETE SET NULL` (nullable) + `billing_period_start DATE` (nullable) + unique constraint `UNIQUE (billing_schedule_id, billing_period_start)` named `invoices_recurring_unique`.
- **D-03:** Idempotency via `INSERT ... ON CONFLICT (billing_schedule_id, billing_period_start) DO NOTHING`. DB-enforced, no application-level check.
- **D-04:** `enquiry_stale_days` + `invoice_overdue_reminder_days` keys seeded into `site_settings` table. Parsed with `parseInt`.
- **D-05:** Admin "Run Now" buttons POST to `POST /api/admin/automations/[job]/run`. Shared job logic in `src/lib/automation/[job].ts`.
- **D-06:** `/admin/automations` page: 3 job cards (name, schedule, last run, summary, Run Now) + Billing Schedules section.
- **D-07:** Scheduled functions in `netlify/functions/` using `.mts` extension with v2 export format. Crons: daily 08:00 UTC for reminders, 1st of month 07:00 UTC for billing.
- **D-08:** `automation_runs` table: `id SERIAL PK`, `job_name VARCHAR(32) NOT NULL`, `ran_at TIMESTAMP WITH TIME ZONE NOT NULL`, `triggered_by VARCHAR(16) NOT NULL`, `status VARCHAR(8) NOT NULL`, `result_summary TEXT`, `error_message TEXT`.
- **D-09:** Reminder emails go to `ambrose@it-guru.co.za` ONLY (same as all admin emails per security constraint). No client-facing reminder emails.
- Recurring invoices created as Draft status.
- Phase 5 migration is `0003_automation.sql` (follows `0002_invoices.sql` from Phase 4).

### Claude's Discretion

- Exact `/admin/automations` page layout (separate Billing Schedules sub-section vs inline vs own page)
- Billing schedule CRUD form fields and validation
- Admin UI for adding/editing billing schedules (inline edit vs modal)
- Whether recurring-billing job creates Draft or Sent invoices (Draft recommended)
- Email HTML template for reminder emails (reuse `emailLayout()`)
- `automation_runs` pruning mechanism (ON INSERT trigger vs job-level cleanup)
- Enquiry reminder deduplication mechanism (see Section 5)
- Billing period date: 1st of month vs anniversary date (see Section 6)

### Deferred Ideas (OUT OF SCOPE)

- Multi-cadence dunning (AUTOMATE-06, v2+)
- Auto-status-transitions (AUTOMATE-05, v2+)
- Client-facing payment notifications or invoice delivery automation
- Slack/webhook notifications
- Billing schedule auto-creation from CRM registration
- Annual billing cycle
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTOMATE-01 | System sends owner reminder when enquiry has no status change after configurable days | Section 5 (dedup), Section 7 (email.ts), enquiry query from CONTEXT.md |
| AUTOMATE-02 | System sends owner reminder when invoice is overdue | Section 5 (dedup), overdue query from CONTEXT.md |
| AUTOMATE-03 | System auto-generates recurring invoice without duplicates on retry | Section 3 (migration), Section 6 (billing period), D-03 idempotency |
| AUTOMATE-04 | Each scheduled automation has manually-triggerable admin equivalent | Section 1 (scheduled-only-on-prod), Section 7 (admin patterns), D-05 trigger route |
</phase_requirements>

---

## RESEARCH COMPLETE

### Executive Summary

- Netlify Scheduled Functions v2 use `.mts` extension with `export default async (req: Request) => {}` + `export const config: Config = { schedule: "..." }`. The `@netlify/functions` package (v5.3.0, not yet in devDependencies) must be installed for the `Config` type. Scheduled functions only run on published deploys — the admin "Run Now" route is mandatory for dev-branch testing (AUTOMATE-04 justification confirmed).
- The `@/` path alias works inside `netlify/functions/*.mts` files because Netlify's esbuild bundler reads `tsconfig.json` from the repo root automatically. Direct `import { db } from "@/lib/db/index"` is valid.
- `@netlify/neon` reads `NETLIFY_DATABASE_URL` automatically (verified in source). The same lazy proxy `db` instance from `src/lib/db/index.ts` works unchanged in scheduled functions — no separate DB client needed.
- The Phase 5 migration (`0003_automation.sql`) must use `ALTER TABLE` to add two columns to `invoices` (which Phase 4 created), plus create two new tables. The unique constraint uses named form `invoices_recurring_unique` for clarity. Drizzle generates correct `ALTER TABLE ... ADD COLUMN` SQL when the schema adds columns to an existing table definition.
- Reminder deduplication requires a `last_reminded_at` column on `contact_enquiries` and a separate `last_reminded_at` mechanism for invoices. The simplest invoice approach: track in `automation_runs` which invoice IDs were reminded last run, or add a `last_reminded_at` column to `invoices`. The recommended pattern is a `last_reminded_at DATE` column on each source table — avoids a separate lookup join on every job run.

---

## 1. Netlify Scheduled Functions v2 Format

### File naming

Use `.mts` extension (mandatory for v2 ESM TypeScript). The project already has `"type": "module"` in `package.json`, so `.ts` would technically resolve as ESM too, but `.mts` is the explicit convention documented by Netlify and required by the CONTEXT.md D-07 decision.

### Exact TypeScript export syntax

```typescript
// netlify/functions/enquiry-reminder.mts
import type { Config } from "@netlify/functions"

export default async (req: Request): Promise<void> => {
  const { next_run } = await req.json()
  // call shared job logic
  await runEnquiryReminderJob()
  console.log("Next run at:", next_run)
}

export const config: Config = {
  schedule: "0 8 * * *"   // daily 08:00 UTC
}
```

The function receives a `Request` object. The body always contains `{ next_run: "<ISO-8601>" }`. Scheduled functions do not return a `Response` — they return `void` or `Promise<void>`.

### Cron expressions (UTC timezone)

| Function | Cron | Meaning |
|----------|------|---------|
| `enquiry-reminder.mts` | `"0 8 * * *"` | Daily at 08:00 UTC |
| `invoice-overdue-reminder.mts` | `"0 8 * * *"` | Daily at 08:00 UTC |
| `recurring-billing.mts` | `"0 7 1 * *"` | 1st of month, 07:00 UTC |

### netlify.toml — no changes needed

`netlify/functions/` is the default functions directory. The existing `netlify.toml` has no `[functions]` section; none is required. Netlify discovers all files in `netlify/functions/` automatically during build.

**Confidence: HIGH** — Verified from official Netlify docs (docs.netlify.com/build/functions/configuration/).

### New devDependency required

`@netlify/functions` is not currently in `package.json`. It provides the `Config` and `Context` types. Install as devDependency:

```bash
npm install --save-dev @netlify/functions
```

Current latest version: **5.3.0** (verified via npm registry 2026-07-01).

### Production-only execution

Scheduled functions ONLY execute automatically on **published deploys** (the `main` branch per CLAUDE.md). They do not run on `dev` branch deploys or Deploy Previews. The admin "Run Now" trigger (AUTOMATE-04) is not a nice-to-have — it is the only way to test scheduled function logic on the `dev` branch.

Local testing: `netlify functions:invoke enquiry-reminder --no-identity` (invokes once for debugging; does not schedule).

---

## 2. Netlify Function to Next.js/Drizzle DB Import Path

### The `@/` alias works in `netlify/functions/*.mts`

Netlify's bundler (esbuild) reads `tsconfig.json` from the repo root automatically and resolves `compilerOptions.paths` entries. The project `tsconfig.json` defines `"@/*": ["./src/*"]`, so `import { db } from "@/lib/db/index"` resolves to `src/lib/db/index.ts` at bundle time.

**Confidence: MEDIUM** — Multiple sources confirm esbuild reads tsconfig paths. No official Netlify doc explicitly demonstrates this for scheduled functions, but it is the documented esbuild behavior and is reported to work in community usage.

**Safe fallback if alias fails:** Use relative paths from `netlify/functions/`. Example: `import { db } from "../../src/lib/db/index.js"`. Note: ESM requires `.js` extension even for `.ts` source files when using relative imports with esbuild. The `@/` alias avoids this complication entirely.

### The existing `db` proxy works unchanged

`src/lib/db/index.ts` exports a lazy proxy that calls `neon()` on first access. `@netlify/neon`'s `neon()` reads `NETLIFY_DATABASE_URL` automatically — confirmed by reading the package source at `node_modules/@netlify/neon/dist/index.js`. This env var is set on the Netlify site (it was provisioned in Phase 1). No additional DB configuration is needed in scheduled functions.

```typescript
// Inside netlify/functions/enquiry-reminder.mts
import { runEnquiryReminderJob } from "@/lib/automation/enquiry-reminder"
// The job module imports db from @/lib/db/index — this works
```

### No `Context` import required for scheduled functions

The v2 scheduled function signature is `(req: Request) => Promise<void>`. The `Context` parameter is optional for functions that don't use Netlify-specific context (geo, account, etc.). Scheduled functions don't need it.

---

## 3. Phase 5 DB Migration (ALTER TABLE invoices + new tables)

### Migration file: `netlify/database/migrations/0003_automation.sql`

The naming convention follows the pattern established in `0000_living_mastermind.sql` (auto-generated tag). The Phase 5 migration will be generated by `npm run db:generate` after updating `src/lib/db/schema.ts`. The generated file will follow Drizzle's breakpoint format (`--> statement-breakpoint`).

### Expected SQL structure

```sql
-- New table: billing_schedules (must come first — invoices FK references it)
CREATE TABLE "billing_schedules" (
  "id" serial PRIMARY KEY NOT NULL,
  "client_name" varchar(128) NOT NULL,
  "client_email" varchar(256),
  "package_id" integer,
  "billing_start" date NOT NULL,
  "cycle" varchar(8) NOT NULL DEFAULT 'monthly',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- New table: automation_runs
CREATE TABLE "automation_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "job_name" varchar(32) NOT NULL,
  "ran_at" timestamp with time zone NOT NULL,
  "triggered_by" varchar(16) NOT NULL,
  "status" varchar(8) NOT NULL,
  "result_summary" text,
  "error_message" text
);
--> statement-breakpoint

-- Extend invoices table (created in Phase 4 migration 0002_invoices.sql)
ALTER TABLE "invoices" ADD COLUMN "billing_schedule_id" integer;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "billing_period_start" date;
--> statement-breakpoint

-- FK from billing_schedules.package_id to hosting_packages.id (Phase 3)
ALTER TABLE "billing_schedules" ADD CONSTRAINT "billing_schedules_package_id_hosting_packages_id_fk"
  FOREIGN KEY ("package_id") REFERENCES "hosting_packages"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint

-- FK from invoices.billing_schedule_id to billing_schedules.id
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_schedule_id_billing_schedules_id_fk"
  FOREIGN KEY ("billing_schedule_id") REFERENCES "billing_schedules"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint

-- Unique constraint for idempotency (D-03)
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_recurring_unique"
  UNIQUE ("billing_schedule_id", "billing_period_start");
--> statement-breakpoint

-- Seed new site_settings keys (D-04)
INSERT INTO "site_settings" ("key", "value") VALUES
  ('enquiry_stale_days', '7'),
  ('invoice_overdue_reminder_days', '1')
ON CONFLICT ("key") DO NOTHING;
```

### Cross-migration FK: does it work?

Yes. Drizzle generates `REFERENCES "hosting_packages"("id")` as a standard PostgreSQL FK. At migration run time, `hosting_packages` already exists (created in Phase 3's `0001_pricing_tables.sql`), and `invoices` already exists (created in Phase 4's `0002_invoices.sql`). PostgreSQL validates FKs at constraint-add time, not at schema-define time. The FK will resolve correctly as long as migrations run in order.

**Confidence: HIGH** — Standard PostgreSQL behavior; Drizzle migration format confirmed from `0000_living_mastermind.sql`.

### UNIQUE constraint on nullable columns — PostgreSQL behavior

PostgreSQL NULL handling: a UNIQUE constraint on `(billing_schedule_id, billing_period_start)` allows multiple rows where either column is NULL, because `NULL != NULL` in standard SQL. This means:
- Manually created invoices (billing_schedule_id = NULL) are NOT affected by this constraint
- Only recurring invoices with both values set are deduplicated
- This is exactly the desired behavior (D-02/D-03)

---

## 4. Drizzle Schema for New Tables

### Imports needed (additions to existing import list in `schema.ts`)

```typescript
import { pgTable, serial, varchar, text, timestamp, boolean, integer, date, unique } from "drizzle-orm/pg-core";
```

Add `integer`, `date`, and `unique` to the existing import. `date` type maps to PostgreSQL `DATE`.

### `billingSchedules` table definition

```typescript
export const billingSchedules = pgTable("billing_schedules", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 128 }).notNull(),
  clientEmail: varchar("client_email", { length: 256 }),
  packageId: integer("package_id").references(() => hostingPackages.id, { onDelete: "set null" }),
  billingStart: date("billing_start").notNull(),
  cycle: varchar("cycle", { length: 8 }).notNull().default("monthly"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

Note: `hostingPackages` table is defined in Phase 3's schema additions. The FK uses `() => hostingPackages.id` (thunk form) to handle potential forward reference if ordering in the file matters.

### `automationRuns` table definition

```typescript
export const automationRuns = pgTable("automation_runs", {
  id: serial("id").primaryKey(),
  jobName: varchar("job_name", { length: 32 }).notNull(),
  ranAt: timestamp("ran_at", { withTimezone: true }).notNull(),
  triggeredBy: varchar("triggered_by", { length: 16 }).notNull(), // 'scheduled' | 'manual'
  status: varchar("status", { length: 8 }).notNull(),             // 'success' | 'error'
  resultSummary: text("result_summary"),
  errorMessage: text("error_message"),
});
```

### Extending `invoices` table in schema.ts

The Phase 4 plan will define an `invoices` pgTable. Phase 5 extends it by adding two columns and a unique constraint. In Drizzle, this means editing the same `invoices` table definition in `schema.ts` to add the new columns, then running `db:generate` to produce the `ALTER TABLE` migration.

```typescript
// Phase 5 additions to the invoices table (defined in Phase 4):
billingScheduleId: integer("billing_schedule_id")
  .references(() => billingSchedules.id, { onDelete: "set null" }),
billingPeriodStart: date("billing_period_start"),
```

And in the table's constraint array:

```typescript
}, (t) => [
  // ... existing constraints from Phase 4 ...
  unique("invoices_recurring_unique").on(t.billingScheduleId, t.billingPeriodStart),
]);
```

### Pruning `automation_runs` (retention: last 100 per job)

Claude's discretion. Recommended: job-level pruning inside each automation job module, executed after the main job logic:

```typescript
// At end of each job function, after writing the run record:
await db.delete(automationRuns)
  .where(
    and(
      eq(automationRuns.jobName, jobName),
      notInArray(
        automationRuns.id,
        db.select({ id: automationRuns.id })
          .from(automationRuns)
          .where(eq(automationRuns.jobName, jobName))
          .orderBy(desc(automationRuns.ranAt))
          .limit(100)
      )
    )
  );
```

Simpler alternative: skip pruning until > 1000 rows accumulate (this is a low-volume table — 3 jobs × 365 runs/year = 1095 rows/year maximum). A quarterly manual trim via Drizzle Studio is acceptable for v1.

---

## 5. Reminder Deduplication

### The problem

Each reminder job runs daily. If an enquiry has been stale for 10 days, without deduplication the job sends 10 identical reminder emails (one per daily run). The owner gets flooded with duplicate alerts for the same record.

### Recommended approach: `last_reminded_at` column on source tables

Add `last_reminded_at DATE` (nullable) to `contact_enquiries` (Phase 2) and `invoices` (Phase 4). The job:
1. Queries records where the staleness/overdue condition is met AND `last_reminded_at IS NULL OR last_reminded_at < CURRENT_DATE`
2. Sends the reminder email
3. Updates `last_reminded_at = CURRENT_DATE` on reminded records

This approach:
- Prevents re-sending on the same calendar day
- Resets automatically when the owner takes action (status change resets `updated_at`, and the record no longer meets the stale query condition)
- Requires adding `last_reminded_at DATE` to Phase 2 and Phase 4 migrations retroactively (or as addendum in Phase 5 migration)

**SQL query with dedup (enquiry reminder):**
```sql
SELECT * FROM contact_enquiries
WHERE status != 'completed'
  AND updated_at < NOW() - INTERVAL '{stale_days} days'
  AND (last_reminded_at IS NULL OR last_reminded_at < CURRENT_DATE)
```

**After sending:**
```sql
UPDATE contact_enquiries SET last_reminded_at = CURRENT_DATE WHERE id = ANY($1)
```

### Alternative: Do not deduplicate — design for once-per-new-stale

An alternative is to only send a reminder when the record FIRST crosses the threshold: query records where `updated_at` crossed the threshold exactly N days ago (within a 1-day window). This avoids the column, but is brittle — if the job misses a run, no catch-up reminder is sent.

### Recommendation

Use `last_reminded_at DATE` column. Add it as part of Phase 5 migration (0003_automation.sql) via `ALTER TABLE contact_enquiries ADD COLUMN last_reminded_at date` and `ALTER TABLE invoices ADD COLUMN last_reminded_at date`. This keeps Phase 5 self-contained.

The Drizzle schema additions are in the respective table definitions. Drizzle generates the `ALTER TABLE` DDL on `db:generate`.

---

## 6. Recurring Billing Period Logic

### The choice

**Option A — Anniversary billing:** Client who started 2026-03-15 gets invoiced on the 15th of each month. `billing_period_start = billing_start day-of-month for current month`.

**Option B — 1st-of-month normalized:** All active clients are invoiced on the 1st regardless of `billing_start`. `billing_period_start = DATE_TRUNC('month', CURRENT_DATE)`.

### Recommendation: Option B (1st of month)

**Rationale:**
- The cron job runs on the 1st of each month (`"0 7 1 * *"`). Option A requires the job to filter "whose anniversary falls on or before today" — but the job only runs on the 1st, so clients who started on the 3rd of any month would never get a billing event until the following month's 1st.
- Option A requires the cron to run daily (not monthly), or to run monthly and check all billing_start day-of-month values against the current month's days. This adds complexity and edge cases (clients who started on the 31st get no invoice in February).
- The CONTEXT.md notes explicitly: "Actually simpler: always bill on the 1st of each month regardless of billing_start day — Claude's discretion on this simplification."
- `billing_period_start = DATE_TRUNC('month', CURRENT_DATE)::date` — e.g., 2026-07-01 for July 2026.

**Implementation:**

```typescript
// In src/lib/automation/recurring-billing.ts
const billingPeriodStart = new Date(
  now.getFullYear(),
  now.getMonth(),
  1   // always 1st of the current month
);

// Insert with ON CONFLICT DO NOTHING
const result = await db.insert(invoices).values({
  // ... line items from billingSchedule.package ...
  billingScheduleId: schedule.id,
  billingPeriodStart: billingPeriodStart,
  status: "draft",
}).onConflictDoNothing({
  target: [invoices.billingScheduleId, invoices.billingPeriodStart],
});
```

**Drizzle `onConflictDoNothing` syntax:**

```typescript
import { invoices } from "@/lib/db/schema"
await db.insert(invoices)
  .values({ ... })
  .onConflictDoNothing();
// Drizzle onConflictDoNothing() with no args uses the table's unique constraint
// OR explicitly target the constraint:
  .onConflictDoNothing({ target: [invoices.billingScheduleId, invoices.billingPeriodStart] });
```

**Count inserted vs skipped:**

```typescript
// Drizzle with returning() to count actual inserts
const inserted = await db.insert(invoices)
  .values(valuesToInsert)
  .onConflictDoNothing()
  .returning({ id: invoices.id });
const insertedCount = inserted.length;
const skippedCount = valuesToInsert.length - insertedCount;
```

**Confidence: HIGH** — Drizzle docs confirm `onConflictDoNothing()` and `returning()` for PostgreSQL. Option B is the correct choice given the monthly cron schedule.

---

## 7. Existing Codebase Patterns to Reuse

### `src/lib/email.ts`

- `emailLayout(title, bodyHtml)` — branded HTML shell. Reuse for both reminder email types. Body HTML must use table-based layout with inline styles only (no `<style>`, no flexbox/grid per CLAUDE.md email constraint).
- `sendEmail({ to, subject, html })` — swallows errors (never throws). Suitable for automation jobs where a failed email should not abort the run.
- `ADMIN_EMAIL` — exported const; currently `process.env.ADMIN_EMAIL ?? "info@it-guru.co.za"`. Per D-09, reminder emails go to `ambrose@it-guru.co.za`. Check if this env var is set on Netlify. If `ADMIN_EMAIL` is not set or points to a different address, pass `"ambrose@it-guru.co.za"` explicitly as the `to` field in reminder emails. (The CONTEXT.md security constraint says "ambrose@it-guru.co.za ONLY".)
- `escapeHtml(value)` — use when interpolating record data (enquiry names, invoice numbers) into email body HTML.

### `src/lib/auth.ts`

- `requireAdmin()` — first call in every admin page/route. Pattern for trigger endpoint:
  ```typescript
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```

### Admin sidebar (`src/app/admin/layout.tsx`)

Currently a bare layout (no sidebar shell yet — Phase 2 plans add it). The CONTEXT.md notes Phase 5 activates a `// Phase 5` commented-out "Automations" link in the sidebar. The planner should note this as a task: uncomment/activate the sidebar nav item.

### Phase 3 `SiteSettingsForm` + `PATCH /api/admin/pricing/settings`

Extend with two new number input fields for `enquiry_stale_days` and `invoice_overdue_reminder_days`. Same pattern: input blur triggers PATCH with `{ key, value }`. The existing route either accepts all keys generically or needs to be extended to allow the new keys. Check the Phase 3 plan for this detail.

### Phase 4 invoice creation pattern

The recurring-billing job creates invoice + line_items in the same transaction structure as manual invoice creation. Reuse whatever helper Phase 4 establishes (likely a `createInvoice()` function in `src/lib/invoices.ts` or similar). Plan Phase 5 to import and call that helper rather than duplicating the insert logic.

### `csvEscape` helper

Defined in Phase 2 (`src/lib/csv.ts` or inline in the export route). Not needed in Phase 5 directly.

### Dynamic route typing — Next.js 16 pattern

For `POST /api/admin/automations/[job]/run`:

```typescript
// src/app/api/admin/automations/[job]/run/route.ts
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ job: string }> };

const VALID_JOBS = ["enquiry-reminder", "invoice-reminder", "recurring-billing"] as const;
type JobName = typeof VALID_JOBS[number];

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { job } = await params;
  if (!VALID_JOBS.includes(job as JobName)) {
    return NextResponse.json({ error: "Unknown job" }, { status: 404 });
  }
  // dispatch to shared logic in src/lib/automation/[job].ts
}
```

**Confidence: HIGH** — Next.js 16 params are `Promise<{...}>` per official docs and confirmed by multiple sources.

---

## 8. Validation Architecture

Nyquist validation is enabled (no `config.json` found with `nyquist_validation: false`).

### Test framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=verbose --testPathPattern=automation` |
| Full suite command | `npm test` |
| Alias | `@/` resolves to `src/` in Vitest (confirmed in `vitest.config.ts`) |
| DB-dependent tests | `describe.skipIf(!process.env.NETLIFY_DATABASE_URL)(...)` pattern |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| AUTOMATE-01 | Enquiry reminder job selects stale records and sends email | unit (mock DB + Resend) | `npm test -- --reporter=verbose` | `src/lib/automation/enquiry-reminder.test.ts` |
| AUTOMATE-01 | Dedup: last_reminded_at prevents re-send on same day | unit (mock DB) | same | Part of enquiry-reminder test |
| AUTOMATE-02 | Invoice overdue reminder selects correct records, sends email | unit (mock DB + Resend) | same | `src/lib/automation/invoice-reminder.test.ts` |
| AUTOMATE-03 | Recurring billing inserts draft invoice, ON CONFLICT skips duplicate | unit (mock DB) or integration | same | `src/lib/automation/recurring-billing.test.ts` |
| AUTOMATE-03 | Second run of billing job returns inserted=0, skipped=N | integration (needs DB) | `npm test -- --testPathPattern=recurring-billing` with NETLIFY_DATABASE_URL | |
| AUTOMATE-04 | Trigger API route returns 401 without session | unit (no DB) | `npm test` | `src/app/api/admin/automations/[job]/run/route.test.ts` |
| AUTOMATE-04 | Trigger API route returns 404 for unknown job name | unit (no DB) | same | |
| AUTOMATE-04 | Trigger API route returns 200 + summary for valid job | integration (needs DB) | DB-gated test | |

### Vitest test patterns for shared job logic

The shared job modules (`src/lib/automation/*.ts`) are the ideal unit test targets — they are plain TypeScript functions that accept an injected `db`/`resend` or mock. Structure:

```typescript
// src/lib/automation/enquiry-reminder.ts
export async function runEnquiryReminderJob(opts?: {
  db?: typeof import("@/lib/db/index").db;
  now?: Date;
}): Promise<{ sent: number; skipped: number }> { ... }
```

Tests use `vi.mock("@/lib/db/index")` + `vi.mock("resend")` to test without a real DB or Resend call. This matches the existing `describe.skipIf(skipDB)` pattern in the codebase — non-DB logic tests always run, DB-dependent tests are skipped in CI without the env var.

### Wave 0 Gaps

- [ ] `src/lib/automation/enquiry-reminder.test.ts` — covers AUTOMATE-01
- [ ] `src/lib/automation/invoice-reminder.test.ts` — covers AUTOMATE-02
- [ ] `src/lib/automation/recurring-billing.test.ts` — covers AUTOMATE-03 (idempotency)
- [ ] `src/app/api/admin/automations/[job]/run/route.test.ts` — covers AUTOMATE-04 auth/validation

---

## 9. Pitfalls and Risks

### Pitfall 1: Netlify functions `@/` alias may fail if esbuild does not load root tsconfig

**Risk:** HIGH — Build succeeds locally with Next.js (which resolves `@/` natively) but the Netlify function bundler (separate esbuild invocation) may not pick up the alias.
**Symptom:** Deploy error "Cannot find module '@/lib/db/index'" in function logs.
**Mitigation:** If the alias fails, use relative paths with `.js` extension for local imports: `import { db } from "../../src/lib/db/index.js"`. The `.js` extension is required by ESM even when the source file is `.ts`.
**Detection:** Test by deploying to `main` and checking the Netlify function logs for the first scheduled function invocation. Or test locally with `netlify functions:invoke`.

### Pitfall 2: `NETLIFY_DATABASE_URL` not available inside scheduled function

**Risk:** LOW — `@netlify/neon`'s source confirms it reads `NETLIFY_DATABASE_URL`. This env var is set at the Netlify site level (Phase 1), available to all functions and builds.
**Mitigation:** Confirmed the env var name in `node_modules/@netlify/neon/dist/index.js`. No action needed.

### Pitfall 3: `.ts` vs `.mts` bundling on Windows

**Risk:** MEDIUM — The project is developed on Windows (Win 11, per environment). `netlify dev` may behave differently for `.mts` files on Windows vs. the Linux build environment. File system case-sensitivity is not a concern here (it's the extension, not casing), but ESM resolution paths may differ.
**Mitigation:** Test with `netlify functions:invoke` locally before pushing. Use `.mts` as required by Netlify docs.

### Pitfall 4: Phase 5 migration runs before Phase 4 migration

**Risk:** HIGH — The `0003_automation.sql` migration references `invoices` table (created by `0002_invoices.sql`). If Phase 4 migration has not run, Phase 5 fails at `ALTER TABLE invoices ADD COLUMN`.
**Mitigation:** Migrations run in alphabetical/numeric order. Ensure `0002_invoices.sql` is applied before deploying Phase 5. The Phase 5 PLAN must document this prerequisite explicitly.

### Pitfall 5: Recurring billing job generates invoice when owner has already sent/paid for that period

**Risk:** MEDIUM — If the owner manually created and sent an invoice for a client for July 2026, and the recurring billing job runs on 2026-07-01, it will try to insert another invoice for `(billing_schedule_id, billing_period_start=2026-07-01)`. The UNIQUE constraint prevents duplication only if the manual invoice was created via the billing schedule link (has `billing_schedule_id` set). If the manual invoice has `billing_schedule_id = NULL`, the constraint will not protect it — a new auto-generated invoice will be created.
**Mitigation:** The spec says only auto-generated invoices have `billing_schedule_id` set; manual invoices are always NULL. This is by design — they are tracked separately. The owner is responsible for not double-billing. Document this in admin UI.

### Pitfall 6: Reminder dedup column not in Phase 2/4 schemas

**Risk:** MEDIUM — If the `last_reminded_at` column is added in Phase 5's migration only (as an ALTER TABLE), it won't be in the Drizzle schema definitions created in Phases 2 and 4. The Phase 5 PLAN must modify the Phase 2 and Phase 4 table definitions in `schema.ts` to add the column, then generate the migration.
**Mitigation:** Phase 5 migration adds `ALTER TABLE contact_enquiries ADD COLUMN last_reminded_at date` + `ALTER TABLE invoices ADD COLUMN last_reminded_at date`. Both tables' Drizzle schema definitions must be updated in `schema.ts`.

### Pitfall 7: `automation_runs` retention unbounded growth

**Risk:** LOW at current scale (3 jobs, max ~1095 rows/year). Becomes a concern at year 3+.
**Mitigation:** Implement job-level cleanup (delete oldest rows beyond 100 per job) at end of each job execution. Or defer until row count becomes meaningful.

### Pitfall 8: 30-second execution limit for recurring billing

**Risk:** LOW currently (few billing schedules). At scale (100+ schedules), bulk invoice creation could exceed 30 seconds.
**Mitigation:** The 30-second limit applies to Netlify Scheduled Functions. For Phase 5 scope (owner has < 20 active clients), this is not a concern. Note as known ceiling for future scaling.

---

## 10. Recommended Task Breakdown

### Wave structure

**Wave 0 — Foundation (no UI, no scheduled functions):**
1. **Plan 05-01:** DB migration (`0003_automation.sql`) — schema additions to `schema.ts`, run `db:generate`, apply migration. New tables: `billing_schedules`, `automation_runs`. ALTER TABLE: `invoices` (add 2 columns + unique constraint), `contact_enquiries` (add `last_reminded_at`), `invoices` (add `last_reminded_at`). Seed `site_settings` keys. Wave 0 test stubs for all 4 automation test files.
2. **Plan 05-02:** Shared job logic — `src/lib/automation/enquiry-reminder.ts`, `src/lib/automation/invoice-reminder.ts`, `src/lib/automation/recurring-billing.ts`. Full unit tests with mocked DB. Includes `last_reminded_at` dedup logic.

**Wave 1 — Trigger infrastructure:**
3. **Plan 05-03:** Admin trigger API (`POST /api/admin/automations/[job]/run`) + `requireAdmin()` guard. Calls shared job logic. Returns `{ summary }`. Route test file (auth + validation cases).
4. **Plan 05-04:** Three Netlify Scheduled Functions (`netlify/functions/enquiry-reminder.mts`, `invoice-overdue-reminder.mts`, `recurring-billing.mts`) — thin wrappers that call shared logic and write to `automation_runs`. Install `@netlify/functions` devDependency.

**Wave 2 — Admin UI:**
5. **Plan 05-05:** `/admin/automations` page — 3 job cards with last-run data (reads `automation_runs`), "Run Now" buttons. Billing Schedules CRUD section (list, add, deactivate). Activate sidebar nav item (currently `// Phase 5` comment).
6. **Plan 05-06:** Extend Phase 3 `SiteSettingsForm` + settings PATCH route with `enquiry_stale_days` and `invoice_overdue_reminder_days` fields.

**Dependencies:**
- Plans 05-01, 05-02 can parallelize within Wave 0 if DB migration lands first
- Plans 05-03, 05-04 depend on 05-01 (schema) and 05-02 (shared logic)
- Plans 05-05, 05-06 depend on 05-03 (trigger route) and are pure UI additions
- Phase 4 (`invoices` table) must be fully applied before Phase 5 migration runs

---

## Sources

### Primary (HIGH confidence)
- Netlify Scheduled Functions docs (`docs.netlify.com/build/functions/scheduled-functions/`) — v2 format, cron expressions, `.mts` naming, 30s limit, production-only execution
- Netlify Functions configuration docs (`docs.netlify.com/build/functions/configuration/`) — default directory is `netlify/functions/`, no `[functions]` toml entry needed
- `@netlify/neon` package source (`node_modules/@netlify/neon/dist/index.js`) — `NETLIFY_DATABASE_URL` confirmed as env var name
- Drizzle ORM indexes-constraints docs — composite unique constraint syntax `unique('name').on(t.col1, t.col2)`
- `tsconfig.json` in repo root — `"@/*": ["./src/*"]` alias confirmed
- `vitest.config.ts` — `"@"` alias confirmed for tests, `environment: "node"`, `include: ["src/**/*.test.ts"]`
- `package.json` — `"type": "module"` confirmed; `@netlify/functions` not yet installed (only `@netlify/plugin-nextjs` is present as devDep)
- Next.js 16 docs (nextjs.org/docs/app/api-reference/file-conventions/route) — `params: Promise<{...}>` confirmed for Next.js 15+

### Secondary (MEDIUM confidence)
- Multiple community sources confirming esbuild reads `tsconfig.json` paths automatically in Netlify function bundling
- Netlify developer guide on migrating to modern functions — `.mts` required for explicit ESM, `require()` not supported
- npm registry — `@netlify/functions` latest version 5.3.0 (verified 2026-07-01)

### Tertiary (LOW confidence)
- Community reports of `@/` alias working in Netlify function files — not officially documented but consistent with esbuild behavior

---

## Metadata

**Confidence breakdown:**
- Scheduled function format: HIGH — official Netlify docs + source code
- DB import path (`@/` alias): MEDIUM — esbuild behavior documented, not explicitly confirmed for scheduled functions
- Migration SQL: HIGH — standard PostgreSQL + Drizzle pattern verified
- Deduplication: HIGH — pattern is standard; column approach is well-established
- Billing period logic: HIGH — 1st-of-month is unambiguously correct given monthly cron

**Research date:** 2026-07-01
**Valid until:** 2026-08-01 (Netlify platform changes rarely; Drizzle schema patterns stable)
