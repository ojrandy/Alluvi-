import { site, type Announcement } from "@/lib/site";
import { T } from "@/components/i18n/t";
import { cn } from "@/lib/utils";

/**
 * Orange scrolling notice bar (live-site parity). These are safety/anti-scam notices, so the bar is
 * intentionally NOT dismissible. Pauses on hover/focus; static under prefers-reduced-motion.
 */
export function AnnouncementBar() {
  const items = site.announcements;
  return (
    <section
      aria-label="Important notices"
      className="group relative h-(--announcement-height) overflow-hidden bg-brand text-brand-foreground"
    >
      {/* Screen readers get the list once; the visual marquee is duplicated for a seamless loop. */}
      <ul className="sr-only">
        {items.map((a) => (
          <li key={a.label}>
            <T>{a.label}</T>: <T>{a.text}</T>
          </li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="flex h-full w-max animate-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ "--marquee-duration": "90s" } as React.CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {items.map((a) => (
              <Notice key={`${copy}-${a.label}`} item={a} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Notice({ item }: { item: Announcement }) {
  return (
    <p className="flex items-center gap-2 px-6 text-[0.78rem] leading-none font-medium whitespace-nowrap">
      <span
        className={cn(
          "rounded-full px-2 py-1 text-[0.65rem] font-extrabold tracking-[0.08em]",
          item.tone === "promo" ? "bg-brand-foreground text-brand" : "bg-black/10",
        )}
      >
        <T>{item.label}</T>
      </span>
      <span>
        <T>{item.text}</T>
      </span>
      <span className="pl-4 opacity-40">|</span>
    </p>
  );
}
