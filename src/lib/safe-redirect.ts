/**
 * Validates a `?next=` value for a post-login redirect. Only same-origin paths are allowed, so the
 * login page can't be used as an open redirect (`//evil.com`, `/\evil.com`, `https://…`,
 * `javascript:` all fall back). `allowedPrefix` narrows it further, e.g. "/admin".
 */
export function safeNextPath(next: unknown, fallback: string, allowedPrefix = "/"): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 512) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  // Reject control characters (incl. tab/newline, which URL parsing strips).
  for (let i = 0; i < next.length; i++) if (next.charCodeAt(i) < 0x20 || next.charCodeAt(i) === 0x7f) return fallback;
  try {
    const base = "http://same-origin.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (allowedPrefix !== "/" && url.pathname !== allowedPrefix && !url.pathname.startsWith(`${allowedPrefix}/`)) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
