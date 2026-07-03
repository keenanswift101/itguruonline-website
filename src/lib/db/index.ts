import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton — neon() is only called on first DB operation, not at module
// import time. This lets JWT-only tests run without NETLIFY_DATABASE_URL set.
let _db: DbInstance | undefined;

function getDbInstance(): DbInstance {
  if (!_db) {
    _db = drizzle({ client: neon(), schema });
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return getDbInstance()[prop as keyof DbInstance];
  },
});
