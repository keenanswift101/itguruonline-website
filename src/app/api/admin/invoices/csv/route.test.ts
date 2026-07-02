import { describe, it } from "vitest";

// Wave 0 stub — plan 04-03 replaces these todos with real tests against GET ./route
// DB gate (established Phase 1 pattern):
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describe("GET /api/admin/invoices/csv — non-DB guards", () => {
  it.todo("401 without session");
});

describeIfDb("GET /api/admin/invoices/csv — DB integration", () => {
  it.todo("Content-Type text/csv");
  it.todo("header row matches spec");
});
