import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession, recordLoginAttempt, isLockedOut } from "./auth";
import { db } from "./db/index";
import { loginAttempts } from "./db/schema";
import { eq } from "drizzle-orm";

// JWT tests use a fixed secret set in the test environment if JWT_SECRET is absent.
beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-32-bytes-minimum-len!";
  }
});

describe("signSession / verifySession", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSession({ sub: "1", email: "admin@example.com" });
    const payload = await verifySession(token);
    expect(payload).toEqual({ sub: "1", email: "admin@example.com" });
  });

  it("returns null for a malformed token", async () => {
    expect(await verifySession("not.a.jwt")).toBeNull();
  });

  it("returns null for a tampered payload", async () => {
    const token = await signSession({ sub: "1", email: "admin@example.com" });
    const parts = token.split(".");
    // Flip a character in the payload segment
    parts[1] = parts[1].slice(0, -1) + (parts[1].slice(-1) === "a" ? "b" : "a");
    expect(await verifySession(parts.join("."))).toBeNull();
  });

  it("returns null for an expired token", async () => {
    // jose setExpirationTime accepts a Date — set to 1ms in the past
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const expired = await new SignJWT({ email: "x@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("1")
      .setIssuedAt()
      .setExpirationTime(new Date(Date.now() - 1000))
      .sign(secret);
    expect(await verifySession(expired)).toBeNull();
  });
});

// DB-dependent tests: skip gracefully if NETLIFY_DATABASE_URL is not available.
const describeIfDb = process.env.NETLIFY_DATABASE_URL ? describe : describe.skip;

describeIfDb("isLockedOut (DB-backed — proves AUTH-04 survives restart)", () => {
  // Unique email per run so test rows don't collide across runs.
  const email = `lockout-test+${Date.now()}@example.com`;
  const ip = "127.0.0.1";

  it("returns false with zero failed attempts", async () => {
    expect(await isLockedOut(email)).toBe(false);
  });

  it("returns false after 4 failed attempts (below threshold)", async () => {
    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt({ email, ipAddress: ip, succeeded: false });
    }
    expect(await isLockedOut(email)).toBe(false);
  });

  it("returns true after 5 failed attempts (at threshold)", async () => {
    await recordLoginAttempt({ email, ipAddress: ip, succeeded: false });
    expect(await isLockedOut(email)).toBe(true);
  });

  it("does not lock out when the 5th attempt is a success", async () => {
    const successEmail = `lockout-success+${Date.now()}@example.com`;
    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt({ email: successEmail, ipAddress: ip, succeeded: false });
    }
    await recordLoginAttempt({ email: successEmail, ipAddress: ip, succeeded: true });
    expect(await isLockedOut(successEmail)).toBe(false);
  });
});
