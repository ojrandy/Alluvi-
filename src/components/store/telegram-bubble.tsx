import { T } from "@/components/i18n/t";
import { site } from "@/lib/site";

/**
 * Floating Telegram bubble linking to the official channel (content/site.json).
 * It is a plain link with no script and no client JS, so it costs nothing on LCP or hydration.
 *
 * Bottom-left, mirroring the Smartsupp launcher on the bottom-right (measured: fixed, 12px from
 * the edge, 24px from the bottom, 56px tall), so the two sit on the same baseline.
 * z-40 keeps it below Radix overlays (cart drawer, dialogs: z-50) and below the open Smartsupp
 * chat window (z-index 10,000,000), so it never covers either of them.
 */
export function TelegramBubble() {
  return (
    <a
      href={site.contact.telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      // only the circle takes pointer events, so the hidden label never blocks clicks on the page
      className="group pointer-events-none fixed bottom-6 left-3 z-40 flex items-center print:hidden"
    >
      <span className="pointer-events-auto grid size-14 place-items-center rounded-full bg-[#229ED9] text-white shadow-[0_6px_20px_rgb(0_0_0/0.35)] ring-offset-2 ring-offset-background transition-transform duration-200 group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-white group-active:scale-95 motion-reduce:transition-none">
        <svg viewBox="0 0 24 24" className="size-7 -translate-x-px" fill="currentColor" aria-hidden="true">
          <path d="M16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </span>
      {/* hover/focus label on pointer devices; touch users see the bubble alone */}
      <span
        aria-hidden="true"
        className="pointer-events-none ml-3 hidden -translate-x-1 rounded-full bg-white px-3 py-1.5 text-[0.8rem] font-semibold whitespace-nowrap text-neutral-900 opacity-0 shadow-lg transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:block"
      >
        <T>Join us on Telegram</T>
      </span>
      <span className="sr-only">
        <T>Join us on Telegram</T> {site.contact.telegramHandle} <T>(opens in a new tab)</T>
      </span>
    </a>
  );
}
