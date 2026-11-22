import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.seo.title,
    template: "%s | Alluvi",
  },
  description: site.seo.description,
  applicationName: site.name,
  icons: { icon: "/images/favicon.png", apple: "/images/favicon.png" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
    title: site.seo.title,
    description: site.seo.description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: site.seo.title, description: site.seo.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#060708",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
