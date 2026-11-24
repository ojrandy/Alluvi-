import { CircleDollarSign, Euro, Globe, Landmark, Send, Wallet, type LucideIcon } from "lucide-react";
import { getPaymentMethodDef, type PaymentIcon } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";

const GLYPH: Record<Extract<PaymentIcon, { kind: "generic" }>["glyph"], LucideIcon> = {
  bank: Landmark,
  globe: Globe,
  euro: Euro,
  send: Send,
  coin: CircleDollarSign,
  wallet: Wallet,
};

/** WCAG relative luminance of a 6-digit hex, to pick a readable glyph colour on the brand tile. */
function isLight(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}

/**
 * Square tile with the method's mark: brand colour + white/black glyph for known brands, a neutral
 * tile with a generic glyph otherwise. Decorative (the method name is always next to it).
 */
export function PaymentMethodIcon({ method, className }: { method: string; className?: string }) {
  const icon = getPaymentMethodDef(method)?.icon ?? ({ kind: "generic", glyph: "wallet" } as const);
  const base = "inline-grid size-7 shrink-0 place-items-center rounded-lg ring-1 ring-inset";

  if (icon.kind === "generic") {
    const Glyph = GLYPH[icon.glyph];
    return (
      <span aria-hidden="true" className={cn(base, "bg-foreground/[0.06] text-foreground/80 ring-foreground/10", className)}>
        <Glyph className="size-[58%]" strokeWidth={1.9} />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn(base, "ring-white/10", className)} style={{ backgroundColor: `#${icon.hex}` }}>
      <svg viewBox="0 0 24 24" className="size-[58%]" fill={isLight(icon.hex) ? "#0a0a0a" : "#ffffff"}>
        <path d={icon.path} />
      </svg>
    </span>
  );
}
