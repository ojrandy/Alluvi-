# PRD — Alluvi Storefront & Dashboard Rebuild

> Product requirements. **Read this first** to understand *what* we are building and *why*.
> Owner: lead developer · Status: v1 in build · Last updated: 2026-11-22

## 1. Background

Alluvi (UK supplier of research peptides for laboratory R&D) runs its store at
`https://alluvi.store/` (canonical in sitemap: `alluvi.bz`). The company **lost its source code**.
The live site is a Vite + React SPA that renders entirely client-side, so crawlers and link
previews see an empty page.

We rebuild the store **from scratch in Next.js** with a basic admin dashboard, keeping the
**same content, URLs and customer journey** so existing customers stay, and raising the quality
bar (speed, SEO, polish, reliability).

## 2. Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | Content parity with the live site | Every page/product in [CONTENT_INVENTORY.md](CONTENT_INVENTORY.md) exists with the same copy |
| G2 | URL parity | All live URLs resolve (200 or 301) — zero broken links from Google/bookmarks |
| G3 | Orders land in the dashboard **and** the webmail inbox | Test order appears in `/admin/orders` and in inbox within 1 min |
| G4 | More professional than the current site | Lighthouse ≥ 90 on all four categories (mobile), server-rendered HTML |
| G5 | Ship in 2 working days | v1 deployed and accepted by client by end of Day 2 |

## 3. Non-goals (v1)

- Social login, wishlists, saved multiple addresses (accounts themselves ARE in v1, see FR-17).
- Online card payments / payment-gateway integration (see [DECISIONS.md](DECISIONS.md) ADR-004).
- Wholesale portal, Telegram ordering, `/ai-service`, `/train-model`.
- Multi-language, multi-currency (GBP only, English only).
- Third-party SaaS APIs (no Stripe, no Resend, no CMS). Orders go to DB + SMTP only.

## 4. Users

| User | Needs |
|------|-------|
| **Researcher / customer** (mostly mobile) | Find a product, trust it (lab reports, anti-fake info), order fast, know how to pay, track order |
| **Shop admin** (1–2 people) | See new orders instantly, mark paid/shipped, add tracking, edit products/prices/stock |

## 5. Functional requirements — v1

### Storefront
- **FR-1** Home page with the live site's hero, sections, trust content.
- **FR-2** `/shop` — product grid, category filter (if live has categories), sorting by price.
- **FR-3** `/product/[slug]` — gallery, price, variants (if any), description, lab-test (Janoshik) link, RUO disclaimer, add to cart.
- **FR-4** Cart drawer (persisted in localStorage), quantity edit, subtotal.
- **FR-5** `/checkout` — contact + shipping address + shipping option + mandatory RUO/18+/terms checkbox. Honeypot anti-spam.
- **FR-6** Order placement: server recomputes all prices from DB; creates order atomically; emails customer + shop.
- **FR-6a** Launch promotion: free shipping on every order for 60 days from launch (ADR-012), announced in the notice bar.
- **FR-7** `/order-confirmation/[orderNo]` — summary, chosen payment method and what happens next; once the admin has emailed the payment details they appear here too, with an "I've sent payment" button (ADR-021).
- **FR-8** `/track-order` — lookup by order number + email, shows status + tracking number.
- **FR-9** Static pages: `/about`, `/spot-a-fake`, `/our-location`, `/policies/*` (refund, shipping, privacy, terms-of-service, press-release).
- **FR-10** SEO: per-page metadata, Open Graph, `sitemap.xml`, `robots.txt`, Product JSON-LD, canonical domain, 301s for legacy URLs.

### Customer accounts (optional; guest checkout always available)
- **FR-17** `/signup`, `/login`, `/logout`, `/forgot-password`, `/reset-password`. Checkout has an optional
  "Create an account with these details" checkbox plus a password field. Logged-in customers get checkout prefilled.
- **FR-18** `/account`: order history with status and tracking, plus a default address edit form. Guest orders with
  the same email are linked after the email is verified.

### Dashboard (`/admin`)
- **FR-11** Login (single admin, env-configured credentials). All `/admin/*` protected.
- **FR-12** Overview: orders today/7d, revenue 7d/30d, pending-payment count, latest 10 orders.
- **FR-13** Orders: table with search (order no / email / name), status filter, pagination, CSV export.
- **FR-14** Order detail: items, customer, address, status change, tracking number, internal notes, timeline. Status → `shipped` emails the customer.
- **FR-15** Products: list, create, edit, archive; price, compare-at price, stock, active flag, images, lab-report URL, description.
- **FR-16** Settings: payment methods offered at checkout + the details template for each (ADR-021), shipping options & fees, notification email.

## 6. Non-functional requirements

- **Performance:** static/cached rendering for catalogue pages; LCP < 2.5s on 4G mobile.
- **Security:** server-side price calculation; Zod validation on every input; admin session = signed httpOnly cookie; rate limit on checkout and login; no secrets in client bundle.
- **Reliability:** order is persisted **before** any email is sent; email failure never fails an order.
- **Accessibility:** WCAG 2.1 AA — keyboard navigable, labelled forms, contrast ≥ 4.5:1.
- **Compliance:** "For laboratory research use only. Not for human consumption." visible on product pages, cart, checkout, footer; UK GDPR-compliant privacy policy; no analytics before consent.

## 7. v2 backlog (post-launch)

Open-banking payment (Klyme) · wholesale portal · discount codes ·
low-stock alerts · order-status emails for every transition · multi-admin with roles ·
analytics dashboard charts · Telegram/WhatsApp order notifications · 3D product viewer.

## 8. Decisions confirmed by client (2026-11-22)

- Hosting: **Namecheap** (app + dashboard + MySQL + email), deployed from GitHub. See ADR-007 and ADR-010.
- Payment: customer picks one of 25 methods at checkout; the admin emails the details per order (ADR-021, supersedes ADR-004).
- Checkout: **guest checkout plus optional account creation** (ADR-005).

## 9. Open questions

1. Canonical domain: `alluvi.store` or `alluvi.bz`?
2. Namecheap plan type (shared Stellar or VPS)? Does it include SSH access (needed for rsync deploys)?
