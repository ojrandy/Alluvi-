"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { selectCount, useCart, useCartHydrated } from "@/stores/cart";

/** Header cart trigger with item count. Count renders only after hydration (no SSR mismatch). */
export function CartButton() {
  const hydrated = useCartHydrated();
  const count = useCart(selectCount);
  const open = useCart((s) => s.open);
  const shown = hydrated ? count : 0;

  return (
    <Button
      variant="ghost"
      size="icon-touch"
      onClick={open}
      aria-label={shown > 0 ? `Open cart, ${shown} item${shown === 1 ? "" : "s"}` : "Open cart"}
      className="relative hover:bg-white/[0.06]"
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {/* Only rendered when non-zero: a hidden "0" still counts as visible text for label-in-name checks. */}
      {shown > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 grid min-w-4.5 animate-in place-items-center rounded-full bg-brand px-1 text-[0.65rem] leading-4.5 font-bold text-brand-foreground tabular-nums zoom-in-50"
        >
          {shown > 9 ? "9+" : shown}
        </span>
      )}
    </Button>
  );
}
