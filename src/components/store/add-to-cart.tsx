"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { T } from "@/components/i18n/t";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { MAX_QTY_PER_LINE, useCart, useCartHydrated } from "@/stores/cart";
import { QuantityStepper } from "./quantity-stepper";

export type CartProductSnapshot = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  pricePence: number;
  stock: number;
};

/** Upper bound for one line: the per-line cap, the stock, minus what is already in the cart. */
function useRemaining(p: CartProductSnapshot) {
  const hydrated = useCartHydrated();
  const inCart = useCart((s) => s.lines.find((l) => l.productId === p.productId)?.quantity ?? 0);
  const cap = Math.min(MAX_QTY_PER_LINE, Math.max(0, p.stock));
  return { remaining: Math.max(0, cap - (hydrated ? inCart : 0)), inCart: hydrated ? inCart : 0 };
}

function addLine(p: CartProductSnapshot, qty: number) {
  useCart.getState().add({ productId: p.productId, slug: p.slug, name: p.name, image: p.image, pricePence: p.pricePence }, qty);
}

/** Compact "Add to cart" for product cards. Opens the cart drawer on add. */
export function AddToCartButton({ product, className }: { product: CartProductSnapshot; className?: string }) {
  const { remaining, inCart } = useRemaining(product);
  const soldOut = product.stock <= 0;
  const disabled = soldOut || remaining === 0;
  const t = useT();

  return (
    <Button
      type="button"
      variant={disabled ? "glass" : "brand"}
      size="xl"
      disabled={disabled}
      onClick={() => addLine(product, 1)}
      className={cn("w-full", className)}
      aria-label={
        soldOut
          ? t(`${product.name} is out of stock`, `${product.name} está esgotado`)
          : t(`Add ${product.name} to cart`, `Adicionar ${product.name} ao carrinho`)
      }
    >
      {soldOut ? (
        <T>Out of stock</T>
      ) : remaining === 0 && inCart > 0 ? (
        <T>Max in cart</T>
      ) : (
        <>
          <ShoppingBag data-icon="inline-start" aria-hidden="true" />
          <T>Add to cart</T>
        </>
      )}
    </Button>
  );
}

/** Product page purchase block: quantity stepper + add to cart, bounded by stock and line cap. */
export function AddToCartPanel({ product }: { product: CartProductSnapshot }) {
  const { remaining, inCart } = useRemaining(product);
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const value = Math.max(1, Math.min(qty, Math.max(1, remaining)));

  if (soldOut) {
    return (
      <Button type="button" variant="glass" size="xl" disabled className="w-full sm:w-auto sm:min-w-56">
        <T>Out of stock</T>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <QuantityStepper label="Quantity" value={value} max={Math.max(1, remaining)} onChange={setQty} />
      <Button
        type="button"
        variant="brand"
        size="xl"
        disabled={remaining === 0}
        onClick={() => {
          addLine(product, value);
          setQty(1);
        }}
        className="flex-1 sm:max-w-72"
      >
        <ShoppingBag data-icon="inline-start" aria-hidden="true" />
        {remaining === 0 ? <T>Maximum quantity in cart</T> : <T>Add to cart</T>}
      </Button>
      {inCart > 0 && remaining > 0 && (
        <p className="text-sm text-muted-foreground sm:sr-only"><T pt={`${inCart} já no seu carrinho`}>{`${inCart} already in your cart`}</T></p>
      )}
    </div>
  );
}
