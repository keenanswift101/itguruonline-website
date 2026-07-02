import { describe, it } from "vitest";

// Wave 0 stub — plan 04-03 replaces these todos with real tests against PATCH ./route
// DB gate (established Phase 1 pattern):
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describe("PATCH /api/admin/invoices/[id]/status — non-DB guards", () => {
  it.todo("401 without session");
  it.todo("409 on invalid transition");
});

describeIfDb("PATCH /api/admin/invoices/[id]/status — DB integration", () => {
  it.todo("assigns fiscal_year+sequence_number on draft→sent (DB)");
  it.todo("sets paid_at on →paid (DB)");
});
