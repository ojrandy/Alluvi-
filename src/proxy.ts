import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, CUSTOMER_COOKIE, verifyAdminToken, verifyCustomerToken } from "@/server/session-tokens";

/**
 * Optimistic redirects only (docs: guides/authentication#optimistic-checks-with-proxy). It verifies
 * the JWT signature + expiry, which needs no database. It is NOT the security boundary: every admin
 * page/action calls requireAdmin() and every account page/action calls requireCustomer(), which also
 * check the password version and (for customers) that the account still exists.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin/login") return noIndex(NextResponse.next());

  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) {
    const ok = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (ok) return noIndex(NextResponse.next());
    if (pathname.startsWith("/api/")) {
      return noIndex(NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }));
    }
    return noIndex(redirectTo(request, "/admin/login", pathname === "/admin" ? null : `${pathname}${search}`));
  }

  if (pathname === "/account" || pathname.startsWith("/account/")) {
    const ok = await verifyCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
    if (!ok) return redirectTo(request, "/login", `${pathname}${search}`);
  }

  return NextResponse.next();
}

function redirectTo(request: NextRequest, path: string, next: string | null) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = next ? `?next=${encodeURIComponent(next)}` : "";
  return NextResponse.redirect(url);
}

function noIndex(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*", "/account", "/account/:path*"],
};
