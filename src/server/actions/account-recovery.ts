"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db, schema } from "@/db";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { forgotPasswordSchema, resetPasswordSchema, tokenSchema } from "@/lib/validators/account";
import { sendAccountEmail } from "../account-emails";
import { createCustomerSession, hashPassword, requireCustomer } from "../customer-auth";
import { consumeCustomerToken, issueCustomerToken } from "../customer-tokens";
import { dbErrorCode } from "../db-errors";
import { linkGuestOrders } from "../queries/customer-orders";
import { rateLimit } from "../rate-limit";
import { getIpHash, hashWithSecret } from "../request";

/**
 * Password reset + email verification (ADR-005). Tokens are sha256-hashed, single use, 30 minutes.
 * Proving control of the email (either flow) sets email_verified_at and links earlier guest orders.
 */

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
const LINK_INVALID = "This link has expired or has already been used.";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

// ---------------------------------------------------------------------------------------------

export type ForgotResult = ActionResult<{ email: string }, { values: { email: string } }>;

/** Always the same answer, whether or not the email has an account. */
export async function forgotPassword(_prev: unknown, fd: FormData): Promise<ForgotResult> {
  const values = { email: str(fd, "email").slice(0, 255) };
  const parsed = forgotPasswordSchema.safeParse({ email: str(fd, "email") });
  if (!parsed.success) return { ok: false, error: "Enter a valid email address.", fieldErrors: firstFieldErrors(parsed.error.issues), values };
  const { email } = parsed.data;

  const [ip, perEmail] = await Promise.all([
    rateLimit(`forgot:ip:${await getIpHash()}`, 5, 15 * 60),
    rateLimit(`forgot:email:${hashWithSecret(email)}`, 3, 60 * 60),
  ]);
  if (!ip.ok) return { ok: false, error: TOO_MANY, values };
  // Over the per-email limit: answer as usual but send nothing (no inbox flooding, no signal).
  if (!perEmail.ok) return { ok: true, data: { email } };

  const [c] = await db
    .select({ id: schema.customers.id, firstName: schema.customers.firstName })
    .from(schema.customers)
    .where(eq(schema.customers.email, email))
    .limit(1);
  if (c) {
    const token = await issueCustomerToken(c.id, "reset_password");
    after(() => sendAccountEmail({ kind: "reset", to: email, firstName: c.firstName, token }));
  }
  return { ok: true, data: { email } };
}

// ---------------------------------------------------------------------------------------------

export type ResetResult = ActionResult<never>;

export async function resetPassword(_prev: unknown, fd: FormData): Promise<ResetResult> {
  const parsed = resetPasswordSchema.safeParse({ token: str(fd, "token"), password: str(fd, "password"), confirmPassword: str(fd, "confirmPassword") });
  if (!parsed.success) {
    const fieldErrors = firstFieldErrors(parsed.error.issues);
    if (fieldErrors.token) return { ok: false, error: LINK_INVALID };
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const limit = await rateLimit(`reset:ip:${await getIpHash()}`, 10, 15 * 60);
  if (!limit.ok) return { ok: false, error: TOO_MANY };

  const passwordHash = await hashPassword(parsed.data.password); // outside the transaction: bcrypt is slow
  let customer: { id: string; passwordHash: string } | null = null;
  try {
    customer = await db.transaction(async (tx) => {
      const customerId = await consumeCustomerToken(tx, parsed.data.token, "reset_password");
      if (!customerId) return null;
      const [c] = await tx.select().from(schema.customers).where(eq(schema.customers.id, customerId)).limit(1).for("update");
      if (!c) return null;
      // Receiving the reset email proves the address, so this also verifies it.
      await tx
        .update(schema.customers)
        .set({ passwordHash, emailVerifiedAt: c.emailVerifiedAt ?? new Date() })
        .where(eq(schema.customers.id, c.id));
      await linkGuestOrders(tx, c.id, c.email);
      return { id: c.id, passwordHash };
    });
  } catch (err) {
    console.error(`[reset-password] failed: ${dbErrorCode(err)}`);
    return { ok: false, error: "We couldn't update your password. Please try again." };
  }
  if (!customer) return { ok: false, error: LINK_INVALID };

  // New password version: every other session for this account is now invalid.
  await createCustomerSession(customer);
  redirect("/account?updated=password");
}

// ---------------------------------------------------------------------------------------------

export type VerifyResult = ActionResult<never>;

export async function verifyEmail(_prev: unknown, fd: FormData): Promise<VerifyResult> {
  const parsed = tokenSchema.safeParse(str(fd, "token"));
  if (!parsed.success) return { ok: false, error: LINK_INVALID };

  const limit = await rateLimit(`verify:ip:${await getIpHash()}`, 10, 15 * 60);
  if (!limit.ok) return { ok: false, error: TOO_MANY };

  let customer: { id: string; passwordHash: string } | null = null;
  try {
    customer = await db.transaction(async (tx) => {
      const customerId = await consumeCustomerToken(tx, parsed.data, "verify_email");
      if (!customerId) return null;
      const [c] = await tx.select().from(schema.customers).where(eq(schema.customers.id, customerId)).limit(1).for("update");
      if (!c) return null;
      if (!c.emailVerifiedAt) await tx.update(schema.customers).set({ emailVerifiedAt: new Date() }).where(eq(schema.customers.id, c.id));
      await linkGuestOrders(tx, c.id, c.email);
      return { id: c.id, passwordHash: c.passwordHash };
    });
  } catch (err) {
    console.error(`[verify-email] failed: ${dbErrorCode(err)}`);
    return { ok: false, error: "We couldn't confirm your email. Please try again." };
  }
  if (!customer) return { ok: false, error: LINK_INVALID };

  await createCustomerSession(customer);
  redirect("/account?updated=verified");
}

// ---------------------------------------------------------------------------------------------

export type ResendResult = ActionResult<{ email: string }>;

/** For a signed-in, unverified customer (e.g. their first link expired). */
export async function resendVerification(): Promise<ResendResult> {
  const customer = await requireCustomer();
  if (customer.emailVerified) return { ok: true, data: { email: customer.email } };

  const limit = await rateLimit(`verify-resend:${customer.id}`, 3, 60 * 60);
  if (!limit.ok) return { ok: false, error: "We've sent a few links already. Please check your inbox (and spam folder), or try again later." };

  const token = await issueCustomerToken(customer.id, "verify_email");
  after(() => sendAccountEmail({ kind: "verify", to: customer.email, firstName: customer.firstName, token }));
  return { ok: true, data: { email: customer.email } };
}
