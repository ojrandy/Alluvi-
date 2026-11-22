import { z } from "zod";
import { COUNTRY_CODES, MAX_CART_LINES, MAX_LINE_QTY } from "@/lib/constants";

/**
 * Checkout input. The SAME schema validates the form on the client (react-hook-form) and the
 * Server Action on the server. Prices are deliberately absent: the server prices every line.
 */

// Official UK postcode shape (incl. GIR 0AA, BFPO excluded). Space optional, case-insensitive.
export const UK_POSTCODE = /^(GIR ?0AA|[A-PR-UWYZ][0-9][0-9]? ?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][A-HK-Y][0-9][0-9]? ?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][0-9][A-HJKPSTUW] ?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY] ?[0-9][ABD-HJLNP-UW-Z]{2})$/i;

/** "sw1a1aa" → "SW1A 1AA" */
export function normalizeUkPostcode(p: string) {
  const c = p.replace(/\s+/g, "").toUpperCase();
  return c.length > 3 ? `${c.slice(0, -3)} ${c.slice(-3)}` : c;
}

const text = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Too long")
    .optional()
    .transform((v) => (v ? v : undefined));

export const checkoutItemSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_LINE_QTY),
});

export const checkoutItemsSchema = z.array(checkoutItemSchema).min(1, "Your cart is empty").max(MAX_CART_LINES);

const customerFields = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(255)),
  firstName: text(100, "First name"),
  lastName: text(100, "Last name"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number"),
  addressLine1: text(255, "Address"),
  addressLine2: optionalText(255),
  city: text(100, "Town / city"),
  postcode: text(20, "Postcode"),
  country: z.enum(COUNTRY_CODES, "Select a country"),
  shippingMethod: z.string().trim().min(1, "Choose a shipping option").max(50),
  customerNote: optionalText(1000),
  ruoAccepted: z.literal(true, "You must confirm research use, age and terms to continue"),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(0).optional(),
  createAccount: z.boolean().optional(),
  password: z.string().max(72, "Password is too long").optional(),
});

function refine<T extends z.infer<typeof customerFields>>(v: T, ctx: z.RefinementCtx) {
  if (v.country === "GB" && !UK_POSTCODE.test(v.postcode.trim())) {
    ctx.addIssue({ code: "custom", path: ["postcode"], message: "Enter a valid UK postcode" });
  }
  if (v.createAccount && (!v.password || v.password.length < 10)) {
    ctx.addIssue({ code: "custom", path: ["password"], message: "Use at least 10 characters" });
  }
}

/** Form fields only (the client form); the cart lines are attached on submit. */
export const checkoutFormSchema = customerFields.superRefine(refine);

/** Full Server Action payload. */
export const checkoutSchema = customerFields.extend({ items: checkoutItemsSchema }).superRefine(refine);

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;
export type CheckoutInput = z.output<typeof checkoutSchema>;
export type CheckoutItem = z.output<typeof checkoutItemSchema>;
