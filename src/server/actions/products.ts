"use server";

import { and, asc, count, eq, inArray, ne, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import type { ProductSpecs } from "@/db/schema";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { productFormSchema, SLUG_PATTERN, type ProductFormOutput } from "@/lib/validators/admin-products";
import { requireAdmin } from "../auth";
import { dbErrorCode, isDuplicateKey } from "../db-errors";
import { imageStorage } from "../storage";

/**
 * Admin catalogue mutations (D2-4). Every action: Zod-validate → requireAdmin() → act (row locked
 * in a transaction) → expire the storefront cache → refresh the admin view.
 *
 * Cache: `updateTag` (not `revalidateTag(…, "max")`) so the very next storefront request reads the
 * new price/stock instead of one stale-while-revalidate hit (D2-4 acceptance: "editing a price
 * updates the storefront immediately"). Tags: `products` (every list) + `product:<slug>` (detail),
 * for the old slug too when it changes.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type SaveProductResult = ActionResult<{
  id: string;
  slug: string;
  message: string;
  /** Stock in the database after the save (may differ from the form if orders came in meanwhile). */
  stock: number;
  /** Set when the slug of an existing product changed: the old URL now 404s unless redirected. */
  redirectSuggestion?: { from: string; to: string };
}>;

export type ProductActionResult = ActionResult<{ message: string }>;

const productId = z.uuid("Unknown product");

const saveInput = z.object({
  id: productId.optional(),
  /** Stock as loaded into the form; stock is only written when the admin actually changed it. */
  loadedStock: z.number().int().min(0).optional(),
  values: z.unknown(),
});

class Rejected extends Error {}

function failure(err: unknown, what: string): { ok: false; error: string } {
  if (err instanceof Rejected) return { ok: false, error: err.message };
  console.error(`[admin-products] ${what} failed: ${dbErrorCode(err)}`);
  return { ok: false, error: "Something went wrong. Nothing was changed; please try again." };
}

function expireStorefront(...slugs: (string | null | undefined)[]) {
  updateTag("products");
  for (const s of new Set(slugs)) if (s) updateTag(`product:${s}`);
}

function toSpecs(v: ProductFormOutput["specs"]): ProductSpecs {
  const specs: ProductSpecs = {
    batchNumber: v.batchNumber,
    fillVolume: v.fillVolume,
    purity: v.purity,
    dateTested: v.dateTested,
    compounds: v.compounds,
    packageContents: v.packageContents.map((p) => p.value),
    labReports: v.labReports,
    disclaimer: v.disclaimer,
    safetyNote: v.safetyNote,
    relatedSlugs: v.relatedSlugs,
  };
  // Keep the JSON tidy: drop empty values (the storefront treats missing and empty the same).
  for (const [k, val] of Object.entries(specs)) {
    if (val === null || (Array.isArray(val) && val.length === 0)) delete specs[k as keyof ProductSpecs];
  }
  return specs;
}

async function replaceImages(tx: Tx, id: string, images: ProductFormOutput["images"]) {
  await tx.delete(schema.productImages).where(eq(schema.productImages.productId, id));
  if (images.length) {
    await tx.insert(schema.productImages).values(images.map((img, i) => ({ productId: id, url: img.url, alt: img.alt, sortOrder: i })));
  }
}

/** Deletes uploaded files no product references any more. Runs after the response (best effort). */
function removeOrphanUploads(urls: string[]) {
  const owned = [...new Set(urls)].filter((u) => imageStorage.owns(u));
  if (!owned.length) return;
  after(async () => {
    const still = await db
      .select({ url: schema.productImages.url })
      .from(schema.productImages)
      .where(inArray(schema.productImages.url, owned));
    const keep = new Set(still.map((r) => r.url));
    for (const url of owned) {
      if (keep.has(url)) continue;
      await imageStorage.remove(url).catch((e) => console.error(`[admin-products] remove upload failed: ${(e as NodeJS.ErrnoException).code}`));
    }
  });
}

// ---------- create / update ----------

export async function saveProduct(input: { id?: string; loadedStock?: number; values: unknown }): Promise<SaveProductResult> {
  const envelope = saveInput.safeParse(input);
  if (!envelope.success) return { ok: false, error: "This form is out of date. Reload the page and try again." };
  const parsed = productFormSchema.safeParse(envelope.data.values);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: firstFieldErrors(parsed.error.issues) };
  }
  await requireAdmin();

  const v = parsed.data;
  const { id, loadedStock } = envelope.data;
  const row = {
    slug: v.slug,
    name: v.name,
    shortDescription: v.shortDescription,
    description: v.description,
    pricePence: v.price!,
    compareAtPence: v.compareAt,
    category: v.category,
    badge: v.badge,
    labReportUrl: v.labReportUrl,
    specs: toSpecs(v.specs),
    isActive: v.isActive,
  };
  const slugTaken = { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another product already uses this slug" } };

  try {
    if (!id) {
      const created = await db.transaction(async (tx) => {
        const [taken] = await tx.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, v.slug)).limit(1);
        if (taken) return null;
        // New products go to the end of the shop grid.
        const [{ max }] = await tx
          .select({ max: sql<number | null>`MAX(${schema.products.sortOrder})`.mapWith((x) => (x == null ? null : Number(x))) })
          .from(schema.products);
        const newId = crypto.randomUUID();
        await tx.insert(schema.products).values({ id: newId, ...row, stock: v.stock, sortOrder: (max ?? 0) + 10 });
        await replaceImages(tx, newId, v.images);
        return newId;
      });
      if (!created) return slugTaken;
      expireStorefront(v.slug);
      refresh();
      return { ok: true, data: { id: created, slug: v.slug, stock: v.stock, message: `“${v.name}” created.${v.isActive ? "" : " It is hidden from the shop until you make it active."}` } };
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(schema.products).where(eq(schema.products.id, id)).for("update").limit(1);
      if (!current) throw new Rejected("This product no longer exists.");
      if (current.slug !== v.slug) {
        const [taken] = await tx
          .select({ id: schema.products.id })
          .from(schema.products)
          .where(and(eq(schema.products.slug, v.slug), ne(schema.products.id, id)))
          .limit(1);
        if (taken) return null;
      }
      const oldImages = await tx.select({ url: schema.productImages.url }).from(schema.productImages).where(eq(schema.productImages.productId, id));

      // Stock: checkout decrements it concurrently. Only write it when the admin changed the number,
      // otherwise saving an unrelated edit would undo sales made since the form was opened.
      const stockChanged = loadedStock === undefined || v.stock !== loadedStock;
      await tx
        .update(schema.products)
        .set({ ...row, ...(stockChanged ? { stock: v.stock } : {}) })
        .where(eq(schema.products.id, id));
      await replaceImages(tx, id, v.images);

      return {
        oldSlug: current.slug,
        removedImages: oldImages.map((i) => i.url).filter((u) => !v.images.some((n) => n.url === u)),
        stockMovedMeanwhile: stockChanged && loadedStock !== undefined && current.stock !== loadedStock ? current.stock : null,
        stock: stockChanged ? v.stock : current.stock,
      };
    });
    if (!result) return slugTaken;

    expireStorefront(result.oldSlug, v.slug);
    removeOrphanUploads(result.removedImages);
    refresh();

    const notes = [`“${v.name}” saved. The shop shows the changes now.`];
    if (result.stockMovedMeanwhile !== null) {
      notes.push(`Stock had changed to ${result.stockMovedMeanwhile} since you opened this page (orders); it is now ${v.stock} as you entered.`);
    }
    let redirectSuggestion: { from: string; to: string } | undefined;
    if (result.oldSlug !== v.slug) {
      redirectSuggestion = { from: `/product/${result.oldSlug}`, to: `/product/${v.slug}` };
      // Logged so it can be collected from the server log and added to next.config.ts redirects.
      console.info(`[admin-products] slug changed: add redirect ${redirectSuggestion.from} → ${redirectSuggestion.to}`);
    }
    return { ok: true, data: { id, slug: v.slug, stock: result.stock, message: notes.join(" "), redirectSuggestion } };
  } catch (err) {
    if (isDuplicateKey(err, "products_slug_uq")) return slugTaken;
    return failure(err, "saveProduct");
  }
}

// ---------- slug check (form blur) ----------

export async function checkProductSlug(slug: string, excludeId?: string): Promise<{ available: boolean }> {
  const s = z.string().trim().toLowerCase().regex(SLUG_PATTERN).max(120).safeParse(slug);
  const ex = productId.optional().safeParse(excludeId);
  await requireAdmin();
  if (!s.success || !ex.success) return { available: true }; // the form shows the format error itself
  const [hit] = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(ex.data ? and(eq(schema.products.slug, s.data), ne(schema.products.id, ex.data)) : eq(schema.products.slug, s.data))
    .limit(1);
  return { available: !hit };
}

// ---------- active toggle ----------

const activeSchema = z.object({ id: productId, isActive: z.boolean() });

export async function setProductActive(input: { id: string; isActive: boolean }): Promise<ProductActionResult> {
  const parsed = activeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown product." };
  await requireAdmin();
  const { id, isActive } = parsed.data;
  try {
    const [p] = await db.select({ slug: schema.products.slug, name: schema.products.name }).from(schema.products).where(eq(schema.products.id, id)).limit(1);
    if (!p) return { ok: false, error: "This product no longer exists." };
    await db.update(schema.products).set({ isActive }).where(eq(schema.products.id, id));
    expireStorefront(p.slug);
    refresh();
    return { ok: true, data: { message: isActive ? `“${p.name}” is now visible in the shop.` : `“${p.name}” is hidden from the shop.` } };
  } catch (err) {
    return failure(err, "setProductActive");
  }
}

// ---------- sort order ----------

const moveSchema = z.object({ id: productId, direction: z.enum(["up", "down"]) });

/**
 * Swaps a product with its neighbour in the shop order. Renumbers everything to 10, 20, 30… first,
 * so equal or gappy sort values (seed data, manual DB edits) still move predictably.
 */
export async function moveProduct(input: { id: string; direction: "up" | "down" }): Promise<ProductActionResult> {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown product." };
  await requireAdmin();
  const { id, direction } = parsed.data;
  try {
    const moved = await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: schema.products.id, sortOrder: schema.products.sortOrder })
        .from(schema.products)
        .orderBy(asc(schema.products.sortOrder), asc(schema.products.name))
        .for("update");
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) throw new Rejected("This product no longer exists.");
      const j = direction === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= rows.length) return false;
      [rows[i], rows[j]] = [rows[j], rows[i]];
      for (const [n, r] of rows.entries()) {
        const next = (n + 1) * 10;
        if (r.sortOrder !== next) await tx.update(schema.products).set({ sortOrder: next }).where(eq(schema.products.id, r.id));
      }
      return true;
    });
    if (moved) {
      expireStorefront();
      refresh();
    }
    return { ok: true, data: { message: moved ? "Order updated." : "Already at the " + (direction === "up" ? "top." : "bottom.") } };
  } catch (err) {
    return failure(err, "moveProduct");
  }
}

// ---------- delete / archive ----------

export type DeleteProductResult = ActionResult<{ message: string; outcome: "deleted" | "archived" }>;

/**
 * Deletes a product that was never ordered. A product with orders is ARCHIVED instead
 * (is_active = false): order history keeps its link and the row can be re-activated later
 * (DATA_MODEL: never hard-delete anything an order references).
 */
export async function deleteProduct(input: { id: string }): Promise<DeleteProductResult> {
  const parsed = z.object({ id: productId }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown product." };
  await requireAdmin();
  const { id } = parsed.data;
  try {
    const result = await db.transaction(async (tx) => {
      const [p] = await tx.select().from(schema.products).where(eq(schema.products.id, id)).for("update").limit(1);
      if (!p) throw new Rejected("This product no longer exists.");
      const [{ n }] = await tx.select({ n: count() }).from(schema.orderItems).where(eq(schema.orderItems.productId, id));
      if (n > 0) {
        if (p.isActive) await tx.update(schema.products).set({ isActive: false }).where(eq(schema.products.id, id));
        return { outcome: "archived" as const, p, n, images: [] as string[] };
      }
      const images = await tx.select({ url: schema.productImages.url }).from(schema.productImages).where(eq(schema.productImages.productId, id));
      await tx.delete(schema.products).where(eq(schema.products.id, id)); // images cascade
      return { outcome: "deleted" as const, p, n, images: images.map((i) => i.url) };
    });

    expireStorefront(result.p.slug);
    removeOrphanUploads(result.images);
    refresh();
    const message =
      result.outcome === "archived"
        ? `“${result.p.name}” is in ${result.n} ${result.n === 1 ? "order" : "orders"}, so it was archived (hidden from the shop) instead of deleted.`
        : `“${result.p.name}” was deleted.`;
    return { ok: true, data: { message, outcome: result.outcome } };
  } catch (err) {
    return failure(err, "deleteProduct");
  }
}
