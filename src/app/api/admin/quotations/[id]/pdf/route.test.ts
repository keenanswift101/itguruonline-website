import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined) }),
}));
// Resend mock MUST be a `function` (not arrow) — vitest calls it via `new Resend()` (08-04 lesson).
vi.mock("resend", () => ({
  Resend: vi.fn(function () { return { emails: { send: vi.fn().mockResolvedValue({ error: null }) } }; }),
}));

beforeAll(() => { if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!"; });

function makeRequest(id = "1") {
  return new Request(`http://localhost:3000/api/admin/quotations/${id}/pdf`, { method: "GET" });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/admin/quotations/[id]/pdf — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });

  it("returns 401 without a session cookie", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest(), params("1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-numeric id / malformed body", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { GET } = await import("./route");
    const res = await GET(makeRequest("abc"), params("abc"));
    expect(res.status).toBe(400);
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("GET /api/admin/quotations/[id]/pdf — DB tests", () => {
  it.todo("returns application/pdf with a QUO- filename");
  it.todo("401 without a session");
});
