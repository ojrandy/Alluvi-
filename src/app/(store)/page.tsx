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
import { getProductCards } from "@/server/queries/products";

export const metadata: Metadata = {
  title: { absolute: "Alluvi - Premium Research Peptides for Laboratory R&D | UK Supplier" },
  description:
    "Premium research peptides: BPC-157, TB-500, Retatrutide, Tirzepatide. Janoshik tested, cold chain delivery, tracked UK shipping for lab R&D.",
  alternates: { canonical: "/" },
};

/**
 * Home page: same sections, order and copy as the live alluvi.store home (D1-4).
 * Organization + WebSite JSON-LD is emitted site-wide by the store layout.
 */
export default async function HomePage() {
  const products = await getProductCards();

  return (
    <div className={jetbrainsMono.variable}>
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
