import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import type { Address } from "@/db/schema";
import { passwordVersion, safeEqual } from "./password";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_SESSION_SECONDS,
  sessionCookieOptions,
  signCustomerToken,
  verifyCustomerToken,
} from "./session-tokens";

export { hashPassword, verifyPassword } from "./password";
export { CUSTOMER_COOKIE };

/**
 * Customer accounts (ADR-005). Session: HS256 JWT in the httpOnly `alluvi_customer` cookie signed
 * with CUSTOMER_SESSION_SECRET (never the admin secret), 30-day expiry. The token carries a
 * fingerprint of the password hash, so resetting the password signs out every other device.
 */

/** What the app may know about the signed-in customer. Never includes the password hash. */
export type CurrentCustomer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  defaultAddress: Address | null;
  emailVerified: boolean;
};

/** Call only from a Server Action or Route Handler (sets a cookie). */
export async function createCustomerSession(customer: { id: string; passwordHash: string }) {
  const token = await signCustomerToken({ customerId: customer.id, pv: passwordVersion(customer.passwordHash) });
  (await cookies()).set(CUSTOMER_COOKIE, token, sessionCookieOptions(CUSTOMER_SESSION_SECONDS));
}

export async function clearCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

/**
 * The signed-in customer, or null. Authoritative: verifies the token AND that the account still
 * exists with the same password. Never throws on a bad/expired cookie. Memoised per request.
 */
export const getCurrentCustomer = cache(async (): Promise<CurrentCustomer | null> => {
  const claims = await verifyCustomerToken((await cookies()).get(CUSTOMER_COOKIE)?.value);
  if (!claims) return null;
  const [c] = await db.select().from(schema.customers).where(eq(schema.customers.id, claims.customerId)).limit(1);
  if (!c || !safeEqual(claims.pv, passwordVersion(c.passwordHash))) return null;
  return {
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    defaultAddress: c.defaultAddress ?? null,
    emailVerified: !!c.emailVerifiedAt,
  };
});

/**
 * Guard for every /account page and account Server Action. `nextPath` is where to return after
 * signing in (validated again on the login side).
 */
export async function requireCustomer(nextPath = "/account"): Promise<CurrentCustomer> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return customer;
}
