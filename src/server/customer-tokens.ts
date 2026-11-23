import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema, type DbExecutor } from "@/db";
import type { CUSTOMER_TOKEN_TYPES } from "@/db/schema";

/**
 * Single-use email tokens (password reset, email verification). The raw token only ever exists in
 * the emailed link; the DB stores its sha256. 30-minute expiry (DATA_MODEL). Issuing a new token
 * deletes earlier ones of the same type for that customer, so only the newest link works.
 */
export type CustomerTokenType = (typeof CUSTOMER_TOKEN_TYPES)[number];

export const TOKEN_TTL_MINUTES = 30;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function issueCustomerToken(customerId: string, type: CustomerTokenType): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.transaction(async (tx) => {
    await tx
      .delete(schema.customerTokens)
      .where(and(eq(schema.customerTokens.customerId, customerId), eq(schema.customerTokens.type, type)));
    await tx.insert(schema.customerTokens).values({
      customerId,
      type,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
    });
  });
  return raw;
}

type TokenRow = typeof schema.customerTokens.$inferSelect;
const isUsable = (row: TokenRow | undefined, type: CustomerTokenType): row is TokenRow =>
  !!row && row.type === type && !row.usedAt && row.expiresAt.getTime() > Date.now();

/** Read-only check, so a page can show "link expired" before the customer fills in a form. */
export async function isCustomerTokenUsable(raw: string, type: CustomerTokenType): Promise<boolean> {
  if (!TOKEN_RE.test(raw)) return false;
  const [row] = await db.select().from(schema.customerTokens).where(eq(schema.customerTokens.tokenHash, sha256(raw))).limit(1);
  return isUsable(row, type);
}

/**
 * Validates and marks the token used, inside the caller's transaction (row-locked, so two
 * concurrent submits can't both succeed). Returns the customer id, or null for any invalid,
 * expired, used or wrong-type token.
 */
export async function consumeCustomerToken(tx: DbExecutor, raw: string, type: CustomerTokenType): Promise<string | null> {
  if (!TOKEN_RE.test(raw)) return null;
  const [row] = await tx
    .select()
    .from(schema.customerTokens)
    .where(eq(schema.customerTokens.tokenHash, sha256(raw)))
    .limit(1)
    .for("update");
  if (!isUsable(row, type)) return null;
  await tx.update(schema.customerTokens).set({ usedAt: new Date() }).where(eq(schema.customerTokens.id, row.id));
  return row.customerId;
}
