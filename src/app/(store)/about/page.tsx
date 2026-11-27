import type { Metadata } from "next";
import { openGraphFor } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { T } from "@/components/i18n/t";

export const metadata: Metadata = {
  title: { absolute: "About Alluvi | Premium Research Peptides Supplier UK" },
  description:
    "Alluvi develops innovative research peptides and compounds for laboratory use. Science-backed formulations with Janoshik testing, cold chain delivery, and tracked UK shipping.",
  alternates: { canonical: "/about" },
  openGraph: openGraphFor({
    title: "About Alluvi | Premium Research Peptides Supplier UK",
    description:
      "Alluvi develops innovative research peptides and compounds for laboratory use. Science-backed formulations with Janoshik testing, cold chain delivery, and tracked UK shipping.",
    path: "/about",
  }),
};

// Copy below is verbatim from the live /about page (content-recovery/raw/pages/about.json).
const STATS = [
  { value: "48+", label: "Advanced formulations developed" },
  { value: "26.3k+", label: "R&D-tested research units" },
  { value: "99.95%", label: "Lab tested purity" },
  { value: "1.26M+", label: "Members through UK and Europe in 2026 alone" },
];

const CAPABILITIES = [
  { img: "box01", alt: "Built for Peptide R&D", title: "Built for Peptide R&D", text: "We manufacture core APIs for our peptide range in-house, controlling quality at every step." },
  { img: "box02", alt: "Real-Time Monitoring", title: "Real-Time Monitoring", text: "Every compound undergoes batch-level monitoring with full transparency into metabolite levels and purity." },
  { img: "box03", alt: "Precision Synthesis", title: "Precision Synthesis", text: "Rapid research compound production formulated, filled, and dispatched with precision timing and documented chain of custody." },
  { img: "box04", alt: "ISO-Certified Filling", title: "Automated Filling", text: "Alluvi operates ISO-certified filling lines for research pens, delivering precise fill accuracy and sterility for laboratory applications." },
  { img: "box05", alt: "Secure Procurement", title: "Secure Chain of Custody", text: "Every unit is traceable with tamper-evident labelling and secure procurement logs designed for R&D compliance." },
  { img: "box06", alt: "Cold Chain Solutions", title: "Cold Chain Critical", text: "Validated cold-chain packaging keeps compounds stable and compliant during sensitive laboratory delivery." },
];

export default function AboutPage() {
  return (
    <>
      {/* hero */}
      <section className="container-page grid items-center gap-10 pt-12 pb-16 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div>
          <h1 className="text-display max-w-xl text-balance">Effortlessly advance science and research.</h1>
          <p className="text-lead mt-6 max-w-lg">
            Alluvi develops innovative compounds for laboratory research use only.
            <br />
            Our science-backed peptides and formulations are provided in sealed formats.
          </p>
          <Button asChild variant="glass" size="xl" className="mt-8">
            <Link href="/announcements">
              Stay upto date
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
          <div className="absolute inset-8 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
          <Image src="/images/fifteenfifteen.webp" alt="Alluvi App Preview" fill priority sizes="(min-width: 1024px) 384px, 80vw" className="relative object-contain" />
        </div>
      </section>

      {/* stats */}
      <section aria-label="Alluvi in numbers" className="container-page">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.value} className="flex flex-col-reverse bg-surface-raised px-5 py-8 text-center md:py-10">
              <dt className="mx-auto mt-3 max-w-[14rem] text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-4xl font-bold tracking-tight md:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-page section-y text-center">
        <h2 className="text-h2 mx-auto max-w-xl text-balance">End-to-End Fulfilment for R&D Supply</h2>
        <p className="text-lead mx-auto mt-4 max-w-md">
          Alluvi provides regulated, research-only peptide compounds with full traceability across Europe &amp; the UK.
        </p>
      </section>

      <FeatureRow
        eyebrow="Built for your research"
        title="R&D-Compliant Supply Chain"
        text="Eliminate uncertainty with unverified vendors. Alluvi ensures compliant, batch-tested peptides and compounds for non-human research, supported by fast UK & EU dispatch and documented supply chain integrity."
        cta={{ label: "Browse our platform", href: "/shop" }}
        image={{ src: "/images/about/firstone.webp", alt: "R&D Products" }}
        tag="Batch-tested · UK & EU dispatch"
      />
      <FeatureRow
        reverse
        eyebrow="Always in-house"
        title="Precision Peptide API Manufacturing, In-House at Alluvi"
        text="Alluvi's in-house R&D lab develops research-grade peptide APIs with full documentation, batch validation, and ISO-certified clean-room standards. Every compound is produced under controlled conditions to meet stringent R&D specifications, ensuring quality from synthesis through dispatch."
        cta={{ label: "Explore lab capabilities", href: "#capabilities" }}
        image={{ src: "/images/about/firstsecond.webp", alt: "Manufacturing" }}
        tag="ISO-certified clean-room"
      />

      <section id="capabilities" aria-labelledby="capabilities-title" className="container-page section-y scroll-mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="capabilities-title" className="text-h2 text-balance">Start with Alluvi Research-Grade Peptides</h2>
          <p className="text-lead mt-4">
            Order today and experience seamless access to US-tested peptides, supplied with full documentation, batch
            traceability, and verified purity for R&amp;D applications.
          </p>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {CAPABILITIES.map((c) => (
            <li key={c.title} className="overflow-hidden rounded-3xl border border-border bg-card p-3">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image src={`/images/about/${c.img}.webp`} alt={c.alt} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <h3 className="mt-5 px-2 font-semibold">{c.title}</h3>
              <p className="mt-2 px-2 pb-3 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          <T>For laboratory research use only. Not for human consumption.</T>
        </p>
      </section>
    </>
  );
}

type FeatureRowProps = {
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
  tag: string;
  reverse?: boolean;
};

function FeatureRow({ eyebrow, title, text, cta, image, tag, reverse }: FeatureRowProps) {
  return (
    <section className="container-page grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? "lg:order-2" : undefined}>
        <p className="eyebrow flex items-center gap-2">
          <span className="h-px w-6 bg-brand" aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 className="text-h2 mt-4 text-balance">{title}</h2>
        <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">{text}</p>
        <Button asChild variant="glass" size="xl" className="mt-7">
          <Link href={cta.href}>
            {cta.label}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <div className="relative">
        <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-brand/10 blur-2xl" aria-hidden="true" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
        </div>
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium backdrop-blur">
          <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
          {tag}
        </span>
      </div>
    </section>
  );
}
