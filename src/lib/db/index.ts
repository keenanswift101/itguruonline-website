import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton — neon() is only called on first DB operation, not at module
// import time. This lets JWT-only tests run without a database connection.
let _db: DbInstance | undefined;

// Netlify's current built-in database provisioning injects the connection
// string as NETLIFY_DB_URL (confirmed via a real deployed function), not the
// legacy NETLIFY_DATABASE_URL that @netlify/neon falls back to when called
// bare. Deliberately not using the @netlify/database package here: it pulls
// in `pg` at module scope even on the 'serverless' driver path, and Turbopack
// mangles that import into an unresolvable external module name in the
// deployed Netlify function.
function getDbInstance(): DbInstance {
  if (!_db) {
    _db = drizzle({ client: neon(process.env.NETLIFY_DB_URL), schema });
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return getDbInstance()[prop as keyof DbInstance];
  },
});
