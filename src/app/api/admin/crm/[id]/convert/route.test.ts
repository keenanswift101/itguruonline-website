import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
});

describe("POST /api/admin/crm/[id]/convert — non-DB guards", () => {
  it("returns 401 when no session cookie is present", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost:3000/api/admin/crm/registration-1/convert", {
      method: "POST",
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "registration-1" }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 for an unparseable crm id (auth guard fires before id-parse guard)", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost:3000/api/admin/crm/not-a-valid-id/convert", {
      method: "POST",
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: "not-a-valid-id" }) });
    // 401 comes first (no session) — matches the established guard-order
    // convention (requireAdmin() runs before params/id parsing).
    expect(res.status).toBe(401);
  });
});

const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/crm/[id]/convert — DB tests", () => {
  it.todo("maps registration firstName+surname into client.name and copies addresses");
  it.todo("maps enquiry name/email/phone into the client");
  it.todo("stamps converted_client_id on the lead inside one transaction");
  it.todo("returns 409 when the lead was already converted (idempotent)");
});
