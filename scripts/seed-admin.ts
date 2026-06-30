/**
 * One-time admin account seed (D-05).
 * Run once after first deploy with ADMIN_EMAIL and ADMIN_SEED_PASSWORD set on Netlify.
 *
 *   netlify dev:exec npm run seed:admin
 *
 * Safe to re-run — exits 0 if the account already exists.
 */
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";
import { eq } from "drizzle-orm";
import { adminUsers } from "../src/lib/db/schema.js";

const SALT_ROUNDS = 12;

const email = process.env.ADMIN_EMAIL;
const rawPassword = process.env.ADMIN_SEED_PASSWORD;

if (!email) {
  console.error("Missing required environment variable: ADMIN_EMAIL");
  process.exit(1);
}
if (!rawPassword) {
  console.error("Missing required environment variable: ADMIN_SEED_PASSWORD");
  process.exit(1);
}

const db = drizzle({ client: neon(), schema: { adminUsers } });

const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
if (existing.length > 0) {
  console.log("Admin account already exists — skipping.");
  process.exit(0);
}

const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
await db.insert(adminUsers).values({ email, passwordHash });

console.log(`Admin account created for ${email}.`);
