import "server-only";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

/**
 * Customer accounts (ADR-005). Built in D1-8 for "create an account at checkout"; D2-1A adds the
 * login/signup/reset pages on top of these helpers.
 *
 * Session: HS256 JWT in the httpOnly `alluvi_customer` cookie, signed with CUSTOMER_SESSION_SECRET
 * (separate from the admin secret), 7-day expiry.
 */
export const CUSTOMER_COOKIE = "alluvi_customer";
const SESSION_DAYS = 7;
const BCRYPT_COST = 12;

function secretKey() {
  const s = process.env.CUSTOMER_SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("CUSTOMER_SESSION_SECRET must be 32+ chars");
    return new TextEncoder().encode("dev-only-customer-secret-change-me-32chars");
  }
  return new TextEncoder().encode(s);
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function createCustomerSession(customerId: string) {
  const token = await new SignJWT({ sub: customerId, typ: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** The logged-in customer's id, or null. Never throws on a bad/expired cookie. */
export async function getCustomerSession(): Promise<{ customerId: string } | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.typ !== "customer" || typeof payload.sub !== "string") return null;
    return { customerId: payload.sub };
  } catch {
    return null;
  }
}

export async function clearCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}
