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
    (admin)/admin/           # dashboard
      login/                 # bare layout (outside the shell)
      (console)/             # shell: collapsible sidebar, top bar, mobile sheet nav (layout.tsx)
        page.tsx (overview)  orders/  orders/[id]/  products/  products/new/  products/[id]/  settings/
    api/admin/orders/export/route.ts   # CSV download
    api/admin/uploads/route.ts         # admin image upload (multipart, 5 MB; Server Actions cap at 1 MB)
    uploads/[file]/route.ts            # serves uploaded images from UPLOADS_DIR
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
    storage.ts               # product image storage (local disk now, swappable; ADR-017)
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
`updateOrderStatus(orderId, status, trackingNumber?)` (src/server/actions/orders.ts) → Zod → `requireAdmin()` →
transaction: lock the order row (`FOR UPDATE`) → check `ORDER_TRANSITIONS` (src/lib/order-transitions.ts) →
compare-and-set update (`WHERE status = from`) → on `cancelled`, restore stock → insert `order_events`
(`status_changed`, `data: {from, to, trackingNumber?, restocked?}`, actor = admin email) → commit →
`revalidateTag('products','max')` if stock moved → if `shipped`, `sendOrderShippedEmail` in `after()` → `refresh()`.
The shipped email is sent once: `shipped` is reachable only from `processing` and never left backwards, and the
sender also skips if an `order-shipped` `email_sent` event exists. Tracking number and internal note have their
own actions (`updateOrderTracking`, `updateOrderNote`) that log `note` events.

### 4.2a Orders list + CSV
`/admin/orders` reads `q` / `status` / `page` from searchParams (parsed once by `parseAdminOrderFilters`, shared
with the export). Server-side LIKE search (wildcards escaped) on order no, email and "first last"; 20 per page;
TanStack Table v9 renders only (no client row models). `GET /api/admin/orders/export` uses the same filters
(all pages, cap 10,000 rows), `verifySession()` → 401, UTF-8 BOM + CRLF + RFC 4180 quoting, and prefixes cells
starting with `= + - @` with `'` (CSV formula injection).

### 4.2b Products admin
`saveProduct` (src/server/actions/products.ts) takes the raw form values and re-parses them with the same
`productFormSchema` the browser resolver uses (`src/lib/validators/admin-products.ts`, £ → pence) → `requireAdmin()`
→ transaction with the row locked (stock written only if the admin changed it) → replace `product_images` →
`updateTag("products")` + `updateTag("product:<slug>")` for old and new slug → `refresh()`. Images are uploaded
first (`POST /api/admin/uploads` → `imageStorage.save`) and only referenced once the product is saved; files no
product references any more are removed in `after()`. Delete archives instead when the product has orders.

### 4.3a Track order
`/track-order` is a static shell. `trackOrder` (Server Action): Zod (accepts `ALV-XXXXXX`, `alv xxxxxx` or the bare 6 chars) →
rate limit 10/10 min per IP hash → load by order number → constant-time email digest compare (dummy digest when the order is missing) →
one generic "not found" message for every miss. A match returns a minimal DTO (status, timeline, items, totals, tracking number + Royal Mail link;
no address or phone) and grants the `alluvi_orders` cookie so "View full order" opens the confirmation page.

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
- Sessions (ADR-016): `alluvi_admin` (7 days, key derived from `SESSION_SECRET`) and `alluvi_customer` (30 days, `CUSTOMER_SESSION_SECRET`). Both are `httpOnly`, `secure` in production, `sameSite=lax`, HS256 via `src/server/session-tokens.ts`, and carry a password-version claim so a password change revokes them.
- `src/proxy.ts` redirects `/admin/*` → `/admin/login`, `/account/*` → `/login?next=` and returns 401 for `/api/admin/*`. It is optimistic only: `requireAdmin()` (`src/server/auth.ts`) and `requireCustomer()` (`src/server/customer-auth.ts`) run in every page and action.
- Account tokens (reset / verify) are 32 random bytes, stored as sha256, single use, 30 minutes, consumed under a row lock (`src/server/customer-tokens.ts`). Guest orders are linked to an account only after the email is verified (`linkGuestOrders`, `customer_linked` event).
- Auth errors are generic and unknown emails cost the same bcrypt work (no user enumeration). Rate limits: admin login 5/15 min per IP + 50/15 min global; customer login 20/15 min per IP + 5/15 min per email; signup, forgot-password and reset are also limited.
- Client IP for rate limiting = right-most `x-forwarded-for` hop (`TRUSTED_PROXY_HOPS`), never the client-controlled left-most one.
- Login, signup, checkout and track-order are rate-limited through the `rate_limits` table, which is shared across Passenger workers.
- `server-only` imported by `db/`, `server/` so they can never be bundled to the client.
- Security headers set in `next.config.ts` (CSP, HSTS, X-Frame-Options, Referrer-Policy).

## 6. Quality gates

`npm run typecheck && npm run lint && npm run build` must pass before any task is marked done.
