/**
 * Production entry point (cPanel "Application startup file": server.js). Bundled by
 * scripts/assemble-release.mjs into .next/standalone/server.js; Next's own standalone server is
 * renamed next-server.js and started at the end.
 *
 * Why migrate here and not over SSH in CI: cPanel's Node app env vars (DATABASE_URL …) only reach
 * the Passenger process, not an SSH shell. Running at boot also means a restart always lands on
 * the schema the code expects. A MySQL named lock keeps two starting processes from racing.
 */
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as schema from "../src/db/schema";
import { runSeed } from "./lib/seed-core";

const ROOT = __dirname;
const LOCK = "alluvi_boot_migrate";

async function prepareDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set: add it in cPanel → Setup Node.js App → Environment variables");
  const conn = await mysql.createConnection({ uri: url, timezone: "Z", charset: "utf8mb4" });
  try {
    const [rows] = await conn.query("SELECT GET_LOCK(?, 120) AS got", [LOCK]);
    if ((rows as { got: number | null }[])[0]?.got !== 1) throw new Error("Timed out waiting for the migration lock");
    try {
      const db = drizzle(conn, { schema, mode: "default" });
      await migrate(db, { migrationsFolder: path.join(ROOT, "drizzle") });
      const r = await runSeed(db, { root: ROOT, productsOnlyIfEmpty: true });
      console.log(
        `[boot] migrations applied; seed inserted=${r.inserted} products` +
          (r.settingsAdded.length ? `, settings added: ${r.settingsAdded.join(", ")}` : ""),
      );
    } finally {
      await conn.query("SELECT RELEASE_LOCK(?)", [LOCK]);
    }
  } finally {
    await conn.end();
  }
}

prepareDatabase()
  .then(() => {
    // Non-literal path so esbuild leaves Next's server out of the bundle.
    const nextServer = path.join(ROOT, "next-server.js");
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime load of a sibling CJS file, not a module import
    require(nextServer);
  })
  .catch((err) => {
    // Fail closed: running new code against an old schema would break checkout in subtle ways.
    console.error("[boot] database preparation failed; not starting the app.", err);
    process.exit(1);
  });
