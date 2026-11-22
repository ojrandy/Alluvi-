"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { isActivePath } from "./nav-links";

const SECONDARY = [
  { label: "Announcements", href: "/announcements" },
  { label: "Spot a Fake", href: "/spot-a-fake" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Press Release", href: "/policies/press-release" },
];

/** Static-shell stand-in for MobileNav (its usePathname() needs request data on dynamic routes). */
export function MobileNavFallback() {
  return (
    <Button variant="ghost" size="icon-touch" aria-label="Open menu" className="md:hidden hover:bg-white/[0.06]">
      <Menu className="size-5" aria-hidden="true" />
    </Button>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-touch" aria-label="Open menu" className="md:hidden hover:bg-white/[0.06]">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] max-w-sm border-border bg-surface p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-foreground">
            <Logo className="h-7" />
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {site.nav.map((l) => {
              const active = !l.external && isActivePath(pathname, l.href);
              const cls = cn(
                "flex min-h-12 items-center justify-between rounded-xl px-3 text-lg font-semibold tracking-tight text-foreground/85 transition-colors hover:bg-white/[0.05] hover:text-foreground",
                active && "bg-white/[0.07] text-foreground",
              );
              return (
                <li key={l.href}>
                  <SheetClose asChild>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {l.label}
                        <ArrowUpRight className="size-4 opacity-60" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link href={l.href} className={cls} aria-current={active ? "page" : undefined}>
                        {l.label}
                      </Link>
                    )}
                  </SheetClose>
                </li>
              );
            })}
          </ul>

          <div className="my-4 h-px bg-border" />

          <ul className="space-y-0.5">
            {SECONDARY.map((l) => (
              <li key={l.href}>
                <SheetClose asChild>
                  <Link
                    href={l.href}
                    className="flex min-h-11 items-center rounded-lg px-3 text-[0.95rem] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>

          <div className="mt-auto space-y-3 px-1 pt-6">
            <SheetClose asChild>
              <Button asChild variant="glass" size="xl" className="w-full">
                <Link href="/account">
                  <UserRound data-icon="inline-start" aria-hidden="true" />
                  My account
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button asChild variant="brand" size="xl" className="w-full">
                <Link href="/shop">Browse Research Peptides</Link>
              </Button>
            </SheetClose>
            <p className="pt-2 text-[0.7rem] leading-relaxed text-muted-foreground">{site.footer.disclaimer}</p>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
