import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    delete: vi.fn(),
  }),
}));

function makeRequest(origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/admin/logout", {
    method: "POST",
    headers: { Origin: origin, Host: "localhost:3000" },
  });
}

describe("POST /api/admin/logout", () => {
  it("rejects cross-site origin with 403", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest("https://evil.com") as any);
    expect(res.status).toBe(403);
  });

  it("clears the session cookie and returns 200 for same-origin requests", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest() as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
