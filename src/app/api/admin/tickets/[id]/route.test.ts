import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

const validBody = {
  subject: "Email not syncing on iPhone",
  description: "Client reports mail app stopped syncing after iOS update.",
  priority: "high",
};

function makeRequest(method: "GET" | "PUT", body?: unknown, id = "1") {
  return new Request(`http://localhost:3000/api/admin/tickets/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET/PUT /api/admin/tickets/[id] — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("GET returns 401 when no session cookie is present", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest("GET") as never, params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("PUT returns 401 when no session cookie is present", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", validBody) as never, params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("GET/PUT /api/admin/tickets/[id] — DB tests", () => {
  it.todo("GET returns the ticket with joined client name");
  it.todo("GET returns 404 for an unknown id");
  it.todo("PUT persists edited subject/description/priority");
});
