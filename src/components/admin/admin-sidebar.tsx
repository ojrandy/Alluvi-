"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminLogout } from "@/server/actions/admin-auth";

type NavItem = { title: string; href: string; icon: LucideIcon; exact?: boolean };

const NAV: NavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

const isActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  // The mobile nav is a Sheet: close it once a link is followed.
  const onNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center px-3 group-data-[collapsible=icon]:px-2">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Logo className="h-6 group-data-[collapsible=icon]:hidden" />
          <span
            aria-hidden="true"
            className="hidden size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground group-data-[collapsible=icon]:grid"
          >
            A
          </span>
          <span className="sr-only">Alluvi admin overview</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}>
                        <item.icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="View store">
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink aria-hidden="true" />
                <span>View store</span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={adminLogout}>
              <SidebarMenuButton type="submit" tooltip="Log out">
                <LogOut aria-hidden="true" />
                <span>Log out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="truncate px-2 pt-1 pb-0.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden" title={email}>
          {email}
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
