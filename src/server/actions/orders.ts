"use server";

import { and, eq, isNotNull, sql } from "drizzle-orm";
import { refresh, revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { ORDER_STATUSES } from "@/db/schema";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { canTransition } from "@/lib/order-transitions";
import { requireAdmin } from "../auth";
import { dbErrorCode } from "../db-errors";
import { sendOrderShippedEmail } from "../order-emails";
import { getStoreSettings } from "../settings";

/**
 * Admin order mutations (D2-3). Every action: Zod-validate → requireAdmin() → act in a transaction
 * with the order row locked → log an order_event (actor = admin email) → refresh.
 * The state machine is enforced HERE (src/lib/order-transitions.ts), never trusted from the UI.
 */

export type OrderActionResult = ActionResult<{ message: string }>;

const orderId = z.uuid("Unknown order");
const trackingNumber = z
  .string()
  .trim()
  .max(100, "Tracking number is too long (100 characters max)")
  .regex(/^[A-Za-z0-9 -]*$/, "Use letters, numbers, spaces and dashes only")
  .transform((v) => v.replace(/\s+/g, " ").toUpperCase() || null);

const statusSchema = z.object({
  orderId,
  status: z.enum(ORDER_STATUSES, "Choose a status"),
  // Only sent (and only applied) when moving to `shipped`, so the shipped email can include it.
  trackingNumber: trackingNumber.optional(),
});

const trackingSchema = z.object({ orderId, trackingNumber });

const noteSchema = z.object({
  orderId,
  internalNote: z
    .string()
    .max(5000, "Note is too long (5,000 characters max)")
    .transform((v) => v.replace(/\r\n/g, "\n").trim() || null),
});

/** Thrown inside a transaction to roll it back with an admin-facing message. */
class Rejected extends Error {}

const fields = (fd: FormData, keys: string[]) => Object.fromEntries(keys.flatMap((k) => (fd.has(k) ? [[k, fd.get(k)]] : [])));

async function lockOrder(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], id: string) {
  const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, id)).for("update").limit(1);
  if (!order) throw new Rejected("This order no longer exists.");
  return order;
}

function failure(err: unknown, what: string): OrderActionResult {
  if (err instanceof Rejected) return { ok: false, error: err.message };
  console.error(`[admin-orders] ${what} failed: ${dbErrorCode(err)}`);
  return { ok: false, error: "Something went wrong. Nothing was changed; please try again." };
}

// ---------- status ----------

export async function updateOrderStatus(_prev: OrderActionResult | null, formData: FormData): Promise<OrderActionResult> {
  const parsed = statusSchema.safeParse(fields(formData, ["orderId", "status", "trackingNumber"]));
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted field.", fieldErrors: firstFieldErrors(parsed.error.issues) };
  }
  const admin = await requireAdmin();
  const { orderId: id, status: to } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const order = await lockOrder(tx, id);
      const from = order.status;
      if (from === to) throw new Rejected(`This order is already ${ORDER_STATUS_LABEL[to].toLowerCase()}.`);
      if (!canTransition(from, to)) {
        throw new Rejected(`An order that is “${ORDER_STATUS_LABEL[from]}” can't be moved to “${ORDER_STATUS_LABEL[to]}”.`);
      }

      const tracking = to === "shipped" && parsed.data.trackingNumber !== undefined ? parsed.data.trackingNumber : order.trackingNumber;
      // `status = from` makes the update a compare-and-set even if the lock were ever removed.
      const [res] = await tx
        .update(schema.orders)
        .set({ status: to, trackingNumber: tracking })
        .where(and(eq(schema.orders.id, id), eq(schema.orders.status, from)));
      if (res.affectedRows !== 1) throw new Rejected("This order was changed by someone else. Reload and try again.");

      let restocked: { productId: string; quantity: number }[] = [];
      if (to === "cancelled") restocked = await restoreStock(tx, id);

      await tx.insert(schema.orderEvents).values({
        orderId: id,
        type: "status_changed",
        data: {
          from,
          to,
          ...(tracking !== order.trackingNumber ? { trackingNumber: tracking } : {}),
          ...(to === "cancelled" ? { restocked } : {}),
        },
        actor: admin.email,
      });
      return { order: { ...order, status: to, trackingNumber: tracking }, from, restocked };
    });

    if (result.restocked.length) revalidateTag("products", "max");
    if (to === "shipped") {
      const o = result.order;
      after(async () => {
        const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
        const settings = await getStoreSettings().catch(() => null);
        const shippingLabel = settings?.shippingOptions.find((s) => s.key === o.shippingMethod)?.label ?? o.shippingMethod;
        await sendOrderShippedEmail({
          id: o.id,
          orderNo: o.orderNo,
          createdAt: o.createdAt,
          email: o.email,
          firstName: o.firstName,
          lastName: o.lastName,
          phone: o.phone,
          addressLine1: o.addressLine1,
          addressLine2: o.addressLine2,
          city: o.city,
          postcode: o.postcode,
          country: o.country,
          shippingLabel,
          items: items.map((i) => ({ name: i.productName, quantity: i.quantity, unitPricePence: i.unitPricePence, lineTotalPence: i.lineTotalPence })),
          subtotalPence: o.subtotalPence,
          shippingPence: o.shippingPence,
          totalPence: o.totalPence,
          customerNote: o.customerNote,
          trackingNumber: o.trackingNumber,
        });
      });
    }
    refresh();

    const label = ORDER_STATUS_LABEL[to];
    const extra =
      to === "cancelled"
        ? result.restocked.length
          ? " Stock has been restored."
          : ""
        : to === "shipped"
          ? " The customer is being emailed."
          : "";
    return { ok: true, data: { message: `Status changed to “${label}”.${extra}` } };
  } catch (err) {
    return failure(err, "updateOrderStatus");
  }
}

/** Put every line back into stock (products deleted since keep product_id NULL and are skipped). */
async function restoreStock(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], id: string) {
  const lines = await tx
    .select({ productId: schema.orderItems.productId, quantity: schema.orderItems.quantity })
    .from(schema.orderItems)
    .where(and(eq(schema.orderItems.orderId, id), isNotNull(schema.orderItems.productId)));
  const restocked: { productId: string; quantity: number }[] = [];
  for (const l of lines) {
    const [res] = await tx
      .update(schema.products)
      .set({ stock: sql`${schema.products.stock} + ${l.quantity}` })
      .where(eq(schema.products.id, l.productId!));
    if (res.affectedRows === 1) restocked.push({ productId: l.productId!, quantity: l.quantity });
  }
  return restocked;
}

// ---------- tracking number ----------

export async function updateOrderTracking(_prev: OrderActionResult | null, formData: FormData): Promise<OrderActionResult> {
  const parsed = trackingSchema.safeParse(fields(formData, ["orderId", "trackingNumber"]));
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted field.", fieldErrors: firstFieldErrors(parsed.error.issues) };
  }
  const admin = await requireAdmin();
  const { orderId: id, trackingNumber: next } = parsed.data;

  try {
    const changed = await db.transaction(async (tx) => {
      const order = await lockOrder(tx, id);
      if (order.status === "cancelled") throw new Rejected("Cancelled orders can't be given a tracking number.");
      if (order.trackingNumber === next) return false;
      await tx.update(schema.orders).set({ trackingNumber: next }).where(eq(schema.orders.id, id));
      await tx.insert(schema.orderEvents).values({
        orderId: id,
        type: "note",
        data: { field: "tracking_number", from: order.trackingNumber, to: next },
        actor: admin.email,
      });
      return true;
    });
    if (changed) refresh();
    return { ok: true, data: { message: !changed ? "No changes to save." : next ? "Tracking number saved." : "Tracking number removed." } };
  } catch (err) {
    return failure(err, "updateOrderTracking");
  }
}

// ---------- internal note ----------

export async function updateOrderNote(_prev: OrderActionResult | null, formData: FormData): Promise<OrderActionResult> {
  const parsed = noteSchema.safeParse(fields(formData, ["orderId", "internalNote"]));
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted field.", fieldErrors: firstFieldErrors(parsed.error.issues) };
  }
  const admin = await requireAdmin();
  const { orderId: id, internalNote: next } = parsed.data;

  try {
    const changed = await db.transaction(async (tx) => {
      const order = await lockOrder(tx, id);
      if ((order.internalNote ?? null) === next) return false;
      await tx.update(schema.orders).set({ internalNote: next }).where(eq(schema.orders.id, id));
      // The note itself lives on the order; the event only records that it changed and who did it.
      await tx.insert(schema.orderEvents).values({
        orderId: id,
        type: "note",
        data: { field: "internal_note", cleared: next === null },
        actor: admin.email,
      });
      return true;
    });
    if (changed) refresh();
    return { ok: true, data: { message: changed ? "Note saved." : "No changes to save." } };
  } catch (err) {
    return failure(err, "updateOrderNote");
  }
}
