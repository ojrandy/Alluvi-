import "server-only";
import { inArray } from "drizzle-orm";
import { db, schema, type DbExecutor } from "@/db";
import type { BankDetails, ShippingOption } from "@/db/schema";

/** `enabled: false` (set from /admin/settings) keeps the row so a re-seed cannot bring the promo back. */
export type FreeShippingPromo = { startsAt: string; endsAt: string; label: string; enabled?: boolean };

export type StoreSettings = {
  shippingOptions: ShippingOption[];
  bankDetails: BankDetails | null;
  freeShippingPromo: FreeShippingPromo | null;
  notifyEmail: string | null;
};

const KEYS = ["shipping_options", "bank_details", "free_shipping_promo", "notify_email"] as const;

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
    bankDetails: (map.get("bank_details") as BankDetails | undefined) ?? null,
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

/** Seeded placeholder bank details must never be shown to customers as real payment details. */
export function usableBankDetails(b: BankDetails | null): BankDetails | null {
  if (!b) return null;
  const placeholder = /TO BE CONFIGURED/i.test(`${b.accountName} ${b.bankName}`) || /^0+$/.test(b.accountNumber.replace(/\D/g, ""));
  return placeholder ? null : b;
}
