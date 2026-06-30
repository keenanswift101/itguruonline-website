import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { loginAttempts } from "@/lib/db/schema";

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
    const { payload } = await jwtVerify(token, getSecret());
    return { sub: payload.sub as string, email: payload["email"] as string };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionPayload | null> {
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
