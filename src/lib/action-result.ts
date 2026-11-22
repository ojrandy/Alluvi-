/** Uniform Server Action return shape (CONVENTIONS): never throw raw errors to the client. */
export type ActionResult<T, E extends object = object> =
  | { ok: true; data: T }
  | ({ ok: false; error: string; fieldErrors?: Record<string, string> } & Partial<E>);

/** First message per field from a Zod error's flattened issues. */
export function firstFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".") || "_form";
    out[key] ??= i.message;
  }
  return out;
}
