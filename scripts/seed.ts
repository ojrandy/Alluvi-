/**
 * Seed the database from content/products.json + default settings.
 *
 *   npm run db:seed            insert anything missing; NEVER overwrites existing rows
 *   npm run db:seed -- --force also refresh catalogue copy/specs/images of existing products
 *                              (price, stock, active flag and settings are never touched)
 *
 * Safe to run repeatedly, including in production. In production the app also seeds itself at
 * boot (scripts/boot-server.ts), filling products only into an empty table.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../src/db/schema";
import { runSeed } from "./lib/seed-core";

loadEnv({ path: ".env.local", override: false });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (.env.local)");
  const conn = await mysql.createConnection({ uri: url, timezone: "Z", charset: "utf8mb4" });
  const db = drizzle(conn, { schema, mode: "default" });

  const r = await runSeed(db, { root: process.cwd(), force: process.argv.includes("--force") });

  const [{ count }] = (await conn.query("SELECT COUNT(*) AS count FROM products"))[0] as [{ count: number }];
  const [{ imgs }] = (await conn.query("SELECT COUNT(*) AS imgs FROM product_images"))[0] as [{ imgs: number }];
  console.log(
    `Seed complete. inserted=${r.inserted} refreshed=${r.refreshed} skipped=${r.skipped} | products=${count} images=${imgs}`,
  );
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
