import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

/**
 * Hash of a random string nobody knows. Compared against when an account/email doesn't exist, so a
 * miss costs the same bcrypt time as a hit and response timing doesn't reveal which emails exist.
 */
const DUMMY_HASH = "$2b$12$WoHHsk3bbbDQjCzQWre7deTc2OiDQhi78eiT5mz50CkQljMaBG6PG";

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

/** Always runs one bcrypt compare, even when `hash` is missing. */
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(password, hash || DUMMY_HASH);
  return ok && !!hash;
}

/**
 * Short, non-reversible fingerprint of a password hash, stored in the session token (`pv`).
 * Changing the password changes it, which signs out every other session.
 */
export const passwordVersion = (hash: string) => createHash("sha256").update(hash).digest("base64url").slice(0, 16);

/** Constant-time string equality for secrets/identifiers of any length. */
export function safeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db) && a.length === b.length;
}
