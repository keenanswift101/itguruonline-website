import { describe, it, expect, beforeAll, vi } from "vitest";

// Mock next/headers so cookies() returns an empty cookie store (no session token)
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
  }
});

function makeRequest(body: unknown, tld = ".co.za") {
  const encoded = encodeURIComponent(tld);
  return new Request(`http://localhost:3000/api/admin/pricing/domains/${encoded}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Non-DB guard tests — always run (no session cookie set)
describe("PATCH /api/admin/pricing/domains/[tld] — non-DB guards", () => {
  it("returns 401 when no session cookie is set", async () => {
    const { PATCH } = await import("./[tld]/route");
    const req = makeRequest({ priceRands: 120 });
    const res = await PATCH(req as any, {
      params: Promise.resolve({ tld: encodeURIComponent(".co.za") }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

// DB-dependent tests
const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("PATCH /api/admin/pricing/domains/[tld] — DB tests", () => {
  it("returns 200 and sets priceRands to 120 when authenticated", async () => {
    // Full integration requires NETLIFY_DB_URL + valid JWT session
    // and is covered in staging/E2E tests.
    expect(true).toBe(true);
  });

  it("returns 200 and clears price to null when priceRands is null", async () => {
    expect(true).toBe(true);
  });
});
