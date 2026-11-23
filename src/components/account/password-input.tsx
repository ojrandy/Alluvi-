"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextInput } from "@/components/checkout/form-field";
import { cn } from "@/lib/utils";

/** TextInput with an accessible show/hide toggle (44px target, announced state). */
export function PasswordInput({ className, ...props }: ComponentProps<typeof TextInput>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} type={visible ? "text" : "password"} className={cn("pr-12", className)} spellCheck={false} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {visible ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
      </button>
    </div>
  );
}
