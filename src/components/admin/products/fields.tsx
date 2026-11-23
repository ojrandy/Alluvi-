import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Admin form controls: same look as the order forms (D2-3), with aria-invalid styling. */
export const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-white/[0.03] px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export const textareaClass = cn(inputClass, "h-auto min-h-24 resize-y py-2 leading-relaxed");

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

/**
 * Label + control + hint/error. `describedBy` gives the control its aria-describedby: the error
 * when there is one, otherwise the hint.
 */
export function Field({
  id,
  label,
  optional,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/** aria props for a control rendered inside <Field>. */
export function describe(id: string, error?: string, hasHint?: boolean) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `section-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className={cn("rounded-2xl border border-border bg-card", className)}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4 p-5 pt-4">{children}</div>
    </section>
  );
}
