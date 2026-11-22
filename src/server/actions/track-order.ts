"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { OrderStatus } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { formatLondonDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_PATH, royalMailTrackingUrl } from "@/lib/order-status";
import { grantOrderAccess } from "../order-access";
import { ORDER_NO_PATTERN } from "../order-number";
import { getOrderByNo, getOrderStatusChanges } from "../queries/orders";
import { rateLimit } from "../rate-limit";
import { getIpHash } from "../request";

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

type Values = { values: { orderNo: string; email: string } };

const input = z.object({
  // Accept "alv-7kq2xm", "ALV 7KQ2XM" or just "7KQ2XM": customers copy it from bank statements.
  orderNo: z
    .string()
    .transform((s) => s.toUpperCase().replace(/[\s-]+/g, ""))
    .transform((s) => `ALV-${s.length === 9 && s.startsWith("ALV") ? s.slice(3) : s}`)
    .pipe(z.string().regex(ORDER_NO_PATTERN)),
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),
});

/** One message for every miss: never reveals whether an order number exists. */
const NOT_FOUND =
  "We couldn't find an order matching those details. Check the order number and the email address used at checkout.";

const digest = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest();

/**
 * Look up an order by order number + email. Rate limited per hashed IP, email compared in
 * constant time (against a dummy when the order doesn't exist), no address or phone returned.
 * A match also unlocks the full confirmation page (payment details) in this browser.
 */
export async function trackOrder(_prev: unknown, formData: FormData): Promise<ActionResult<TrackedOrder, Values>> {
  const raw = { orderNo: String(formData.get("orderNo") ?? ""), email: String(formData.get("email") ?? "") };
  const values = { orderNo: raw.orderNo.slice(0, 32), email: raw.email.slice(0, 255) };

  const parsed = input.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Enter your order number (for example ALV-7KQ2XM) and the email used at checkout.", values };
  }

  const limit = await rateLimit(`track-order:${await getIpHash()}`, 10, 10 * 60);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again.", values };

  const order = await getOrderByNo(parsed.data.orderNo);
  const match = timingSafeEqual(digest(order?.email ?? "\u0000no-order"), digest(parsed.data.email)) && !!order;
  if (!match || !order) return { ok: false, error: NOT_FOUND, values };

  const [changes] = await Promise.all([getOrderStatusChanges(order.id), grantOrderAccess(order.orderNo)]);

  return {
    ok: true,
    data: {
      orderNo: order.orderNo,
      status: order.status,
      statusLabel: ORDER_STATUS_LABEL[order.status],
      placedAt: formatLondonDateTime(order.createdAt),
      timeline: buildTimeline(order.status, order.createdAt, changes),
      items: order.items.map((i) => ({ id: i.id, name: i.productName, quantity: i.quantity, lineTotalPence: i.lineTotalPence })),
      subtotalPence: order.subtotalPence,
      shippingPence: order.shippingPence,
      totalPence: order.totalPence,
      tracking: order.trackingNumber
        ? { number: order.trackingNumber, url: royalMailTrackingUrl(order.trackingNumber) }
        : null,
    },
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
