import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "./schema";

export type TxDb = ReturnType<typeof drizzleNeon<typeof schema>>;

/**
 * Runs `fn` against a short-lived Drizzle client that supports real
 * interactive transactions (`db.transaction`).
 *
 * Why this exists: the default `@netlify/neon` HTTP driver cannot run
 * transactions — drizzle-orm's neon-http session throws
 * "No transactions support in neon-http driver" (verified in drizzle-orm
 * 0.45.2). Multi-statement atomic writes (invoice + line items) must go
 * through this helper instead.
 *
 * Rules (per Phase 4 research):
 * - The Pool is created per call, never at module scope — Netlify spins up
 *   a fresh function instance per request.
 * - `pool.end()` always runs in `finally` to avoid connection exhaustion.
 *
 * Local dev only (USE_LOCAL_PG=true in .env.local): the Neon WebSocket driver
 * needs a real Neon endpoint (neon_local doesn't support websockets either —
 * only HTTP). A plain local Postgres uses the standard node-postgres Pool
 * instead, which supports transactions natively. Production never sets
 * USE_LOCAL_PG, so it always uses the Neon WebSocket driver.
 */
export async function withTxDb<T>(fn: (db: TxDb) => Promise<T>): Promise<T> {
  if (process.env.USE_LOCAL_PG === "true") {
    const pool = new PgPool({ connectionString: process.env.NETLIFY_DATABASE_URL });
    try {
      return await fn(drizzlePg({ client: pool, schema }) as unknown as TxDb);
    } finally {
      await pool.end();
    }
  }
  neonConfig.webSocketConstructor = ws;
  const pool = new NeonPool({ connectionString: process.env.NETLIFY_DATABASE_URL });
  const db = drizzleNeon({ client: pool, schema });
  try {
    return await fn(db);
  } finally {
    await pool.end();
  }
}
