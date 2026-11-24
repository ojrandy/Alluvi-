import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { addDays, londonDayKey, londonMidnight } from "@/lib/london-day";

/**
 * Admin dashboard reads. Deliberately NOT cached ('use cache' is never used here): admin data must
 * always be fresh. Callers must have run requireAdmin() first (pages do it before rendering data).
 *
 * Definitions (docs/DATA_MODEL.md "Dashboard metrics"):
 * - Day boundaries are London midnights. "7 days" = today + the previous 6 days; "30 days" likewise.
 * - Orders = every order placed in the window, whatever its status.
 * - Revenue = SUM(total_pence) of orders placed in the window whose payment has been received
 *   (status paid, processing, shipped or completed). Pending and cancelled orders are excluded.
 * - Pending payments = every order currently `pending_payment`, regardless of age.
 * - "Previous" figures cover the same-length window immediately before (days -13…-7 for 7 days,
 *   -59…-30 for 30 days), so the dashboard can show a like-for-like change.
 */

export const REVENUE_STATUSES = ["paid", "processing", "shipped", "completed"] as const satisfies readonly OrderStatus[];

const o = schema.orders;
const isRevenue = inArray(o.status, REVENUE_STATUSES);

/** UTC bounds of the London-day windows, relative to now. */
function windows(now = new Date()) {
  const today = londonDayKey(now);
  return {
    today,
    todayStart: londonMidnight(today),
    start7: londonMidnight(addDays(today, -6)),
    start14: londonMidnight(addDays(today, -13)),
    start30: londonMidnight(addDays(today, -29)),
    start60: londonMidnight(addDays(today, -59)),
  };
}

export type OverviewKpis = {
  ordersToday: number;
  orders7d: number;
  revenue7dPence: number;
  revenue30dPence: number;
  pendingCount: number;
  pendingPence: number;
  /** Same-length windows immediately before, for the change indicators. */
  ordersPrev7d: number;
  revenuePrev7dPence: number;
  revenuePrev30dPence: number;
  /** Paid orders placed in the last 30 days (average order value = revenue30dPence / this). */
  paidOrders30d: number;
};

const EMPTY_KPIS: OverviewKpis = {
  ordersToday: 0,
  orders7d: 0,
  revenue7dPence: 0,
  revenue30dPence: 0,
  pendingCount: 0,
  pendingPence: 0,
  ordersPrev7d: 0,
  revenuePrev7dPence: 0,
  revenuePrev30dPence: 0,
  paidOrders30d: 0,
};

/** All KPI figures in one conditional-aggregate query (uses orders_created_idx / orders_status_idx). */
export async function getOverviewKpis(): Promise<OverviewKpis> {
  const { todayStart, start7, start14, start30, start60 } = windows();
  const count = (cond: SQL | undefined) => sql<number>`COALESCE(SUM(CASE WHEN ${cond} THEN 1 ELSE 0 END), 0)`.mapWith(Number);
  const pence = (cond: SQL | undefined) =>
    sql<number>`COALESCE(SUM(CASE WHEN ${cond} THEN ${o.totalPence} ELSE 0 END), 0)`.mapWith(Number);
  const pending = eq(o.status, "pending_payment");

  const [row] = await db
    .select({
      ordersToday: count(gte(o.createdAt, todayStart)),
      orders7d: count(gte(o.createdAt, start7)),
      revenue7dPence: pence(and(gte(o.createdAt, start7), isRevenue)),
      revenue30dPence: pence(and(gte(o.createdAt, start30), isRevenue)),
      pendingCount: count(pending),
      pendingPence: pence(pending),
      ordersPrev7d: count(and(gte(o.createdAt, start14), lt(o.createdAt, start7))),
      revenuePrev7dPence: pence(and(gte(o.createdAt, start14), lt(o.createdAt, start7), isRevenue)),
      revenuePrev30dPence: pence(and(gte(o.createdAt, start60), lt(o.createdAt, start30), isRevenue)),
      paidOrders30d: count(and(gte(o.createdAt, start30), isRevenue)),
    })
    .from(o)
    .where(or(gte(o.createdAt, start60), pending));

  return row ?? EMPTY_KPIS;
}

export type RevenuePoint = { day: string; revenuePence: number; orders: number };

/**
 * Revenue per London day for the last `days` days (oldest first, zero-filled). SQL groups by UTC
 * hour, which is DST-safe without CONVERT_TZ (MySQL time-zone tables are often not loaded on shared
 * hosting); the hours are folded into London days here. At most 24 × days rows.
 */
export async function getRevenueSeries(days = 30): Promise<RevenuePoint[]> {
  const { today } = windows();
  const first = addDays(today, -(days - 1));
  const hour = sql<string>`DATE_FORMAT(${o.createdAt}, '%Y-%m-%d %H:00:00')`;

  const rows = await db
    .select({
      hour,
      revenuePence: sql<number>`SUM(${o.totalPence})`.mapWith(Number),
      orders: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(o)
    .where(and(gte(o.createdAt, londonMidnight(first)), isRevenue))
    .groupBy(hour);

  const series = new Map<string, RevenuePoint>();
  for (let i = 0; i < days; i++) {
    const day = addDays(first, i);
    series.set(day, { day, revenuePence: 0, orders: 0 });
  }
  for (const r of rows) {
    const point = series.get(londonDayKey(new Date(`${r.hour.replace(" ", "T")}Z`)));
    if (!point) continue; // an order timestamped after "now" (clock skew): ignore
    point.revenuePence += r.revenuePence;
    point.orders += r.orders;
  }
  return [...series.values()];
}

export type LatestOrder = {
  id: string;
  orderNo: string;
  createdAt: Date;
  customerName: string;
  email: string;
  status: OrderStatus;
  totalPence: number;
  itemCount: number;
};

export async function getLatestOrders(limit = 10): Promise<LatestOrder[]> {
  const rows = await db
    .select({
      id: o.id,
      orderNo: o.orderNo,
      createdAt: o.createdAt,
      firstName: o.firstName,
      lastName: o.lastName,
      email: o.email,
      status: o.status,
      totalPence: o.totalPence,
    })
    .from(o)
    .orderBy(desc(o.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  // Flat second query, not a correlated subquery: in a single-table select Drizzle renders columns
  // unqualified, so `orders.id` inside a subquery would silently bind to `order_items.id`.
  const items = schema.orderItems;
  const counts = await db
    .select({ orderId: items.orderId, quantity: sql<number>`SUM(${items.quantity})`.mapWith(Number) })
    .from(items)
    .where(inArray(items.orderId, rows.map((r) => r.id)))
    .groupBy(items.orderId);
  const byOrder = new Map(counts.map((c) => [c.orderId, c.quantity]));

  return rows.map(({ firstName, lastName, ...r }) => ({
    ...r,
    customerName: `${firstName} ${lastName}`.trim(),
    itemCount: byOrder.get(r.id) ?? 0,
  }));
}

// ---------- dashboard side panels ----------

export type TopProduct = { name: string; slug: string; units: number; revenuePence: number };

/** Best sellers by revenue over the last `days` days (paid orders; line snapshots, so renamed products still count). */
export async function getTopProducts(days = 30, limit = 5): Promise<TopProduct[]> {
  const { today } = windows();
  const items = schema.orderItems;
  const revenue = sql<number>`SUM(${items.lineTotalPence})`.mapWith(Number);
  return db
    .select({
      name: sql<string>`MAX(${items.productName})`,
      slug: items.productSlug,
      units: sql<number>`SUM(${items.quantity})`.mapWith(Number),
      revenuePence: revenue,
    })
    .from(items)
    .innerJoin(o, eq(items.orderId, o.id))
    .where(and(gte(o.createdAt, londonMidnight(addDays(today, -(days - 1)))), isRevenue))
    .groupBy(items.productSlug)
    .orderBy(desc(revenue))
    .limit(limit);
}

export type LowStockProduct = { id: string; name: string; stock: number };

/** Active products at or below `threshold` units, emptiest first. */
export async function getLowStockProducts(threshold = 5, limit = 5): Promise<LowStockProduct[]> {
  const p = schema.products;
  return db
    .select({ id: p.id, name: p.name, stock: p.stock })
    .from(p)
    .where(and(eq(p.isActive, true), lte(p.stock, threshold)))
    .orderBy(asc(p.stock), asc(p.name))
    .limit(limit);
}
