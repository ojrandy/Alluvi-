/**
 * Shared seed logic for `npm run db:seed` (scripts/seed.ts) and the production boot step
 * (scripts/boot-server.ts). Insert-only: never overwrites prices, stock, flags or settings.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { eq, inArray, sql } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import type { PaymentMethodConfig, ProductSpecs, ShippingOption } from "../../src/db/schema";
import { defaultTemplate, PAYMENT_METHODS } from "../../src/lib/payment-methods";

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

function defaultSettings(): Record<string, unknown> {
  return {
    // ADR-021: every catalogue method enabled, with a details template the admin completes in
    // /admin/settings (the [[ … ]] parts). Sending is blocked while any [[ … ]] remains.
    payment_methods: PAYMENT_METHODS.map((m) => ({ key: m.key, enabled: true, template: defaultTemplate(m.key) })) satisfies PaymentMethodConfig[],
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
    notify_email: process.env.ORDER_NOTIFY_EMAIL ?? "info@alluvihealthcare.co",
    settings_needs_review: true,
  };
}

export type SeedOptions = {
  /** Folder holding content/ and public/ (the project root, or the deployed app root). */
  root: string;
  /** Refresh catalogue copy/specs/images of existing products (never price, stock or active flag). */
  force?: boolean;
  /**
   * Insert products only when the products table is empty (production boot). Without it, a product
   * the admin deleted would be re-created from content/ on every deploy.
   */
  productsOnlyIfEmpty?: boolean;
};

export type SeedResult = { inserted: number; refreshed: number; skipped: number; settingsAdded: string[] };

export async function runSeed(db: MySql2Database<typeof schema>, opts: SeedOptions): Promise<SeedResult> {
  const items = JSON.parse(
    await readFile(path.join(opts.root, "content", "products.json"), "utf8"),
  ) as ProductContent[];
  const slugByName = new Map(items.map((p) => [p.name, p.slug]));

  let seedProducts = true;
  if (opts.productsOnlyIfEmpty) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.products);
    seedProducts = Number(n) === 0;
  }

  if (seedProducts) {
    // Fail loudly if an image referenced by content is missing from public/
    const missing = items.flatMap((p) => p.images).filter((i) => !existsSync(path.join(opts.root, "public", i.url)));
    if (missing.length) throw new Error(`Missing image files:\n${missing.map((m) => m.url).join("\n")}`);
  }

  const existing = seedProducts
    ? await db
        .select({ id: schema.products.id, slug: schema.products.slug })
        .from(schema.products)
        .where(inArray(schema.products.slug, items.map((p) => p.slug)))
    : [];
  const existingBySlug = new Map(existing.map((e) => [e.slug, e.id]));

  let inserted = 0;
  let refreshed = 0;
  const settingsAdded: string[] = [];

  await db.transaction(async (tx) => {
    for (const p of seedProducts ? items : []) {
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
      } else if (opts.force) {
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
    for (const [key, value] of Object.entries(defaultSettings())) {
      if (!existingKeys.has(key)) {
        await tx.insert(schema.settings).values({ key, value });
        settingsAdded.push(key);
      }
    }
  });

  return { inserted, refreshed, skipped: seedProducts ? items.length - inserted - refreshed : items.length, settingsAdded };
}
