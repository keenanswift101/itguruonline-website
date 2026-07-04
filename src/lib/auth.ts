import crypto from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { and, eq, gte, gt, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { adminUsers, loginAttempts } from "@/lib/db/schema";

export interface SessionPayload {
  sub: string;
  email: string;
}

export const COOKIE_NAME = "admin_session";

const SESSION_DURATION = "8h";
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    // Pin the algorithm explicitly — belt-and-braces against any future
    // key-type change reintroducing algorithm-confusion room.
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return { sub: payload.sub as string, email: payload["email"] as string };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  // Local-testing bypass, owner-requested. Requires BOTH `next dev`
  // (NODE_ENV is "production" in every deployed build) AND an explicit
  // DEV_AUTH_BYPASS=1 opt-in, which lives only in .env.local — it must
  // never be set as a Netlify env var.
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "1"
  ) {
    return { sub: "0", email: "dev-bypass@local" };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function recordLoginAttempt(args: {
  email: string;
  ipAddress: string;
  succeeded: boolean;
}): Promise<void> {
  await db.insert(loginAttempts).values({
    email: args.email,
    ipAddress: args.ipAddress,
    succeeded: args.succeeded,
  });
}

export async function isLockedOut(email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);
  const rows = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.attemptedAt, windowStart)
      )
    );
  return rows.length >= LOCKOUT_THRESHOLD;
}

// ── Password reset helpers ──────────────────────────────────────────────────

const RESET_TOKEN_TTL_MINUTES = 60;

export async function createResetToken(email: string): Promise<string | null> {
  const [user] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email));
  if (!user) return null;

  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(raw, 12);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

  await db.update(adminUsers)
    .set({ resetToken: tokenHash, resetTokenExpiresAt: expiresAt })
    .where(eq(adminUsers.id, user.id));

  return raw;
}

export async function consumeResetToken(rawToken: string, newPassword: string): Promise<boolean> {
  const now = new Date();
  const candidates = await db
    .select()
    .from(adminUsers)
    .where(and(isNotNull(adminUsers.resetToken), gt(adminUsers.resetTokenExpiresAt, now)));

  for (const candidate of candidates) {
    if (!candidate.resetToken) continue;
    const matches = await bcrypt.compare(rawToken, candidate.resetToken);
    if (matches) {
      const newHash = await bcrypt.hash(newPassword, 12);
      await db.update(adminUsers)
        .set({ passwordHash: newHash, resetToken: null, resetTokenExpiresAt: null })
        .where(eq(adminUsers.id, candidate.id));
      return true;
    }
  }

  return false;
}

// ── Change password (authenticated, current-password-verified) ─────────────

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const [user] = await db
    .select({ id: adminUsers.id, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.id, Number(userId)));
  if (!user) return false;

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) return false;

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(adminUsers).set({ passwordHash: newHash }).where(eq(adminUsers.id, user.id));
  return true;
}
