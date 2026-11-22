"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { quoteCheckout, type CheckoutQuote } from "@/server/actions/checkout";
import type { CartLine } from "@/stores/cart";

/** Re-price the cart on the server whenever lines, shipping method or country change (debounced). */
export function useCheckoutQuote(lines: CartLine[], shippingMethod: string, country: string, enabled: boolean) {
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issueIds, setIssueIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const key = useMemo(() => JSON.stringify(lines.map((l) => [l.productId, l.quantity])), [lines]);

  useEffect(() => {
    if (!enabled || !shippingMethod) return;
    const items = (JSON.parse(key) as [string, number][]).map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = await quoteCheckout({ items, shippingMethod, country });
        if (cancelled) return;
        if (res.ok) {
          setQuote(res.data);
          setError(null);
          setIssueIds(new Set());
        } else {
          setQuote(null);
          setError(res.error);
          setIssueIds(new Set((res.issues ?? []).map((i) => i.productId)));
        }
      });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key, shippingMethod, country, enabled]);

  return { quote, error, issueIds, pending, setIssueIds, setError };
}
