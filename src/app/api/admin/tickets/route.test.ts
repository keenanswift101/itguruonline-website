import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

function makeRequest(url: string, method: "GET" | "POST" = "GET", body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  clientId: 1,
  subject: "Email not syncing on iPhone",
  description: "Client reports mail app stopped syncing after iOS update.",
  priority: "high",
};

describe("POST /api/admin/tickets — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("returns 401 when no session cookie is present", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest("http://localhost:3000/api/admin/tickets", "POST", validBody) as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 422 when subject is empty", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const { subject: _omit, ...rest } = validBody;
    const res = await POST(
      makeRequest("http://localhost:3000/api/admin/tickets", "POST", { ...rest, subject: "" }) as never
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("Validation failed.");
    expect(body.fields).toHaveProperty("subject");
  });

  it("returns 422 when clientId is missing", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const { clientId: _omit, ...rest } = validBody;
    const res = await POST(makeRequest("http://localhost:3000/api/admin/tickets", "POST", rest) as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields).toHaveProperty("clientId");
  });
});

describe("GET /api/admin/tickets — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("returns 401 when no session cookie is present", async () => {
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost:3000/api/admin/tickets") as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/tickets — DB tests", () => {
  it.todo("creates a ticket linked to a client with status=open and returns 201");
  it.todo("returns 422 when clientId does not exist");
});

describeIfDb("GET /api/admin/tickets — DB tests", () => {
  it.todo("orders open/in_progress before resolved, then priority high→low");
  it.todo("filters by ?status=open");
});
