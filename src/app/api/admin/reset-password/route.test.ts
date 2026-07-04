import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";

const BASE = "https://it-guru.co.za";
const skipDB = !process.env.NETLIFY_DB_URL;

// ── Non-DB route tests (always run) ────────────────────────────────────────

describe("POST /api/admin/reset-password (no DB required)", () => {
  it("rejects cross-site origin (403)", async () => {
    const { POST } = await import("./route");
    const req = new Request(`${BASE}/api/admin/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://evil.com",
        host: "it-guru.co.za",
      },
      body: JSON.stringify({ token: "sometoken", password: "validpass1" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it("rejects malformed JSON (400)", async () => {
    const { POST } = await import("./route");
    const req = new Request(`${BASE}/api/admin/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("rejects missing/short-password fields (422)", async () => {
    const { POST } = await import("./route");
    const req = new Request(`${BASE}/api/admin/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "tok", password: "short" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(422);
  });
});

// ── DB-dependent tests (skip without NETLIFY_DB_URL) ──────────────────

describe.skipIf(skipDB)("reset-token helpers + route (requires DB)", () => {
  const testEmail = `reset+${Date.now()}@test.it-guru.co.za`;
  let rawToken: string | null = null;

  beforeAll(async () => {
    const { db } = await import("@/lib/db/index");
    const { adminUsers } = await import("@/lib/db/schema");
    const hash = await bcrypt.hash("SeedPass123!", 12);
    await db.insert(adminUsers).values({ email: testEmail, passwordHash: hash });
  });

  it("createResetToken stores bcrypt hash + future expiry and returns raw token", async () => {
    const { createResetToken } = await import("@/lib/auth");
    const { db } = await import("@/lib/db/index");
    const { adminUsers } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    rawToken = await createResetToken(testEmail);
    expect(rawToken).toBeTruthy();
    expect(typeof rawToken).toBe("string");
    expect(rawToken!.length).toBeGreaterThan(32);

    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, testEmail));
    expect(row.resetToken).toBeTruthy();
    expect(row.resetTokenExpiresAt).toBeTruthy();
    expect(row.resetTokenExpiresAt!.getTime()).toBeGreaterThan(Date.now());

    // Stored value must be a bcrypt hash, not the raw token
    const isHash = await bcrypt.compare(rawToken!, row.resetToken!);
    expect(isHash).toBe(true);
  });

  it("createResetToken returns null for unknown email", async () => {
    const { createResetToken } = await import("@/lib/auth");
    const result = await createResetToken("nobody@nonexistent.example");
    expect(result).toBeNull();
  });

  it("consumeResetToken accepts valid token and sets new password", async () => {
    expect(rawToken).toBeTruthy();
    const { consumeResetToken } = await import("@/lib/auth");
    const { db } = await import("@/lib/db/index");
    const { adminUsers } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const ok = await consumeResetToken(rawToken!, "NewPassword99!");
    expect(ok).toBe(true);

    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, testEmail));
    const passwordUpdated = await bcrypt.compare("NewPassword99!", row.passwordHash);
    expect(passwordUpdated).toBe(true);

    // Token must be cleared
    expect(row.resetToken).toBeNull();
    expect(row.resetTokenExpiresAt).toBeNull();
  });

  it("consumeResetToken rejects already-used (cleared) token", async () => {
    expect(rawToken).toBeTruthy();
    const { consumeResetToken } = await import("@/lib/auth");
    const ok = await consumeResetToken(rawToken!, "AnotherPass99!");
    expect(ok).toBe(false);
  });

  it("consumeResetToken rejects expired token", async () => {
    const { createResetToken } = await import("@/lib/auth");
    const { db } = await import("@/lib/db/index");
    const { adminUsers } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const expiredEmail = `expired+${Date.now()}@test.it-guru.co.za`;
    const hash = await bcrypt.hash("AnotherSeed456!", 12);
    await db.insert(adminUsers).values({ email: expiredEmail, passwordHash: hash });

    const raw = await createResetToken(expiredEmail);
    expect(raw).toBeTruthy();

    // Backdate the expiry to the past
    await db.update(adminUsers)
      .set({ resetTokenExpiresAt: new Date(Date.now() - 60_000) })
      .where(eq(adminUsers.email, expiredEmail));

    const { consumeResetToken } = await import("@/lib/auth");
    const ok = await consumeResetToken(raw!, "ShouldFail99!");
    expect(ok).toBe(false);
  });

  it("reset-password route returns 200 for valid token", async () => {
    // Issue a fresh token for this route test
    const routeEmail = `route+${Date.now()}@test.it-guru.co.za`;
    const { db } = await import("@/lib/db/index");
    const { adminUsers } = await import("@/lib/db/schema");
    const ph = await bcrypt.hash("RouteTestSeed1!", 12);
    await db.insert(adminUsers).values({ email: routeEmail, passwordHash: ph });

    const { createResetToken } = await import("@/lib/auth");
    const freshToken = await createResetToken(routeEmail);
    expect(freshToken).toBeTruthy();

    const { POST } = await import("./route");
    const req = new Request(`${BASE}/api/admin/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: freshToken, password: "UpdatedPass99!" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });

  it("reset-password route returns 400 for invalid token", async () => {
    const { POST } = await import("./route");
    const req = new Request(`${BASE}/api/admin/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "completely-invalid-token-xyz", password: "ValidPass99!" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });
});
