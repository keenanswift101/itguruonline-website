import { describe, it, expect, beforeAll } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db/index";
import { adminUsers, loginAttempts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
  }
});

function makeRequest(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

// Non-DB tests — always run
describe("POST /api/admin/login — non-DB guards", () => {
  it("rejects cross-site origin with 403", async () => {
    const req = makeRequest({ email: "a@b.com", password: "x" }, "https://evil.com");
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it("rejects malformed body with 400", async () => {
    const req = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", Host: "localhost:3000" },
      body: "not-json",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("rejects missing fields with 422", async () => {
    const res = await POST(makeRequest({ email: "bad" }) as any);
    expect(res.status).toBe(422);
  });
});

// DB-dependent tests
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describeIfDb("POST /api/admin/login — DB tests", () => {
  const email = `admin-route-test+${Date.now()}@example.com`;
  const password = "TestPass123!";
  let userId: number;

  beforeAll(async () => {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(adminUsers).values({ email, passwordHash: hash }).returning();
    userId = user.id;
  });

  it("returns 200 and sets httpOnly cookie on correct credentials", async () => {
    const res = await POST(makeRequest({ email, password }) as any);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("admin_session");
    expect(setCookie).toContain("HttpOnly");
  });

  it("returns 401 for wrong password (same shape as unknown email)", async () => {
    const res = await POST(makeRequest({ email, password: "wrong!" }) as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid credentials.");
  });

  it("returns 401 for unknown email (same shape — no enumeration)", async () => {
    const res = await POST(makeRequest({ email: `unknown+${Date.now()}@example.com`, password }) as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid credentials.");
  });

  it("returns 429 after 5 failed attempts even with correct password", async () => {
    const lockEmail = `lockout-route+${Date.now()}@example.com`;
    const lockHash = await bcrypt.hash(password, 10);
    await db.insert(adminUsers).values({ email: lockEmail, passwordHash: lockHash });
    // Insert 5 failed attempts directly
    for (let i = 0; i < 5; i++) {
      await db.insert(loginAttempts).values({
        email: lockEmail, ipAddress: "127.0.0.1", succeeded: false,
      });
    }
    const res = await POST(makeRequest({ email: lockEmail, password }) as any);
    expect(res.status).toBe(429);
  });
});
