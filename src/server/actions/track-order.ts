"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { grantOrderAccess } from "../order-access";
import { ORDER_NO_PATTERN } from "../order-number";
import { toTrackedOrder, type TrackedOrder } from "../order-timeline";
import { getOrderByNo } from "../queries/orders";
import { rateLimit } from "../rate-limit";
import { getIpHash } from "../request";

export type { TimelineStep, TrackedOrder } from "../order-timeline";

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

  const [tracked] = await Promise.all([toTrackedOrder(order), grantOrderAccess(order.orderNo)]);
  return { ok: true, data: tracked };
}
