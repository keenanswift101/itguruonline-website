import { describe, it } from "vitest";

// Wave 0 stub — plan 04-02 replaces these todos with real tests against PUT ./route
// DB gate (established Phase 1 pattern):
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describe("PUT /api/admin/invoices/[id] — non-DB guards", () => {
  it.todo("401 without session");
});

describeIfDb("PUT /api/admin/invoices/[id] — DB integration", () => {
  it.todo("409 when status != draft");
  it.todo("recomputes total on update (DB)");
});
