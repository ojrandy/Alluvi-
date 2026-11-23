import { z } from "zod";
import { penceToPounds, poundsToPence } from "./admin-products";

/**
 * /admin/settings forms (D2-5). The client sends the raw strings it shows; these schemas turn them
 * into the stored JSON shapes (DATA_MODEL `settings`). Money is entered in £ and stored in pence.
 */

const text = (max: number, label: string) =>
  z.string().trim().min(1, `Enter the ${label}`).max(max, `Keep the ${label} under ${max} characters`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v === "" ? null : v));

const money = (label: string, required: boolean) =>
  z.string().transform((v, ctx) => {
    const p = poundsToPence(v);
    if (p === null) {
      if (required) ctx.addIssue({ code: "custom", message: `Enter the ${label}` });
      return null;
    }
    if (Number.isNaN(p)) {
      ctx.addIssue({ code: "custom", message: "Use a £ amount like 4.99" });
      return null;
    }
    return p;
  });

// ---------- bank details ----------

export const bankFormSchema = z.object({
  accountName: text(120, "account name"),
  bankName: text(120, "bank name"),
  sortCode: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{6}$/, "A sort code is 6 digits, e.g. 12-34-56"))
    .transform((v) => `${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4)}`),
  accountNumber: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{8}$/, "A UK account number is 8 digits")),
  iban: z
    .string()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .pipe(z.string().regex(/^$|^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/, "Check the IBAN"))
    .transform((v) => (v === "" ? null : v)),
  instructions: optionalText(500),
});
export type BankFormInput = z.input<typeof bankFormSchema>;

// ---------- shipping options ----------

export const SHIPPING_KEY_PATTERN = /^[a-z0-9_]{2,40}$/;

const shippingRow = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SHIPPING_KEY_PATTERN, "2–40 characters: a–z, 0–9 and _"),
  label: text(80, "label"),
  description: optionalText(160),
  price: money("price", true),
  freeOver: money("threshold", false),
});

export const shippingFormSchema = z
  .object({ options: z.array(shippingRow).min(1, "Keep at least one shipping option").max(12, "12 options at most") })
  .superRefine((v, ctx) => {
    const seen = new Set<string>();
    v.options.forEach((o, i) => {
      if (seen.has(o.key)) ctx.addIssue({ code: "custom", path: ["options", i, "key"], message: "Each key must be unique" });
      seen.add(o.key);
    });
  });
export type ShippingRowInput = z.input<typeof shippingRow>;

export function shippingRowFromStored(o: {
  key: string;
  label: string;
  description?: string | null;
  pricePence: number;
  freeOverPence?: number | null;
}): ShippingRowInput {
  return {
    key: o.key,
    label: o.label,
    description: o.description ?? "",
    price: penceToPounds(o.pricePence),
    freeOver: penceToPounds(o.freeOverPence),
  };
}

// ---------- free-shipping promo (ADR-012) ----------

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
export const promoFormSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false) }),
  z
    .object({ enabled: z.literal(true), label: text(80, "banner label"), startDay: dayKey, endDay: dayKey })
    .refine((v) => v.endDay >= v.startDay, { path: ["endDay"], message: "The end date must be on or after the start date" }),
]);
export type PromoFormInput = z.input<typeof promoFormSchema>;

// ---------- notification email ----------

export const notifyFormSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(255)),
});
