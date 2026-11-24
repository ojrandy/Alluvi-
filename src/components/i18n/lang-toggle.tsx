"use client";

import type { ComponentProps } from "react";
import { toggleLang } from "@/lib/i18n/client";
import { T } from "./t";

/**
 * "Alluvi Brazil" switches the site to Brazilian Portuguese in place; in Portuguese it reads
 * "English" and switches back (the label swap is pure CSS via <T>). A real <button>: it changes
 * state, not location. Forwards props and ref so it works inside Radix `asChild` slots (SheetClose).
 */
export function LangToggle({ onClick, ...props }: Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        toggleLang();
        onClick?.(e);
      }}
    >
      <T pt="English">Alluvi Brazil</T>
    </button>
  );
}
