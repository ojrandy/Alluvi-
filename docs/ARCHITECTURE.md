# Architecture

> *How* the system is built. Read before adding a module, route, or dependency.

## 1. System context

```
            ┌──────────────────────────── Next.js 16 app (one deployable) ───────────────────────────┐
 Customer ─▶│  (store) route group      Server Components + Server Actions         (admin) route group │◀─ Admin
  browser   │  /, /shop, /product/...   ───────────────────────────────────▶      /admin/...          │  browser
            │          │                        src/server/*                          │               │
            └──────────┼─────────────────────────────┬──────────────────────────────┼───────────────┘
                       │                             │                              │
                 localStorage cart            ┌──────▼──────┐                 ┌─────▼─────┐
                 (zustand)                    │   MySQL     │                 │ SMTP      │──▶ shop webmail
                                              │  (Drizzle)  │                 │ (nodemailer)│──▶ customer inbox
                                              └─────────────┘                 └───────────┘
```

No external SaaS APIs. MySQL is the system of record; email is a notification channel only.

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, `cacheComponents: true`) | `middleware.ts` is now **`proxy.ts`**. Caching via `'use cache'` + `cacheTag`/`revalidateTag`. Check `node_modules/next/dist/docs/` before using any API from memory. |
| Language | TypeScript (strict) | |
| UI | Tailwind CSS v4, shadcn/ui (radix-nova), lucide-react, `motion` | Brand font: Manrope (via `next/font/google`) |
| 3D (optional, v2) | three, @react-three/fiber, @react-three/drei | Hero vial / product viewer. Must be lazy-loaded, client-only, with static image fallback. |
| Forms | react-hook-form + zod (`@hookform/resolvers`) | Same Zod schema validates on client and server |
| State | zustand (cart only, persisted) | Everything else is server state |
| DB | MySQL/MariaDB + **Drizzle ORM** (`mysql2` driver), drizzle-kit migrations | Namecheap cPanel database (ADR-010) |
| Hosting | Namecheap cPanel Node.js app (Passenger), `output: "standalone"`, built + deployed by GitHub Actions | ADR-007 |
| Email | nodemailer → client SMTP | HTML + plain-text templates in `src/emails/` |
| Auth (customer) | bcryptjs + `jose` cookie `alluvi_customer` (separate secret), reset tokens hashed in DB | Optional accounts; guest checkout always works (ADR-005) |
| Auth (admin) | bcryptjs hash in env + `jose` signed JWT in httpOnly cookie | Optimistic check in `proxy.ts`, **authoritative check in every admin Server Action / page** via `requireAdmin()` |
| Tables / charts | @tanstack/react-table, recharts | Dashboard only |
| Toasts | sonner | |
| IDs | nanoid (order numbers `ALV-XXXXXX`, uppercase, no ambiguous chars) | |
| Content scrape | playwright (dev only) | `scripts/scrape-live-site.ts` |

## 3. Directory layout

```
src/
  app/
    (store)/                 # public storefront, shares store layout (header/footer/cart)
      page.tsx               # home
      shop/  product/[slug]/  checkout/  order-confirmation/[orderNo]/  track-order/
      about/  spot-a-fake/  our-location/  policies/[slug]/
      login/  signup/  forgot-password/  reset-password/  account/   # optional customer accounts
    (admin)/admin/           # dashboard, shares admin shell (sidebar)
      login/  page.tsx (overview)  orders/  orders/[id]/  products/  products/[id]/  settings/
    api/admin/orders/export/route.ts   # CSV download (only route handler we need)
    sitemap.ts  robots.ts  layout.tsx  globals.css  not-found.tsx
  components/
    ui/                      # shadcn primitives — do not hand-edit beyond theming
    store/                   # storefront components
    admin/                   # dashboard components
    three/                   # 3D components (client-only, dynamic import)
  db/
    schema.ts  index.ts      # Drizzle schema + client (server-only)
  server/
    queries/                 # read functions ('use cache' where public)
    actions/                 # Server Actions ('use server'), one file per domain
    auth.ts                  # admin session, requireAdmin()
    customer-auth.ts         # customer session, requireCustomer(), tokens
    mail.ts                  # transporter + send helpers
    pricing.ts               # the ONLY place totals are computed
  emails/                    # email templates (order-received, order-shipped, admin-new-order)
  lib/
    validators/              # shared Zod schemas
    utils.ts  format.ts  constants.ts
  stores/cart.ts             # zustand
  proxy.ts                   # redirect unauthenticated /admin/* → /admin/login
scripts/                     # seed, scrape, hash-password
content/                     # recovered copy (markdown/json) used by seed + static pages
drizzle/                     # generated migrations (committed)
docs/                        # you are here
```

## 4. Key flows

### 4.1 Place order
1. Client submits checkout form → Server Action `placeOrder(input)`.
2. Zod-validate; reject if honeypot filled; rate-limit by IP.
3. Load products by id from DB; reject inactive / insufficient stock.
4. `pricing.ts` computes line totals, shipping, grand total (pence, integers).
5. **DB transaction:** insert `orders` + `order_items`, decrement stock, insert `order_events('created')`.
   Prices and stock are read with `SELECT … FOR UPDATE` inside the transaction; the stock decrement also guards `stock >= qty`. Order-number collisions retry (max 5).
6. After commit: set the signed `alluvi_orders` cookie (which confirmations this browser may view) and, if an account was created, the customer session. Emails (customer confirmation + admin notification) are sent in `after()` so the response never waits on SMTP; each is in try/catch and logs `email_sent` / `email_failed` to `order_events`.
7. `revalidateTag('products', 'max')`; return `orderNo` → redirect to `/order-confirmation/[orderNo]`. Opened in another browser, that page asks for the order email first (constant-time compare, rate limited).

The checkout sidebar is priced by `quoteCheckout` (same `pricing.ts`), never by the client cart snapshot.

### 4.2 Admin status change
`updateOrderStatus(id, status, tracking?)` → `requireAdmin()` → validate allowed transition →
update + insert `order_events` → if `shipped`, email customer → `revalidatePath`.

### 4.3 Caching
- Public catalogue queries use `'use cache'` + `cacheTag('products')` / `cacheTag('product:'+slug)`.
- Admin product mutations call `revalidateTag(...)`.
- Admin pages, checkout, track-order are dynamic (read cookies / per-request data).
- Policy pages read `content/pages/*.md` (`src/server/content/pages.ts`) and are statically generated.
- `src/db/index.ts` creates the pool lazily on first query, so modules that import `db` can be built without a database (CI).
- Components that call `usePathname()` in the shared header sit inside `<Suspense>` with a static fallback; otherwise dynamic routes without `generateStaticParams` fail to prerender.

## 5. Security model

- Money is **integer pence** everywhere. Client-supplied prices are ignored.
- All Server Actions validate input with Zod and authorize (`requireAdmin()` for admin).
- Session cookie: `httpOnly`, `secure`, `sameSite=lax`, 7-day expiry, HS256 with `SESSION_SECRET`.
- Login, signup, checkout and track-order are rate-limited through the `rate_limits` table, which is shared across Passenger workers.
- `server-only` imported by `db/`, `server/` so they can never be bundled to the client.
- Security headers set in `next.config.ts` (CSP, HSTS, X-Frame-Options, Referrer-Policy).

## 6. Quality gates

`npm run typecheck && npm run lint && npm run build` must pass before any task is marked done.
