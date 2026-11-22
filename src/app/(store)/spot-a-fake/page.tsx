import type { Metadata } from "next";
import { ArrowUpRight, ScanSearch, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAKE_SELLER_FLAGS, FAKE_SELLERS, type FakeSeller } from "@/components/store/fake-sellers";

export const metadata: Metadata = {
  title: "Spot a Fake",
  description: "Upload an image to check if the product is original Alluvi or fake.",
  alternates: { canonical: "/spot-a-fake" },
};

const VERIFY_URL = "https://spotafakealluvi.com/";
const COUNTRIES: FakeSeller["country"][] = ["United Kingdom", "Brazil", "Paraguay"];

/**
 * /spot-a-fake: the live verify CTA, plus the counterfeit watchlist from the live /fake-sellers
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
        <p className="text-lead mt-5 max-w-md">Upload an image to check if the product is original Alluvi or fake</p>
        <Button asChild variant="brand" size="xl" className="mt-9">
          <a href={VERIFY_URL} target="_blank" rel="noopener noreferrer">
            Verify My Product
            <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
            <span className="sr-only">(opens spotafakealluvi.com in a new tab)</span>
          </a>
        </Button>
      </section>

      <section id="watchlist" aria-labelledby="watchlist-title" className="container-page scroll-mt-24 pb-20 md:pb-28">
        <div className="max-w-2xl">
          <h2 id="watchlist-title" className="text-h1">Fake Alluvi Sellers.</h2>
          <p className="text-lead mt-4">
            Public watchlist of unauthorised sellers reported for distributing counterfeit Alluvi products. Alluvi is sold
            exclusively through{" "}
            <a href="https://alluvi.org/" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-4">
              alluvi.org
            </a>
            . If a seller is listed below, do not buy from them.
          </p>
        </div>

        {COUNTRIES.map((country) => {
          const sellers = FAKE_SELLERS.filter((s) => s.country === country);
          return (
            <div key={country} className="mt-12">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <span aria-hidden="true">{FAKE_SELLER_FLAGS[country]}</span>
                {country} <span className="text-muted-foreground">({sellers.length})</span>
              </h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
                {sellers.map((s) => (
                  <li key={s.name} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                    <span className="self-start rounded-full bg-destructive/15 px-2.5 py-1 text-[0.65rem] font-bold tracking-wider text-destructive uppercase">
                      Counterfeit
                    </span>
                    <p className="mt-4 font-semibold">{s.name}</p>
                    <p className="mt-1 text-[0.7rem] font-bold tracking-wider text-muted-foreground uppercase">{s.channel}</p>
                    <p className="mt-1 font-mono text-sm break-all text-foreground/85">{s.handle}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{s.note}</p>
                    <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
                      <ShieldX className="size-4" aria-hidden="true" />
                      Do Not Buy
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <p className="mt-14 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          This list is maintained by Alluvi for buyer safety. Alluvi products are sold exclusively for in vitro research
          and development use. If you have encountered a seller not listed here who is impersonating Alluvi, please report
          them via our official contact channels.
        </p>
      </section>
    </>
  );
}
