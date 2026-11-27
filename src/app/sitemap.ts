import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { POLICY_SLUGS } from "@/server/content/pages";
import { getProductCards } from "@/server/queries/products";

/**
 * /sitemap.xml — indexable storefront URLs only. Pages marked `robots: noindex` (login, signup,
 * checkout, account, track-order, admin…) are deliberately left out so the sitemap never
 * contradicts the page. Products come from the cached catalogue (DB, or content/ at build time),
 * so it updates on the same `products` revalidation as the shop.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const abs = (path: string) => (path.startsWith("http") ? path : `${siteUrl}${path}`);

  const pages: MetadataRoute.Sitemap = [
    { url: abs("/"), changeFrequency: "daily", priority: 1 },
    { url: abs("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: abs("/wholesale"), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/spot-a-fake"), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: abs("/our-location"), changeFrequency: "monthly", priority: 0.5 },
    { url: abs("/announcements"), changeFrequency: "weekly", priority: 0.5 },
  ];

  const policies: MetadataRoute.Sitemap = POLICY_SLUGS.map((slug) => ({
    url: abs(`/policies/${slug}`),
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  const products: MetadataRoute.Sitemap = (await getProductCards()).map((p) => ({
    url: abs(`/product/${p.slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
    ...(p.image ? { images: [abs(p.image.url)] } : {}),
  }));

  return [...pages, ...products, ...policies];
}
