import Link from "next/link";
import { ArrowUpRight, ChevronLeft, FlaskConical, ShieldAlert } from "lucide-react";
import { Markdown } from "@/components/content/markdown";
import { LabReportLink } from "@/components/content/lab-report-link";
import { AddToCartPanel } from "@/components/store/add-to-cart";
import { ProductCard } from "@/components/store/product-card";
import { site } from "@/lib/site";
import { formatPriceLabel } from "@/lib/money";
import type { ProductCard as ProductCardData, ProductDetail } from "@/server/queries/products";
import { LabAnalysis } from "./lab-analysis";
import { ProductGallery } from "./product-gallery";
import { T } from "@/components/i18n/t";

const LOW_STOCK = 5;

type Props = { product: ProductDetail; related: ProductCardData[]; shortName: string };

/** Product detail layout. Copy and section order follow the live product page. */
export function ProductView({ product: p, related, shortName }: Props) {
  const specs = p.specs;
  const disclaimer = specs.disclaimer ?? site.productDisclaimer;
  const hasLab = (specs.compounds?.length ?? 0) > 0 || !!specs.batchNumber || !!p.labReportUrl;
  const packageContents = specs.packageContents ?? [];

  return (
    <div className="container-page pt-6 pb-20 md:pt-10 md:pb-28">
      <Link
        href="/shop"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        All products
      </Link>

      <aside
        aria-label="Research use disclaimer"
        className="mt-4 mb-6 flex gap-3 rounded-2xl border border-warning/30 bg-warning/[0.06] p-3.5 text-xs leading-relaxed text-foreground/85 sm:p-4 sm:text-sm md:mb-12"
      >
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
        <p>
          <T>{disclaimer}</T>
        </p>
      </aside>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={p.images} name={p.name} />

        <div className="flex flex-col">
          <p className="eyebrow">Compound analysis</p>
          <h1 className="text-h1 mt-3 text-balance">{p.name}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-2xl font-semibold tracking-tight">
              {p.compareAtPence && p.compareAtPence > p.pricePence && (
                <s className="mr-2 text-lg font-medium text-muted-foreground">
                  <span className="sr-only">Was </span>
                  {formatPriceLabel(p.compareAtPence)}
                </s>
              )}
              {formatPriceLabel(p.pricePence)}
            </p>
            <StockState stock={p.stock} />
          </div>

          {p.description && <Markdown source={p.description} className="mt-6 text-muted-foreground" />}

          {specs.safetyNote && (
            <p className="mt-6 rounded-xl border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3 text-sm leading-relaxed">
              <SafetyNote text={specs.safetyNote} />
            </p>
          )}

          <div className="mt-8">
            <AddToCartPanel
              product={{
                productId: p.id,
                slug: p.slug,
                name: p.name,
                image: p.images[0]?.url ?? null,
                pricePence: p.pricePence,
                stock: p.stock,
              }}
            />
          </div>

          {p.labReportUrl && (
            <LabReportLink
              href={p.labReportUrl}
              className="mt-6 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-teal underline-offset-4 hover:underline"
            >
              <FlaskConical className="size-4" aria-hidden="true" />
              View Janoshik Analytical Report
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </LabReportLink>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            <T>For laboratory research use only. Not for human consumption.</T>
          </p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:mt-24 lg:grid-cols-[1.4fr_1fr]">
        {hasLab ? <LabAnalysis specs={specs} reportUrl={p.labReportUrl} /> : null}
        {packageContents.length > 0 && (
          <section
            aria-labelledby="package-title"
            className={hasLab ? "self-start rounded-3xl border border-border bg-card p-5 sm:p-8" : "rounded-3xl border border-border bg-card p-5 sm:p-8 lg:col-span-2"}
          >
            <h2 id="package-title" className="text-h3">Package Contents</h2>
            <p className="mt-2 text-sm text-muted-foreground">Each {shortName} Research kit includes:</p>
            <ul className="mt-5 space-y-3">
              {packageContents.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-20 md:mt-28">
          <div className="mb-8 text-center">
            <h2 id="related-title" className="text-h2">Continue Your Research</h2>
            <p className="mt-3 text-muted-foreground">Handpicked research kits that pair well with {shortName}.</p>
          </div>
          <ul className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2" role="list">
            {related.map((r) => (
              <li key={r.id} className="flex [&>article]:flex-1">
                <ProductCard product={r} eyebrow="Compound" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StockState({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">Out of stock</span>;
  }
  if (stock <= LOW_STOCK) {
    return <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning">Only {stock} left</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1 text-xs font-bold text-success">
      <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
      In stock
    </span>
  );
}

/** Bold the "Safety Protocol:" lead-in like the live page. */
function SafetyNote({ text }: { text: string }) {
  const m = /^([^:]{2,40}:)\s*(.*)$/.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      <strong className="font-semibold text-foreground">{m[1]}</strong> {m[2]}
    </>
  );
}
