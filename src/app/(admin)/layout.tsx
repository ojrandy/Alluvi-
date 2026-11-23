import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Alluvi Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/** Admin route group: no storefront chrome. Auth is enforced per page/action via requireAdmin(). */
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
