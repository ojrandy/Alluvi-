import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/constants";
import { UK_POSTCODE } from "./checkout";

/** Shared by client forms and Server Actions. */

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(255));

/** bcrypt only uses the first 72 BYTES, so cap by bytes, not characters. */
export const newPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .refine((p) => new TextEncoder().encode(p).length <= 72, "Password is too long");

const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(100, `${label} is too long`);

export const signupSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  email: emailSchema,
  password: newPasswordSchema,
  // Honeypot: never shown to people.
  website: z.string().max(0).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(200),
  next: z.string().max(512).optional(),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

/** 32 random bytes, base64url: exactly 43 characters. */
export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Invalid link");

export const resetPasswordSchema = z
  .object({ token: tokenSchema, password: newPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Too long")
    .optional()
    .transform((v) => (v ? v : null));

export const accountDetailsSchema = z
  .object({
    firstName: name("First name"),
    lastName: name("Last name"),
    phone: z
      .string()
      .trim()
      .refine((p) => p === "" || /^\+?[0-9 ()-]{7,20}$/.test(p), "Enter a valid phone number")
      .transform((p) => (p ? p : null)),
    line1: z.string().trim().max(255, "Too long"),
    line2: optionalText(255),
    city: z.string().trim().max(100, "Too long"),
    postcode: z.string().trim().max(20, "Too long"),
    country: z.enum(COUNTRY_CODES, "Select a country"),
  })
  .superRefine((v, ctx) => {
    // The address is optional as a whole, but complete if any of it is given.
    const anyAddress = !!(v.line1 || v.line2 || v.city || v.postcode);
    if (!anyAddress) return;
    if (!v.line1) ctx.addIssue({ code: "custom", path: ["line1"], message: "Address is required" });
    if (!v.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Town / city is required" });
    // Postcode is required for the UK only; many countries have none.
    if (!v.postcode && v.country === "GB") ctx.addIssue({ code: "custom", path: ["postcode"], message: "Postcode is required" });
    else if (v.postcode && v.country === "GB" && !UK_POSTCODE.test(v.postcode)) {
      ctx.addIssue({ code: "custom", path: ["postcode"], message: "Enter a valid UK postcode" });
    }
  });

export type AccountDetailsInput = z.input<typeof accountDetailsSchema>;
