import siteJson from "../../content/site.json";

/** `langToggle`: renders the EN ⇄ pt-BR switch (ADR-018); `href` is the no-JS fallback. */
export type NavLink = { label: string; href: string; external?: boolean; langToggle?: boolean };
export type Announcement = { label: string; text: string; tone: "promo" | "warning" | "info" };

type SiteContent = {
  name: string;
  legalName: string;
  tagline: string;
  canonicalDomain: string;
  officialDomains: string[];
  contact: { researchEmail: string; supportEmail: string; telegramHandle: string; telegramUrl: string; whatsappUrl: string };
  announcements: Announcement[];
  nav: NavLink[];
  footer: {
    columns: { title: string; links: NavLink[] }[];
    disclaimer: string;
    copyright: string;
  };
  productDisclaimer: string;
  seo: { title: string; description: string; themeColor: string };
};

/** Global site copy, recovered verbatim from the live site (content/site.json). */
export const site = siteJson as SiteContent;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${site.canonicalDomain}`).replace(/\/$/, "");
