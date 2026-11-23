import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Latest announcements and updates from Alluvi.",
  alternates: { canonical: "/announcements" },
};

/** Verbatim from the live /announcements page. */
export default function AnnouncementsPage() {
  return (
    <div className="container-page pt-12 pb-20 md:pt-20 md:pb-28">
      <header className="max-w-2xl">
        <p className="eyebrow">Alluvi updates</p>
        <h1 className="text-h1 mt-4">Announcements</h1>
        <p className="text-lead mt-4">Product, packaging, and security changes — published here for full transparency.</p>
      </header>

      <div className="mt-12 space-y-8">
        <Post badge="New" eager image={{ src: "/images/TelegramOrderNotification.png", alt: "Telegram Order Notification" }}>
          <p className="eyebrow">Telegram orders now open</p>
          <h2 className="text-h2 mt-3">WE&apos;RE BACK IN STOCK!</h2>
          <p className="mt-4 text-muted-foreground">
            Thank you for your patience and loyalty. We&apos;re excited to announce that we&apos;re back in stock and ready to
            serve you! Enjoy shopping with us once again.
          </p>
          <h3 className="mt-6 text-sm font-bold tracking-wider uppercase">Telegram orders only</h3>
          <p className="mt-2 text-muted-foreground">
            To place your order, please send a direct message to our dedicated Telegram support. Our team is ready to
            assist you with your research compound needs.
          </p>
          <h3 className="mt-6 text-sm font-bold tracking-wider uppercase">Order now</h3>
          <p className="mt-2 text-muted-foreground">
            Click the button below to open Telegram and start your order with {site.contact.telegramHandle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="brand" size="xl">
              <a href={site.contact.telegramUrl} target="_blank" rel="noopener noreferrer">
                <Send data-icon="inline-start" aria-hidden="true" />
                Order on Telegram
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link href="/shop">View Products</Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link href="/">Homepage</Link>
            </Button>
          </div>
        </Post>

        <Post badge="Latest" image={{ src: "/images/packagingupdate.jpeg", alt: "Packaging update" }}>
          <p className="eyebrow">Packaging update</p>
          <dl className="mt-4 space-y-5">
            {[
              ["No more shrink wrap", "To avoid delays, shrink wrap has been removed."],
              [
                "New authenticity check",
                "UV torch reveals Alluvi authenticity mark\nFront of packaging has Alluvi authenticity hologram included",
              ],
              ["Extra security soon", "Tamper proof seal added in the coming weeks"],
              ["Scan QR code", "This notice is also live on the Alluvi website homepage popup"],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="text-sm font-bold tracking-wider uppercase">{t}</dt>
                <dd className="mt-1.5 whitespace-pre-line text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="glass" size="xl">
              <Link href="/">View homepage</Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link href="/shop">Shop</Link>
            </Button>
          </div>
        </Post>
      </div>
    </div>
  );
}

function Post({
  badge,
  image,
  eager = false,
  children,
}: {
  badge: string;
  image: { src: string; alt: string };
  /** The first post's image is the LCP element; load it eagerly. */
  eager?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="relative aspect-square bg-surface-raised md:aspect-auto md:min-h-full">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 40vw, 100vw"
          loading={eager ? "eager" : "lazy"}
          className="object-contain p-4"
        />
        <span className="absolute top-4 left-4 rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-extrabold tracking-wider text-brand-foreground uppercase">
          {badge}
        </span>
      </div>
      <div className="p-6 md:p-10">{children}</div>
    </article>
  );
}
