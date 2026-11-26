import Image from "next/image";
import { ArrowUpRight, Expand, FlaskConical } from "lucide-react";
import type { ProductSpecs } from "@/db/schema";
import type { Certificate } from "@/lib/certificates";
import { LabReportLink } from "@/components/content/lab-report-link";

/**
 * "Janoshik Third-Party Lab Analysis" block. Live copy and structure (tiles, compound table,
 * "How to read the numbers", independent reports). On the live site this opens as a modal on page
 * load; here it is inline so it never blocks the page or steals focus.
 */
export function LabAnalysis({
  specs,
  reportUrl,
  certificate,
}: {
  specs: ProductSpecs;
  reportUrl: string | null;
  certificate: Certificate | null;
}) {
  const compounds = specs.compounds ?? [];
  const tiles = [
    { label: "Batch number", value: specs.batchNumber },
    { label: "Fill volume", value: specs.fillVolume },
    { label: "Purity", value: specs.purity, accent: true },
  ].filter((t) => !!t.value);
  const reports = specs.labReports ?? [];

  return (
    <section aria-labelledby="lab-title" className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-teal/10 text-teal" aria-hidden="true">
          <FlaskConical className="size-5" />
        </span>
        <h2 id="lab-title" className="text-h3 mt-4">
          Janoshik Third-Party Lab Analysis
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Independently tested and verified by Janoshik Analytical.</p>
        {specs.dateTested && (
          <p className="mt-1 text-sm text-muted-foreground">
            Date Tested: <span className="font-semibold text-brand">{specs.dateTested}</span>
          </p>
        )}
      </div>

      {tiles.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl border border-border bg-white/[0.02] px-4 py-3 text-center last:odd:col-span-2 sm:last:odd:col-span-1">
              <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">{t.label}</dt>
              <dd className={t.accent ? "mt-1 font-bold text-success" : "mt-1 font-bold"}>{t.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {compounds.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[22rem] text-sm">
            <caption className="sr-only">Compound analysis results</caption>
            <thead className="bg-white/[0.04] text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-bold">Compound</th>
                <th scope="col" className="px-4 py-3 text-center font-bold">Concentration</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">Verified content</th>
              </tr>
            </thead>
            <tbody>
              {compounds.map((c) => (
                <tr key={c.compound} className="border-t border-border">
                  <th scope="row" className="px-4 py-3 text-left font-semibold">{c.compound}</th>
                  <td className="px-4 py-3 text-center tabular-nums">{c.concentration ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{c.verifiedContent ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {compounds.length > 0 && specs.fillVolume && <HowToRead specs={specs} />}

      {certificate && <CertificateFigure certificate={certificate} />}

      {reports.length > 1 && (
        <div className="mt-6">
          <h3 className="eyebrow text-muted-foreground">Independent test reports</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {reports.map((r, i) => (
              <li key={`${i}-${r.label}`}>
                <LabReportLink
                  href={r.url}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                >
                  {r.label}
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </LabReportLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reportUrl && (
        <LabReportLink
          href={reportUrl}
          className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--brand),white_12%)]"
        >
          View Full Janoshik Report
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </LabReportLink>
      )}
    </section>
  );
}

/** The certificate of analysis itself; opens full size in a new tab. */
function CertificateFigure({ certificate: c }: { certificate: Certificate }) {
  return (
    <figure className="mt-6">
      <h3 className="eyebrow text-muted-foreground">Certificate of analysis</h3>
      <a
        href={c.image}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mx-auto mt-3 block max-w-xs overflow-hidden rounded-2xl border border-border bg-white shadow-lg transition-colors hover:border-white/30"
      >
        <Image
          src={c.image}
          alt={c.alt}
          width={c.width}
          height={c.height}
          sizes="(max-width: 640px) 80vw, 320px"
          className="h-auto w-full"
        />
        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white opacity-90 transition-opacity group-hover:opacity-100">
          <Expand className="size-3.5" aria-hidden="true" />
          View full size
          <span className="sr-only"> (opens in a new tab)</span>
        </span>
      </a>
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
        Janoshik task #{c.task}
      </figcaption>
    </figure>
  );
}

function HowToRead({ specs }: { specs: ProductSpecs }) {
  const compounds = specs.compounds ?? [];
  const single = compounds.length === 1 ? compounds[0] : null;
  return (
    <div className="mt-6 rounded-2xl bg-white/[0.02] p-4 sm:p-5">
      <h3 className="eyebrow text-muted-foreground">How to read the numbers</h3>
      <div className="mt-4 grid items-center gap-3 text-sm sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Term title="Concentration" hint="How much is in each ml">
          {single ? `(${single.concentration})` : compounds.map((c) => <span key={c.compound} className="block">{c.compound} {c.concentration}</span>)}
        </Term>
        <span className="text-center text-lg text-muted-foreground" aria-hidden="true">×</span>
        <Term title="Fill volume" hint="How many ml the pen holds">({specs.fillVolume})</Term>
        <span className="text-center text-lg text-muted-foreground" aria-hidden="true">=</span>
        <Term title="Verified content" hint="The total amount in the pen" accent>
          {single ? `(${single.verifiedContent})` : compounds.map((c) => <span key={c.compound} className="block">{c.verifiedContent}</span>)}
        </Term>
      </div>
    </div>
  );
}

function Term({ title, hint, accent, children }: { title: string; hint: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-4 py-3 text-center">
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <p className={accent ? "mt-1.5 font-semibold text-brand tabular-nums" : "mt-1.5 font-medium tabular-nums"}>{children}</p>
    </div>
  );
}
