/**
 * Lab-report link policy.
 *
 * The recovered Janoshik verification links (verify.janoshik.com) are for the old alluvi.store
 * batches and show that domain, so they must not be exposed. Until certificates for this domain
 * are issued, every Janoshik link resolves to the contact page's certificate-request section.
 * The raw URLs stay in content/ and the DB untouched; when real links arrive, only this file
 * (or the stored URLs) needs to change.
 */
export const LAB_LINK_PLACEHOLDER = "/contact#certificates";

const BLOCKED_HOST = /(^|\.)janoshik\.com$/i;

/** Returns the href to render for a lab-report URL. */
export function labLink(url: string): string {
  try {
    if (BLOCKED_HOST.test(new URL(url).hostname)) return LAB_LINK_PLACEHOLDER;
  } catch {
    // relative or malformed: leave as-is (callers already validate their own hrefs)
  }
  return url;
}

export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}
