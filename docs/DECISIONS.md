# Architecture Decision Records

> Why things are the way they are. Add a new ADR instead of silently changing a decision.
> Format: Context → Decision → Consequences. Status: `Accepted` · `Proposed` · `Superseded`.

## ADR-001 — Single Next.js app for storefront and dashboard
**Status:** Accepted
**Context:** 2-day deadline, one developer, small catalogue.
**Decision:** One Next.js 16 app; `(store)` and `(admin)` route groups.
**Consequences:** One deploy, shared types/schemas. Admin bundle is isolated by route; no extra infra.

## ADR-002 — MySQL (MariaDB) + Drizzle, no backend API layer
**Status:** Accepted (amended 2026-11-22: Postgres → MySQL, see ADR-010)
**Context:** "No extra APIs." Orders still need durable storage and querying.
**Decision:** MySQL via Drizzle (`mysql2` driver); mutations through Server Actions; one route handler for CSV export.
**Consequences:** `DATABASE_URL` only. Migrations committed in `drizzle/`.

## ADR-003 — Email via the client's own SMTP (nodemailer)
**Status:** Accepted
**Context:** Orders must reach the shop's webmail; no third-party email API.
**Decision:** nodemailer with client SMTP. Order is committed before sending; failures logged to `order_events`.
**Consequences:** Deliverability depends on SPF/DKIM/DMARC — must be configured at launch.

## ADR-004 — Bank transfer only in v1 (superseded by ADR-021)
**Status:** Accepted (client confirmed 2026-11-22)
**Context:** Live site uses Klyme (open banking). Mainstream processors (Stripe, PayPal) prohibit this product category.
**Decision:** v1 = bank transfer with order number as reference; admin marks `paid`. Klyme in v2.
**Consequences:** Zero integration risk; manual reconciliation by admin.

## ADR-005 — Guest checkout **plus optional customer accounts** in v1
**Status:** Accepted (client confirmed 2026-11-22; supersedes the earlier "guest only" proposal)
**Context:** Client wants guest checkout to keep working, with the option to create an account.
Old account data is lost with the old system, so returning customers must re-register.
**Decision:**
- Guest checkout remains the default path. `/track-order` (order no + email) works for everyone.
- Optional "Create an account" checkbox at checkout (sets a password) and standalone `/signup`, `/login`, `/account`.
- Accounts: email + bcrypt password, own `jose` session cookie (`alluvi_customer`, separate secret from admin),
  password reset by emailed single-use token (hashed, 30-min expiry).
- `/account`: order history + saved default address. Guest orders made with the same email are
  linked once the customer verifies that email (via the reset/verify token flow).
**Consequences:** ~3h extra in v1 (task D2-1A). Social login, wishlists and similar features remain v2.

## ADR-006 — Single admin, env-based credentials, JWT cookie
**Status:** Accepted
**Context:** 1–2 admins. A full auth library is overkill.
**Decision:** `ADMIN_EMAIL` + bcrypt `ADMIN_PASSWORD_HASH` in env; `jose` HS256 session cookie; `proxy.ts` optimistic redirect + `requireAdmin()` in every admin action/page.
**Consequences:** No user table needed. Multi-admin/roles is V2-6.

## ADR-007 — Hosting on Namecheap via GitHub pipeline
**Status:** Accepted (client confirmed 2026-11-22)
**Context:** Everything (app, dashboard, database, email) is hosted on Namecheap.
**Decision:**
- App runs as a cPanel **"Setup Node.js App"** (Phusion Passenger) using Next.js `output: "standalone"`.
- **Build in GitHub Actions, not on the server.** Shared hosting has tight RAM/process limits, so building there fails.
  CI builds the standalone bundle and deploys it over SSH (rsync) or FTP, runs migrations, then restarts
  Passenger (`touch tmp/restart.txt`).
- Database: MySQL/MariaDB created in cPanel (ADR-010). Email: the same cPanel's mailboxes over SMTP.
- Uploaded product images are written to a persistent folder outside the deploy directory and served from there.
**Consequences:** No preview deploys (use a staging subdomain if needed). The Node version must be ≥ 20.9 in
cPanel. Pin it in `.nvmrc` and in CI. See DEPLOYMENT.md.

## ADR-010 — MySQL instead of Postgres
**Status:** Accepted
**Context:** Namecheap shared/cPanel hosting provides MySQL/MariaDB databases. PostgreSQL there is
not reliably available.
**Decision:** Drizzle `mysql-core` + `mysql2`. UUIDs as `char(36)` generated in app
(`crypto.randomUUID()`), `json` instead of `jsonb`, `datetime` stored in UTC, money still integer pence.
Avoid MySQL-8-only features so MariaDB 10.x also works. Drizzle must use `mode: "planetscale"` because MariaDB has no `LATERAL` joins (found and fixed in D1-2).
**Consequences:** If the client later moves to a VPS, MySQL still works; no migration needed.

## ADR-008 — Canonical domain
**Status:** Accepted (2026-11-22). **alluvi.store** is canonical. Verified redirect chain: `alluvi.org` → `alluvi.bz` → `alluvi.store` (all 301), and all three served the same build.
**Context:** Site served at `alluvi.store`, sitemap canonical is `alluvi.bz`.
**Decision:** Pick one as `NEXT_PUBLIC_SITE_URL`; 301 the other at DNS/host level.
**Amended 2026-11-24 (client):** canonical domain is now **alluvihealthcare.co** and the single public contact email is **info@alluvihealthcare.co**. All storefront copy (announcement marquee, policies, press release, Spot a Fake, product-slider watermark) names only this domain. Production must set `NEXT_PUBLIC_SITE_URL=https://alluvihealthcare.co`; the old domains should 301 to it. Product photos still carry the old `www.ALLUVI.org` watermark baked into the pixels until the client supplies clean originals.

## ADR-009 — 3D is progressive enhancement only
**Status:** Accepted
**Context:** 3D can make the brand feel premium but hurts mobile performance if careless.
**Decision:** three / R3F components are client-only, `next/dynamic` with `ssr:false`, shown only above `md` breakpoint or when `prefers-reduced-motion` is not set, with a static image fallback. Not on the v1 critical path.
**Consequences:** LCP never depends on WebGL.

## ADR-011: Dark-only brand theme; notice bar not dismissible
**Status:** Accepted (2026-11-22)
**Context:** The live brand is black + Alluvi orange (#FF8200) with an orange→teal gradient. The orange bar carries anti-scam and RUO safety notices.
**Decision:** One dark theme (tokens in `globals.css`, `color-scheme: dark`); no light mode for the storefront. The notice bar is a pausable marquee (static under reduced motion) and is deliberately **not dismissible** (deviation from the D1-3 prompt), because it carries safety notices.
**Consequences:** Simpler CSS, consistent brand. Admin reuses the same tokens.

## ADR-012: Launch free-shipping promotion
**Status:** Accepted (2026-11-22)
**Decision:** `settings.free_shipping_promo = {startsAt, endsAt, label}`, seeded to 60 days from the first seed (launch). `pricing.ts` sets shipping to 0 while active. Editable in `/admin/settings`.

## ADR-013: Home-page motion reproduced with `motion`, not GSAP
**Status:** Accepted (2026-11-22)
**Context:** The client asked for the home page to match alluvi.store "with all the animation, GSAP, scroll animations". The live
bundle contains no GSAP: its motion is Webflow IX2 (page-load timeline, scroll-scrubbed keyframes), framer-motion (QA steps)
and CSS (`animation-timeline: view()`, marquee).
**Decision:** Port every interaction 1:1 with the already-installed `motion` package (`useScroll` + `useTransform` reproduce IX2
scroll-progress keyframes) and CSS. No GSAP dependency (~70KB). Deliberate deviations, for performance and UX:
- Load sequence compressed (heading at ~0.1s instead of 2s) and the heading/lede move in without an opacity fade, so the hero
  heading stays the LCP element.
- Anti-counterfeit popup opens from 3s on the visitor's first scroll/tap/key (live: pure 3s timer made the artwork the LCP).
- Dark→light phone wipe ends at full height smoothly (live jumped from 67% to 100%).
- Giveaway/newsletter popup not rebuilt (needs an email-marketing backend; out of v1 scope).
- App-store badges are images, not links (live links pointed at applestore.com / googleplay.com placeholders).
- Everything is static under `prefers-reduced-motion`.
**Consequences:** No new dependency. Section styles live in CSS Modules under `src/components/home/`.

## ADR-014: In-house safe Markdown renderer instead of react-markdown
**Status:** Accepted (2026-11-22)
**Context:** Product descriptions and policy pages need Markdown (headings, lists, links, bold). Descriptions are admin-editable, so the renderer must never emit raw HTML.
**Decision:** `src/components/content/markdown.tsx` handles the small subset we use (##/### with ids for anchors/TOC, paragraphs, lists, quotes, rules, bold/italic, links limited to http(s)/mailto/tel/relative). It builds React elements only; unknown syntax renders as text. No new dependency.
**Consequences:** Tables, images and code blocks are not supported. If content ever needs them, switch to react-markdown (without rehype-raw).

## ADR-015: Storefront route decisions made in D1-5..D1-8
**Status:** Accepted (2026-11-22, made autonomously; client may revisit)
- **/fake-sellers** 301s to **/spot-a-fake#watchlist** (per CONTENT_INVENTORY). The live watchlist content is kept, verbatim, as a section of /spot-a-fake so nothing is lost.
- **/announcements** is rebuilt (live content is real and linked from footer and mobile nav) rather than 301'd.
- **Product page Janoshik panel** is shown inline, not as the live site's auto-opening modal (the modal steals focus and hides the page on load).
- **/wholesale** keeps the live tiers / why / how-to-order copy; the live inquiry form (which posted to the old backend) is replaced by email + Telegram buttons from `content/site.json` until V2-3.
- **/our-location**: the live "See Pharmacy Location" button had no target or address, so it is omitted.
- **/about**: the live "Stay upto date" email capture links to /announcements (no newsletter backend in v1, see ADR-013).
- **Checkout** collects phone (couriers need it), offers UK tracked for GB and international tracked elsewhere, and requires one combined checkbox: 18+, research-use-only and Terms/Refund acceptance (`orders.ruo_accepted_at`).
- **Order emails** are sent in `after()` (post-response), so SMTP latency or outages never slow or fail checkout.
- **Seeded placeholder bank details** are never displayed; customers are told details will be emailed until real ones are set.

## ADR-016: Auth details settled in D2-1 / D2-1A
**Status:** Accepted (2026-11-22, made autonomously; client may revisit)
- **Signup confirms the email before signing in.** `/signup` always answers "check your inbox". A new email gets a confirmation link (`verify_email` token); an email that already has an account gets a "you already have an account" email instead. Signing in straight after signup would reveal which emails are registered, which conflicts with "no user enumeration". Confirming sets `email_verified_at`, links earlier guest orders and signs the customer in. Unverified accounts can still sign in with their password (they just don't see guest orders).
- **Single-use links are confirmed with a button, not on page load** (`/verify-email`, `/reset-password`): mail scanners pre-open links, and a GET that consumed the token would burn it. Both pages use `referrer: no-referrer` so the token never leaks in a Referer header.
- **Password version in every session token** (`pv` = sha256(password hash), 16 chars). Changing the customer password, or rotating `ADMIN_PASSWORD_HASH`, revokes every existing session without a sessions table.
- **Proxy verifies JWT signatures** (no DB) for optimistic redirects of `/admin/*`, `/api/admin/*` (401 JSON) and `/account/*`. `requireAdmin()` / `requireCustomer()` in each page and action remain the boundary; they also check `pv` and, for customers, that the account still exists.
- **Client IP = right-most `x-forwarded-for` entry** (`TRUSTED_PROXY_HOPS`, default 1). The left-most entry is client-controlled, so the earlier "first entry" logic let anyone bypass per-IP rate limits by sending a fake header. Admin login also has a global cap (50 / 15 min across all IPs).
- **Customer session is 30 days** (was 7 in the D1-8 helper), admin 7 days. The header account icon always links to `/account`; the proxy sends signed-out visitors to `/login?next=/account`. This keeps the header in the static shell with no layout shift.
- **`ADMIN_PASSWORD_HASH` is stored escaped** (`\$2b\$12\$…`). Next's env loader expands `$` in `.env` files and in real env vars whose key also appears in a `.env` file, which empties a raw bcrypt hash. `auth.ts` unescapes it and logs a clear error if the hash is missing or malformed.

## ADR-017: Product admin details settled in D2-4
**Status:** Accepted (2026-11-23, made autonomously; client may revisit)
- **Image storage behind `src/server/storage.ts`** (`ImageStorage`: `save` / `remove` / `owns`). The v1 driver writes to `UPLOADS_DIR` (Namecheap: `~/alluvi-uploads`, outside the deploy dir, so deploys never wipe it; local default `./.uploads`, git-ignored) and `GET /uploads/<file>` serves it (immutable cache, `nosniff`). Not `public/`: a standalone build only serves files present at build time, and each deploy replaces that folder. Swapping to S3/R2 later means one new driver; nothing else changes.
- **Uploads go through `POST /api/admin/uploads`, not a Server Action.** Server Actions are capped at 1 MB; raising the cap globally would also raise it for public checkout/login. The route re-checks the session, rejects cross-site requests (Origin / `Sec-Fetch-Site`), limits to 5 MB and accepts PNG/JPG/WebP/AVIF/GIF **by magic bytes** (no SVG: it can carry script). File names are random (`<hint>-<16 hex>.<ext>`), so the serve route only accepts that exact pattern (no traversal).
- **"Paste URL" accepts site paths only** (`/images/…`, `/uploads/…`; a full link to alluvi.store is reduced to its path). External hosts are refused so next/image needs no `remotePatterns` and the CSP (D2-6) can keep `img-src 'self'`. Admins download and upload external images instead.
- **Storefront cache: `updateTag`, not `revalidateTag(…, "max")`.** `updateTag('products')` + `updateTag('product:<slug>')` (old and new slug) expires immediately, so the next shop request shows the new price (D2-4 acceptance). `revalidateTag` with `max` would serve one stale hit first.
- **Specs editor is structured, not free key/value.** `products.specs` is the typed `ProductSpecs` the product page renders (batch, fill volume, purity, date tested, compounds, lab reports, package contents, disclaimer, safety note, related products). Arbitrary keys would be saved but never displayed.
- **Stock is only written when the admin changed it.** The form sends the stock it loaded; an unrelated edit leaves `stock` alone, so sales placed while the form was open are not undone. A changed value is written as entered, and the reply says if orders moved it meanwhile.
- **Delete = archive when ordered.** A product referenced by any `order_items` row is set `is_active = false`; only never-ordered products are deleted (their uploaded files are removed after the response).
- **Slug changes return a redirect suggestion** (`{ source: "/product/old", destination: "/product/new" }`, also logged as `[admin-products] slug changed`) to add to `next.config.ts`. No redirects table in v1.
- **Cache Components keeps previous routes mounted (hidden `<Activity>`).** The create form resets itself when hidden after a create, and the edit form takes fresh server values when the product's `updated_at` changes and it has no unsaved edits. Without this, revisiting an edit page could silently re-activate a product that was hidden from the list.

## ADR-018: "Alluvi Brazil" = in-place EN ⇄ pt-BR switch
**Status:** Accepted (2026-11-24, client chose the "proper PT toggle" option over Google Translate and a full /pt-br/ site)
- **Why not alluvibrazil.org:** the Brazil app is still under construction, so the nav/footer "Alluvi Brazil" item now switches this site to Brazilian Portuguese instead of linking out. In Portuguese the item reads "English" and switches back.
- **Mechanism (no new dependency, pages stay static):** `<T>` (`src/components/i18n/t.tsx`) renders the English source and its pt-BR translation from `src/lib/i18n/pt.ts` (a dictionary keyed by the English string). A tiny pre-paint script in the root layout (`LANG_BOOT_SCRIPT`) reads `?lang=pt|en` or the `alluvi_lang` cookie and sets `<html data-lang="pt" lang="pt-BR">`; CSS in `globals.css` hides the inactive language. No cookie is read on the server, so Cache Components/PPR prerendering is unchanged and there is no flash of English. Attribute text (aria-label, alt) uses `useT()`; `toggleLang()` reads the live `<html>` state, not React state.
- **Rejected:** Google Translate widget (third-party script against the "no third-party APIs" rule, known React DOM conflicts that can break cart/checkout, unreviewed machine translation of compliance text); next-intl with `/pt-br/` routes (correct long term, several days plus legal review; revisit when the Brazil app is ready).
- **Scope:** header, mobile menu, footer, notices, home page, cart, product-card buttons, checkout (labels, validation and server messages, country names via `Intl.DisplayNames`), contact page and every research-use disclaimer. **Stays English:** product names and descriptions, policy pages, emails, `/admin`. A missing dictionary key falls back to English.
- **Copy note:** translations keep RUO wording faithful. Where the English source uses human-use phrasing ("Don't put your health at risk…", "precision dosing devices"), the pt-BR text omits it (CONVENTIONS: no dosing or human-use language). Have a native speaker review `pt.ts` before promoting the Brazilian version.
- **Trade-off:** pages ship both languages in the HTML (hidden spans, `lang="pt-BR"` on the Portuguese ones), a few KB more per page.

## ADR-019: Light SaaS theme for the admin console
**Date:** 2026-11-24 · **Status:** Accepted

**Context:** The client asked for the admin to look like a professional SaaS dashboard (references: light canvas, white cards, pastel KPI tiles, pill navigation). The storefront brand is dark-only.

**Decision:** The admin gets its own light token set in `globals.css`, applied by `:root:has([data-admin-ui])`. The attribute sits on the `(admin)` group layout, so `/admin/**` (login included) is light and the storefront is untouched. `:root:has()` rather than a wrapper class because dialogs, dropdowns, sheets and toasts portal into `<body>`. New tokens: `brand-ink` (brand as AA-safe text; equals `brand` on the storefront), `kpi-*` / `kpi-*-ink` (pastel tiles), `ink` (dark accent card), `shadow-card`. Shared primitives live in `src/components/admin/ui.tsx`. No new dependency.

**Consequences:** Shared components must not hardcode `white/x` or `black/x` (use `foreground/x` or tokens); `button`, `form-alert`, `form-field`, `skeleton` and `order-status-badge` were converted (no visible change on the dark storefront). Dashboard range/metric switches are client state over a 180-day series (no request). Product list mutations are optimistic (`useOptimistic`) and report through toasts.

## ADR-020: Janoshik links point to the contact page until our certificates exist

**Context:** The recovered verify.janoshik.com links are for alluvi.store batches; a visitor who opens one sees the old domain. The client requires every such link to go to Contact Us until the new links are supplied.

**Decision:** `labLink()` in `src/lib/lab-links.ts` maps any `*.janoshik.com` URL to `/contact#certificates` at render time (product page, lab-analysis panel, home sections, Markdown). Stored URLs in `content/` and the DB stay as data; nothing links to them.

**Consequences:** Admin-entered Janoshik links are redirected too until the rule is removed. When real certificates arrive: store their URLs and delete the host check in `labLink()`.

**Update 2026-11-26:** The client supplied certificate images for five products (Reta 40/20, Tirz 40, BPC/TB 40, Glow 70) showing manufacturer `www.alluvihealthcare.co`. They are shown on the home QA section and product lab panels (`src/lib/certificates.ts`, `public/images/coa/`). They carry the **same task numbers and verification keys** as the old reports (which read `www.alluvi.org`), so the host check in `labLink()` stays until someone confirms at janoshik.com/verify that the keys now return the new domain. NAD+ (#239746) has no new certificate yet.

## ADR-021: Customer chooses a payment method; the admin emails the details per order
**Date:** 2026-11-24 · **Status:** Accepted (client decision) · supersedes ADR-004

**Context:** The client does not want bank or wallet details published on the site or in automated emails (security, and accounts in this niche get frozen and must be swapped quickly). Customers in the UK, US and elsewhere want to pay in different ways.

**Decision:**
- Checkout offers a grouped dropdown (icon, then name) of **25 methods + "Other"** from a code catalogue, `src/lib/payment-methods.ts`: UK/US/SEPA/SWIFT bank transfer; PayPal, Zelle, Cash App, Venmo, Apple Cash, Revolut, Wise, Monzo, N26, Payoneer; Western Union, MoneyGram, Remitly; BTC, ETH, USDT, USDC, LTC, SOL, XRP, Binance Pay. The client approved PayPal, Zelle and the others. Keys are stored on orders and are never renamed. The `bank_transfer` key = UK bank transfer (existing orders).
- `settings.payment_methods` = `[{key, enabled, template}]`, edited in /admin/settings. The template holds the **full** payment details (client choice: speed over not storing them). It is admin-only and only ever sent inside the email for one order.
- `placeOrder` accepts only an **enabled** key; it stores the key plus a label snapshot. Neither the confirmation page nor the automated emails contain payment details; the customer is promised the details "within 2 business hours".
- The admin sends details from /admin/orders/[id]: the template is prefilled with `{{first_name}} {{order_no}} {{amount}} {{method}} {{pay_by}}` (amount from the stored server-computed total). Sending is blocked while any `[[ … ]]` placeholder remains. The email is sent **first**; the order records `payment_instructions(_sent_at)` only once SMTP accepted it. The sent text also shows on the customer's (access-gated) order page, so a customer can check an email against the site (anti-phishing). Each customer email carries a "we never change details by phone/social" notice.
- The customer can press "I've sent payment" (+ optional reference). This is gated like the order page and rate limited (5/10 min/IP). It notifies the shop but is not proof of payment; the admin marks the order paid.
- Payment stage is derived, not a new status: `needs_details → awaiting_payment → customer_reported`, or `overdue` 5 days after details were sent (`PAYMENT_DUE_DAYS`). Admin can send a reminder. Orders list has stage chips; the dashboard card counts details still to send.
- Email only (no WhatsApp/Telegram automation).
- **New dependency `simple-icons` (16.36.0, CC0):** the brand marks for the dropdown. Named imports + `sideEffects:false` tree-shake to the ~19 icons used (one ~20 KB client chunk, verified). Brands it lacks (Remitly, USDC) use neutral lucide glyphs.

**Consequences:** The `bank_details` setting and its card are removed (migration 0001 deletes the row; it only held placeholders). The response promise and due period are constants in `payment-methods.ts`. A method switched off after a customer loaded checkout is rejected with a field error and the list refreshes. Being able to accept PayPal/Zelle/etc. for this product category is the client's own business and compliance decision (see the PROJECT_TRACKER risk).
