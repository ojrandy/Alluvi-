import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Alluvi Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#f4f5f7",
  colorScheme: "light",
};

/**
 * Admin route group: no storefront chrome. `data-admin-ui` switches the whole document to the light
 * console theme (globals.css, ADR-019). Auth is enforced per page/action via requireAdmin().
 */
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div data-admin-ui className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
