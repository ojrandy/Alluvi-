import "server-only";

/**
 * True for a MySQL/MariaDB duplicate-key error, optionally on a specific unique index. Drizzle
 * wraps driver errors, so walk the `cause` chain.
 */
export function isDuplicateKey(err: unknown, indexName?: string): boolean {
  for (let e: unknown = err, depth = 0; e && depth < 4; depth++) {
    const o = e as { code?: string; message?: string; cause?: unknown };
    if (o.code === "ER_DUP_ENTRY" && (!indexName || (o.message ?? "").includes(indexName))) return true;
    e = o.cause;
  }
  return false;
}

/** Driver error code for logs (never the message, which can echo personal data). */
export function dbErrorCode(err: unknown): string {
  for (let e: unknown = err, depth = 0; e && depth < 4; depth++) {
    const o = e as { code?: unknown; cause?: unknown };
    if (typeof o.code === "string") return o.code;
    e = o.cause;
  }
  return "UNKNOWN";
}
