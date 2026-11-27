import type { NextConfig } from "next";

/**
 * Legacy live-site routes (docs/CONTENT_INVENTORY.md "Route parity"). All permanent (308, which
 * search engines treat like 301). Routes that are rebuilt (shop, product, policies, …) are not here.
 */
const LEGACY_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/fake-sellers", destination: "/spot-a-fake#watchlist" },
  // Pharmacy/prescriptions copy contradicted research-use-only (SEO audit D01, C2); URL kept via 301.
  { source: "/our-location", destination: "/about" },
  { source: "/order-confirmation", destination: "/track-order" },
  { source: "/order-information", destination: "/track-order" },
  { source: "/payment-review", destination: "/track-order" },
  { source: "/payment-completed", destination: "/track-order" },
  { source: "/telegram-order", destination: "/shop" },
  { source: "/wholesale-console", destination: "/wholesale" },
  { source: "/management-console", destination: "/admin" },
  // Unknown purpose on the live site; default per CONTENT_INVENTORY is the home page.
  { source: "/ai-service", destination: "/" },
  { source: "/train-model", destination: "/" },
  { source: "/test-product", destination: "/" },
  { source: "/refersufbrfbrr", destination: "/" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for cPanel/Passenger (ADR-007, DEPLOYMENT.md). Assembled into the
  // deploy folder by scripts/assemble-release.mjs.
  output: "standalone",
  // Dev-only: lets devices on the local network (and the 127.0.0.1 loopback) load dev assets/HMR.
  allowedDevOrigins: ["127.0.0.1", "192.168.1.177", "192.168.*.*", "10.*.*.*"],
  // Dev-only badge: the bottom corners belong to the Telegram bubble (left) and Smartsupp (right).
  devIndicators: { position: "top-right" },
  cacheComponents: true,
  partialPrefetching: true,
  // Policy pages read content/pages/*.md at render time; ship them with the server bundle.
  outputFileTracingIncludes: {
    "/policies/*": ["./content/pages/**/*.md"],
  },
  async redirects() {
    return [
      // One canonical host (SEO audit D01, H2): www.alluvihealthcare.co → alluvihealthcare.co, path kept.
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "www.alluvihealthcare.co" }],
        destination: "https://alluvihealthcare.co/:path*",
        permanent: true,
      },
      ...LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true })),
    ];
  },
  turbopack: {
    rules: {
      // Only the Tailwind entry. A "*.css" key would also catch *.module.css and, via `as`,
      // re-type them as global CSS, so CSS Modules would export no class names.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
