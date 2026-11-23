import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { passwordVersion, safeEqual, verifyPassword } from "./password";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, sessionCookieOptions, signAdminToken, verifyAdminToken } from "./session-tokens";

/**
 * Admin authentication (ADR-006): one admin, credentials in env, jose HS256 session in the httpOnly
 * `alluvi_admin` cookie (7 days). `proxy.ts` only redirects optimistically; THIS module is the
 * security boundary: every admin page and Server Action must call `requireAdmin()`.
 */

export type AdminSession = { email: string };

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
let warnedBadHash = false;

/**
 * ADMIN_PASSWORD_HASH, or null when unset or mangled. Next's env loader expands `$…` in .env
 * files AND in a real environment variable whose key also appears in any .env file, so an
 * unescaped bcrypt hash can arrive empty. Always store it escaped (`\$2b\$12\$…`, the form
 * `npm run hash-password` prints): it survives expansion, and any leftover `\$` is unescaped here.
 */
function adminConfig(): { email: string; hash: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim().replace(/\\\$/g, "$");
  if (!email || !hash || !BCRYPT_HASH.test(hash)) {
    if (!warnedBadHash) {
      warnedBadHash = true;
      console.error("[auth] ADMIN_EMAIL / ADMIN_PASSWORD_HASH missing or malformed; admin login is disabled. See .env.example.");
    }
    return null;
  }
  return { email, hash };
}

/**
 * Checks email + password. Always runs exactly one bcrypt compare and compares the email in
 * constant time, so neither a wrong email nor a missing config is distinguishable by timing.
 */
export async function checkAdminCredentials(email: string, password: string): Promise<boolean> {
  const config = adminConfig();
  const emailOk = safeEqual(email.trim().toLowerCase(), config?.email ?? "\u0000");
  const passwordOk = await verifyPassword(password, config?.hash);
  return !!config && emailOk && passwordOk;
}

/** Call only from a Server Action or Route Handler (sets a cookie). */
export async function createSession(): Promise<void> {
  const config = adminConfig();
  if (!config) throw new Error("Admin credentials are not configured");
  const token = await signAdminToken({ email: config.email, pv: passwordVersion(config.hash) });
  (await cookies()).set(ADMIN_COOKIE, token, sessionCookieOptions(ADMIN_SESSION_SECONDS));
}

/**
 * The current admin, or null. Authoritative: verifies signature/expiry, that the token is for the
 * configured ADMIN_EMAIL, and that it was issued for the CURRENT password hash (rotating the hash
 * signs every session out). Memoised per request.
 */
export const verifySession = cache(async (): Promise<AdminSession | null> => {
  const claims = await verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  const config = adminConfig();
  if (!claims || !config) return null;
  if (!safeEqual(claims.pv, passwordVersion(config.hash))) return null;
  return { email: claims.email };
});

/** Call only from a Server Action or Route Handler (deletes a cookie). */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

/**
 * Guard for every admin page, layout section and Server Action. Redirects to /admin/login when
 * there is no valid session; in a Server Action that redirect aborts the action before it acts.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await verifySession();
  if (!session) redirect("/admin/login");
  return session;
}
