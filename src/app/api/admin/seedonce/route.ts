import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";
import { eq } from "drizzle-orm";
import { adminUsers } from "@/lib/db/schema";

const SALT_ROUNDS = 12;

// Temporary one-time admin seed endpoint -- takes no input, reads only
// server-side env vars, idempotent (skips if the account already exists).
// Remove immediately after use.
export async function GET() {
  const email = process.env.ADMIN_EMAIL;
  const rawPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !rawPassword) {
    return NextResponse.json({ error: "Missing ADMIN_EMAIL or ADMIN_SEED_PASSWORD" }, { status: 500 });
  }

  const db = drizzle({ client: neon(process.env.NETLIFY_DB_URL), schema: { adminUsers } });
  const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ status: "already exists", email });
  }

  const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
  await db.insert(adminUsers).values({ email, passwordHash });

  return NextResponse.json({ status: "created", email });
}
