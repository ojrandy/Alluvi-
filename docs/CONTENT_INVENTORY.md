# Content Inventory — Live Site Parity Map

> Everything on `https://alluvi.store/` that must exist in the rebuild. Filled in by task D1-1.
> Raw scrape output → `content-recovery/raw/` (git-ignored). Cleaned content → `content/`.

## Facts recovered so far (2026-11-22)
- Live site: Vite + React SPA, client-rendered (bundle `/assets/index-*.js`, lazy chunks).
- Title: *"Alluvi - Premium Research Peptides for Laboratory R&D | UK Supplier"*.
- Font: **Manrope** (200–800). Favicon: `/images/favicon.png`. OG image: `/images/Holding-iPhone_1Holding-iPhone.webp`.
- Third parties on live site: GA4 (`G-HKE9YKMN6Q`), PostHog, Omnisend, Klyme widget, Janoshik verification links (`verify.janoshik.com/tests/...`). (`spotafakealluvi.com` was compromised on 2026-11-24 — all links removed; "Verify" now routes to `/contact`.)
- Currency GBP (e.g. `£219.99` found in bundle).

## D1-1 scrape results (2026-11-22)

`npm run scrape` rendered 26 public routes, all returning HTTP 200. Raw output is in `content-recovery/raw/`:
`pages/*.html|json`, `screens/*@390|1440.png`, `_alltext.txt` (cleaned text of every page), `_summary.json`.
67 images were downloaded into `public/images/` (8 MB) with their original paths kept.

### Products found: 9 (the sitemap lists only 5)

| Slug | Name | Price | Janoshik batch | Lab links |
|---|---|---|---|---|
| `tesamorelin-20mg` | Tesamorelin 20mg (R&D Only) | £120 | none | none |
| `mots-c-40mg` | MOTS-C 40mg (R&D Only) | £100 | none | none |
| `cjc-1295-10mg` | CJC-1295 (No DAC) 10mg (R&D Only) | £100 | none | none |
| `tirzepatide-40mg` | Tirzepatide 40mg (R&D Only) | £90 | BT3426LAM, 99.82% | purity, heavy metal, LCMS, sterility |
| `retatrutide-40mg` | Retatrutide 40mg (R&D Only) | £140 | RT9264BUG, 99.83% | purity, heavy metal, LCMS, sterility |
| `retatrutide-20mg` | Retatrutide 20mg (R&D Only) | £90 | AR1721TRT, 99.84% | purity, heavy metal, sterility |
| `glow-70mg` | Glow 70mg (R&D Only) | £90 | GL0621XSA | 1 report |
| `bpc-157-tb-500-40mg` | BPC-157 & TB-500 40mg (R&D Only) | £120 | BP1701FSR | 1 report |
| `nad-plus-1000mg` | NAD+ 1,000mg | £140 | ND68442NIC | 1 report |

Each product page has: a mandatory disclaimer, a description, a "Safety Protocol" line, a Janoshik table
(compound / concentration / verified content, fill volume, batch number, purity), package contents,
related products, and 4 images (front, pen, open, UV).

### Findings that need a client decision before writing `content/`
1. ~~**Domain identity.**~~ **Resolved 2026-11-22:** `alluvi.org` → `alluvi.bz` → `alluvi.store`. alluvi.store is canonical (ADR-008). The live copy on alluvi.store says *"Our official site is www.alluvi.org, we are only
   handling this site"*. The press release lists the official domains as **alluvi.bz** and **alluvi.org**.
   Every policy page and email address uses **@alluvi.org**. alluvi.store is not named anywhere as an
   official domain.
2. **Resolved 2026-11-22:** client chose to keep the live wording verbatim. New "doctor approval" copy was NOT added (see tracker change log).
   Original note: **Copy that contradicts "research use only".** Examples: "Don't put your health at risk to save some quid",
   "precision dosing devices", "Customers will be able to visit in store for prescriptions for Alluvi
   Peptides", "monthly research supply boxes", and "1.26M+ Members". This weakens the RUO position that
   the site's own press release relies on.
3. **Live checkout requires an account** (`/checkout` redirects to `/signup`; signup asks for DOB,
   nationality and residence). The rebuild offers guest checkout plus optional accounts (ADR-005).
   Does the client still want DOB/nationality collected?
4. **Resolved:** keep all of these links (client, 2026-11-22). Original note: **Third-party channels on the live site:** Telegram ordering (`@Sophie_alluvi_xxx`), "Contact Max"
   via WhatsApp for wholesale, and alluvibrazil.org (the "Verify" nav link previously pointed to spotafakealluvi.com; that domain was compromised and it now routes to /contact).
   `/spot-a-fake` is only an "upload image" CTA that points to the external verifier.
5. **Open (low):** Terms/Refund pages mention card/USDT. Keep verbatim for now. **Payment wording:** the Terms say "card, bank transfer, or USDT" and the Refund policy mentions crypto.
   Since ADR-021 checkout offers bank transfer, payment apps, money transfer and crypto (incl. USDT), but **not card**. The client should update the Terms line (their legal copy; we don't rewrite it).
6. **Live-site tracking:** the site calls `/api/user-orders/fingerprint/collect` (browser fingerprinting)
   and loads PostHog, GA and Omnisend. None of these will be carried over without a consent decision.
7. ~~**Missing images.**~~ **Resolved:** Tirzepatide pen, open and UV images downloaded on retry.

## Route parity

| Live URL | In sitemap | v1 action | New route |
|---|---|---|---|
| `/` | ✅ | Rebuild | `(store)/page.tsx` |
| `/shop` | ✅ | Rebuild | `(store)/shop` |
| `/about` | ✅ | Rebuild | `(store)/about` |
| `/product/glow-70mg` | ✅ | Rebuild | `(store)/product/[slug]` |
| `/product/bpc-157-tb-500-40mg` | ✅ | Rebuild | 〃 |
| `/product/retatrutide-20mg` | ✅ | Rebuild | 〃 |
| `/product/retatrutide-40mg` | ✅ | Rebuild | 〃 |
| `/product/tirzepatide-40mg` | ✅ | Rebuild | 〃 |
| `/policies/refund-policy` | ✅ | Rebuild | `(store)/policies/[slug]` |
| `/policies/shipping-policy` | ✅ | Rebuild | 〃 |
| `/policies/privacy-policy` | ✅ | Rebuild | 〃 |
| `/policies/terms-of-service` | ✅ | Rebuild | 〃 |
| `/policies/press-release` | ✅ | Rebuild | 〃 |
| `/checkout` | | Rebuild | `(store)/checkout` |
| `/order-confirmation` | | Rebuilt as `/order-confirmation/[orderNo]`; bare URL 301 → `/track-order` | `(store)/order-confirmation/[orderNo]` |
| `/track-order` | | Rebuild | `(store)/track-order` |
| `/spot-a-fake`, `/fake-sellers` | | Rebuilt (D1-6); `/fake-sellers` 301 → `/spot-a-fake#watchlist` (watchlist copy kept there) | `(store)/spot-a-fake` |
| `/our-location` | | Rebuild | `(store)/our-location` |
| `/announcements` | | Rebuilt (D1-6, content verified) | `(store)/announcements` |
| `/login`, `/signup`, `/account`, `/forgot-password`, `/reset-password` | | Rebuilt (D2-1A, ADR-005/016). Plus new `/verify-email`, `/account/details`, `/account/orders/[orderNo]`. All `noindex`. There were never config redirects for these routes, so none to remove | `(store)/login` etc., `(store)/account` |
| `/order-information`, `/payment-review`, `/payment-completed` | | 301 → `/track-order` | — |
| `/wholesale`, `/wholesale-console` | | v2; temp page "contact us for wholesale" | `(store)/wholesale` |
| `/telegram-order` | | v2; 301 → `/shop` | — |
| `/admin`, `/management-console` | | `/management-console` 301 → `/admin`. `/admin/*` guarded (D2-1); `/admin/login` | `(admin)/admin` |
| `/ai-service`, `/train-model`, `/test-product`, `/refersufbrfbrr` | | Ask client; default 301 → `/` | — |

## Redirects (D1-6)
All legacy redirects live in `next.config.ts` (`LEGACY_REDIRECTS`, permanent). Policy copy: `content/pages/*.md`, generated verbatim by `npm run content:pages`.
The 4 products missing from the live sitemap (tesamorelin-20mg, mots-c-40mg, cjc-1295-10mg, nad-plus-1000mg) are also served; add them to the sitemap in D2-6.

## Per-page content checklist (fill in during D1-1)

For each page record: headings, body copy, CTAs, images (path + alt), FAQs, testimonials.

### Home
- [ ] Hero heading / sub / CTA
- [ ] Sections (in order)
- [ ] Trust badges / lab-testing block
- [ ] Testimonials
- [ ] FAQ
- [ ] Newsletter block (Omnisend → replace with simple form storing to DB? decide)

### Products (one block per slug)
- [ ] name · price · compare-at · size/strength · purity · description · specs · images · Janoshik link

### Footer / global
- [ ] Contact email · phone · address · social links · legal text · RUO disclaimer wording

## Assets
- [ ] Download all `/images/*` referenced by rendered pages into `public/images/` (keep filenames for URL parity).
