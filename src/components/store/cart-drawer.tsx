"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatGBP } from "@/lib/money";
import { MAX_QTY_PER_LINE, selectCount, selectSubtotalPence, useCart, useCartHydrated } from "@/stores/cart";
import { QuantityStepper } from "./quantity-stepper";

/**
 * Slide-over cart, opened from the header button and after every "Add to cart".
 * Line data renders only after the persisted cart has hydrated (no SSR/client mismatch).
 */
export function CartDrawer() {
  const hydrated = useCartHydrated();
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const lines = useCart((s) => s.lines);
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotalPence);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const empty = !hydrated || lines.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="gap-0 border-border bg-surface p-0 data-[side=right]:w-[92vw] data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-lg text-foreground">
            Your cart{!empty && <span className="ml-2 text-sm font-medium text-muted-foreground">({count})</span>}
          </SheetTitle>
          <SheetDescription className="sr-only">Review the items in your cart and go to checkout.</SheetDescription>
        </SheetHeader>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-white/[0.05]" aria-hidden="true">
              <ShoppingBag className="size-6 text-muted-foreground" />
            </span>
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="max-w-64 text-sm text-muted-foreground">Browse our Janoshik-tested research compounds.</p>
            <SheetClose asChild>
              <Button asChild variant="brand" size="xl" className="mt-2">
                <Link href="/shop">Shop research peptides</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5" aria-label="Cart items">
              {lines.map((l) => (
                <li key={l.productId} className="flex gap-4 py-5">
                  <div className="relative aspect-[3/2] w-24 shrink-0 self-start overflow-hidden rounded-xl border border-border bg-surface-raised">
                    {l.image && <Image src={l.image} alt="" fill sizes="96px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <SheetClose asChild>
                        <Link href={`/product/${l.slug}`} className="text-sm leading-snug font-semibold hover:underline">
                          {l.name}
                        </Link>
                      </SheetClose>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatGBP(l.pricePence * l.quantity)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatGBP(l.pricePence)} each</p>
                    <div className="mt-auto flex items-center justify-between">
                      <QuantityStepper
                        size="sm"
                        label={`Quantity for ${l.name}`}
                        value={l.quantity}
                        max={MAX_QTY_PER_LINE}
                        onChange={(q) => setQty(l.productId, q)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-touch"
                        onClick={() => remove(l.productId)}
                        aria-label={`Remove ${l.name} from cart`}
                        className="text-muted-foreground hover:bg-white/[0.06] hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="gap-3 border-t border-border bg-surface-raised/60 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                {/* Indicative only: prices are a snapshot from when items were added. The server
                    recomputes every price, shipping and the total from the database at checkout
                    (src/server/pricing.ts), so this number is never trusted. */}
                <span className="text-lg font-semibold tabular-nums">{formatGBP(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and final total are calculated at checkout.</p>
              <SheetClose asChild>
                <Button asChild variant="brand" size="xl" className="w-full">
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </SheetClose>
              <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
                For laboratory research use only. Not for human consumption.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
