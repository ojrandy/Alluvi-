import Link from "next/link";
import type { ReactNode } from "react";
import { isInternalHref, labLink } from "@/lib/lab-links";

/**
 * Link to a lab report. Janoshik URLs are rewritten to the contact page (see lib/lab-links) and
 * open in the same tab; any other external URL opens in a new tab with an sr-only hint.
 * Safe in both server and client components.
 */
export function LabReportLink({
  href,
  className,
  children,
  newTabHint = "(opens in a new tab)",
}: {
  href: string;
  className?: string;
  children: ReactNode;
  newTabHint?: ReactNode;
}) {
  const target = labLink(href);
  if (isInternalHref(target)) {
    return (
      <Link href={target} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={target} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> {newTabHint}</span>
    </a>
  );
}
