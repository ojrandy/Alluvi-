import type { Metadata } from "next";
import { AppComingSoon } from "@/components/home/app-coming-soon";
import { HomeHero } from "@/components/home/hero";
import { PensStability } from "@/components/home/pens-stability";
import { ProductMarquee } from "@/components/home/product-marquee";
import { ResearchPlatform } from "@/components/home/research-platform";
import { StabilityStages } from "@/components/home/stability-stages";
import { TestingSteps } from "@/components/home/testing-steps";
import { VerifyPopup } from "@/components/home/verify-popup";
import { jetbrainsMono } from "@/lib/fonts";
import { site, siteUrl } from "@/lib/site";
import { getProductCards } from "@/server/queries/products";

export const metadata: Metadata = {
  title: { absolute: "Alluvi - Premium Research Peptides for Laboratory R&D | UK Supplier" },
  description:
    "Premium research peptides: BPC-157, TB-500, Retatrutide, Tirzepatide. Janoshik tested, cold chain delivery, tracked UK shipping for lab R&D.",
  keywords: [
    "research peptides UK",
    "BPC-157",
    "TB-500",
    "Retatrutide",
    "Tirzepatide",
    "GHK-Cu",
    "laboratory peptides",
    "peptide supplier",
    "Janoshik tested",
    "research chemicals UK",
  ],
  alternates: { canonical: "/" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: siteUrl,
  logo: `${siteUrl}/images/favicon.png`,
  description:
    "Premium research peptides supplier for laboratory R&D. Janoshik tested peptides with cold chain delivery and tracked UK shipping.",
  address: { "@type": "PostalAddress", addressCountry: "GB" },
  contactPoint: { "@type": "ContactPoint", contactType: "Customer Service", email: site.contact.supportEmail },
};

/** Home page: same sections, order and copy as the live alluvi.store home (D1-4). */
export default async function HomePage() {
  const products = await getProductCards();

  return (
    <div className={jetbrainsMono.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeHero />
      <ProductMarquee products={products} />
      <TestingSteps />
      <PensStability />
      <StabilityStages />
      <AppComingSoon />
      <ResearchPlatform />
      <VerifyPopup />
    </div>
  );
}
