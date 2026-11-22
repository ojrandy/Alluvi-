import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "Alluvi's First Compounding Pharmacy in London",
  description:
    "Alluvi is proud to announce the opening of its first compounding pharmacy in the UK, located in London. Opening 13th April.",
  alternates: { canonical: "/our-location" },
};

/**
 * Verbatim from the live /our-location page. The live "See Pharmacy Location" button had no
 * target or address, so it is omitted until the client supplies the address.
 */
export default function OurLocationPage() {
  return (
    <section className="container-page grid items-center gap-12 pt-12 pb-20 md:pt-20 md:pb-28 lg:grid-cols-2 lg:gap-20">
      <div className="relative mx-auto w-full max-w-md lg:order-2">
        <div className="absolute inset-6 rounded-full bg-teal/15 blur-3xl" aria-hidden="true" />
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border">
          <Image
            src="/images/alluvipharmacy.png"
            alt="Alluvi Compounding Pharmacy — London"
            fill
            priority
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-cover"
          />
        </div>
      </div>

      <div>
        <p className="eyebrow">Coming soon</p>
        <h1 className="text-h1 mt-4 text-balance">Alluvi&apos;s First Compounding Pharmacy in London</h1>
        <p className="text-lead mt-6 max-w-lg">
          Alluvi is proud to announce the opening of its first compounding pharmacy in the UK, located in the capital
          city of London.
        </p>
        <div className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
          <CalendarDays className="size-6 text-brand" aria-hidden="true" />
          <div>
            <p className="text-[0.7rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">Opening</p>
            <p className="text-xl font-semibold">13th April</p>
          </div>
        </div>
        <p className="mt-8 max-w-lg text-muted-foreground">
          Customers will be able to visit in store for prescriptions for Alluvi Peptides!
        </p>
      </div>
    </section>
  );
}
