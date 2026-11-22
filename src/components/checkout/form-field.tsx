"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label + control + error, wired with aria-describedby / aria-invalid. */
export function FormField({
  id,
  label,
  error,
  hint,
  optional,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export const controlClass =
  "h-12 w-full rounded-xl border border-input bg-white/[0.03] px-4 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export function TextInput({ id, error, hint, className, ...props }: ComponentProps<"input"> & { id: string; error?: string; hint?: string }) {
  return (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className={cn(controlClass, className)}
      {...props}
    />
  );
}
