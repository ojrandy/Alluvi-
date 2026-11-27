import { site, siteUrl } from "@/lib/site";

/**
 * Schema.org JSON-LD builders (SEO audit D01, H4). Facts come only from content/site.json and the
 * policy pages; no ratings or reviews (docs/seo/PLAN.md §3.2).
 */

export const ORGANIZATION_ID = `${siteUrl}/#organization`;
export const WEBSITE_ID = `${siteUrl}/#website`;

/** Site-wide identity graph: one Organization + one WebSite, referenced by @id elsewhere. */
export function siteIdentityJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: site.name,
        alternateName: "Alluvi Health Care",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/alluvi-logo.png`,
          width: 2400,
          height: 981,
        },
        description: site.tagline,
        email: site.contact.supportEmail,
        address: { "@type": "PostalAddress", addressCountry: "GB" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: site.contact.supportEmail,
          availableLanguage: ["en-GB", "pt-BR"],
        },
        // Official channels only (content/site.json; press release §3).
        sameAs: [site.contact.telegramUrl],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: site.name,
        url: siteUrl,
        inLanguage: "en-GB",
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl}${it.path}`,
    })),
  };
}

/**
 * From content/pages/refund-policy.md: unopened items only, request within 7 days of delivery,
 * return postage paid by the customer unless the error was ours.
 */
export const MERCHANT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "GB",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  itemCondition: "https://schema.org/NewCondition",
  merchantReturnLink: `${siteUrl}/policies/refund-policy`,
};

/** `<script type="application/ld+json">` payload, with `<` escaped so it can't close the tag. */
export function jsonLdHtml(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
