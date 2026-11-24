"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronRight, ExternalLink, LogOut, Search, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { adminLogout } from "@/server/actions/admin-auth";
import { AdminAvatar } from "./ui";

type Crumb = { label: string; href?: string };

/** Breadcrumb from the path, so the bar lives in the layout and never re-mounts between pages. */
function crumbsFor(pathname: string): Crumb[] {
  const [, , section, sub] = pathname.split("/"); // "", "admin", section, sub
  switch (section) {
    case undefined:
    case "":
      return [{ label: "Dashboard" }];
    case "orders":
      return sub ? [{ label: "Orders", href: "/admin/orders" }, { label: "Order details" }] : [{ label: "Orders" }];
    case "products":
      return sub
        ? [{ label: "Products", href: "/admin/products" }, { label: sub === "new" ? "New product" : "Edit product" }]
        : [{ label: "Products" }];
    case "settings":
      return [{ label: "Settings" }];
    default:
      return [{ label: "Admin" }];
  }
}

export function AdminTopbar({ email }: { email: string }) {
  const crumbs = crumbsFor(usePathname());
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" or Ctrl/⌘+K focuses the order search from anywhere (except while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md backdrop-saturate-150 sm:px-6 lg:px-8">
      <SidebarTrigger className="-ml-1.5 size-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Toggle navigation" />

      <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
        <ol className="flex items-center gap-1.5 text-sm">
          <li className="text-muted-foreground">Admin</li>
          {crumbs.map((c, i) => (
            <li key={c.label} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              {c.href ? (
                <Link href={c.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-foreground" aria-current={i === crumbs.length - 1 ? "page" : undefined}>
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        {/* next/form: GET to /admin/orders, client-side navigation with prefetch. */}
        <Form action="/admin/orders" role="search" className="relative w-full max-w-xs min-w-0 lg:max-w-sm">
          <label htmlFor="admin-search" className="sr-only">
            Search orders
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={searchRef}
            id="admin-search"
            name="q"
            type="search"
            maxLength={100}
            placeholder="Search orders…"
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full rounded-xl border border-border bg-card pr-12 pl-9 text-sm shadow-card outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:block">
            /
          </kbd>
        </Form>

        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="hidden size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-card transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 sm:grid"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          <span className="sr-only">View store (opens in a new tab)</span>
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex shrink-0 items-center gap-2.5 rounded-xl p-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 lg:pr-3">
            <AdminAvatar email={email} className="size-8" />
            <span className="hidden text-left leading-tight lg:block">
              <span className="block max-w-[11rem] truncate text-sm font-semibold text-foreground">{email.split("@")[0]}</span>
              <span className="block text-xs text-muted-foreground">Administrator</span>
            </span>
            <span className="sr-only">Account menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium text-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                  <Settings aria-hidden="true" />
                  Store settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/" target="_blank" rel="noopener">
                  <ExternalLink aria-hidden="true" />
                  View store
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={adminLogout}>
              <DropdownMenuItem asChild variant="destructive">
                <button type="submit" className="w-full">
                  <LogOut aria-hidden="true" />
                  Log out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
