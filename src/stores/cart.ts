"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Client cart. Prices here are a DISPLAY SNAPSHOT only: the server recomputes every
 * price and total from the database at checkout (src/server/pricing.ts).
 */
export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  pricePence: number;
  quantity: number;
};

export const MAX_QTY_PER_LINE = 10;

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
};

const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

const clampQty =(q: number) => Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(q)));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          const lines = existing
            ? s.lines.map((l) =>
                l.productId === line.productId ? { ...l, ...line, quantity: clampQty(l.quantity + quantity) } : l,
              )
            : [...s.lines, { ...line, quantity: clampQty(quantity) }];
          return { lines, isOpen: true };
        }),
      setQty: (productId, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.productId === productId ? { ...l, quantity: clampQty(quantity) } : l)),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "alluvi-cart-v1",
      // Node 26 has its own global `localStorage`, so reference the browser's explicitly.
      storage: createJSONStorage(() => (typeof window === "undefined" ? noopStorage : window.localStorage)),
      partialize: (s) => ({ lines: s.lines }), // never persist UI state
      skipHydration: true, // hydrated manually after mount → no SSR/client mismatch
    },
  ),
);

export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectSubtotalPence = (s: CartState) => s.lines.reduce((n, l) => n + l.pricePence * l.quantity, 0);

/** Rehydrate the persisted cart once on the client; returns true once it's safe to render cart data. */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(() => useCart.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useCart.persist.onFinishHydration(() => setHydrated(true));
    void useCart.persist.rehydrate();
    return unsub;
  }, [hydrated]);
  return hydrated;
}
