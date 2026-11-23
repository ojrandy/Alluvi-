import { z } from "zod";

/**
 * Product create/edit form (D2-4). ONE schema, used by the react-hook-form resolver in the browser
 * and re-run by the Server Action, so the client can never send something the server would not
 * accept. Money is typed in pounds and leaves this schema as integer pence (CONVENTIONS).
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "BPC-157 + TB-500 (40mg)" → "bpc-157-tb-500-40mg". Same rules as the live URLs. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

const MAX_PRICE_PENCE = 10_000_000; // £100,000: anything above is a typo

/** "£1,250.5" → 125050. Returns null for empty, NaN for anything that is not a money amount. */
export function poundsToPence(input: string): number | null {
  const v = input.replace(/[£,\s]/g, "");
  if (v === "") return null;
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(v);
  if (!m) return Number.NaN;
  // String maths, not parseFloat * 100: 19.99 * 100 is 1998.9999999999998.
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** 12050 → "120.50", 12000 → "120". For pre-filling the form. */
export function penceToPounds(pence: number | null | undefined): string {
  if (pence == null) return "";
  return pence % 100 === 0 ? String(pence / 100) : (pence / 100).toFixed(2);
}

const text = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} is too long (${max.toLocaleString("en-GB")} characters max)`);

/** Optional single-line text: "" → null. */
const optionalText = (max: number, label: string) => text(max, label).transform((v) => v || null);

/** Optional multi-line text: normalises line ends, "" → null. */
const optionalLongText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} is too long (${max.toLocaleString("en-GB")} characters max)`)
    .transform((v) => v.replace(/\r\n?/g, "\n").trim() || null);

const httpUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500, `${label} is too long (500 characters max)`)
    .refine((v) => v === "" || isHttpUrl(v), "Enter a full link starting with https://")
    .transform((v) => v || null);

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Product images must live on this site: /images/… (recovered catalogue, shipped with the build)
 * or /uploads/… (uploaded in the admin, see src/server/storage.ts). External hosts are refused so
 * next/image needs no remotePatterns and the CSP (D2-6) can keep img-src 'self'.
 */
export const IMAGE_PATH_PATTERN = /^\/(images|uploads)\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.(png|jpe?g|webp|avif|gif)$/i;

const money = (label: string, required: boolean) =>
  z.string().transform((v, ctx) => {
    const pence = poundsToPence(v);
    if (pence === null) {
      if (required) ctx.addIssue({ code: "custom", message: `Enter the ${label.toLowerCase()}` });
      return null;
    }
    if (Number.isNaN(pence)) {
      ctx.addIssue({ code: "custom", message: "Enter an amount in pounds, e.g. 120 or 89.50" });
      return z.NEVER;
    }
    if (pence <= 0) {
      ctx.addIssue({ code: "custom", message: `${label} must be more than £0` });
      return z.NEVER;
    }
    if (pence > MAX_PRICE_PENCE) {
      ctx.addIssue({ code: "custom", message: `${label} can't be more than £100,000` });
      return z.NEVER;
    }
    return pence;
  });

const rowText = (max: number, label: string) => text(max, label);

export const productFormSchema = z
  .object({
    name: text(255, "Name").min(2, "Enter the product name"),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "Enter a URL slug")
      .max(120, "Slug is too long (120 characters max)")
      .regex(SLUG_PATTERN, "Use lower-case letters, numbers and single dashes, e.g. glow-70mg"),
    shortDescription: optionalLongText(500, "Short description"),
    description: optionalLongText(20_000, "Description"),
    price: money("Price", true),
    compareAt: money("Compare-at price", false),
    stock: z
      .string()
      .trim()
      .regex(/^\d{1,6}$/, "Enter a whole number, 0 or more")
      .transform(Number),
    category: optionalText(100, "Category"),
    badge: optionalText(50, "Badge"),
    labReportUrl: httpUrl("Lab report link"),
    isActive: z.boolean(),
    images: z
      .array(
        z.object({
          url: z.string().trim().regex(IMAGE_PATH_PATTERN, "Use an uploaded image or a path like /images/glow.png"),
          alt: text(255, "Alt text"),
        }),
      )
      .max(12, "12 images max"),
    specs: z.object({
      batchNumber: optionalText(100, "Batch number"),
      fillVolume: optionalText(100, "Fill volume"),
      purity: optionalText(100, "Purity"),
      dateTested: optionalText(100, "Date tested"),
      compounds: z
        .array(
          z.object({
            compound: rowText(100, "Compound").min(1, "Enter the compound"),
            concentration: optionalText(100, "Concentration"),
            verifiedContent: optionalText(100, "Verified content"),
          }),
        )
        .max(20, "20 compounds max"),
      packageContents: z.array(z.object({ value: rowText(200, "Item").min(1, "Enter the item or remove the row") })).max(30, "30 items max"),
      labReports: z
        .array(
          z.object({
            label: rowText(100, "Label").min(1, "Enter a label"),
            url: z.string().trim().refine(isHttpUrl, "Enter a full link starting with https://"),
          }),
        )
        .max(10, "10 reports max"),
      disclaimer: optionalLongText(2000, "Disclaimer"),
      safetyNote: optionalLongText(2000, "Safety note"),
      relatedSlugs: z.array(z.string().regex(SLUG_PATTERN)).max(8, "Pick up to 8 related products"),
    }),
  })
  .superRefine((v, ctx) => {
    if (v.compareAt !== null && v.price !== null && v.compareAt <= v.price) {
      ctx.addIssue({ code: "custom", path: ["compareAt"], message: "Compare-at price must be higher than the price (or leave it empty)" });
    }
    if (v.specs.relatedSlugs.includes(v.slug)) {
      ctx.addIssue({ code: "custom", path: ["specs", "relatedSlugs"], message: "A product can't be related to itself" });
    }
    const seen = new Set<string>();
    v.images.forEach((img, i) => {
      if (seen.has(img.url)) ctx.addIssue({ code: "custom", path: ["images", i, "url"], message: "This image is already in the list" });
      seen.add(img.url);
    });
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormOutput = z.output<typeof productFormSchema>;

/** Empty form for /admin/products/new. Uses the live catalogue's defaults (in stock: 0, visible). */
export const EMPTY_PRODUCT_FORM: ProductFormInput = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAt: "",
  stock: "0",
  category: "",
  badge: "",
  labReportUrl: "",
  isActive: true,
  images: [],
  specs: {
    batchNumber: "",
    fillVolume: "",
    purity: "",
    dateTested: "",
    compounds: [],
    packageContents: [],
    labReports: [],
    disclaimer: "",
    safetyNote: "",
    relatedSlugs: [],
  },
};

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/gif";
