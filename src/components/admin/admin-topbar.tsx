"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Page title from the path, so the bar lives in the layout and never re-mounts between pages. */
function titleFor(pathname: string): string {
  const [, , section, sub] = pathname.split("/"); // "", "admin", section, sub
  switch (section) {
    case undefined:
    case "":
      return "Overview";
    case "orders":
      return sub ? "Order" : "Orders";
    case "products":
      return sub === "new" ? "New product" : sub ? "Edit product" : "Products";
    case "settings":
      return "Settings";
    default:
      return "Admin";
  }
}

export function AdminTopbar() {
  const title = titleFor(usePathname());
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <SidebarTrigger className="-ml-1.5" aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="h-5 data-vertical:self-center" />
      <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
