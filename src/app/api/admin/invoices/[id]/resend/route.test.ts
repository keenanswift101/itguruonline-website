import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let sessionToken: string | null = null;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (sessionToken ? { name, value: sessionToken } : undefined),
  }),
}));
// Must be a `function` (not an arrow) so vitest can invoke it as a
// constructor via `new Resend()`.
vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send: vi.fn().mockResolvedValue({ error: null }) } };
  }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/invoices/[id]/resend — non-DB guards", () => {
  beforeEach(() => {
    sessionToken = null;
  });

  it("returns 401 when no session cookie is present", async () => {
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost:3000/api/admin/invoices/1/resend", { method: "POST" }) as never, params("1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-numeric id", async () => {
    const { signSession } = await import("@/lib/auth");
    sessionToken = await signSession({ sub: "1", email: "admin@test.dev" });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost:3000/api/admin/invoices/abc/resend", { method: "POST" }) as never, params("abc"));
    expect(res.status).toBe(400);
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;
describeIfDb("POST /api/admin/invoices/[id]/resend — DB tests", () => {
  it.todo("returns 404 for an unknown invoice id");
  it.todo("returns 409 when the invoice is still a draft (not sent)");
  it.todo("returns 422 (no_client_email) when a sent invoice has no client email");
  it.todo("re-sends the PDF and returns ok without changing status");
});
