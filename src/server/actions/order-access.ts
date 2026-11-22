"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import type { ActionResult } from "@/lib/action-result";
import { grantOrderAccess } from "../order-access";
import { ORDER_NO_PATTERN } from "../order-number";
import { rateLimit } from "../rate-limit";
import { getIpHash } from "../request";

const input = z.object({
  orderNo: z.string().trim().toUpperCase().regex(ORDER_NO_PATTERN),
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),
});

const NOT_FOUND = "We couldn't match that email to this order. Check the address you used at checkout.";

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * Unlock an order confirmation in this browser by proving the order email. Same message for a
 * wrong email and an unknown order number; comparison is constant-time; rate limited per IP.
 */
export async function unlockOrder(_prev: unknown, formData: FormData): Promise<ActionResult<{ orderNo: string }>> {
  const parsed = input.safeParse({ orderNo: formData.get("orderNo"), email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Enter the email address you used at checkout." };

  const limit = await rateLimit(`order-unlock:${await getIpHash()}`, 10, 10 * 60);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };

  const [order] = await db
    .select({ email: schema.orders.email })
    .from(schema.orders)
    .where(eq(schema.orders.orderNo, parsed.data.orderNo))
    .limit(1);
  // Compare against a dummy when the order doesn't exist, so timing doesn't reveal which case it was.
  const match = timingSafeEqual(digest(order?.email ?? "\u0000no-order"), digest(parsed.data.email)) && !!order;
  if (!match) return { ok: false, error: NOT_FOUND };

  await grantOrderAccess(parsed.data.orderNo);
  return { ok: true, data: { orderNo: parsed.data.orderNo } };
}
