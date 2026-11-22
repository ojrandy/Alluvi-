import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Client IP, hashed with a server secret so we can rate-limit and spot abuse without storing
 * raw IPs (no PII in the DB or logs). Behind Passenger/Apache the client IP is the first
 * x-forwarded-for entry.
 */
export async function getIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
  return hashWithSecret(ip);
}

export function hashWithSecret(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
  return createHash("sha256").update(`${secret ?? "dev-only-secret"}:${value}`).digest("hex");
}
