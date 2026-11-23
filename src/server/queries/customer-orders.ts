import "server-only";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema, type DbExecutor } from "@/db";
import type { OrderStatus } from "@/db/schema";
import type { OrderWithItems } from "./orders";

/**
 * Account order history. Every function takes the customer id from requireCustomer(), never from
 * user input, so a customer can only ever see orders linked to their own account.
 */

export type CustomerOrderSummary = {
  orderNo: string;
  status: OrderStatus;
  createdAt: Date;
  totalPence: number;
  trackingNumber: string | null;
  itemCount: number;
  itemNames: string[];
};

const HISTORY_LIMIT = 100;

export async function getCustomerOrders(customerId: string): Promise<CustomerOrderSummary[]> {
  const orders = await db
    .select({
      id: schema.orders.id,
      orderNo: schema.orders.orderNo,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
      totalPence: schema.orders.totalPence,
      trackingNumber: schema.orders.trackingNumber,
    })
    .from(schema.orders)
    .where(eq(schema.orders.customerId, customerId))
    .orderBy(desc(schema.orders.createdAt))
    .limit(HISTORY_LIMIT);
  if (orders.length === 0) return [];

  // Flat second query instead of a relational `with` (MariaDB, see DATA_MODEL).
  const items = await db
    .select({ orderId: schema.orderItems.orderId, name: schema.orderItems.productName, quantity: schema.orderItems.quantity })
    .from(schema.orderItems)
    .where(inArray(schema.orderItems.orderId, orders.map((o) => o.id)))
    .orderBy(asc(schema.orderItems.productName));
  const byOrder = new Map<string, typeof items>();
  for (const i of items) byOrder.set(i.orderId, [...(byOrder.get(i.orderId) ?? []), i]);

  return orders.map(({ id, ...o }) => {
    const lines = byOrder.get(id) ?? [];
    return { ...o, itemCount: lines.reduce((n, l) => n + l.quantity, 0), itemNames: lines.map((l) => l.name) };
  });
}

/** One order, only if it belongs to this customer. */
export async function getCustomerOrder(customerId: string, orderNo: string): Promise<OrderWithItems | null> {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.orderNo, orderNo), eq(schema.orders.customerId, customerId)))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id))
    .orderBy(asc(schema.orderItems.productName));
  return { ...order, items };
}

export async function customerOwnsOrder(customerId: string, orderNo: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.orderNo, orderNo), eq(schema.orders.customerId, customerId)))
    .limit(1);
  return !!row;
}

/**
 * Attach earlier guest orders placed with this email to the account (ADR-005). Callers MUST only
 * call this once the customer has proven they own the email (email_verified_at is set). Each linked
 * order gets a `customer_linked` event for the audit trail. Returns how many were linked.
 */
export async function linkGuestOrders(executor: DbExecutor, customerId: string, email: string): Promise<number> {
  const guestOrders = await executor
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.email, email.toLowerCase()), isNull(schema.orders.customerId)));
  if (guestOrders.length === 0) return 0;
  const ids = guestOrders.map((o) => o.id);
  await executor
    .update(schema.orders)
    .set({ customerId })
    .where(and(inArray(schema.orders.id, ids), isNull(schema.orders.customerId)));
  await executor
    .insert(schema.orderEvents)
    .values(ids.map((orderId) => ({ orderId, type: "customer_linked" as const, data: { customerId, via: "verified_email" }, actor: "system" })));
  return ids.length;
}
