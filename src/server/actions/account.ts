"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import type { Address } from "@/db/schema";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { normalizeUkPostcode } from "@/lib/validators/checkout";
import { accountDetailsSchema } from "@/lib/validators/account";
import { requireCustomer } from "../customer-auth";
import { dbErrorCode } from "../db-errors";

const FIELDS = ["firstName", "lastName", "phone", "line1", "line2", "city", "postcode", "country"] as const;

export type DetailsResult = ActionResult<{ saved: true }, { values: Partial<Record<(typeof FIELDS)[number], string>> }>;

/** Name, phone and default delivery address (used to prefill checkout). */
export async function updateAccountDetails(_prev: unknown, fd: FormData): Promise<DetailsResult> {
  const customer = await requireCustomer("/account/details");

  const raw = Object.fromEntries(FIELDS.map((k) => [k, String(fd.get(k) ?? "")])) as Record<(typeof FIELDS)[number], string>;
  const values = Object.fromEntries(FIELDS.map((k) => [k, raw[k].slice(0, 255)]));
  const parsed = accountDetailsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: firstFieldErrors(parsed.error.issues), values };
  const v = parsed.data;

  const defaultAddress: Address | null = v.line1
    ? {
        line1: v.line1,
        line2: v.line2,
        city: v.city,
        postcode: v.country === "GB" ? normalizeUkPostcode(v.postcode) : v.postcode.toUpperCase(),
        country: v.country,
      }
    : null;

  try {
    await db
      .update(schema.customers)
      .set({ firstName: v.firstName, lastName: v.lastName, phone: v.phone, defaultAddress })
      .where(eq(schema.customers.id, customer.id));
  } catch (err) {
    console.error(`[account] details update failed: ${dbErrorCode(err)}`);
    return { ok: false, error: "We couldn't save your details. Please try again.", values };
  }
  // Re-render account pages so the form's defaults (and the overview card) show the saved values.
  revalidatePath("/account", "layout");
  return { ok: true, data: { saved: true } };
}
