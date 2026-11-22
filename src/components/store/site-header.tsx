import Link from "next/link";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";
import { CartButton } from "./cart-button";
import { MobileNav, MobileNavFallback } from "./mobile-nav";
import { NavLinks, NavList } from "./nav-links";

/**
 * Sticky floating "pill" header, a refined version of the live site's glass nav.
 * Fixed height (--header-height) so it never causes layout shift.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 h-(--header-height) pt-3">
      <div className="container-page">
        <div className="glass backdrop-blur-xl backdrop-saturate-150 flex h-[calc(var(--header-height)-0.75rem)] items-center justify-between gap-2 rounded-full border border-border pr-1.5 pl-5 shadow-soft">
          <Link
            href="/"
            className="-ml-1 flex items-center rounded-full px-1 text-foreground transition-opacity hover:opacity-80"
            aria-label="Alluvi home"
          >
            <Logo className="h-8" />
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <Suspense fallback={<NavList links={site.nav} pathname={null} />}>
              <NavLinks links={site.nav} />
            </Suspense>
          </nav>

          <div className="flex items-center">
            <Button
              asChild
              variant="ghost"
              size="icon-touch"
              className="hidden hover:bg-white/[0.06] sm:inline-flex"
            >
              <Link href="/account" aria-label="My account">
                <UserRound className="size-5" aria-hidden="true" />
              </Link>
            </Button>
            <CartButton />
            <Suspense fallback={<MobileNavFallback />}>
              <MobileNav />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
