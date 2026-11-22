import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ProductSpecs } from "@/db/schema";
import { contentCatalogue } from "./catalogue-content";

export type ProductImageRef = { url: string; alt: string };

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  pricePence: number;
  compareAtPence: number | null;
  category: string | null;
  badge: string | null;
  image: ProductImageRef | null;
  stock: number;
  inStock: boolean;
};

export type ProductDetail = ProductCard & {
  shortDescription: string | null;
  description: string | null;
  labReportUrl: string | null;
  specs: ProductSpecs;
  images: ProductImageRef[];
};

/**
 * Catalogue reads. Cached and tagged `products` (+ `product:<slug>` for detail); placeOrder and
 * admin mutations call `revalidateTag('products')`. Stock shown here can lag by one revalidation,
 * which is fine: placeOrder re-checks stock inside the transaction.
 *
 * Without DATABASE_URL (the GitHub Actions build has no database, see DEPLOYMENT.md) these read
 * the recovered catalogue in content/products.json, the same source the seed uses, so prerendered
 * pages are correct and the first revalidation on the server swaps in live DB data.
 */
export async function getProductCards(): Promise<ProductCard[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const all = await loadActive();
  return all.map(toCard);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag("products", `product:${slug}`);
  cacheLife("hours");

  const all = await loadActive();
  return all.find((p) => p.slug === slug) ?? null;
}

/** Products for "Continue your research", in the order given, skipping inactive ones. */
export async function getProductsBySlugs(slugs: string[]): Promise<ProductCard[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const all = await loadActive();
  return slugs.map((s) => all.find((p) => p.slug === s)).filter((p): p is ProductDetail => !!p).map(toCard);
}

export async function getActiveSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  return (await loadActive()).map((p) => p.slug);
}

function toCard(p: ProductDetail): ProductCard {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    pricePence: p.pricePence,
    compareAtPence: p.compareAtPence,
    category: p.category,
    badge: p.badge,
    image: p.images[0] ?? null,
    stock: p.stock,
    inStock: p.inStock,
  };
}

/** The catalogue is 9 products, so one load serves every read; each caller caches its own result. */
async function loadActive(): Promise<ProductDetail[]> {
  if (!process.env.DATABASE_URL) return contentCatalogue();

  // Imported lazily: src/db creates the MySQL pool at module load and throws without DATABASE_URL.
  const { db, schema } = await import("@/db");
  const { asc, eq, inArray } = await import("drizzle-orm");
  const { products, productImages } = schema;

  // Two flat queries: Drizzle's nested `with: { limit }` emits a correlated derived table that
  // MariaDB (Namecheap) rejects ("Unknown column 'products.id'").
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.sortOrder), asc(products.name));
  if (rows.length === 0) return [];

  const images = await db
    .select({ productId: productImages.productId, url: productImages.url, alt: productImages.alt })
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.id)))
    .orderBy(asc(productImages.sortOrder));

  const byProduct = new Map<string, ProductImageRef[]>();
  for (const img of images) {
    const list = byProduct.get(img.productId) ?? [];
    list.push({ url: img.url, alt: img.alt });
    byProduct.set(img.productId, list);
  }

  return rows.map((p) => {
    const imgs = byProduct.get(p.id) ?? [];
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      pricePence: p.pricePence,
      compareAtPence: p.compareAtPence,
      category: p.category,
      badge: p.badge,
      image: imgs[0] ?? null,
      images: imgs,
      stock: p.stock,
      inStock: p.stock > 0,
      shortDescription: p.shortDescription,
      description: p.description,
      labReportUrl: p.labReportUrl,
      specs: p.specs ?? {},
    };
  });
}
