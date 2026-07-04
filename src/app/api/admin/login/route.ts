import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isTrustedOrigin } from "@/lib/csrf";
import { getClientIp } from "@/lib/client-ip";
import {
  signSession,
  isLockedOut,
  recordLoginAttempt,
  COOKIE_NAME,
} from "@/lib/auth";
import { db } from "@/lib/db/index";
import { adminUsers } from "@/lib/db/schema";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Real bcrypt hash of a random throwaway string — compared against when the
// email doesn't exist, so unknown-email and wrong-password take the same
// time (no account enumeration via response timing).
const DUMMY_HASH = "$2b$12$BgfGYCEmSMsaC8N2HB/7TOYzyFZPlyHkmEDktFFDAGu0DPE..6Aom";

export async function POST(req: NextRequest) {
  // 1. CSRF origin check
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 3. Validate
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const { password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // 4. Lockout check BEFORE bcrypt (prevents timing-based enumeration under load)
  if (await isLockedOut(email)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const ip = getClientIp(req);

  // 5. Look up admin
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));

  // 6. Compare — identical response AND timing for unknown email and wrong
  // password (no enumeration): missing user still pays one bcrypt compare.
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    await recordLoginAttempt({ email, ipAddress: ip, succeeded: false });
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // 7. Success
  await recordLoginAttempt({ email, ipAddress: ip, succeeded: true });
  const token = await signSession({ sub: String(user.id), email: user.email });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
