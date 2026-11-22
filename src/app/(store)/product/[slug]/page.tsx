import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/components/product/product-view";
import { ProductViewSkeleton } from "@/components/product/product-view-skeleton";
import { siteUrl } from "@/lib/site";
import { getActiveSlugs, getProductBySlug, getProductsBySlugs } from "@/server/queries/products";

/** Prerender every active product (the 5 sitemap URLs plus the 4 newer ones). */
export async function generateStaticParams() {
  const slugs = await getActiveSlugs();
  return slugs.map((slug) => ({ slug }));
}

const shortName = (name: string) => name.replace(/\s*\(R&D Only\)\s*$/i, "");

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
    openGraph: {
      type: "website",
      title: `${title} | Alluvi`,
      description,
      url: `/product/${p.slug}`,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
    twitter: { card: "summary_large_image", title: `${title} | Alluvi`, description, images: image ? [image.url] : undefined },
  };
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  // params are awaited inside the boundary so unknown slugs still get the static App Shell.
  return (
    <Suspense fallback={<ProductViewSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getProductsBySlugs((product.specs.relatedSlugs ?? []).filter((s) => s !== product.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.slug,
    mpn: product.specs.batchNumber ?? undefined,
    category: product.category ?? undefined,
    image: product.images.map((i) => `${siteUrl}${i.url}`),
    brand: { "@type": "Brand", name: "Alluvi" },
    url: `${siteUrl}/product/${product.slug}`,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "GBP",
      price: (product.pricePence / 100).toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Alluvi" },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductView product={product} related={related} shortName={shortName(product.name)} />
    </>
  );
}
