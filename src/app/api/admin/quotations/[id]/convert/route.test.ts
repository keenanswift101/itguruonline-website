import { describe, it, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined) }),
}));
// Resend mock MUST be a `function` (not arrow) — vitest calls it via `new Resend()` (08-04 lesson).
vi.mock("resend", () => ({
  Resend: vi.fn(function () { return { emails: { send: vi.fn().mockResolvedValue({ error: null }) } }; }),
}));

beforeAll(() => { if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!"; });

describe("POST /api/admin/quotations/[id]/convert — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });
  it.todo("returns 401 without a session cookie");
  it.todo("returns 400 for a non-numeric id / malformed body");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("POST /api/admin/quotations/[id]/convert — DB tests", () => {
  it.todo("409 when quotation is not accepted");
  it.todo("creates a draft invoice + line items + stamps converted_invoice_id (201)");
  it.todo("409 on a second convert (idempotency)");
});
