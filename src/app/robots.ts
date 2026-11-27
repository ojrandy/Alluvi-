import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** /robots.txt — crawl the storefront, keep private/transactional areas out, point at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/account", "/checkout", "/order-confirmation/", "/reset-password", "/verify-email"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
