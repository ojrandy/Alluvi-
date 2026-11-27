import "server-only";
import productsContent from "../../../content/products.json";
import type { ProductSpecs } from "@/db/schema";
import type { ProductDetail } from "./products";

/**
 * The recovered catalogue (content/products.json) shaped like DB rows. Used only when there is no
 * database (CI build). Stock is unknown there, so products are shown as in stock; checkout always
 * needs the database, so nothing can be ordered against this data.
 */
export function contentCatalogue(): ProductDetail[] {
  const slugByName = new Map(productsContent.map((p) => [p.name, p.slug]));
  return [...productsContent]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const specs: ProductSpecs = {
        ...(p.specs as ProductSpecs),
        disclaimer: p.disclaimer,
        safetyNote: p.safetyNote,
        relatedSlugs: p.relatedNames.map((n) => slugByName.get(n)).filter((s): s is string => !!s),
      };
      return {
        id: p.slug,
        slug: p.slug,
        name: p.name,
        pricePence: p.pricePence,
        compareAtPence: null,
        category: p.category,
        badge: p.badge,
        image: p.images[0] ?? null,
        images: p.images,
        stock: 100,
        inStock: true,
        updatedAt: null,
        shortDescription: p.shortDescription,
        description: p.description,
        labReportUrl: p.labReportUrl,
        specs,
      };
    });
}
