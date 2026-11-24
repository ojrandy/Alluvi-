import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  error: { cls: "border-destructive/30 bg-destructive/10 text-foreground", Icon: AlertCircle, iconCls: "text-destructive" },
  success: { cls: "border-success/30 bg-success/10 text-foreground", Icon: CheckCircle2, iconCls: "text-success" },
  info: { cls: "border-border bg-foreground/[0.03] text-muted-foreground", Icon: Info, iconCls: "text-brand" },
} as const;

/** Inline status message for auth/account forms. Errors use role="alert" so they're announced. */
export function FormAlert({
  tone = "error",
  id,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed", t.cls, className)}
    >
      <t.Icon className={cn("mt-0.5 size-4 shrink-0", t.iconCls)} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
