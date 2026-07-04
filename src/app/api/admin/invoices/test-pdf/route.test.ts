import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { signSession } from "@/lib/auth";

// Mutable session token — null means "no session cookie" (non-DB guard tests),
// set to a signed JWT inside the DB-gated block for the authenticated smoke test.
let sessionToken: string | null = null;

// Mock next/headers so cookies() serves the mutable token above
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "admin_session" && sessionToken ? { name, value: sessionToken } : undefined,
  })),
}));

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
  }
});

// Non-DB guard tests — always run (no session cookie set)
describe("GET /api/admin/invoices/test-pdf — non-DB guards", () => {
  it("returns 401 when no session cookie is set", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// DB-dependent tests
const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("GET /api/admin/invoices/test-pdf — renderToBuffer smoke test", () => {
  beforeAll(async () => {
    sessionToken = await signSession({ sub: "1", email: "smoke-test@example.com" });
  });

  afterAll(() => {
    sessionToken = null;
  });

  it("returns 200 + application/pdf with a non-empty body (renderToBuffer works on Next.js 16)", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
