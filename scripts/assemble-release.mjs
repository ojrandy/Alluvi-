/**
 * Turns `next build` output (output: "standalone") into the folder deployed to cPanel's
 * Application root (DEPLOYMENT.md). Run after `npm run build`:
 *
 *   .next/standalone/
 *     server.js        boot wrapper (scripts/boot-server.ts): migrate + seed, then start Next
 *     next-server.js   Next's standalone server
 *     .next/static     client assets      public/   static files
 *     drizzle/         SQL migrations     content/  seed data (products.json)
 */
import { cpSync, existsSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const out = path.join(root, ".next", "standalone");
if (!existsSync(path.join(out, "server.js")) && !existsSync(path.join(out, "next-server.js"))) {
  throw new Error('No .next/standalone build found. Run `npm run build` with output: "standalone" first.');
}

const copy = (from, to) => {
  rmSync(path.join(out, to), { recursive: true, force: true });
  cpSync(path.join(root, from), path.join(out, to), { recursive: true });
};
copy(".next/static", ".next/static");
copy("public", "public");
copy("drizzle", "drizzle");
copy("content", "content");

// Never ship local env files: production env lives in cPanel.
for (const f of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  rmSync(path.join(out, f), { force: true });
}

if (existsSync(path.join(out, "server.js"))) {
  rmSync(path.join(out, "next-server.js"), { force: true });
  renameSync(path.join(out, "server.js"), path.join(out, "next-server.js"));
}

await build({
  entryPoints: [path.join(root, "scripts", "boot-server.ts")],
  outfile: path.join(out, "server.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  tsconfig: path.join(root, "tsconfig.json"),
  logLevel: "warning",
  legalComments: "none",
});

console.log(`Release assembled in ${path.relative(root, out)}`);
