import "server-only";
import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Order, OrderEvent, OrderItem, OrderStatus } from "@/db/schema";
import { ADMIN_ORDERS_PAGE_SIZE, type AdminOrderFilters } from "@/lib/validators/admin-orders";

/**
 * Admin order reads (D2-3). Never cached: personal data that must always be fresh. Callers must
 * have run requireAdmin() first.
 */

const o = schema.orders;
const items = schema.orderItems;

/** Escape LIKE wildcards so a search for "50%" or "a_b" matches literally. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function whereFor(f: Pick<AdminOrderFilters, "q" | "status">): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (f.status) conds.push(eq(o.status, f.status));
  if (f.q) {
    const term = `%${likeEscape(f.q)}%`;
    conds.push(
      or(
        like(o.orderNo, `%${likeEscape(f.q.toUpperCase())}%`),
        like(o.email, `%${likeEscape(f.q.toLowerCase())}%`),
        like(sql`CONCAT(${o.firstName}, ' ', ${o.lastName})`, term),
      ),
    );
  }
  return conds.length ? and(...conds) : undefined;
}

/** Units per order (SUM of quantities). Flat query: see getLatestOrders for why not a subquery. */
async function itemCounts(orderIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (let i = 0; i < orderIds.length; i += 1000) {
    const rows = await db
      .select({ orderId: items.orderId, quantity: sql<number>`SUM(${items.quantity})`.mapWith(Number) })
      .from(items)
      .where(inArray(items.orderId, orderIds.slice(i, i + 1000)))
      .groupBy(items.orderId);
    for (const r of rows) out.set(r.orderId, r.quantity);
  }
  return out;
}

export type AdminOrderRow = {
  id: string;
  orderNo: string;
  createdAt: Date;
  customerName: string;
  email: string;
  itemCount: number;
  totalPence: number;
  status: OrderStatus;
  paymentMethod: string;
};

export async function listAdminOrders(f: AdminOrderFilters): Promise<{ rows: AdminOrderRow[]; total: number; page: number; pageCount: number }> {
  const where = whereFor(f);
  const [{ total }] = await db.select({ total: count() }).from(o).where(where);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE));
  const page = Math.min(f.page, pageCount); // a stale ?page= past the end shows the last page

  const rows = await db
    .select({
      id: o.id,
      orderNo: o.orderNo,
      createdAt: o.createdAt,
      firstName: o.firstName,
      lastName: o.lastName,
      email: o.email,
      totalPence: o.totalPence,
      status: o.status,
      paymentMethod: o.paymentMethod,
    })
    .from(o)
    .where(where)
    .orderBy(desc(o.createdAt), desc(o.orderNo))
    .limit(ADMIN_ORDERS_PAGE_SIZE)
    .offset((page - 1) * ADMIN_ORDERS_PAGE_SIZE);

  const counts = await itemCounts(rows.map((r) => r.id));
  return {
    rows: rows.map(({ firstName, lastName, ...r }) => ({
      ...r,
      customerName: `${firstName} ${lastName}`.trim(),
      itemCount: counts.get(r.id) ?? 0,
    })),
    total,
    page,
    pageCount,
  };
}

/** Orders per status for the current search (feeds the status filter chips). */
export async function countOrdersByStatus(q: string): Promise<{ all: number } & Partial<Record<OrderStatus, number>>> {
  const rows = await db.select({ status: o.status, n: count() }).from(o).where(whereFor({ q })).groupBy(o.status);
  const out: { all: number } & Partial<Record<OrderStatus, number>> = { all: 0 };
  for (const r of rows) {
    out[r.status] = r.n;
    out.all += r.n;
  }
  return out;
}

/** Hard cap for one CSV download; the export says so if it was hit. */
export const EXPORT_MAX_ROWS = 10_000;

export type ExportOrder = Order & { items: Pick<OrderItem, "productName" | "quantity">[] };

/** Every order matching the filters (ignores pagination), newest first, with item lines. */
export async function listOrdersForExport(f: Pick<AdminOrderFilters, "q" | "status">): Promise<{ orders: ExportOrder[]; truncated: boolean }> {
  const rows = await db
    .select()
    .from(o)
    .where(whereFor(f))
    .orderBy(desc(o.createdAt), desc(o.orderNo))
    .limit(EXPORT_MAX_ROWS + 1);
  const truncated = rows.length > EXPORT_MAX_ROWS;
  const orders = rows.slice(0, EXPORT_MAX_ROWS);

  const byOrder = new Map<string, ExportOrder["items"]>();
  const ids = orders.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 1000) {
    const lines = await db
      .select({ orderId: items.orderId, productName: items.productName, quantity: items.quantity })
      .from(items)
      .where(inArray(items.orderId, ids.slice(i, i + 1000)))
      .orderBy(asc(items.productName));
    for (const l of lines) {
      const list = byOrder.get(l.orderId) ?? [];
      list.push({ productName: l.productName, quantity: l.quantity });
      byOrder.set(l.orderId, list);
    }
  }
  return { orders: orders.map((r) => ({ ...r, items: byOrder.get(r.id) ?? [] })), truncated };
}

export type AdminOrderDetail = Order & { items: OrderItem[]; events: OrderEvent[] };

/** One order with its items and full event log (oldest first). */
export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const [order] = await db.select().from(o).where(eq(o.id, id)).limit(1);
  if (!order) return null;
  const [lines, events] = await Promise.all([
    db.select().from(items).where(eq(items.orderId, id)).orderBy(asc(items.productName)),
    db
      .select()
      .from(schema.orderEvents)
      .where(eq(schema.orderEvents.orderId, id))
      .orderBy(asc(schema.orderEvents.createdAt), asc(schema.orderEvents.id)),
  ]);
  return { ...order, items: lines, events };
}
