"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowRight, XIcon } from "lucide-react";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { site } from "@/lib/site";

const STORAGE_KEY = "alluvi_verify_popup_shown";
const DELAY_MS = 3000;

const verifyUrl = site.nav.find((l) => l.label === "Verify")?.href ?? "https://spotafakealluvi.com/";

/**
 * Anti-counterfeit notice ("Is your Alluvi fake?"), shown once per browser session from 3s after
 * the home page loads (on first interaction). The artwork carries the message; the CTA opens the
 * external verifier. Never blocks first paint: nothing renders until it opens.
 */
export function VerifyPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    // Open on the visitor's first scroll/tap/key once 3s have passed. Opening purely on a timer
    // (as the live site does) makes the large artwork the page's LCP element.
    const events = ["scroll", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    const show = () => {
      events.forEach((e) => window.removeEventListener(e, show));
      setOpen(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    };
    const t = window.setTimeout(() => {
      events.forEach((e) => window.addEventListener(e, show, { once: true, passive: true }));
    }, DELAY_MS);
    return () => {
      window.clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, show));
    };
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay className="bg-black/75 supports-backdrop-filter:backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <DialogPrimitive.Title className="sr-only">Is your Alluvi fake? Packaging and security update</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Check your product&apos;s authenticity marks with the official Alluvi verifier.
          </DialogPrimitive.Description>
          <div className="relative">
            <Image
              src="/images/homepromopromo-desktop.webp"
              alt="Is your Alluvi fake? Alluvi authenticity marks, holographic seal, and packaging and security update"
              width={1360}
              height={1360}
              sizes="(max-width: 767px) 92vw, 640px"
              className="h-auto max-h-[calc(100dvh-10.5rem)] w-auto max-w-[min(92vw,640px)] rounded-[14px] shadow-[0_24px_60px_rgb(0_0_0/65%)]"
            />
            <DialogPrimitive.Close
              className="absolute -top-3 -right-3 grid size-11 place-items-center rounded-full border border-white/15 bg-black/80 text-white transition-colors hover:bg-black"
              aria-label="Close"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-8 text-sm font-extrabold tracking-[0.12em] text-brand-foreground uppercase shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Verify now
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
