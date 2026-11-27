import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/components/product/product-view";
import { ProductViewSkeleton } from "@/components/product/product-view-skeleton";
import { openGraphFor } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";
import { breadcrumbJsonLd, jsonLdHtml, MERCHANT_RETURN_POLICY, ORGANIZATION_ID } from "@/lib/structured-data";
import { getActiveSlugs, getProductBySlug, getProductCards, getProductsBySlugs } from "@/server/queries/products";

/**
 * Fully static route (catalogue/content data is 'use cache'). An unknown slug is then rendered to
 * completion before responding instead of streaming the fallback shell with a 200, so notFound()
 * returns a real 404 (next/dist/docs ensureStatic.md "Dynamic route parameters"; SEO audit D01, C1).
 */
export const ensureStatic = "navigation";

/** Prerender every active product (the 5 sitemap URLs plus the 4 newer ones). */
export async function generateStaticParams() {
  const slugs = await getActiveSlugs();
  return slugs.map((slug) => ({ slug }));
}

const shortName = (name: string) => name.replace(/\s*\(R&D Only\)\s*$/i, "");

/** "Continue your research" shows at least this many products (an even count fills its 2-up grid). */
const MIN_RELATED = 4;

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  // Live title: "<name> | Advanced Research | Alluvi" (root template appends "| Alluvi").
  const title = `${p.name} | Advanced Research`;
  const description = p.shortDescription ?? undefined;
  const image = p.images[0];
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: openGraphFor({
      title: `${title} | Alluvi`,
      description,
      path: `/product/${p.slug}`,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    }),
    twitter: { card: "summary_large_image", title: `${title} | Alluvi`, description, images: image ? [image.url] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  // Existence check BEFORE the Suspense boundary: once a fallback streams, the status is locked at
  // 200, so an unknown slug would be a soft 404 (next/dist/docs streaming.md "The HTTP contract").
  // getProductBySlug is cached, so ProductDetails reuses this result.
  const { slug } = await params;
  if (!(await getProductBySlug(slug))) notFound();

  return (
    <Suspense fallback={<ProductViewSkeleton />}>
      <ProductDetails slug={slug} />
    </Suspense>
  );
}

async function ProductDetails({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const curated = await getProductsBySlugs((product.specs.relatedSlugs ?? []).filter((s) => s !== product.slug));
  // Top up thin curated lists from the catalogue so every product links to several others.
  const related =
    curated.length >= MIN_RELATED
      ? curated
      : [
          ...curated,
          ...(await getProductCards())
            .filter((c) => c.slug !== product.slug && !curated.some((r) => r.slug === c.slug))
            .slice(0, MIN_RELATED - curated.length),
        ];

  const url = `${siteUrl}/product/${product.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.slug,
    category: product.category ?? undefined,
    image: product.images.map((i) => `${siteUrl}${i.url}`),
    brand: { "@type": "Brand", name: "Alluvi" },
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "GBP",
      price: (product.pricePence / 100).toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORGANIZATION_ID },
      hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
    },
  };
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: shortName(product.name), path: `/product/${product.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(breadcrumbs)} />
      <ProductView product={product} related={related} shortName={shortName(product.name)} />
    </>
  );
}
