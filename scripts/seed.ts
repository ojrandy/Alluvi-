/**
 * Seed the database from content/products.json + default settings.
 *
 *   npm run db:seed            insert anything missing; NEVER overwrites existing rows
 *   npm run db:seed -- --force also refresh catalogue copy/specs/images of existing products
 *                              (price, stock, active flag and settings are never touched)
 *
 * Safe to run repeatedly, including in production.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, inArray } from "drizzle-orm";
import * as schema from "../src/db/schema";
import type { BankDetails, ProductSpecs, ShippingOption } from "../src/db/schema";

loadEnv({ path: ".env.local", override: false });

const FORCE = process.argv.includes("--force");
// Real stock is unknown; seed 50–100 per product (client request). The admin sets true stock in the dashboard.
const placeholderStock = () => 50 + Math.floor(Math.random() * 51);
const FREE_SHIPPING_DAYS = 60;

type ProductContent = {
  slug: string;
  name: string;
  pricePence: number;
  shortDescription: string;
  description: string;
  category: string | null;
  badge: string | null;
  disclaimer: string | null;
  safetyNote: string | null;
  labReportUrl: string | null;
  specs: ProductSpecs;
  images: { url: string; alt: string }[];
  relatedNames: string[];
  sortOrder: number;
};

const DEFAULT_SETTINGS: Record<string, unknown> = {
  // Placeholders: the client must fill these in /admin/settings before launch (DEPLOYMENT checklist).
  bank_details: {
    accountName: "TO BE CONFIGURED",
    bankName: "TO BE CONFIGURED",
    sortCode: "00-00-00",
    accountNumber: "00000000",
    iban: null,
    instructions: "Use your order number as the payment reference. Orders are dispatched once payment has cleared.",
  } satisfies BankDetails,
  // Labels/descriptions follow the live shipping policy. Prices are placeholders (0) until the client confirms them.
  shipping_options: [
    {
      key: "uk_tracked",
      label: "UK tracked & signed for",
      description: "Typically delivered the next working day after dispatch.",
      pricePence: 0,
      freeOverPence: null,
    },
    {
      key: "international_tracked",
      label: "International tracked",
      description: "Usually 3–10 working days. Customs duties are the buyer's responsibility.",
      pricePence: 0,
      freeOverPence: null,
    },
  ] satisfies ShippingOption[],
  // Launch promotion: free shipping for every customer for 60 days from the first seed (= launch).
  // pricing.ts sets shipping to 0 while now is between startsAt and endsAt. Editable in /admin/settings.
  free_shipping_promo: {
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + FREE_SHIPPING_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    label: "Free shipping on every order for our first 60 days",
  },
  notify_email: process.env.ORDER_NOTIFY_EMAIL ?? "orders@alluvi.store",
  settings_needs_review: true,
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (.env.local)");
  const conn = await mysql.createConnection({ uri: url, timezone: "Z", charset: "utf8mb4" });
  const db = drizzle(conn, { schema, mode: "default" });

  const items = JSON.parse(
    await readFile(path.join(process.cwd(), "content", "products.json"), "utf8"),
  ) as ProductContent[];
  const slugByName = new Map(items.map((p) => [p.name, p.slug]));

  // Fail loudly if an image referenced by content is missing from public/
  const missing = items.flatMap((p) => p.images).filter((i) => !existsSync(path.join("public", i.url)));
  if (missing.length) throw new Error(`Missing image files:\n${missing.map((m) => m.url).join("\n")}`);

  const existing = await db
    .select({ id: schema.products.id, slug: schema.products.slug })
    .from(schema.products)
    .where(inArray(schema.products.slug, items.map((p) => p.slug)));
  const existingBySlug = new Map(existing.map((e) => [e.slug, e.id]));

  let inserted = 0;
  let refreshed = 0;

  await db.transaction(async (tx) => {
    for (const p of items) {
      const specs: ProductSpecs = {
        ...p.specs,
        disclaimer: p.disclaimer,
        safetyNote: p.safetyNote,
        relatedSlugs: p.relatedNames.map((n) => slugByName.get(n)).filter((s): s is string => !!s),
      };
      const copy = {
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        category: p.category,
        badge: p.badge,
        labReportUrl: p.labReportUrl,
        specs,
        sortOrder: p.sortOrder,
      };

      let productId = existingBySlug.get(p.slug);
      if (!productId) {
        productId = crypto.randomUUID();
        await tx.insert(schema.products).values({
          id: productId,
          slug: p.slug,
          pricePence: p.pricePence,
          stock: placeholderStock(),
          isActive: true,
          ...copy,
        });
        inserted++;
      } else if (FORCE) {
        await tx.update(schema.products).set(copy).where(eq(schema.products.id, productId));
        await tx.delete(schema.productImages).where(eq(schema.productImages.productId, productId));
        refreshed++;
      } else {
        continue; // exists and not forcing → leave untouched (including images)
      }

      if (p.images.length) {
        await tx.insert(schema.productImages).values(
          p.images.map((img, i) => ({ productId: productId!, url: img.url, alt: img.alt, sortOrder: i })),
        );
      }
    }

    // Settings: insert only if missing. Never overwrite what the admin configured.
    const existingKeys = new Set(
      (await tx.select({ key: schema.settings.key }).from(schema.settings)).map((s) => s.key),
    );
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (!existingKeys.has(key)) await tx.insert(schema.settings).values({ key, value });
    }
  });

  const [{ count }] = (await conn.query("SELECT COUNT(*) AS count FROM products"))[0] as [{ count: number }];
  const [{ imgs }] = (await conn.query("SELECT COUNT(*) AS imgs FROM product_images"))[0] as [{ imgs: number }];
  console.log(
    `Seed complete. inserted=${inserted} refreshed=${refreshed} skipped=${items.length - inserted - refreshed} | products=${count} images=${imgs}`,
  );
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
