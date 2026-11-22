import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Order, OrderItem } from "@/db/schema";

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
