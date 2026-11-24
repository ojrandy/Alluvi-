import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Admin console building blocks. Plain components (no hooks, no server-only imports) so both server
 * pages and client components can use them. One visual language: white cards, 1px hairline,
 * soft shadow, 20px radius, 20–24px padding.
 */

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  flush,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Body runs edge to edge (tables, lists). */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  as?: "section" | "div";
}) {
  const headingId = title ? `panel-${title.toLowerCase().replace(/\W+/g, "-")}` : undefined;
  return (
    <Tag aria-labelledby={headingId} className={cn("flex min-w-0 flex-col rounded-[1.25rem] border border-border bg-card shadow-card", className)}>
      {title && (
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={headingId} className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("min-w-0 flex-1", flush ? (title ? "pt-4" : "") : title ? "px-5 pt-4 pb-5 sm:px-6 sm:pb-6" : "p-5 sm:p-6", bodyClassName)}>
        {children}
      </div>
    </Tag>
  );
}

/** Small pill-style action used in panel headers ("Export", "View all"), as in the design reference. */
export const pillAction =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand-ink transition-colors outline-none hover:bg-brand hover:text-brand-foreground focus-visible:ring-2 focus-visible:ring-ring";

export const primaryAction =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-[0_1px_2px_rgb(16_24_40/0.08)] transition-[background-color,transform] outline-none hover:bg-[color-mix(in_oklch,var(--brand),black_6%)] focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98]";

export const secondaryAction =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-card transition-[background-color,transform] outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98]";

const AVATAR_TONES = ["bg-kpi-violet text-kpi-violet-ink", "bg-kpi-sky text-kpi-sky-ink", "bg-kpi-mint text-kpi-mint-ink", "bg-kpi-peach text-kpi-peach-ink"];

export function initials(nameOrEmail: string) {
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0].replace(/[._-]+/g, " ") : nameOrEmail;
  const parts = base.trim().split(/\s+/).filter(Boolean);
  const chars = parts.length > 1 ? parts[0][0] + parts.at(-1)![0] : (parts[0] ?? "?").slice(0, 2);
  return chars.toUpperCase();
}

/** Deterministic initials avatar (no images, no third-party services). */
export function AdminAvatar({ email, name, className }: { email?: string; name?: string; className?: string }) {
  const key = name || email || "?";
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold", AVATAR_TONES[h % AVATAR_TONES.length], className)}
    >
      {initials(key)}
    </span>
  );
}

/** Period-over-period change. `null` previous means "no comparison" (nothing to compare against). */
export function Delta({ current, previous, className }: { current: number; previous: number; className?: string }) {
  if (previous === 0 && current === 0) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground", className)}>
        <Minus className="size-3" aria-hidden="true" />
        No change
      </span>
    );
  }
  if (previous === 0) {
    return <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold text-success", className)}>New</span>;
  }
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", up ? "text-success" : "text-destructive", className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {Math.abs(pct) >= 1000 ? ">999" : Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}
