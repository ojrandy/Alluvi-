"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { safeNextPath } from "@/lib/safe-redirect";
import { checkAdminCredentials, createSession, destroySession } from "../auth";
import { rateLimit, resetRateLimit } from "../rate-limit";
import { getIpHash } from "../request";

/** 5 attempts per 15 minutes per hashed IP: the 6th is refused without checking the password. */
const LIMIT = { max: 5, windowSeconds: 15 * 60 };
const GLOBAL_MAX = 50;
const INVALID = "Incorrect email or password.";

const input = z.object({
  email: z.string().trim().toLowerCase().max(255),
  password: z.string().min(1).max(200),
  next: z.string().max(512).optional(),
});

type Values = { values: { email: string } };

export async function adminLogin(_prev: unknown, formData: FormData): Promise<ActionResult<never, Values>> {
  const email = String(formData.get("email") ?? "").slice(0, 255);
  const parsed = input.safeParse({
    email,
    password: String(formData.get("password") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  });
  if (!parsed.success) return { ok: false, error: INVALID, values: { email } };

  const key = `admin-login:${await getIpHash()}`;
  const [limit, global] = await Promise.all([
    rateLimit(key, LIMIT.max, LIMIT.windowSeconds),
    // Defence in depth across ALL IPs (e.g. a botnet). Trade-off: a flood can delay the real admin
    // by up to 15 minutes, which beats an unbounded password-guessing rate.
    rateLimit("admin-login:all", GLOBAL_MAX, LIMIT.windowSeconds),
  ]);
  if (!limit.ok || !global.ok) {
    const resetAt = (limit.ok ? global : limit).resetAt;
    const minutes = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 60_000));
    return { ok: false, error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, values: { email } };
  }

  if (!(await checkAdminCredentials(parsed.data.email, parsed.data.password))) {
    return { ok: false, error: INVALID, values: { email } };
  }

  await resetRateLimit(key);
  await createSession();
  redirect(safeNextPath(parsed.data.next, "/admin", "/admin"));
}

export async function adminLogout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
