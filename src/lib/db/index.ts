import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@netlify/neon";
import { Pool as PgPool } from "pg";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton — neon() is only called on first DB operation, not at module
// import time. This lets JWT-only tests run without a database connection.
let _db: DbInstance | undefined;

// `netlify dev` provisions a LOCAL Postgres and injects NETLIFY_DB_DRIVER=
// "server" plus a plain TCP connection string — the Neon HTTP driver cannot
// speak to it. Production always injects NETLIFY_DB_DRIVER="serverless", so
// this branch is unreachable in deployed functions. `pg` is listed in
// serverExternalPackages (next.config.ts) so Turbopack never bundles it —
// the class of bug that broke @netlify/database in deployed functions.
// The node-postgres instance is cast to the neon-http type: both are
// PgDatabase dialects with identical query builders for everything this
// app does on `db` (transactions go through withTxDb, never here).
function isLocalServerDriver(): boolean {
  return process.env.NETLIFY_DB_DRIVER === "server";
}

// Netlify's current built-in database provisioning injects the connection
// string as NETLIFY_DB_URL (confirmed via a real deployed function), not the
// legacy NETLIFY_DATABASE_URL that @netlify/neon falls back to when called
// bare. Deliberately not using the @netlify/database package here: it pulls
// in `pg` at module scope even on the 'serverless' driver path, and Turbopack
// mangles that import into an unresolvable external module name in the
// deployed Netlify function.
function getDbInstance(): DbInstance {
  if (!_db) {
    _db = isLocalServerDriver()
      ? (drizzlePg({
          client: new PgPool({ connectionString: process.env.NETLIFY_DB_URL }),
          schema,
        }) as unknown as DbInstance)
      : drizzle({ client: neon(process.env.NETLIFY_DB_URL), schema });
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return getDbInstance()[prop as keyof DbInstance];
  },
});
