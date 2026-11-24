import "server-only";
import { inArray } from "drizzle-orm";
import { db, schema, type DbExecutor } from "@/db";
import type { PaymentMethodConfig, ShippingOption } from "@/db/schema";
import { resolvePaymentMethods, type CheckoutPaymentMethod, type ResolvedPaymentMethod } from "@/lib/payment-methods";

/** `enabled: false` (set from /admin/settings) keeps the row so a re-seed cannot bring the promo back. */
export type FreeShippingPromo = { startsAt: string; endsAt: string; label: string; enabled?: boolean };

export type StoreSettings = {
  shippingOptions: ShippingOption[];
  /** Every catalogue method with the admin's enabled flag + details template (ADR-021). Server-only data. */
  paymentMethods: ResolvedPaymentMethod[];
  freeShippingPromo: FreeShippingPromo | null;
  notifyEmail: string | null;
};

const KEYS = ["shipping_options", "payment_methods", "free_shipping_promo", "notify_email"] as const;

/**
 * Store settings (seeded, editable in /admin/settings). Read per request on the money path, not
 * cached: checkout must always price with the current shipping options and promo.
 */
export async function getStoreSettings(executor: DbExecutor = db): Promise<StoreSettings> {
  const rows = await executor
    .select({ key: schema.settings.key, value: schema.settings.value })
    .from(schema.settings)
    .where(inArray(schema.settings.key, [...KEYS]));
  const map = new Map(rows.map((r) => [r.key, r.value as unknown]));

  const shipping = map.get("shipping_options");
  return {
    shippingOptions: Array.isArray(shipping) ? (shipping as ShippingOption[]) : [],
    paymentMethods: resolvePaymentMethods(Array.isArray(map.get("payment_methods")) ? (map.get("payment_methods") as PaymentMethodConfig[]) : null),
    freeShippingPromo: (map.get("free_shipping_promo") as FreeShippingPromo | undefined) ?? null,
    notifyEmail: typeof map.get("notify_email") === "string" ? (map.get("notify_email") as string) : null,
  };
}

/** ADR-012: free shipping while now is within startsAt..endsAt. */
export function isPromoActive(promo: FreeShippingPromo | null, now = new Date()): boolean {
  if (!promo || promo.enabled === false) return false;
  const start = Date.parse(promo.startsAt);
  const end = Date.parse(promo.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

/** Enabled methods for the checkout dropdown: names only, never the details templates. */
export function checkoutPaymentMethods(s: StoreSettings): CheckoutPaymentMethod[] {
  return s.paymentMethods.filter((m) => m.enabled).map(({ key, label, group, hint }) => ({ key, label, group, hint }));
}
