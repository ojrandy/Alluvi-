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
 * Sticky, centred, compact glass pill, matching the live site's nav: "ALLUVI" wordmark followed by
 * Shop · Verify · About Us · Track · Alluvi Brazil. Account and cart sit at the pill's right end
 * (the live site has no cart). Fixed height (--header-height) so it never causes layout shift.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 h-(--header-height) pt-3">
      <div className="container-page flex justify-center">
        <div className="flex h-[3.125rem] max-w-full items-center rounded-full border border-white/10 bg-[rgb(33_33_33/0.8)] pr-1 pl-5 shadow-[0_14px_20px_rgb(0_0_0/0.21)] backdrop-blur-[34px] backdrop-saturate-150">
          <Link
            href="/"
            className="mr-2 flex shrink-0 items-center rounded-full py-2 text-white transition-opacity hover:opacity-80"
            aria-label="Alluvi home"
          >
            <Logo wordmarkOnly className="h-[0.95rem]" />
          </Link>

          <nav aria-label="Primary" className="min-w-0">
            <Suspense fallback={<NavList links={site.nav} pathname={null} />}>
              <NavLinks links={site.nav} />
            </Suspense>
          </nav>

          <span className="mx-1.5 h-5 w-px shrink-0 bg-white/10" aria-hidden="true" />

          <div className="flex shrink-0 items-center">
            <Button asChild variant="ghost" size="icon-touch" className="hidden hover:bg-white/[0.06] sm:inline-flex">
              <Link href="/account" aria-label="My account">
                <UserRound className="size-[1.125rem]" aria-hidden="true" />
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
