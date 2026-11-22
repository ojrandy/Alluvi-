"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { NavLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop primary nav with active state. Wrap in <Suspense> with <NavList pathname={null}> as fallback. */
export function NavLinks({ links }: { links: NavLink[] }) {
  return <NavList links={links} pathname={usePathname()} />;
}

/** usePathname() is request data on dynamic routes, so the static shell renders this without an active item. */
export function NavList({ links, pathname }: { links: NavLink[]; pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1">
      {links.map((l) => {
        const active = !l.external && isActivePath(pathname, l.href);
        const cls = cn(
          "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
          active && "bg-white/[0.08] text-foreground",
        );
        return (
          <li key={l.href}>
            {l.external ? (
              <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {l.label}
                <ArrowUpRight className="size-3.5 opacity-60" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <Link href={l.href} className={cls} aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
