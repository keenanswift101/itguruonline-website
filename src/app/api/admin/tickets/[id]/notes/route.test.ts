import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("POST /api/admin/tickets/[id]/notes — non-DB guards", () => {
  it("returns 401 when no session cookie is present", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost:3000/api/admin/tickets/1/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Called client, escalated to on-site visit" }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 (guard fires before id parsing) for a non-numeric ticket id", async () => {
    // requireAdmin() runs before Number(id) validation, so with no session cookie
    // this is still 401, not 404 — matches the guard-order convention in
    // clients/[id]/notes/route.test.ts (Pitfall 4).
    const { POST } = await import("./route");
    const req = new Request("http://localhost:3000/api/admin/tickets/not-a-number/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Called client, escalated to on-site visit" }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "not-a-number" }) });
    expect(res.status).toBe(401);
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/tickets/[id]/notes — DB tests", () => {
  it.todo("inserts a crm_notes row with recordType 'ticket' and returns 201");
  it.todo("strips HTML from the note body before storing");
});
