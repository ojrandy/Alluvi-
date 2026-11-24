import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { verifySession } from "@/server/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="relative grid flex-1 place-items-center bg-[radial-gradient(60rem_30rem_at_50%_-10%,var(--brand-soft),transparent)] px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-9" />
          <p className="eyebrow mt-6 text-brand-ink">Management console</p>
          <h1 className="text-h2 mt-2">Sign in</h1>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_1px_2px_rgb(16_24_40/0.04),0_12px_32px_-12px_rgb(16_24_40/0.12)] sm:p-7">
          {/* useSearchParams (?next=) and the session check are request data: keep them out of the static shell. */}
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
            <RedirectIfSignedIn />
            <AdminLoginForm />
          </Suspense>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Authorised staff only. Attempts are rate limited.
        </p>
      </div>
    </div>
  );
}

async function RedirectIfSignedIn() {
  if (await verifySession()) redirect("/admin");
  return null;
}
