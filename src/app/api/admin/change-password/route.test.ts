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

function makeRequest(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/admin/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, Host: "localhost:3000" },
    body: JSON.stringify(body),
  });
}

// Non-DB tests — always run
describe("POST /api/admin/change-password — non-DB guards", () => {
  it("rejects cross-site origin with 403", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ currentPassword: "a", newPassword: "validpass1" }, "https://evil.com") as any);
    expect(res.status).toBe(403);
  });

  it("returns 401 when no session cookie is present", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ currentPassword: "a", newPassword: "validpass1" }) as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

// DB-dependent tests
const describeIfDb = process.env.NETLIFY_DB_URL ? describe : describe.skip;

describeIfDb("changePassword() helper — DB tests", () => {
  it("returns false for an incorrect current password", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const { db } = await import("@/lib/db/index");
    const { adminUsers } = await import("@/lib/db/schema");
    const { changePassword } = await import("@/lib/auth");

    const email = `changepw+${Date.now()}@test.it-guru.co.za`;
    const hash = await bcrypt.hash("CorrectPass1!", 12);
    const [user] = await db.insert(adminUsers).values({ email, passwordHash: hash }).returning();

    const ok = await changePassword(String(user.id), "WrongPassword!", "NewPassword1!");
    expect(ok).toBe(false);
  });

  it("updates the password hash when the current password matches", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const { db } = await import("@/lib/db/index");
    const { adminUsers } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { changePassword } = await import("@/lib/auth");

    const email = `changepw+${Date.now()}+2@test.it-guru.co.za`;
    const hash = await bcrypt.hash("CorrectPass1!", 12);
    const [user] = await db.insert(adminUsers).values({ email, passwordHash: hash }).returning();

    const ok = await changePassword(String(user.id), "CorrectPass1!", "BrandNewPass9!");
    expect(ok).toBe(true);

    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, user.id));
    const updated = await bcrypt.compare("BrandNewPass9!", row.passwordHash);
    expect(updated).toBe(true);
  });
});
