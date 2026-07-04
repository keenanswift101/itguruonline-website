import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";
import * as schema from "./schema";

export type TxDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Runs `fn` against a short-lived WebSocket-backed Drizzle client that
 * supports real interactive transactions (`db.transaction`).
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
 */
export async function withTxDb<T>(fn: (db: TxDb) => Promise<T>): Promise<T> {
  // Local `netlify dev` database is plain TCP Postgres (NETLIFY_DB_DRIVER=
  // "server") — node-postgres supports interactive transactions natively.
  // Production is always "serverless", so this branch never runs deployed.
  if (process.env.NETLIFY_DB_DRIVER === "server") {
    const pgPool = new PgPool({ connectionString: process.env.NETLIFY_DB_URL });
    const pgDb = drizzlePg({ client: pgPool, schema }) as unknown as TxDb;
    try {
      return await fn(pgDb);
    } finally {
      await pgPool.end();
    }
  }
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.NETLIFY_DB_URL });
  const db = drizzle({ client: pool, schema });
  try {
    return await fn(db);
  } finally {
    await pool.end();
  }
}
