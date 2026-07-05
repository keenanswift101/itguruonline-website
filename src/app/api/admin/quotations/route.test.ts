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

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/quotations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  clientName: "Acme (Pty) Ltd",
  clientEmail: "billing@acme.co.za",
  billingAddress: "1 Main Rd\nKuils River",
  issueDate: "2026-07-02",
  validUntil: "2026-07-31",
  lineItems: [
    { description: "Startup hosting — July", quantity: 1, unitPriceRands: 99 },
    { description: "Domain renewal .co.za", quantity: 2, unitPriceRands: 120 },
  ],
};

describe("POST /api/admin/quotations — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });

  it("returns 401 without a session cookie", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 even with a valid-shaped body (requireAdmin is first)", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest("not-json") as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 on a non-JSON body when authenticated", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const res = await POST(makeRequest("not-json") as never);
    expect(res.status).toBe(400);
  });

  it("returns 422 with fieldErrors when clientName is missing", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const { clientName: _omit, ...rest } = validBody;
    const res = await POST(makeRequest(rest) as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("Validation failed.");
    expect(body.fields).toHaveProperty("clientName");
  });

  it("returns 422 when validUntil is missing", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const { validUntil: _omit, ...rest } = validBody;
    const res = await POST(makeRequest(rest) as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields).toHaveProperty("validUntil");
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("POST /api/admin/quotations — DB tests", () => {
  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
  });

  it.todo("creates a draft quotation + line items (201)");
  it.todo("422 when clientId references a missing client");
});
