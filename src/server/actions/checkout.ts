"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { db, schema } from "@/db";
import type { OrderEmailData } from "@/emails/layout";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { checkoutItemsSchema, checkoutSchema, normalizeUkPostcode } from "@/lib/validators/checkout";
import { COUNTRY_CODES } from "@/lib/constants";
import { createCustomerSession, getCustomerSession, hashPassword } from "../customer-auth";
import { grantOrderAccess } from "../order-access";
import { sendNewOrderEmails } from "../order-emails";
import { isOrderNoCollision, newOrderNo } from "../order-number";
import { computeTotals, type LineIssue, type Totals } from "../pricing";
import { rateLimit } from "../rate-limit";
import { getIpHash } from "../request";
import { getStoreSettings, usableBankDetails } from "../settings";
import { z } from "zod";

const MAX_ATTEMPTS = 5;
const RATE_LIMIT = { max: 5, windowSeconds: 10 * 60 };
const GENERIC_ERROR = "We couldn't place your order. Please try again, or contact support if it keeps happening.";

/** Thrown inside the transaction to roll it back with a customer-facing message. */
class CheckoutRejected extends Error {
  constructor(
    message: string,
    readonly issues: LineIssue[] = [],
    readonly field?: string,
  ) {
    super(message);
  }
}

export type PlaceOrderResult = ActionResult<
  { orderNo: string; accountCreated: boolean; accountRequested: boolean },
  { issues: LineIssue[] }
>;

/** docs/ARCHITECTURE.md §4.1. Order is committed BEFORE any email is attempted. */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    // Honeypot filled → bot. Same generic message as any failure; nothing is written.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: false, error: GENERIC_ERROR };
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: firstFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const ipHash = await getIpHash();
  const limit = await rateLimit(`checkout:${ipHash}`, RATE_LIMIT.max, RATE_LIMIT.windowSeconds);
  if (!limit.ok) return { ok: false, error: "Too many order attempts. Please wait a few minutes and try again." };

  const session = await getCustomerSession();
  const wantsAccount = !session && !!v.createAccount && !!v.password;
  // bcrypt is slow on purpose; hash before the transaction so row locks are held briefly.
  const passwordHash = wantsAccount ? await hashPassword(v.password!) : null;
  const postcode = v.country === "GB" ? normalizeUkPostcode(v.postcode) : v.postcode.trim().toUpperCase();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const orderId = crypto.randomUUID();
    const orderNo = newOrderNo();
    try {
      const result = await db.transaction(async (tx) => {
        // Prices and stock are read under row locks, so the stored totals match what is decremented.
        const priced = await computeTotals(v.items, v.shippingMethod, { executor: tx, lockRows: true, country: v.country });
        if (!priced.ok) throw new CheckoutRejected(priced.error, priced.issues, priced.field);
        const t = priced.totals;

        let customerId: string | null = null;
        let accountCreated = false;
        if (session) {
          const [c] = await tx.select({ id: schema.customers.id }).from(schema.customers).where(eq(schema.customers.id, session.customerId)).limit(1);
          customerId = c?.id ?? null;
        } else if (passwordHash) {
          const [existing] = await tx.select({ id: schema.customers.id }).from(schema.customers).where(eq(schema.customers.email, v.email)).limit(1);
          // Existing email: do NOT link or reveal it. The order is placed as a guest (ADR-005).
          if (!existing) {
            customerId = crypto.randomUUID();
            await tx.insert(schema.customers).values({
              id: customerId,
              email: v.email,
              passwordHash,
              firstName: v.firstName,
              lastName: v.lastName,
              phone: v.phone,
              defaultAddress: { line1: v.addressLine1, line2: v.addressLine2 ?? null, city: v.city, postcode, country: v.country },
            });
            accountCreated = true;
          }
        }

        await tx.insert(schema.orders).values({
          id: orderId,
          orderNo,
          status: "pending_payment",
          customerId,
          email: v.email,
          firstName: v.firstName,
          lastName: v.lastName,
          phone: v.phone,
          addressLine1: v.addressLine1,
          addressLine2: v.addressLine2 ?? null,
          city: v.city,
          postcode,
          country: v.country,
          shippingMethod: t.shippingOption.key,
          subtotalPence: t.subtotalPence,
          shippingPence: t.shippingPence,
          totalPence: t.totalPence,
          paymentMethod: "bank_transfer",
          customerNote: v.customerNote ?? null,
          ruoAcceptedAt: new Date(),
          ipHash,
        });
        await tx.insert(schema.orderItems).values(
          t.lines.map((l) => ({
            orderId,
            productId: l.productId,
            productName: l.name,
            productSlug: l.slug,
            unitPricePence: l.unitPricePence,
            quantity: l.quantity,
            lineTotalPence: l.lineTotalPence,
          })),
        );
        for (const l of t.lines) {
          // Guard: never let stock go negative, even if the lock above were ever removed.
          const [res] = await tx
            .update(schema.products)
            .set({ stock: sql`${schema.products.stock} - ${l.quantity}` })
            .where(and(eq(schema.products.id, l.productId), gte(schema.products.stock, l.quantity)));
          if (res.affectedRows !== 1) {
            throw new CheckoutRejected(`${l.name} has just sold out. Please update your cart.`, [
              { productId: l.productId, name: l.name, reason: "insufficient_stock", available: 0 },
            ]);
          }
        }
        await tx.insert(schema.orderEvents).values({
          orderId,
          type: "created",
          data: { totalPence: t.totalPence, items: t.lines.length, accountCreated, linkedToCustomer: !!customerId },
          actor: "system",
        });
        return { totals: t, customerId, accountCreated };
      });

      // ---- committed: nothing below may turn a saved order into an error response ----
      try {
        if (result.accountCreated && result.customerId) await createCustomerSession(result.customerId);
        await grantOrderAccess(orderNo);
      } catch (err) {
        // Worst case the customer is asked for their email on the confirmation page.
        console.error(`[order ${orderNo}] post-commit cookie failed: ${(err as Error).message.slice(0, 80)}`);
      }
      revalidateTag("products", "max");

      const emailData = toEmailData(orderId, orderNo, v, postcode, result.totals);
      after(async () => {
        const settings = await getStoreSettings();
        await sendNewOrderEmails(
          { ...emailData, bankDetails: usableBankDetails(settings.bankDetails) },
          settings.notifyEmail ?? process.env.ORDER_NOTIFY_EMAIL ?? null,
        );
      });

      return { ok: true, data: { orderNo, accountCreated: result.accountCreated, accountRequested: !!v.createAccount && !session } };
    } catch (err) {
      if (err instanceof CheckoutRejected) {
        return {
          ok: false,
          error: err.message,
          issues: err.issues,
          fieldErrors: err.field ? { [err.field]: err.message } : undefined,
        };
      }
      // Order number (or a racing sign-up for the same email) collided: retry with fresh values.
      if (isOrderNoCollision(err) || isDuplicateCustomer(err)) continue;
      console.error(`[checkout] placeOrder failed: ${(err as { code?: string }).code ?? "UNKNOWN"}`);
      return { ok: false, error: GENERIC_ERROR };
    }
  }
  return { ok: false, error: GENERIC_ERROR };
}

function isDuplicateCustomer(err: unknown): boolean {
  for (let e: unknown = err, d = 0; e && d < 4; d++) {
    const o = e as { code?: string; message?: string; cause?: unknown };
    if (o.code === "ER_DUP_ENTRY" && /customers_email_uq/.test(o.message ?? "")) return true;
    e = o.cause;
  }
  return false;
}

function toEmailData(
  id: string,
  orderNo: string,
  v: z.output<typeof checkoutSchema>,
  postcode: string,
  t: Totals,
): Omit<OrderEmailData, "bankDetails"> {
  return {
    id,
    orderNo,
    createdAt: new Date(),
    email: v.email,
    firstName: v.firstName,
    lastName: v.lastName,
    phone: v.phone,
    addressLine1: v.addressLine1,
    addressLine2: v.addressLine2 ?? null,
    city: v.city,
    postcode,
    country: v.country,
    shippingLabel: t.shippingOption.label,
    items: t.lines.map((l) => ({ name: l.name, quantity: l.quantity, unitPricePence: l.unitPricePence, lineTotalPence: l.lineTotalPence })),
    subtotalPence: t.subtotalPence,
    shippingPence: t.shippingPence,
    totalPence: t.totalPence,
    customerNote: v.customerNote ?? null,
  };
}

// ---------------------------------------------------------------------------------------------

const quoteSchema = z.object({
  items: checkoutItemsSchema,
  shippingMethod: z.string().max(50),
  country: z.enum(COUNTRY_CODES).optional(),
});

export type CheckoutQuote = {
  lines: { productId: string; name: string; slug: string; quantity: number; unitPricePence: number; lineTotalPence: number }[];
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  freeShippingReason: Totals["freeShippingReason"];
};

/** Server-computed order summary for the checkout sidebar. Read-only; uses the same pricing code. */
export async function quoteCheckout(input: unknown): Promise<ActionResult<CheckoutQuote, { issues: LineIssue[] }>> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Your cart is empty." };
  const r = await computeTotals(parsed.data.items, parsed.data.shippingMethod, { country: parsed.data.country });
  if (!r.ok) return { ok: false, error: r.error, issues: r.issues, fieldErrors: r.field ? { [r.field]: r.error } : undefined };
  const t = r.totals;
  return {
    ok: true,
    data: {
      lines: t.lines.map((l) => ({ productId: l.productId, name: l.name, slug: l.slug, quantity: l.quantity, unitPricePence: l.unitPricePence, lineTotalPence: l.lineTotalPence })),
      subtotalPence: t.subtotalPence,
      shippingPence: t.shippingPence,
      totalPence: t.totalPence,
      freeShippingReason: t.freeShippingReason,
    },
  };
}
