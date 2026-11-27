import { T } from "@/components/i18n/t";
import { CartDrawer } from "@/components/store/cart-drawer";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { SmartsuppChat } from "@/components/store/smartsupp-chat";
import { TelegramBubble } from "@/components/store/telegram-bubble";
import { jsonLdHtml, siteIdentityJsonLd } from "@/lib/structured-data";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Organization + WebSite on every storefront page (SEO audit D01, H4). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(siteIdentityJsonLd())} />
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 font-semibold text-brand-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        <T>Skip to content</T>
      </a>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
      <TelegramBubble />
      <SmartsuppChat />
    </>
  );
}
