import "server-only";
import { customAlphabet } from "nanoid";
import { ORDER_NO_PREFIX } from "@/lib/constants";

/** No 0/O, 1/I/L: order numbers are read aloud and typed as bank references. 31^6 ≈ 887M. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generate = customAlphabet(ALPHABET, 6);

export const newOrderNo = () => `${ORDER_NO_PREFIX}${generate()}`;

export const ORDER_NO_PATTERN = /^ALV-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;

/** True when a DB error is the orders.order_no unique index (so placeOrder retries with a new number). */
export function isOrderNoCollision(err: unknown): boolean {
  for (let e: unknown = err, depth = 0; e && depth < 4; depth++) {
    const o = e as { code?: string; message?: string; cause?: unknown };
    if (o.code === "ER_DUP_ENTRY" && /orders_order_no_uq/.test(o.message ?? "")) return true;
    e = o.cause;
  }
  return false;
}
