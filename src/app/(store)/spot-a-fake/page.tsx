import type { Metadata } from "next";
import { openGraphFor } from "@/lib/metadata";
import Link from "next/link";
import { ArrowRight, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FakeSellerWatchlist } from "@/components/store/fake-seller-watchlist";

export const metadata: Metadata = {
  title: "Spot a Fake",
  description: "Contact Alluvi with photos of your product to check if it is original or fake.",
  alternates: { canonical: "/spot-a-fake" },
  openGraph: openGraphFor({
    title: "Spot a Fake | Alluvi",
    description: "Contact Alluvi with photos of your product to check if it is original or fake.",
    path: "/spot-a-fake",
  }),
};

/**
 * /spot-a-fake: the verify CTA (routes to /contact — the old external verifier domain was
 * compromised and must never be linked), plus the counterfeit watchlist from the live /fake-sellers
 * page (that URL now 301s to #watchlist here, per CONTENT_INVENTORY).
 */
export default function SpotAFakePage() {
  return (
    <>
      <section className="container-page flex flex-col items-center pt-16 pb-16 text-center md:pt-24 md:pb-24">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand" aria-hidden="true">
          <ScanSearch className="size-7" />
        </span>
        <p className="eyebrow mt-6">Product verification</p>
        <h1 className="text-display mt-4">Spot a Fake</h1>
        <p className="text-lead mt-5 max-w-md">Contact us with photos of your product to check if it is original Alluvi or fake</p>
        <Button asChild variant="brand" size="xl" className="mt-9">
          <Link href="/contact">
            Verify My Product
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <section id="watchlist" aria-labelledby="watchlist-title" className="container-page scroll-mt-24 pb-20 md:pb-28">
        <div className="max-w-2xl">
          <h2 id="watchlist-title" className="text-h1">Fake Alluvi Sellers.</h2>
          <p className="text-lead mt-4">
            Public watchlist of unauthorised sellers reported for distributing counterfeit Alluvi products. Alluvi is sold
            exclusively through{" "}
            <a href="https://alluvihealthcare.co/" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-4">
              alluvihealthcare.co
            </a>
            . If a seller is listed below, do not buy from them.
          </p>
        </div>

        <FakeSellerWatchlist />

        <p className="mt-14 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          This list is maintained by Alluvi for buyer safety. Alluvi products are sold exclusively for in vitro research
          and development use. If you have encountered a seller not listed here who is impersonating Alluvi, please report
          them via our official contact channels.
        </p>
      </section>
    </>
  );
}
