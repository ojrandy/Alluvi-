import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Client IP, hashed with a server secret so we can rate-limit and spot abuse without storing
 * raw IPs (no PII in the DB or logs).
 *
 * Which x-forwarded-for entry to trust: each proxy APPENDS the address it received the request
 * from, so the left-most entries are whatever the client sent and can be forged. We take the entry
 * added by our own outermost trusted proxy: the right-most one by default (one proxy, e.g. Apache /
 * LiteSpeed in front of Passenger). Set TRUSTED_PROXY_HOPS=2 if another proxy (e.g. a CDN) sits in
 * front. Next.js itself only fills the header from the socket when it is absent.
 */
export async function getIpHash(): Promise<string> {
  const h = await headers();
  return hashWithSecret(clientIp(h.get("x-forwarded-for"), h.get("x-real-ip")));
}

export function clientIp(forwardedFor: string | null, realIp: string | null): string {
  const hops = Math.max(1, Math.trunc(Number(process.env.TRUSTED_PROXY_HOPS ?? 1)) || 1);
  const chain = (forwardedFor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (chain.length > 0) return chain[Math.max(0, chain.length - hops)];
  return realIp?.trim() || "unknown";
}

export function hashWithSecret(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
  return createHash("sha256").update(`${secret ?? "dev-only-secret"}:${value}`).digest("hex");
}
