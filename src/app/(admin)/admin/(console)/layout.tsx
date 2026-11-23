import type { ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar-cookie";
import { Skeleton } from "@/components/ui/skeleton";
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
        <SidebarInset className="min-w-0">
          <AdminTopbar />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 border-b border-border" />
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-5 lg:p-8">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
