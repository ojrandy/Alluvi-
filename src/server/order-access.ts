import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

/**
 * Which order confirmations this browser may view in full: order numbers placed here (or unlocked
 * by entering the order email), in a signed httpOnly cookie. Without it the confirmation page asks
 * for the email, so a guessed order number never reveals someone's address or items.
 */
const COOKIE = "alluvi_orders";
const MAX_ORDERS = 10;
const TTL_DAYS = 30;

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be 32+ chars");
    return new TextEncoder().encode("dev-only-order-access-secret-32-chars!!");
  }
  return new TextEncoder().encode(`order-access:${s}`);
}

async function readOrderNos(): Promise<string[]> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return [];
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return Array.isArray(payload.orders) ? payload.orders.filter((o): o is string => typeof o === "string") : [];
  } catch {
    return [];
  }
}

export async function canViewOrder(orderNo: string): Promise<boolean> {
  return (await readOrderNos()).includes(orderNo);
}

/** Must be called from a Server Action or Route Handler (sets a cookie). */
export async function grantOrderAccess(orderNo: string) {
  const orders = [orderNo, ...(await readOrderNos()).filter((o) => o !== orderNo)].slice(0, MAX_ORDERS);
  const token = await new SignJWT({ orders })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_DAYS * 24 * 60 * 60,
  });
}
