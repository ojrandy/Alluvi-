"use client";

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { ProductImageRef } from "@/server/queries/products";

/**
 * Main image + thumbnails, following the WAI-ARIA tabs pattern: one tab stop for the thumbnail
 * strip, Arrow/Home/End move between images, the main image is the tab panel.
 */
export function ProductGallery({ images, name }: { images: ProductImageRef[]; name: string }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const current = images[active];

  if (!current) {
    return <div className="aspect-[3/2] rounded-3xl border border-border bg-surface-raised" aria-hidden="true" />;
  }

  const select = (i: number) => {
    const next = (i + images.length) % images.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, () => void> = {
      ArrowRight: () => select(active + 1),
      ArrowDown: () => select(active + 1),
      ArrowLeft: () => select(active - 1),
      ArrowUp: () => select(active - 1),
      Home: () => select(0),
      End: () => select(images.length - 1),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        id={`${baseId}-panel`}
        role={images.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={images.length > 1 ? `${baseId}-tab-${active}` : undefined}
        className="relative aspect-[3/2] overflow-hidden rounded-3xl border border-border bg-surface-raised"
      >
        {images.map((img, i) => (
          <Image
            key={img.url}
            src={img.url}
            alt={img.alt || name}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 600px, 100vw"
            className={cn(
              "object-cover transition-opacity duration-300 motion-reduce:transition-none",
              i === active ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i !== active || undefined}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={`${name} images`}
          onKeyDown={onKeyDown}
          className="flex justify-center gap-3"
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`${baseId}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square w-16 overflow-hidden rounded-xl border-2 transition-[border-color,opacity] sm:w-20",
                i === active ? "border-brand" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              <span className="sr-only">{img.alt || `Image ${i + 1}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
