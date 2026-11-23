import "server-only";
import type { OrderStatus } from "@/db/schema";
import { formatLondonDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_PATH, royalMailTrackingUrl } from "@/lib/order-status";
import { getOrderStatusChanges, type OrderWithItems } from "./queries/orders";

/**
 * Customer-safe view of an order: status timeline, items, totals, tracking. No address, phone or
 * admin data. Shared by /track-order and the account order page.
 */
export type TimelineStep = {
  key: OrderStatus;
  label: string;
  /** Pre-formatted in UK time on the server, so client and server render the same string. */
  at: string | null;
  state: "done" | "current" | "upcoming" | "cancelled";
};

export type TrackedOrder = {
  orderNo: string;
  status: OrderStatus;
  statusLabel: string;
  placedAt: string;
  timeline: TimelineStep[];
  items: { id: string; name: string; quantity: number; lineTotalPence: number }[];
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  tracking: { number: string; url: string } | null;
};

export async function toTrackedOrder(order: OrderWithItems): Promise<TrackedOrder> {
  const changes = await getOrderStatusChanges(order.id);
  return {
    orderNo: order.orderNo,
    status: order.status,
    statusLabel: ORDER_STATUS_LABEL[order.status],
    placedAt: formatLondonDateTime(order.createdAt),
    timeline: buildTimeline(order.status, order.createdAt, changes),
    items: order.items.map((i) => ({ id: i.id, name: i.productName, quantity: i.quantity, lineTotalPence: i.lineTotalPence })),
    subtotalPence: order.subtotalPence,
    shippingPence: order.shippingPence,
    totalPence: order.totalPence,
    tracking: order.trackingNumber ? { number: order.trackingNumber, url: royalMailTrackingUrl(order.trackingNumber) } : null,
  };
}

/**
 * Happy-path steps with the time each was reached (first `status_changed` event whose `to` is that
 * status). Steps without an event but before the current status still count as done, so an admin
 * skipping a step (e.g. paid → shipped) reads correctly. A cancelled order shows the steps it
 * reached, then "Cancelled".
 */
function buildTimeline(status: OrderStatus, createdAt: Date, changes: { to: OrderStatus; from: OrderStatus | null; at: Date }[]): TimelineStep[] {
  const reachedAt = new Map<OrderStatus, Date>([["pending_payment", createdAt]]);
  for (const c of changes) if (!reachedAt.has(c.to)) reachedAt.set(c.to, c.at);
  const fmt = (s: OrderStatus) => {
    const d = reachedAt.get(s);
    return d ? formatLondonDateTime(d) : null;
  };

  if (status === "cancelled") {
    const cancel = changes.findLast((c) => c.to === "cancelled");
    const fromIdx = cancel?.from ? ORDER_STATUS_PATH.indexOf(cancel.from as (typeof ORDER_STATUS_PATH)[number]) : -1;
    const lastIdx = Math.max(0, fromIdx, ...ORDER_STATUS_PATH.map((s, i) => (reachedAt.has(s) ? i : 0)));
    return [
      ...ORDER_STATUS_PATH.slice(0, lastIdx + 1).map((s) => ({ key: s, label: ORDER_STATUS_LABEL[s], at: fmt(s), state: "done" as const })),
      { key: "cancelled", label: ORDER_STATUS_LABEL.cancelled, at: fmt("cancelled"), state: "cancelled" },
    ];
  }

  const current = ORDER_STATUS_PATH.indexOf(status);
  return ORDER_STATUS_PATH.map((s, i) => ({
    key: s,
    label: ORDER_STATUS_LABEL[s],
    at: i <= current ? fmt(s) : null,
    // "completed" is terminal, so it reads as done rather than in progress.
    state: i < current || (i === current && s === "completed") ? "done" : i === current ? "current" : "upcoming",
  }));
}
