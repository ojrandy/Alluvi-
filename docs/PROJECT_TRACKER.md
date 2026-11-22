# Project Tracker

> Live status board. **Update this at the end of every task** (status, date, notes).
> Status: `TODO` · `DOING` · `DONE` · `BLOCKED` · `CUT`

## Current focus
**Next up:** D1-9 Track order (header Track link and redirects already point to /track-order).
**Blocked on client:** Namecheap cPanel access (SSH + MySQL + email), bank details.

## v1

| ID | Task | Status | Done on | Notes |
|----|------|--------|---------|-------|
| D0-1 | Scaffold + dependencies + configs | DONE | 2026-11-22 | Next 16.4.6, React 19.3, Tailwind 4.3, shadcn radix-nova |
| D0-2 | Docs, CLAUDE.md, prompt.md | DONE | 2026-11-22 | |
| D1-1 | Recover live-site content | DONE | 2026-11-22 | 26 pages, 9 products, 71 images. `content/products.json` + `content/site.json`. Page copy is used verbatim from `content-recovery/raw/_alltext.txt` in D1-4/D1-6 (client approved existing wording) |
| D1-2 | DB schema + migrations + seed | DONE | 2026-11-22 | 10 tables on MariaDB 10.11 (Docker). Idempotent seed. Fixed MariaDB LATERAL incompatibility (planetscale mode) |
| D1-3 | Design system + store layout | DONE | 2026-11-22 | Dark brand tokens, Manrope, marquee notice bar, glass pill header, mobile Sheet nav, footer, error/404. Lighthouse mobile: a11y 100, SEO 100, BP 96, CLS 0. 0px overflow at 360/768/1280 |
| D1-4 | Home page | DONE | 2026-11-22 | Live-parity sections, order and copy (from the live bundle). Animations ported from Webflow IX2/framer-motion with `motion` (ADR-013). Products via `getProductCards()` (`use cache`, tag `products`, JSON fallback when no DB). Desktop LCP = hero h1 at ~0.5s, CLS 0, no overflow at 360/390/768/1280. Lighthouse not run (CLI download blocked); verify in DevTools |
| D1-5 | Shop + product pages | DONE | 2026-11-22 | /shop (live hero copy, category + price sort via searchParams, streamed grid), /product/[slug] for all 9 products (gallery w/ keyboard tabs, stock state, qty stepper, inline Janoshik panel, package contents, related, RUO disclaimer). generateStaticParams + generateMetadata (live titles) + Product/Offer JSON-LD (GBP, availability). Unknown slug → not-found + noindex (streamed, so HTTP 200 under PPR) |
| D1-6 | Static & policy pages | DONE | 2026-11-22 | /about, /spot-a-fake (+ watchlist), /our-location, /wholesale (temp contact), /announcements, /policies/[slug] ×5 with TOC + anchors from content/pages/*.md (verbatim, `npm run content:pages`). Legacy redirects in next.config.ts. All inventory routes 200/308 except later-task routes (/track-order D1-9, accounts D2-1A, /admin D2-1). ADR-014/015 |
| D1-7 | Cart + drawer | DONE | 2026-11-22 | Sheet drawer (lines, stepper, remove, indicative subtotal, RUO note, Checkout), opens on add-to-cart. Persists across reload, Escape/keyboard OK, no hydration warnings |
| D1-8 | Checkout + placeOrder + emails + confirmation | DONE | 2026-11-22 | Shared Zod schema, pricing.ts (row locks, promo/threshold), placeOrder (honeypot, DB rate limit 5/10min, tx + stock guard + order-no retry, optional account in same tx), emails via after() with email_sent/failed events, confirmation gated by signed cookie or email. 18 Playwright e2e checks pass (guest, account, existing email, tamper, over-stock, stock race, honeypot, rate limit, SMTP down) + both emails verified in Mailpit. customer-auth.ts helpers built for D2-1A |
| D1-9 | Track order | TODO | | |
| D2-1 | Admin auth | TODO | | |
| D2-1A | Customer accounts (optional) | TODO | | Added 2026-11-22 per client |
| D2-2 | Admin shell + overview | TODO | | |
| D2-3 | Orders management + CSV | TODO | | |
| D2-4 | Products CRUD | TODO | | |
| D2-5 | Settings | TODO | | |
| D2-6 | SEO + redirects + security headers | TODO | | |
| D2-7 | QA pass | TODO | | |
| D2-8 | Deploy + handover | TODO | | |

## v2

| ID | Task | Status |
|----|------|--------|
| V2-1 | Account extras (basic accounts moved to v1, D2-1A) | TODO |
| V2-2 | Klyme payments | TODO |
| V2-3 | Wholesale portal | TODO |
| V2-4 | Discount codes | TODO |
| V2-5 | Analytics + low-stock alerts | TODO |
| V2-6 | Multi-admin + roles | TODO |
| V2-7 | 3D product viewer | TODO |
| V2-8 | Telegram/WhatsApp notifications | TODO |
| V2-9 | E2E tests | TODO |

## Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Lazy-loaded chunks hide content from scrape | Missing copy | Scrape **rendered** DOM with Playwright, visit every route | Dev |
| Order emails land in spam | Missed orders | SPF/DKIM/DMARC on sending domain; dashboard is source of truth | Dev + client |
| Client slow to give credentials | Launch slip | Request on Day 0; build against local MySQL (Docker) + Mailpit | PM |
| Payment provider bans product category | Frozen funds | Bank transfer in v1; Klyme only (no Stripe/PayPal) | Client |
| Shared hosting RAM/process limits | Build fails or app restarts | Build in GitHub Actions, deploy standalone bundle only | Dev |
| Domain ambiguity (.store vs .bz) | SEO split | Pick one canonical, 301 the other | Client |

## Change log
- 2026-11-22: D1-5..D1-8 done. src/db pool is now lazy (CI build without DB works). Header nav using usePathname wrapped in Suspense (needed for dynamic routes without static params). Seeded bank details are placeholders: set real ones before launch (DEPLOYMENT pre-launch checklist).
- 2026-11-22: Project initialised; stack locked (see DECISIONS ADR-001..009).
- 2026-11-22: Client confirmed Namecheap hosting, bank transfer, guest checkout + optional accounts. DB switched Postgres → MySQL (ADR-010); deploy via GitHub Actions (ADR-007); added D2-1A.
- 2026-11-22: Client answers: keep live wording verbatim; keep Telegram/WhatsApp/Brazil/Verify links; free shipping for all customers for 60 days from launch; seed stock random 50–100. Declined to author new "use only if your doctor approves / contact us before usage" copy (contradicts the RUO disclaimers; human-use guidance for unlicensed injectables). If wanted, the client supplies it after legal review.
- 2026-11-22: Canonical domain = alluvi.store (ADR-008). D1-2 done. MariaDB needs Drizzle planetscale mode (no LATERAL).
- 2026-11-22: D1-4 done. Fixed turbopack Tailwind rule ("*.css" also turned *.module.css into global CSS) -> now "globals.css" only. Drizzle nested `with: {limit}` fails on MariaDB; use flat queries.
