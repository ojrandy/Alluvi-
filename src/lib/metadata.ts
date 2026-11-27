import type { Metadata } from "next";
import { site } from "@/lib/site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * Full per-page Open Graph block. A child `openGraph` replaces the root one wholesale, so siteName,
 * locale and type are repeated here; without it pages inherited the home page's og:url and title
 * (SEO audit D01, M1). The default share image comes from app/opengraph-image.tsx.
 */
export function openGraphFor({
  title,
  description,
  path,
  images,
}: {
  title: string;
  description?: string;
  path: string;
  images?: OpenGraph["images"];
}): OpenGraph {
  return {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
    title,
    description,
    url: path,
    ...(images ? { images } : {}),
  };
}
