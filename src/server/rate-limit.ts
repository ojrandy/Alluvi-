import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: Date };

/**
 * Fixed-window limiter in the `rate_limits` table, shared by every Passenger worker (an in-memory
 * limiter would not be). One atomic upsert per call: a new window starts when the old one expired.
 *
 * In ON DUPLICATE KEY UPDATE, MySQL/MariaDB apply assignments left to right, so `count` is
 * computed from the OLD reset_at before reset_at itself is updated.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const k = key.slice(0, 191);
  await db.execute(sql`
    INSERT INTO rate_limits (\`key\`, \`count\`, reset_at)
    VALUES (${k}, 1, UTC_TIMESTAMP() + INTERVAL ${windowSeconds} SECOND)
    ON DUPLICATE KEY UPDATE
      \`count\` = IF(reset_at <= UTC_TIMESTAMP(), 1, \`count\` + 1),
      reset_at = IF(reset_at <= UTC_TIMESTAMP(), UTC_TIMESTAMP() + INTERVAL ${windowSeconds} SECOND, reset_at)
  `);
  const [row] = await db
    .select({ count: schema.rateLimits.count, resetAt: schema.rateLimits.resetAt })
    .from(schema.rateLimits)
    .where(eq(schema.rateLimits.key, k))
    .limit(1);
  const count = row?.count ?? 1;
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt: row?.resetAt ?? new Date() };
}
