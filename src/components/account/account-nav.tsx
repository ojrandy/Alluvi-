"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", label: "Orders", match: (p: string) => p === "/account" || p.startsWith("/account/orders") },
  { href: "/account/details", label: "Details & address", match: (p: string) => p.startsWith("/account/details") },
];

/** Segmented tabs. usePathname() is request data, so render <AccountNavList pathname={null}> as the Suspense fallback. */
export function AccountNav() {
  return <AccountNavList pathname={usePathname()} />;
}

export function AccountNavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Account" className="-mx-1 overflow-x-auto px-1">
      <ul className="inline-flex gap-1 rounded-full border border-border bg-white/[0.03] p-1">
        {ITEMS.map((item) => {
          const active = !!pathname && item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-white/[0.09] text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
