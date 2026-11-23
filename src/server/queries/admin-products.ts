import "server-only";
import { and, asc, count, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Product, ProductSpecs } from "@/db/schema";
import { penceToPounds, type ProductFormInput } from "@/lib/validators/admin-products";

/**
 * Admin catalogue reads (D2-4). Never cached: the admin must always see what is in the database,
 * including inactive (archived) products the storefront hides.
 */

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  pricePence: number;
  compareAtPence: number | null;
  stock: number;
  category: string | null;
  isActive: boolean;
  sortOrder: number;
  image: { url: string; alt: string } | null;
  orderCount: number;
};

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const { products, productImages, orderItems } = schema;
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.name));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  // Flat queries (no correlated subqueries): MariaDB on Namecheap, see queries/products.ts.
  const [images, ordered] = await Promise.all([
    db
      .select({ productId: productImages.productId, url: productImages.url, alt: productImages.alt })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select({ productId: orderItems.productId, n: count() })
      .from(orderItems)
      .where(and(isNotNull(orderItems.productId), inArray(orderItems.productId, ids)))
      .groupBy(orderItems.productId),
  ]);

  const firstImage = new Map<string, { url: string; alt: string }>();
  for (const img of images) if (!firstImage.has(img.productId)) firstImage.set(img.productId, { url: img.url, alt: img.alt });
  const orderCount = new Map(ordered.map((o) => [o.productId!, o.n]));

  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    pricePence: p.pricePence,
    compareAtPence: p.compareAtPence,
    stock: p.stock,
    category: p.category,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    image: firstImage.get(p.id) ?? null,
    orderCount: orderCount.get(p.id) ?? 0,
  }));
}

export type AdminProductDetail = Product & {
  specs: ProductSpecs;
  images: { url: string; alt: string }[];
  orderCount: number;
};

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const { products, productImages, orderItems } = schema;
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) return null;
  const [images, [ordered]] = await Promise.all([
    db
      .select({ url: productImages.url, alt: productImages.alt })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder)),
    db.select({ n: count() }).from(orderItems).where(eq(orderItems.productId, id)),
  ]);
  return { ...p, specs: p.specs ?? {}, images, orderCount: ordered?.n ?? 0 };
}

/** DB row → form values (pence → pounds strings, nulls → ""). */
export function toProductFormInput(p: AdminProductDetail): ProductFormInput {
  const s = p.specs;
  return {
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    price: penceToPounds(p.pricePence),
    compareAt: penceToPounds(p.compareAtPence),
    stock: String(p.stock),
    category: p.category ?? "",
    badge: p.badge ?? "",
    labReportUrl: p.labReportUrl ?? "",
    isActive: p.isActive,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    specs: {
      batchNumber: s.batchNumber ?? "",
      fillVolume: s.fillVolume ?? "",
      purity: s.purity ?? "",
      dateTested: s.dateTested ?? "",
      compounds: (s.compounds ?? []).map((c) => ({ compound: c.compound, concentration: c.concentration ?? "", verifiedContent: c.verifiedContent ?? "" })),
      packageContents: (s.packageContents ?? []).map((value) => ({ value })),
      labReports: (s.labReports ?? []).map((r) => ({ label: r.label, url: r.url })),
      disclaimer: s.disclaimer ?? "",
      safetyNote: s.safetyNote ?? "",
      relatedSlugs: s.relatedSlugs ?? [],
    },
  };
}

/** Options for the "related products" picker and the category suggestions. */
export async function getProductPickerData(excludeId?: string) {
  const { products } = schema;
  const rows = await db
    .select({ slug: products.slug, name: products.name, isActive: products.isActive, category: products.category })
    .from(products)
    .where(excludeId ? ne(products.id, excludeId) : undefined)
    .orderBy(asc(products.sortOrder), asc(products.name));
  const categories = [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))].sort();
  return { products: rows.map(({ slug, name, isActive }) => ({ slug, name, isActive })), categories };
}
