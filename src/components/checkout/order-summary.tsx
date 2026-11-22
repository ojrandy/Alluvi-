"use client";

import Image from "next/image";
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatGBP } from "@/lib/money";
import type { CartLine } from "@/stores/cart";
import type { CheckoutQuote } from "@/server/actions/checkout";

type Props = {
  cartLines: CartLine[];
  quote: CheckoutQuote | null;
  quoteError: string | null;
  issueIds: Set<string>;
  pending: boolean;
  promoLabel: string | null;
};

/**
 * Sidebar summary. Every amount shown here comes from the server (quoteCheckout → pricing.ts);
 * the cart snapshot is used only for images and as a placeholder while the quote loads.
 */
export function OrderSummary({ cartLines, quote, quoteError, issueIds, pending, promoLabel }: Props) {
  const priced = new Map(quote?.lines.map((l) => [l.productId, l]));

  return (
    <section aria-labelledby="summary-title" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 id="summary-title" className="text-h3">Order summary</h2>
        {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Updating totals" />}
      </div>

      <ul className="mt-5 divide-y divide-border">
        {cartLines.map((l) => {
          const p = priced.get(l.productId);
          const problem = issueIds.has(l.productId);
          return (
            <li key={l.productId} className="flex gap-3 py-3.5">
              <div className="relative aspect-[3/2] w-16 shrink-0 self-start overflow-hidden rounded-lg border border-border bg-surface-raised">
                {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug font-medium">{p?.name ?? l.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Qty {l.quantity}</p>
                {problem && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    Not available in this quantity
                  </p>
                )}
              </div>
              <p className="text-sm font-medium tabular-nums">{p ? formatGBP(p.lineTotalPence) : "—"}</p>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{quote ? formatGBP(quote.subtotalPence) : "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="tabular-nums">
            {!quote ? "—" : quote.shippingPence === 0 ? <span className="font-medium text-success">Free</span> : formatGBP(quote.shippingPence)}
          </dd>
        </div>
        {quote?.freeShippingReason === "promo" && promoLabel && (
          <p className="text-xs text-success">{promoLabel}</p>
        )}
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="text-xl font-semibold tabular-nums" aria-live="polite">
            {quote ? formatGBP(quote.totalPence) : "—"}
          </dd>
        </div>
      </dl>

      {quoteError && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {quoteError}
        </p>
      )}

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Prices are confirmed from our catalogue when you place the order. Payment is by UK bank transfer.
      </p>
    </section>
  );
}
