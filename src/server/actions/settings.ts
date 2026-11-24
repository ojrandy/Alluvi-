"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import type { PaymentMethodConfig, ShippingOption } from "@/db/schema";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { addDays, londonMidnight } from "@/lib/london-day";
import { notifyFormSchema, paymentMethodsFormSchema, promoFormSchema, shippingFormSchema } from "@/lib/validators/admin-settings";
import { requireAdmin } from "../auth";
import { dbErrorCode } from "../db-errors";
import { getStoreSettings, type FreeShippingPromo } from "../settings";

/**
 * Admin settings (D2-5). Zod-validate → requireAdmin() → upsert one `settings` row → expire.
 * Checkout, pricing, confirmation and emails read settings per request (src/server/settings.ts),
 * so the next order already uses the new values; `updateTag("settings")` covers any cached reader.
 */

export type SettingsResult = ActionResult<{ message: string }>;

async function save(key: string, value: unknown, what: string): Promise<SettingsResult> {
  try {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  } catch (err) {
    console.error(`[admin-settings] save ${key} failed: ${dbErrorCode(err)}`);
    return { ok: false, error: "Something went wrong. Nothing was changed; please try again." };
  }
  updateTag("settings");
  refresh();
  return { ok: true, data: { message: `${what} saved.` } };
}

function invalid(error: z.ZodError): SettingsResult {
  return { ok: false, error: "Check the highlighted fields.", fieldErrors: firstFieldErrors(error.issues) };
}

/** ADR-021: which methods checkout offers + the details template the admin sends for each. */
export async function savePaymentMethods(input: unknown): Promise<SettingsResult> {
  const parsed = paymentMethodsFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  const value: PaymentMethodConfig[] = parsed.data.methods.map((m) => ({ key: m.key, enabled: m.enabled, template: m.template }));
  return save("payment_methods", value, "Payment methods");
}

export async function saveShippingOptions(input: unknown): Promise<SettingsResult> {
  const parsed = shippingFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  const value: ShippingOption[] = parsed.data.options.map((o) => ({
    key: o.key,
    label: o.label,
    ...(o.description ? { description: o.description } : {}),
    pricePence: o.price ?? 0,
    freeOverPence: o.freeOver,
  }));
  return save("shipping_options", value, "Shipping options");
}

export async function saveFreeShippingPromo(input: unknown): Promise<SettingsResult> {
  const parsed = promoFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  const p = parsed.data;
  if (!p.enabled) {
    // Keep the row (disabled) rather than delete it: `db:seed` inserts missing keys.
    const prev = (await getStoreSettings().catch(() => null))?.freeShippingPromo;
    const value: FreeShippingPromo = { label: prev?.label ?? "Free shipping", startsAt: prev?.startsAt ?? "", endsAt: prev?.endsAt ?? "", enabled: false };
    const res = await save("free_shipping_promo", value, "Free-shipping promotion");
    return res.ok ? { ok: true, data: { message: "Free-shipping promotion turned off." } } : res;
  }
  // Whole London days: from 00:00 on the start day to 23:59:59.999 on the end day.
  const value: FreeShippingPromo = {
    label: p.label,
    startsAt: londonMidnight(p.startDay).toISOString(),
    endsAt: new Date(londonMidnight(addDays(p.endDay, 1)).getTime() - 1).toISOString(),
  };
  return save("free_shipping_promo", value, "Free-shipping promotion");
}

export async function saveNotifyEmail(input: unknown): Promise<SettingsResult> {
  const parsed = notifyFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  return save("notify_email", parsed.data.email, "Notification email");
}
