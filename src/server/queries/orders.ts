import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ORDER_STATUSES, type Order, type OrderItem, type OrderStatus } from "@/db/schema";

export type OrderWithItems = Order & { items: OrderItem[] };

/** Never cached: contains personal data. Two flat queries (MariaDB, see DATA_MODEL). */
export async function getOrderByNo(orderNo: string): Promise<OrderWithItems | null> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNo, orderNo)).limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id))
    .orderBy(asc(schema.orderItems.productName));
  return { ...order, items };
}

const isStatus = (v: unknown): v is OrderStatus => typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);

/**
 * Status changes for the customer timeline, oldest first. Reads `order_events` of type
 * `status_changed` whose `data` is `{ from, to }` (written by updateOrderStatus, D2-3).
 * Only the status and time leave this function: admin actors and other event data stay private.
 */
export async function getOrderStatusChanges(orderId: string): Promise<{ from: OrderStatus | null; to: OrderStatus; at: Date }[]> {
  const rows = await db
    .select({ data: schema.orderEvents.data, at: schema.orderEvents.createdAt })
    .from(schema.orderEvents)
    .where(and(eq(schema.orderEvents.orderId, orderId), eq(schema.orderEvents.type, "status_changed")))
    .orderBy(asc(schema.orderEvents.createdAt));
  return rows.flatMap((r) =>
    isStatus(r.data?.to) ? [{ from: isStatus(r.data.from) ? r.data.from : null, to: r.data.to, at: r.at }] : [],
  );
}
