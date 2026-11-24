import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/product-grid-skeleton";
import { cn } from "@/lib/utils";
import { getProductCards, type ProductCard as ProductCardData } from "@/server/queries/products";
import { T } from "@/components/i18n/t";

export const metadata: Metadata = {
  title: { absolute: "Professional Research Solutions | Alluvi Shop" },
  description: "Premium laboratory R&D compounds. Clinical grade purity, rigorous testing.",
  keywords: ["research peptides", "clinical grade", "BPC-157", "TB-500"],
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Professional Research Solutions | Alluvi Shop",
    description: "Premium laboratory R&D compounds. Clinical grade purity, rigorous testing.",
    url: "/shop",
  },
};

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

/** /shop: live copy ("Premium Research" hero, same product order), plus category + price sort. */
export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="container-page pt-12 pb-20 md:pt-20 md:pb-28">
      <header className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
        <h1 className="text-display bg-linear-to-b from-white to-zinc-400 bg-clip-text font-bold text-transparent">
          Premium Research
        </h1>
        <p className="text-lead mx-auto mt-6 max-w-2xl tracking-wide text-balance">
          Engineered for precision. Validated by science.
          <br className="hidden sm:block" /> Supplying leading laboratories with high-purity research compounds.
        </p>
      </header>

      <Suspense fallback={<ProductGridSkeleton count={9} />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>

      <p className="mt-14 text-center text-sm text-muted-foreground">
        <T>For laboratory research use only. Not for human consumption.</T>
      </p>
    </div>
  );
}

async function ShopResults({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const products = await getProductCards();

  const categories = [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))];
  const categoryParam = first(sp.category);
  const category = categories.find((c) => slugify(c) === categoryParam) ?? null;
  const sortParam = first(sp.sort);
  const sort: SortKey = SORTS.some((s) => s.key === sortParam) ? (sortParam as SortKey) : "featured";

  const visible = sortProducts(
    category ? products.filter((p) => p.category === category) : products,
    sort,
  );

  const hrefFor = (next: { category?: string | null; sort?: SortKey }) => {
    const params = new URLSearchParams();
    const c = next.category === undefined ? (category ? slugify(category) : null) : next.category;
    const s = next.sort ?? sort;
    if (c) params.set("category", c);
    if (s !== "featured") params.set("sort", s);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {categories.length > 1 ? (
          <nav aria-label="Filter by category" className="-mx-1 flex flex-wrap gap-2">
            <FilterChip href={hrefFor({ category: null })} active={!category}>
              All
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c} href={hrefFor({ category: slugify(c) })} active={category === c}>
                {c}
              </FilterChip>
            ))}
          </nav>
        ) : (
          <span />
        )}
        <nav aria-label="Sort products" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort</span>
          {SORTS.map((s) => (
            <FilterChip key={s.key} href={hrefFor({ sort: s.key })} active={sort === s.key}>
              {s.label}
            </FilterChip>
          ))}
        </nav>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} product{visible.length === 1 ? "" : "s"}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-6 py-20 text-center">
          <p className="text-h3">No products here yet.</p>
          <p className="mt-2 text-muted-foreground">Check back soon, or browse the full range.</p>
          <Link href="/shop" className="mt-6 inline-flex font-semibold text-brand underline-offset-4 hover:underline">
            View all products
          </Link>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {visible.map((p, i) => (
            <li key={p.id} className="flex">
              <div className="flex w-full flex-col [&>article]:flex-1">
                <ProductCard product={p} priority={i < 3} headingLevel="h2" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-white/20 bg-white/[0.09] text-foreground"
          : "border-border text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function sortProducts(list: ProductCardData[], sort: SortKey) {
  if (sort === "featured") return list;
  const dir = sort === "price-asc" ? 1 : -1;
  // Stable: equal prices keep the curated order.
  return [...list].sort((a, b) => dir * (a.pricePence - b.pricePence));
}
