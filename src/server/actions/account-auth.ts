"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db, schema } from "@/db";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { safeNextPath } from "@/lib/safe-redirect";
import { loginSchema, signupSchema } from "@/lib/validators/account";
import { sendAccountEmail } from "../account-emails";
import { clearCustomerSession, createCustomerSession, hashPassword, verifyPassword } from "../customer-auth";
import { issueCustomerToken } from "../customer-tokens";
import { dbErrorCode, isDuplicateKey } from "../db-errors";
import { linkGuestOrders } from "../queries/customer-orders";
import { rateLimit, resetRateLimit } from "../rate-limit";
import { getIpHash, hashWithSecret } from "../request";

/**
 * Customer sign-up / sign-in / sign-out (ADR-005). No user enumeration: sign-in has one error
 * message and equal bcrypt work for unknown emails; sign-up always answers "check your inbox" and
 * tells an existing account holder by email instead of on screen.
 */

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
const LOGIN_INVALID = "Incorrect email or password.";

type Values<K extends string> = { values: Partial<Record<K, string>> };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

// ---------------------------------------------------------------------------------------------

export type SignupResult = ActionResult<{ email: string }, Values<"firstName" | "lastName" | "email">>;

export async function signup(_prev: unknown, fd: FormData): Promise<SignupResult> {
  const raw = { firstName: str(fd, "firstName"), lastName: str(fd, "lastName"), email: str(fd, "email"), password: str(fd, "password"), website: str(fd, "website") };
  const values = { firstName: raw.firstName.slice(0, 100), lastName: raw.lastName.slice(0, 100), email: raw.email.slice(0, 255) };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = firstFieldErrors(parsed.error.issues);
    // Honeypot: pretend it worked, write nothing.
    if (fieldErrors.website) return { ok: true, data: { email: values.email } };
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors, values };
  }
  const v = parsed.data;

  const [ip, perEmail] = await Promise.all([
    rateLimit(`signup:ip:${await getIpHash()}`, 5, 60 * 60),
    rateLimit(`signup:email:${hashWithSecret(v.email)}`, 3, 60 * 60),
  ]);
  if (!ip.ok || !perEmail.ok) return { ok: false, error: TOO_MANY, values };

  // Hash first, for every request, so new and existing emails take the same time.
  const passwordHash = await hashPassword(v.password);
  const [existing] = await db
    .select({ id: schema.customers.id, firstName: schema.customers.firstName })
    .from(schema.customers)
    .where(eq(schema.customers.email, v.email))
    .limit(1);

  if (existing) {
    after(() => sendAccountEmail({ kind: "exists", to: v.email, firstName: existing.firstName }));
    return { ok: true, data: { email: v.email } };
  }

  const id = crypto.randomUUID();
  try {
    await db.insert(schema.customers).values({ id, email: v.email, passwordHash, firstName: v.firstName, lastName: v.lastName });
  } catch (err) {
    // Lost a race with another sign-up (or checkout) for the same email: same answer as "exists".
    if (isDuplicateKey(err, "customers_email_uq")) return { ok: true, data: { email: v.email } };
    console.error(`[signup] insert failed: ${dbErrorCode(err)}`);
    return { ok: false, error: "We couldn't create your account. Please try again.", values };
  }
  const token = await issueCustomerToken(id, "verify_email");
  after(() => sendAccountEmail({ kind: "verify", to: v.email, firstName: v.firstName, token }));
  return { ok: true, data: { email: v.email } };
}

// ---------------------------------------------------------------------------------------------

export type LoginResult = ActionResult<never, Values<"email">>;

export async function login(_prev: unknown, fd: FormData): Promise<LoginResult> {
  const values = { email: str(fd, "email").slice(0, 255) };
  const parsed = loginSchema.safeParse({ email: str(fd, "email"), password: str(fd, "password"), next: str(fd, "next") || undefined });
  if (!parsed.success) return { ok: false, error: "Enter your email address and password.", fieldErrors: firstFieldErrors(parsed.error.issues), values };
  const v = parsed.data;

  const emailKey = `login:email:${hashWithSecret(v.email)}`;
  const [ip, perEmail] = await Promise.all([
    rateLimit(`login:ip:${await getIpHash()}`, 20, 15 * 60),
    rateLimit(emailKey, 5, 15 * 60),
  ]);
  if (!ip.ok || !perEmail.ok) return { ok: false, error: TOO_MANY, values };

  const [c] = await db.select().from(schema.customers).where(eq(schema.customers.email, v.email)).limit(1);
  const valid = await verifyPassword(v.password, c?.passwordHash); // runs bcrypt even when c is undefined
  if (!c || !valid) return { ok: false, error: LOGIN_INVALID, values };

  await db.update(schema.customers).set({ lastLoginAt: new Date() }).where(eq(schema.customers.id, c.id));
  if (c.emailVerifiedAt) {
    // Guest orders placed since the last visit. Never blocks signing in.
    try {
      await db.transaction((tx) => linkGuestOrders(tx, c.id, c.email));
    } catch (err) {
      console.error(`[login] guest-order link failed: ${dbErrorCode(err)}`);
    }
  }
  await resetRateLimit(emailKey);
  await createCustomerSession(c);
  redirect(safeNextPath(v.next, "/account"));
}

// ---------------------------------------------------------------------------------------------

export async function logout(): Promise<void> {
  await clearCustomerSession();
  redirect("/");
}
