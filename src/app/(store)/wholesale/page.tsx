import type { Metadata } from "next";
import { openGraphFor } from "@/lib/metadata";
import { Mail, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Wholesale",
  description: "Wholesale supply information for Alluvi research products.",
  alternates: { canonical: "/wholesale" },
  openGraph: openGraphFor({
    title: "Wholesale | Alluvi",
    description: "Wholesale supply information for Alluvi research products.",
    path: "/wholesale",
  }),
};

// Verbatim from the live /wholesale page. The live inquiry form posted to the old backend; until the
// wholesale portal (V2-3) ships, enquiries go to the official contact channels in content/site.json.
const TIERS = [
  { name: "Small", range: "50–100 pens", who: "For new partners testing the market", perks: ["Standard pricing", "Email support"] },
  { name: "Medium", range: "100–1,000 pens", who: "For growing wholesale operations", perks: ["Tiered pricing", "Priority fulfilment", "WhatsApp support"] },
  { name: "Large", range: "1,000+ pens", who: "For established distributors", perks: ["Volume pricing", "Scheduled delivery", "Dedicated support"] },
];
const WHY = [
  { title: "Consistent Stock", text: "We keep inventory ready so you never have to explain delays to your customers." },
  { title: "Research-Grade", text: "Every batch comes with documentation. Your customers get what they expect." },
  { title: "Clear Pricing", text: "No hidden fees. No surprises. What we quote is what you pay." },
  { title: "Reliable Delivery", text: "Cold chain shipping. Tracked. Insured. Arrives when we say it will." },
];
const STEPS = [
  { title: "Choose your tier", text: "Small, Medium, or Large. Pick what fits your current volume." },
  { title: "Contact Max", text: "WhatsApp or email. Tell us what you need and when you need it." },
  { title: "Get your quote", text: "We'll send pricing within 24 hours. No obligation." },
  { title: "Place order", text: "Confirm and pay. Your order is dispatched within 24 hours." },
];

export default function WholesalePage() {
  const mailto = `mailto:${site.contact.researchEmail}?subject=${encodeURIComponent("Wholesale inquiry")}`;
  return (
    <>
      <section className="container-page grid gap-10 pt-12 pb-16 md:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow">Wholesale</p>
          <h1 className="text-h1 mt-4 max-w-2xl text-balance">Wholesale orders for Alluvi partners</h1>
          <p className="text-lead mt-5 max-w-xl">
            If you&apos;re buying for customers and need reliable stock, this page gives you the overview. Order sizes
            below set expectations before you speak to Max for current pricing.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="font-semibold">Submit an inquiry</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tell us your name, contact number, quantity and country, and we&apos;ll reply with pricing.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button asChild variant="brand" size="xl">
              <a href={mailto}>
                <Mail data-icon="inline-start" aria-hidden="true" />
                {site.contact.researchEmail}
              </a>
            </Button>
            <Button asChild variant="glass" size="xl">
              <a href={site.contact.telegramUrl} target="_blank" rel="noopener noreferrer">
                <Send data-icon="inline-start" aria-hidden="true" />
                Telegram {site.contact.telegramHandle}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
            <Button asChild variant="glass" size="xl">
              <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle data-icon="inline-start" aria-hidden="true" />
                WhatsApp
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="tiers-title" className="container-page py-12 md:py-16">
        <h2 id="tiers-title" className="text-h2">Order Tiers</h2>
        <p className="mt-3 text-muted-foreground">Three tiers based on volume. Each unlocks better pricing and faster fulfilment.</p>
        <ul className="mt-8 grid gap-5 md:grid-cols-3" role="list">
          {TIERS.map((t, i) => (
            <li key={t.name} className={i === 1 ? "rounded-3xl border border-brand/40 bg-card p-6 shadow-glow" : "rounded-3xl border border-border bg-card p-6"}>
              <p className="eyebrow">{t.name}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{t.range}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.who}</p>
              <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2.5">
                    <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="why-title" className="container-page py-12 md:py-16">
        <h2 id="why-title" className="text-h2">Why wholesale with Alluvi</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          We understand wholesale because we started as researchers. We know what your customers need.
        </p>
        <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-2xl border border-border p-5">
              <dt className="font-semibold">{w.title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="how-title" className="container-page pt-12 pb-20 md:pt-16 md:pb-28">
        <h2 id="how-title" className="text-h2">How to order</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Simple process. No complicated forms. Just get in touch and we&apos;ll handle the rest.
        </p>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="font-mono text-sm font-semibold text-brand">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-3 font-semibold">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
