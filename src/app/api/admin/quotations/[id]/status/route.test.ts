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

function makeRequest(body?: unknown, id = "1") {
  return new Request(`http://localhost:3000/api/admin/quotations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/admin/quotations/[id]/status — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });

  it("returns 401 without a session cookie", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "sent" }) as never, params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for a non-numeric id when authed", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "sent" }, "abc") as never, params("abc"));
    expect(res.status).toBe(400);
  });

  it("returns 422 for an invalid status enum value when authed", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "bogus" }) as never, params("1"));
    expect(res.status).toBe(422);
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("PATCH /api/admin/quotations/[id]/status — DB tests", () => {
  it.todo("draft→sent returns 422 no_client_email when clientEmail null");
  it.todo("draft→sent emails the PDF + sets status sent");
  it.todo("sent→accepted ok");
  it.todo("accepted→sent returns 409 (terminal)");
});
