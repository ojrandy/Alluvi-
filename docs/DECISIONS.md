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

## ADR-004 — Bank transfer only in v1
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
