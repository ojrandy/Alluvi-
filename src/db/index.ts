import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Single connection pool per process, created on FIRST QUERY rather than at import. The CI build
 * has no database (DEPLOYMENT.md), and merely importing a module that uses `db` must not throw;
 * a missing DATABASE_URL now fails the query that needs it, with a clear message.
 *
 * In dev, Next's hot reload re-evaluates modules, so the instance is cached on globalThis to avoid
 * exhausting MySQL connections (cPanel limits are low).
 */
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 5),
    waitForConnections: true,
    timezone: "Z", // store/read datetimes as UTC
    charset: "utf8mb4",
    enableKeepAlive: true,
  });
  // "planetscale" mode makes relational queries use correlated subqueries instead of LATERAL joins,
  // which MariaDB (Namecheap) does not support. Works on MySQL 8 too.
  return drizzle(pool, { schema, mode: "planetscale" });
}

type Db = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { __alluviDb?: Db };

function instance(): Db {
  globalForDb.__alluviDb ??= createDb();
  return globalForDb.__alluviDb;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = instance();
    const value = Reflect.get(real, prop, real) as unknown;
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export type DB = Db;
export { schema };
/** The pool or an open transaction: helpers that may run inside `db.transaction` accept either. */
export type DbExecutor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
