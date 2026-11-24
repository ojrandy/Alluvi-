"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LangToggle } from "@/components/i18n/lang-toggle";
import { T } from "@/components/i18n/t";
import type { NavLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Kept visible in the pill on small screens; the rest live in the mobile menu sheet. */
const ALWAYS_VISIBLE = new Set(["/shop", "/track-order"]);

/** Primary nav with active state. Wrap in <Suspense> with <NavList pathname={null}> as fallback. */
export function NavLinks({ links }: { links: NavLink[] }) {
  return <NavList links={links} pathname={usePathname()} />;
}

/** usePathname() is request data on dynamic routes, so the static shell renders this without an active item. */
export function NavList({ links, pathname }: { links: NavLink[]; pathname: string | null }) {
  return (
    <ul className="flex items-center">
      {links.map((l) => {
        const active = !l.external && !l.langToggle && isActivePath(pathname, l.href);
        const cls = cn(
          "inline-flex h-8 items-center rounded-full px-2.5 text-sm font-medium whitespace-nowrap text-[#8d91aa] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-ring",
          active && "bg-white/10 text-white",
        );
        return (
          <li key={l.href} className={ALWAYS_VISIBLE.has(l.href) ? undefined : "hidden md:block"}>
            {l.langToggle ? (
              <LangToggle className={cn(cls, "cursor-pointer")} />
            ) : l.external ? (
              <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
                <T>{l.label}</T>
                <span className="sr-only">
                  {" "}
                  <T>(opens in a new tab)</T>
                </span>
              </a>
            ) : (
              <Link href={l.href} className={cls} aria-current={active ? "page" : undefined}>
                <T>{l.label}</T>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
