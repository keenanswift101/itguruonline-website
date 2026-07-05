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

describe("PUT/DELETE /api/admin/quotations/[id] — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });
  it.todo("returns 401 without a session cookie");
  it.todo("returns 400 for a non-numeric id / malformed body");
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("PUT/DELETE /api/admin/quotations/[id] — DB tests", () => {
  it.todo("PUT edits a draft (ok)");
  it.todo("PUT returns 409 on a non-draft quotation");
  it.todo("DELETE 409 on a non-draft");
  it.todo("DELETE removes a draft + cascades line items");
});
