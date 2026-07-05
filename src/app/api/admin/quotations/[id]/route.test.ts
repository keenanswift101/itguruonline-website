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

const validBody = {
  clientName: "Acme (Pty) Ltd",
  clientEmail: "billing@acme.co.za",
  billingAddress: "1 Main Rd\nKuils River",
  issueDate: "2026-07-02",
  validUntil: "2026-07-31",
  lineItems: [
    { description: "Business hosting — July", quantity: 1, unitPriceRands: 199 },
  ],
};

function makeRequest(method: "PUT" | "DELETE", body?: unknown, id = "1") {
  return new Request(`http://localhost:3000/api/admin/quotations/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PUT/DELETE /api/admin/quotations/[id] — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });

  it("returns 401 without a session cookie", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody) as never, params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("DELETE returns 401 without a session cookie", async () => {
    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE") as never, params("1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-numeric id / malformed body", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody, "abc") as never, params("abc"));
    expect(res.status).toBe(400);
  });

  it("DELETE returns 400 for a non-numeric id", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE", undefined, "abc") as never, params("abc"));
    expect(res.status).toBe(400);
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("PUT/DELETE /api/admin/quotations/[id] — DB tests", () => {
  beforeEach(async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
  });

  it.todo("PUT edits a draft (ok)");
  it.todo("PUT returns 409 on a non-draft quotation");
  it.todo("DELETE 409 on a non-draft");
  it.todo("DELETE removes a draft + cascades line items");
});
