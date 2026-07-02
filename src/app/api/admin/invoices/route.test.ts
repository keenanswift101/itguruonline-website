import { describe, it } from "vitest";

// Wave 0 stub — plan 04-02 replaces these todos with real tests against POST ./route
// DB gate (established Phase 1 pattern):
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describe("POST /api/admin/invoices — non-DB guards", () => {
  it.todo("401 without session");
  it.todo("422 missing fields");
  it.todo("400 bad JSON");
});

describeIfDb("POST /api/admin/invoices — DB integration", () => {
  it.todo("creates draft with computed total (DB)");
});
