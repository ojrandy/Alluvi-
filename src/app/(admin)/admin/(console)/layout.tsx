import type { ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar-cookie";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdmin } from "@/server/auth";

/**
 * Admin shell for every signed-in page (/admin/login sits outside this group). The shell reads the
 * session and the sidebar preference cookie, so it renders inside Suspense (Cache Components).
 * Pages still call requireAdmin() themselves: a layout check alone is not a security boundary.
 */
export default function AdminConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: ReactNode }) {
  const [admin, jar] = await Promise.all([requireAdmin(), cookies()]);
  const defaultOpen = jar.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    // TooltipProvider: the collapsed (icon-only) sidebar labels each item with a tooltip.
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar email={admin.email} />
        <SidebarInset className="min-w-0 bg-background">
          <AdminTopbar email={admin.email} />
          <div id="admin-main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      {/* Light theme explicitly: there is no next-themes provider, the console is always light. */}
      <Toaster theme="light" position="bottom-right" richColors closeButton />
    </TooltipProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 border-b border-border" />
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-[1.25rem]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
