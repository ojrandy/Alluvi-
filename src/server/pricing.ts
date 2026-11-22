import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema, type DbExecutor } from "@/db";
import type { ShippingOption } from "@/db/schema";
import { MAX_LINE_QTY, UK_ONLY_SHIPPING_PREFIX } from "@/lib/constants";
import type { CheckoutItem } from "@/lib/validators/checkout";
import { getStoreSettings, isPromoActive } from "./settings";

/**
 * THE ONLY place order money is computed (CONVENTIONS). Integer pence throughout. Client prices
 * are never read: every unit price comes from the products table.
 */

export type PricedLine = {
  productId: string;
  slug: string;
  name: string;
  unitPricePence: number;
  quantity: number;
  lineTotalPence: number;
  stock: number;
};

export type LineIssue = {
  productId: string;
  name: string | null;
  reason: "unavailable" | "insufficient_stock";
  available: number;
};

export type Totals = {
  lines: PricedLine[];
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  shippingOption: ShippingOption;
  freeShippingReason: "promo" | "threshold" | null;
};

export type TotalsResult =
  | { ok: true; totals: Totals }
  | { ok: false; error: string; issues: LineIssue[]; field?: "shippingMethod" };


type Options = {
  /** Destination country; UK-only shipping options are rejected for other countries. */
  country?: string;
  /** Inside the order transaction: lock product rows so stock cannot change until commit. */
  lockRows?: boolean;
  executor?: DbExecutor;
  now?: Date;
};

/** Merge duplicate product ids (a tampered payload could repeat one to dodge the per-line cap). */
export function mergeItems(items: CheckoutItem[]): CheckoutItem[] {
  const merged = new Map<string, number>();
  for (const it of items) merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function computeTotals(
  rawItems: CheckoutItem[],
  shippingMethod: string,
  opts: Options = {},
): Promise<TotalsResult> {
  const ex = opts.executor ?? db;
  const items = mergeItems(rawItems);
  if (items.length === 0) return { ok: false, error: "Your cart is empty.", issues: [] };

  const settings = await getStoreSettings(ex);
  const shippingOption = settings.shippingOptions.find((o) => o.key === shippingMethod);
  if (!shippingOption) {
    return { ok: false, error: "Choose a shipping option.", issues: [], field: "shippingMethod" };
  }
  if (opts.country && opts.country !== "GB" && shippingOption.key.startsWith(UK_ONLY_SHIPPING_PREFIX)) {
    return { ok: false, error: "This shipping option is only available for UK addresses.", issues: [], field: "shippingMethod" };
  }
  if (opts.country === "GB" && !shippingOption.key.startsWith(UK_ONLY_SHIPPING_PREFIX) && settings.shippingOptions.some((o) => o.key.startsWith(UK_ONLY_SHIPPING_PREFIX))) {
    return { ok: false, error: "Choose UK shipping for a UK address.", issues: [], field: "shippingMethod" };
  }

  const ids = items.map((i) => i.productId);
  const query = ex
    .select({
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      pricePence: schema.products.pricePence,
      stock: schema.products.stock,
    })
    .from(schema.products)
    .where(and(inArray(schema.products.id, ids), eq(schema.products.isActive, true)));
  const rows = opts.lockRows ? await query.for("update") : await query;
  const byId = new Map(rows.map((r) => [r.id, r]));

  const issues: LineIssue[] = [];
  const lines: PricedLine[] = [];
  for (const it of items) {
    const p = byId.get(it.productId);
    if (!p) {
      issues.push({ productId: it.productId, name: null, reason: "unavailable", available: 0 });
      continue;
    }
    if (it.quantity > MAX_LINE_QTY || it.quantity > p.stock) {
      issues.push({ productId: p.id, name: p.name, reason: "insufficient_stock", available: Math.min(p.stock, MAX_LINE_QTY) });
      continue;
    }
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      unitPricePence: p.pricePence,
      quantity: it.quantity,
      lineTotalPence: p.pricePence * it.quantity,
      stock: p.stock,
    });
  }

  if (issues.length) {
    const first = issues[0];
    const error =
      first.reason === "unavailable"
        ? "An item in your cart is no longer available. Please remove it to continue."
        : first.available > 0
          ? `Only ${first.available} of ${first.name} ${first.available === 1 ? "is" : "are"} available. Please reduce the quantity.`
          : `${first.name} is out of stock. Please remove it to continue.`;
    return { ok: false, error, issues };
  }

  const subtotalPence = lines.reduce((n, l) => n + l.lineTotalPence, 0);
  let shippingPence = Math.max(0, Math.round(shippingOption.pricePence));
  let freeShippingReason: Totals["freeShippingReason"] = null;
  if (isPromoActive(settings.freeShippingPromo, opts.now)) {
    shippingPence = 0;
    freeShippingReason = "promo";
  } else if (shippingOption.freeOverPence != null && subtotalPence >= shippingOption.freeOverPence) {
    shippingPence = 0;
    freeShippingReason = "threshold";
  }

  return {
    ok: true,
    totals: {
      lines,
      subtotalPence,
      shippingPence,
      totalPence: subtotalPence + shippingPence,
      shippingOption,
      freeShippingReason,
    },
  };
}
