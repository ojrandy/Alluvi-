/**
 * Signed session tokens (jose HS256) for the admin and customer cookies.
 *
 * Deliberately free of `server-only`, `next/headers` and the DB, because `src/proxy.ts` imports it for
 * its optimistic redirects. Never import this from a Client Component: it reads server secrets.
 *
 * The two sessions are fully separate (ADR-005/006): different cookies, different keys, different
 * `typ` claims, so a customer token can never verify as an admin token or vice versa.
 */
import { jwtVerify, SignJWT } from "jose";

export const ADMIN_COOKIE = "alluvi_admin";
export const CUSTOMER_COOKIE = "alluvi_customer";
export const ADMIN_SESSION_SECONDS = 7 * 24 * 60 * 60;
export const CUSTOMER_SESSION_SECONDS = 30 * 24 * 60 * 60;

const isProd = () => process.env.NODE_ENV === "production";

/**
 * Admin key: SESSION_SECRET, domain-separated so it never equals the order-access or IP-hash keys
 * derived from the same secret. In production a missing/short secret yields `null`: verification
 * then fails closed (redirect to login) and signing throws.
 */
function adminKey(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) return isProd() ? null : new TextEncoder().encode("dev-only-admin-session-secret-32-chars!!");
  return new TextEncoder().encode(`admin-session:${s}`);
}

function customerKey(): Uint8Array | null {
  const s = process.env.CUSTOMER_SESSION_SECRET;
  if (!s || s.length < 32) return isProd() ? null : new TextEncoder().encode("dev-only-customer-secret-change-me-32chars");
  return new TextEncoder().encode(s);
}

function required(key: Uint8Array | null, name: string): Uint8Array {
  if (!key) throw new Error(`${name} must be set to 32+ characters`);
  return key;
}

export type AdminClaims = { email: string; pv: string };
export type CustomerClaims = { customerId: string; pv: string };

/** `pv` = password version: a short fingerprint of the password hash, so a password change revokes old sessions. */
export async function signAdminToken({ email, pv }: AdminClaims): Promise<string> {
  return new SignJWT({ typ: "admin", pv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_SECONDS}s`)
    .sign(required(adminKey(), "SESSION_SECRET"));
}

/** Signature, expiry, type and the configured ADMIN_EMAIL. The password-version check needs the env hash and lives in auth.ts. */
export async function verifyAdminToken(token: string | undefined): Promise<AdminClaims | null> {
  const key = adminKey();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!token || !key || !adminEmail) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (payload.typ !== "admin" || payload.sub !== adminEmail || typeof payload.pv !== "string") return null;
    return { email: payload.sub, pv: payload.pv };
  } catch {
    return null;
  }
}

export async function signCustomerToken({ customerId, pv }: CustomerClaims): Promise<string> {
  return new SignJWT({ typ: "customer", pv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_SESSION_SECONDS}s`)
    .sign(required(customerKey(), "CUSTOMER_SESSION_SECRET"));
}

export async function verifyCustomerToken(token: string | undefined): Promise<CustomerClaims | null> {
  const key = customerKey();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (payload.typ !== "customer" || typeof payload.sub !== "string" || typeof payload.pv !== "string") return null;
    return { customerId: payload.sub, pv: payload.pv };
  } catch {
    return null;
  }
}

/** Cookie options shared by both sessions (httpOnly, Secure in production, SameSite=Lax). */
export const sessionCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
