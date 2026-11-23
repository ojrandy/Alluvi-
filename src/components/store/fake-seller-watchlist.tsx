"use client";

import { useState } from "react";
import { ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAKE_SELLER_FLAGS, FAKE_SELLERS, type FakeSeller } from "./fake-sellers";

type Country = FakeSeller["country"];
const COUNTRIES: Country[] = ["United Kingdom", "Brazil", "Paraguay"];

/**
 * Counterfeit watchlist with the live /fake-sellers country filter: All (12) · United Kingdom (4) ·
 * Brazil (4) · Paraguay (4). Server-rendered with "All" selected, so every seller is in the HTML
 * without JavaScript; the filter only narrows what is shown.
 */
export function FakeSellerWatchlist() {
  const [filter, setFilter] = useState<Country | "All">("All");
  const shown = filter === "All" ? COUNTRIES : [filter];

  const tabs: { key: Country | "All"; label: string; count: number }[] = [
    { key: "All", label: "All", count: FAKE_SELLERS.length },
    ...COUNTRIES.map((c) => ({ key: c, label: c, count: FAKE_SELLERS.filter((s) => s.country === c).length })),
  ];

  return (
    <>
      <div role="group" aria-label="Filter sellers by country" className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(t.key)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-white/25 hover:text-foreground",
              )}
            >
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {shown.map((country) => {
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
    </>
  );
}
