"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LayoutDashboard, LogOut, Package, Settings, ShoppingBag, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/server/actions/admin-auth";
import { AdminAvatar } from "./ui";

type NavItem = { title: string; href: string; icon: LucideIcon; exact?: boolean };

const NAV: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { title: "Products", href: "/admin/products", icon: Package },
];

const SYSTEM: NavItem[] = [{ title: "Settings", href: "/admin/settings", icon: Settings }];

const matches = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

/** Shared look for every nav row: a soft pill, solid brand pill when active (as in the design reference). */
const itemClass =
  "h-10 gap-3 rounded-xl px-3 font-medium text-sidebar-foreground transition-colors duration-150 data-active:bg-brand data-active:font-semibold data-active:text-brand-foreground data-active:shadow-[0_1px_2px_rgb(16_24_40/0.08)] group-data-[collapsible=icon]:rounded-lg [&_svg]:size-[18px]";

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  // Optimistic highlight: the clicked item lights up immediately, before the route commits. It is
  // tied to the pathname it was clicked on, so it is discarded as soon as navigation lands.
  const [clicked, setClicked] = useState<{ href: string; from: string } | null>(null);
  const pendingHref = clicked && clicked.from === pathname ? clicked.href : null;

  const isActive = (item: NavItem) => (pendingHref ? pendingHref === item.href : matches(pathname, item));
  const onNavigate = (item: NavItem) => {
    if (pathname !== item.href) setClicked({ href: item.href, from: pathname });
    if (isMobile) setOpenMobile(false);
  };

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const active = isActive(item);
      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={active} tooltip={item.title} className={itemClass}>
            <Link href={item.href} onClick={() => onNavigate(item)} aria-current={active ? "page" : undefined}>
              <item.icon aria-hidden="true" />
              <span>{item.title}</span>
              <PendingDot />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon" className="border-r-sidebar-border">
      <SidebarHeader className="h-[4.5rem] justify-center px-5 group-data-[collapsible=icon]:px-2">
        <Link
          href="/admin"
          onClick={() => onNavigate(NAV[0])}
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-[13px] font-bold text-ink-foreground"
          >
            A
          </span>
          <span className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <Logo className="h-[18px] text-foreground" wordmarkOnly />
            <span className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Console</span>
          </span>
          <span className="sr-only">Alluvi admin dashboard</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
            Main menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{renderItems(NAV)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
            Store
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {renderItems(SYSTEM)}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View store" className={itemClass}>
                  <a href="/" target="_blank" rel="noopener">
                    <ExternalLink aria-hidden="true" />
                    <span>View store</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-sidebar-border bg-surface p-4 text-center group-data-[collapsible=icon]:hidden">
          <AdminAvatar email={email} className="size-11 text-sm" />
          <div className="min-w-0 max-w-full">
            <p className="truncate text-sm font-semibold text-foreground" title={email}>
              {email}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={adminLogout}>
              <SidebarMenuButton type="submit" tooltip="Log out" className={cn(itemClass, "hover:text-destructive")}>
                <LogOut aria-hidden="true" />
                <span>Log out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Tiny always-rendered indicator (no layout shift) that pulses while a non-prefetched route loads. */
function PendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-auto size-1.5 shrink-0 rounded-full bg-current opacity-0 transition-opacity group-data-[collapsible=icon]:hidden",
        pending && "animate-pulse opacity-70",
      )}
    />
  );
}
