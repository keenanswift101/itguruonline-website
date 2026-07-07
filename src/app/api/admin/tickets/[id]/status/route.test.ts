import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

function makeRequest(body?: unknown, id = "1") {
  return new Request(`http://localhost:3000/api/admin/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/admin/tickets/[id]/status — non-DB guards", () => {
  beforeEach(() => { sessionToken = null; });

  it("returns 401 when no session cookie is present", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest({ status: "resolved" }) as never, params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
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

describeIfDb("PATCH /api/admin/tickets/[id]/status — DB tests", () => {
  it.todo("open→resolved stamps resolved_at and returns ok");
  it.todo("returns 409 for a disallowed transition");
  it.todo("reopening (resolved→open) clears resolved_at");
});
