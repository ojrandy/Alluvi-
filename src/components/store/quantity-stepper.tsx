"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: "md" | "sm";
  className?: string;
};

/** Accessible −/+ stepper. Buttons are ≥44px on "md"; the value is announced via aria-live. */
export function QuantityStepper({ value, min = 1, max, onChange, label, size = "md", className }: Props) {
  const btn = cn(
    "grid place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:pointer-events-none disabled:opacity-35",
    size === "md" ? "size-11" : "size-9",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-full border border-border bg-white/[0.03]", className)}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className={cn("min-w-8 text-center font-semibold tabular-nums", size === "sm" && "text-sm")}>
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
