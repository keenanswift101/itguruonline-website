import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@netlify/neon";
import { Pool } from "pg";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton — neon()/Pool is only touched on first DB operation, not at
// module import time. This lets JWT-only tests run without NETLIFY_DATABASE_URL set.
let _db: DbInstance | undefined;

// Local dev only (USE_LOCAL_PG=true in .env.local): drizzle-orm/neon-http speaks
// Neon's HTTP wire protocol, which only a real Neon endpoint (or the neon_local
// proxy, which needs a live Neon API key) can serve. A plain local Postgres —
// e.g. Docker — needs the standard node-postgres driver instead. Production
// never sets USE_LOCAL_PG, so it always uses neon-http.
function getDbInstance(): DbInstance {
  if (!_db) {
    _db =
      process.env.USE_LOCAL_PG === "true"
        ? (drizzlePg({ client: new Pool({ connectionString: process.env.NETLIFY_DATABASE_URL }), schema }) as unknown as DbInstance)
        : drizzle({ client: neon(), schema });
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return getDbInstance()[prop as keyof DbInstance];
  },
});
