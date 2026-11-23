import type { Metadata } from "next";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { AccountNav, AccountNavList } from "@/components/account/account-nav";
import { Button } from "@/components/ui/button";
import { logout } from "@/server/actions/account-auth";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s · My account | Alluvi" },
  robots: { index: false, follow: false },
};

/**
 * Static chrome only. Auth is enforced by requireCustomer() inside each page (and each action),
 * never here: a layout doesn't re-run on every navigation, so it can't be the boundary.
 */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-page pt-10 pb-20 md:pt-16 md:pb-28">
      <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="text-h1 mt-3">My account</h1>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Suspense fallback={<AccountNavList pathname={null} />}>
            <AccountNav />
          </Suspense>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="xl" className="rounded-full px-4 text-muted-foreground hover:bg-white/[0.06]">
              <LogOut data-icon="inline-start" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <div className="pt-8 md:pt-10">{children}</div>
      <p className="mt-16 text-center text-sm text-muted-foreground">For laboratory research use only. Not for human consumption.</p>
    </div>
  );
}
