import type { ReactNode } from "react";
import { PackageSearch, ShieldCheck, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { T } from "@/components/i18n/t";

/**
 * Shared frame for /login, /signup, /forgot-password, /reset-password and /verify-email: centred
 * heading, one card, an optional footer line, and a quiet reassurance strip. Static (no request
 * data), so it renders in the prerendered shell while the form streams in.
 */
export function AuthShell({
  eyebrow = "Account",
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container-page pt-10 pb-20 md:pt-16 md:pb-28">
      <div className="mx-auto max-w-md">
        <header className="text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-h1 mt-3 text-balance">{title}</h1>
          {description && <p className="text-lead mt-4 text-pretty">{description}</p>}
        </header>
        <div className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        <ul className="mt-10 grid gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:grid-cols-3">
          <li className="flex items-center gap-2 sm:justify-center">
            <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden="true" />
            Guest checkout always available
          </li>
          <li className="flex items-center gap-2 sm:justify-center">
            <PackageSearch className="size-4 shrink-0 text-brand" aria-hidden="true" />
            Order history in one place
          </li>
          <li className="flex items-center gap-2 sm:justify-center">
            <Truck className="size-4 shrink-0 text-brand" aria-hidden="true" />
            Faster checkout
          </li>
        </ul>
        <p className="mt-10 text-center text-sm text-muted-foreground"><T>For laboratory research use only. Not for human consumption.</T></p>
      </div>
    </div>
  );
}

export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="mt-2 h-12 w-full rounded-full" />
    </div>
  );
}
