# D01 — Technical SEO audit (read-only)

> **Task:** SEO-D01-2 · **Date:** 2026-11-27 (run ahead of Day 1) · **Auditor:** Claude
> **Method:** source review of `src/app/(store)/**`, `src/app/layout.tsx`, `next.config.ts`, `src/proxy.ts`,
> `content/**`; production build of commit `267b16a` (clean worktree, `next build` passed: 48 pages) served
> with `next start` and crawled with a script (status, `<title>`, description, canonical, robots meta,
> `X-Robots-Tag`, hreflang, JSON-LD, headings, images, internal links); spot checks against the live site
> `https://alluvihealthcare.co`.
> **Note:** commit `bbbc7bf` ("SEO: sitemap.xml and robots.txt") landed and deployed *during* the audit.
> `src/app/robots.ts` and `src/app/sitemap.ts` were audited from source and from live output.
> **Local-only artefact:** the local build uses `NEXT_PUBLIC_SITE_URL=http://localhost:3000` from
> `.env.local`, so local canonicals read `http://localhost:3000/...`. Production is correct (see M4).

## Executive summary

- **Soft 404s in production.** Unknown `/product/*` and `/policies/*` URLs return **HTTP 200** with
  `noindex` (live and local). The `notFound()` runs inside a `<Suspense>` boundary after streaming has
  started. Fix on D02-1: check that the slug exists *before* the boundary.
- **Research-use-only (RUO) contradictions on indexable pages.** `/our-location` promises "prescriptions"
  from a "compounding pharmacy". The home page says "Don't put your health at risk", the `/shop` meta says
  "Clinical grade purity", and hero/footer copy says "supplements" and "precision dosing". In a YMYL niche this
  is the largest ranking and compliance risk. Fix on D05-1.
- **Every page ships hidden pt-BR text.** The home page has 1,302 Portuguese words in its HTML, and its H1 reads
  "Advancing discovery throughImpulsionando a descoberta…". Google indexes a mixed-language page and a
  polluted H1.
- **Host and structured-data gaps.** `www` serves 200 (no 301 to the apex domain), and `http://` redirects to
  `https://www`. Product JSON-LD lacks shipping/returns, `mpn` holds a batch number, and there is no
  Breadcrumb or WebSite schema. Organization schema appears only on `/`, with a 510-byte favicon as its logo.
- **Thin, templated product copy and weak linking.** 8 of 9 products share one two-sentence template.
  Six products get only 2 inbound internal links (home marquee + `/shop`). The basics are good: SSR, unique
  canonicals, trailing-slash and uppercase handling, query-param canonicals, noindex on private routes,
  and single-hop legacy redirects.

---

## Findings (ranked by impact)

### Critical

**C1 · Soft 404 on unknown product and policy slugs**
- *Evidence:* `GET /product/does-not-exist` → **200**, `<meta name="robots" content="noindex">`, home-page
  `<title>`; same for `/policies/nope`. Reproduced live 3/3 (`https://alluvihealthcare.co/product/does-not-exist-1..3` → 200).
  Cause: `src/app/(store)/product/[slug]/page.tsx:41-55` awaits params and calls `notFound()` *inside*
  `<Suspense>`, as does `src/app/(store)/policies/[slug]/page.tsx:29-37`. Per
  `node_modules/next/dist/docs/01-app/02-guides/streaming.md` §"The HTTP contract", once a Suspense
  fallback streams, the status is committed to 200. (`dynamicParams = false` is **not available** with
  `cacheComponents`.) `/this-page-does-not-exist` correctly returns 404.
- *Fix:* in both pages, `await params` and run a fast existence check (`getProductBySlug` is already
  cached / `isPolicySlug`) at the top of the page component, calling `notFound()` **before** the
  `<Suspense>` boundary, as in the docs example. Apply the same to `/order-confirmation/[orderNo]` (pattern
  check before the boundary). Verify that each returns 404 with `curl -I`.
- *Task:* **SEO-D02-1** · Owner: Claude · Effort: S

**C2 · RUO-contradicting copy on indexable pages** (full quote list in Appendix D)
- *Evidence (worst lines):*
  - `src/app/(store)/our-location/page.tsx:48`: "Customers will be able to visit in store for **prescriptions** for Alluvi Peptides!"
  - `src/app/(store)/our-location/page.tsx:6-8,35-37`: title/H1/meta "Alluvi's First **Compounding Pharmacy** in London" (in the sitemap, priority 0.5).
  - `src/components/home/pens-stability.tsx:105`: "Don't put **your health** at risk to save some quid."
  - `src/app/(store)/shop/page.tsx:12,13,17`: meta "**Clinical grade** purity" + keyword "clinical grade".
  - `src/components/home/research-platform.tsx:103`: alt "Alluvi precision **dosing** pen"; `:121` "precision **dosing** devices"; `:33` "**nutritional** analysis".
  - `src/components/home/hero.tsx:48` and `src/components/store/site-footer.tsx:39`: "premium peptides and **supplements**" (footer = every page).
  - `src/app/(store)/about/page.tsx:28`: "precise **dosing** accuracy and sterility".
- *Why Critical:* the site claims RUO in its disclaimers but advertises a pharmacy dispensing prescriptions,
  personal health, and dosing. For Google's YMYL quality raters and for MHRA exposure, this contradiction is
  the strongest negative signal on the site. It also invalidates the RUO positioning the content plan depends on.
- *Fix:* D05-1 compliance pass (drafted, owner-approved). **Owner decision needed for `/our-location`:**
  (a) rewrite as a neutral "UK base / lab location" page, or (b) 301 it to `/about` (keeps the URL
  working per CLAUDE.md) and drop it from the sitemap and footer. Recommendation: (b), unless a real, non-pharmacy
  location exists. Remove the "clinical grade" meta/keywords on `/shop` in D04-1/D05-1.
- *Task:* **SEO-D05-1** (+ sitemap/footer change in **SEO-D08-1** if 301) · Owner: Claude → You · Effort: M

### High

**H1 · Hidden pt-BR text in every server-rendered page**
- *Evidence:* `src/components/i18n/t.tsx:11-22` renders both `<span data-l="en">` and `<span data-l="pt">`;
  CSS hides one (`src/app/globals.css:448-449`). The crawl found 1,302 Portuguese words in the home HTML. H1 text as
  extracted: `/` "Advancing discovery throughImpulsionando a descoberta por meio da pesquisa Alluvi research";
  `/contact` "Get in touch with AlluviFale com a Alluvi"; `/checkout` "CheckoutFinalizar compra". Footer
  headings are bilingual on every page ("Shop Loja", "Company Empresa").
- *Impact:* Google renders CSS, so this is unlikely to be treated as spam, but the text is still indexed. Language
  detection, snippets and H1 relevance are diluted, and HTML weight rises (home = 255 KB). `?lang=pt` URLs canonicalise
  to the English URL (good: no duplicate URLs).
- *Fix (two steps):* (1) **Interim, D02-1:** add `data-nosnippet` to the `data-l="pt"` span so pt-BR never
  appears in snippets (one-line change in `t.tsx`). (2) **Proper fix, needs an ADR:** keep only English in
  SSR HTML and load the pt-BR dictionary client-side when the toggle or `?lang=pt` is active, or serve pt-BR at real
  `/pt/...` URLs with hreflang (larger; out of 30-day scope). Recommendation: (1) now, with (2) as an ADR on the
  60-day roadmap.
- *Task:* **SEO-D02-1** (interim) · ADR for the proper fix · Owner: Claude · Effort: S (interim) / L (proper)

**H2 · Host duplication: `www` serves 200** *(corrected 2026-11-27: http → https stays on the same host; see Fix status)*
- *Evidence (live):* `https://www.alluvihealthcare.co/` → 200 (no redirect); `http://alluvihealthcare.co/`
  → 301 → `https://www.alluvihealthcare.co/`. Canonicals on `www` point to the apex
  (`<link rel="canonical" href="https://alluvihealthcare.co/shop">`), so Google will likely consolidate. Still, the
  site has two crawlable hosts, http goes through a non-canonical host first, and the announcement bar
  advertises "www.alluvihealthcare.co" (`content/site.json:17`).
- *Fix:* cPanel `.htaccess` (kept by the deploy rsync, `docs/DEPLOYMENT.md:68`): one 301 from any
  `http://*` or `https://www.*` to `https://alluvihealthcare.co$1`. Change the announcement copy to the apex domain.
  Set the GSC Domain property in D01-1 so both hosts are covered.
- *Task:* **SEO-D02-1** (rule + doc) / **SEO-D01-1** (You: GSC) · Owner: Claude + You (cPanel) · Effort: S

**H3 · Thin, near-duplicate product copy**
- *Evidence:* `content/products.json`: 8 of 9 products use the same template — "A {N}mg {X} formulation
  supplied in a pre-filled research device, provided exclusively for controlled laboratory R&D applications.
  Delivered in sealed format to support compound stability analysis, formulation studies, and delivery
  mechanism evaluation." `description` == `shortDescription` for all 9. Meta descriptions are 253–271
  chars (truncated in SERPs). There is no unique, compound-specific text.
- *Fix:* product copy batches A/B (unique 250–400 words per product: what the compound is, its research class,
  form supplied, lab analysis for certified products only, storage, links to guide), plus a 140–155-char meta
  from the D04-1 matrix.
- *Task:* **SEO-D05-2**, **SEO-D06-1**, **SEO-D04-1** · Owner: Claude → You · Effort: M

**H4 · Structured data incomplete**
- *Evidence:* product JSON-LD (`src/app/(store)/product/[slug]/page.tsx:57-75`, crawl of
  `/product/retatrutide-40mg`) has name, description, sku (=slug), image[], brand, url, offers.price,
  priceCurrency, availability, itemCondition, seller. **Missing:** `offers.shippingDetails`,
  `offers.hasMerchantReturnPolicy` (the data exists in `content/pages/shipping-policy.md` and `refund-policy.md`)
  and `BreadcrumbList`. **Misused:** `mpn` = batch number (`RT9264BUG`); drop it, because batch ≠ MPN.
  `Organization` (`src/app/(store)/page.tsx:33-44`) is on `/` only. Its `logo` is `/images/favicon.png` (510 bytes;
  Google needs ≥ 112×112 px), and it has no `sameAs` or `WebSite` node. No other page has JSON-LD.
- *Fix:* D02-1 adds a site-wide `Organization` + `WebSite` in the root/store layout (real logo asset:
  `alluvi-logo.png` is in the repo root, uncommitted) and `BreadcrumbList` on product/policy pages. D08-1
  adds `shippingDetails` (GB, rate from shipping policy) and `hasMerchantReturnPolicy` (from refund policy),
  and removes `mpn`. Validate with the Rich Results Test.
- *Task:* **SEO-D02-1**, **SEO-D08-1** · Owner: Claude · Effort: S–M

### Medium

**M1 · Open Graph inherits the home values on most pages**
- *Evidence:* pages that set only `title`/`description` inherit the root `openGraph` (`src/app/layout.tsx:22-29`).
  `og:url` = home on `/announcements`, `/contact`, `/our-location`, `/spot-a-fake`, `/wholesale`, `/track-order`,
  and `og:title` = the site default title. No `og:image` exists outside product pages.
- *Fix:* set `openGraph: { url, title }` per page (or a small `pageMetadata()` helper), plus a default
  `opengraph-image` (1200×630) at the app root.
- *Task:* **SEO-D02-1** · Effort: S

**M2 · Titles and H1s are not keyword-targeted**
- *Evidence:* `/shop` title "Professional Research Solutions | Alluvi Shop", H1 "Premium Research" (no
  "peptides"). The home title is 67 chars (truncated). Product titles use the filler "| Advanced Research |" and
  "(R&D Only)" (`/product/cjc-1295-10mg` = 62 chars, BPC/TB = 61). `/about` H1 "Effortlessly advance science and research.".
  Policy titles use "| Alluvi - …" instead of the brand-last pattern.
- *Fix:* D04-1 metadata matrix (one primary keyword per URL from PLAN §4, ≤ 60 chars, brand last).
- *Task:* **SEO-D04-1** → ship in **SEO-D08-1** · Effort: S

**M3 · Sitemap/robots (live since `bbbc7bf`) need refinement**
- *Evidence:* `src/app/sitemap.ts`: 22 URLs, product images included, but **no `lastModified`**. It also lists
  `/our-location` (see C2) and `/announcements` (thin). `src/app/robots.ts`: `Host:` is ignored by Google
  (harmless). Disallowing `/checkout`, `/account` and `/order-confirmation/` stops Google from seeing their noindex,
  which is acceptable because nothing links to them externally.
- *Fix:* add `lastModified` (product `updatedAt` from DB; content-file mtime/static date for pages). Remove
  `/our-location` if C2 option (b) is chosen. Keep robots as is.
- *Task:* **SEO-D02-1** · Effort: S

**M4 · `siteUrl` falls back silently, so a non-CI build ships localhost canonicals**
- *Evidence:* `src/lib/site.ts:27` reads `NEXT_PUBLIC_SITE_URL`, which is baked in at build time. `.env.local`/`.env.example`
  set `http://localhost:3000`, and a local `next build` emits `canonical`, `og:url`, sitemap and JSON-LD URLs on
  localhost. CI sets `https://alluvihealthcare.co` (`.github/workflows/deploy.yml:22`); confirmed live
  (`<link rel="canonical" href="https://alluvihealthcare.co/product/retatrutide-40mg">`).
- *Fix:* fail the build when `NODE_ENV=production` **and** a deploy flag is set **and** `siteUrl` is not https,
  or add a CI step that greps the built HTML for `localhost`. Never deploy from a workstation build.
- *Task:* **SEO-D02-1** · Effort: S

**M5 · Press release: unverifiable legal and brand claims**
- *Evidence:* `content/pages/press-release.md:15` names Eli Lilly / Mounjaro as behind a "coordinated
  communication effort". `:57` cites "MHRA v Peptide Clinics UK (2018)" (not verified in this audit).
  `:74` "injectable products". The page is indexable and in the sitemap and footer.
- *Fix:* owner/legal decision. Verify the case citation or remove it, soften the competitor allegation, and
  drop "injectable". Option: noindex the page (keep the URL) if it must stay verbatim.
- *Task:* **SEO-D05-1** (owner decision) · Effort: S

**M6 · Home hero image is lazy-loaded above the fold**
- *Evidence:* `src/components/home/hero.tsx:88-95`: `<Image src="/images/Holding-iPhone_1-p-1600.png" … sizes="66vh">`
  renders `loading="lazy"`, with no image preload in `<head>`. The hero is a client component with scroll-linked
  `motion` transforms. The text H1 is SSR'd, so LCP may be the H1 on mobile, but on desktop the phone image is likely
  the LCP element.
- *Fix:* measure LCP in D13-1. If the image is LCP, use `preload`/`fetchPriority="high"` and drop lazy.
- *Task:* **SEO-D13-1** · Effort: S

**M7 · Product interlinking is thin**
- *Evidence:* inbound internal links from the crawled pages: Reta 40 = 10, Reta 20 = 9, Tirz 40 = 6, while
  BPC/TB, Glow, MOTS-C, CJC, Tesamorelin and NAD+ = **2** (home marquee + `/shop`). `relatedNames` for MOTS-C, CJC and
  Tesamorelin (and others) point only to Retatrutide 20/40 (`content/products.json`). There are no breadcrumbs.
- *Fix:* breadcrumbs (D02-1), related products by category or research class (D05-2/D06-1 copy), the
  "Research behind this compound" block and `/research` hub (D09-1), and an internal-link audit (D19-1).
- *Task:* **SEO-D02-1**, **SEO-D09-1**, **SEO-D19-1** · Effort: S–M

### Low

- **L1 · Heading order in raw HTML.** On streamed (PPR) pages the footer's four `h2`s appear before the
  `h1` in source order (product and policy pages). The rendered DOM order is fine. The home marquee duplicates the 9
  product `h3`s for its loop; mark the clone list `aria-hidden` / use `<p>`. → **SEO-D13-1**.
- **L2 · `meta keywords`** on `/` and `/shop` (`page.tsx:17-28`, `shop/page.tsx:13`) is ignored by Google and
  leaks "clinical grade". Remove it. → **SEO-D04-1**.
- **L3 · Images.** All `<img>` have `alt` plus width/height or `fill`. Product pages have 4 `alt=""` images =
  hidden gallery slides (`product-gallery.tsx:64`, `aria-hidden`), which is acceptable. Home has 7 `alt=""`
  (decorative app-screen layers), also acceptable. Janoshik certificate PNGs are 780–810 KB
  (`public/images/*jn-*.png`); check whether they are loaded on page or only linked. → **SEO-D13-1**.
- **L4 · Unused 3D dependencies.** `three`, `@react-three/fiber` and `@react-three/drei` are in `package.json`, but nothing
  in `src/` imports them. There is no runtime cost now; remove them or keep them per ADR-009. → **SEO-D13-1**.
- **L5 · Private routes are correct.** `noindex` on `/checkout`, `/login`, `/signup`, `/forgot-password`,
  `/reset-password`, `/verify-email`, `/track-order`, `/order-confirmation/*`, `/account/*` (307 → login) and
  `/admin*` (also `X-Robots-Tag: noindex, nofollow` via `src/proxy.ts`). `/api/admin/*` → 401 + `X-Robots-Tag`.
  Missing `description`s on these pages fall back to the site default, which doesn't matter because they are noindex.
- **L6 · URL hygiene is correct.** `/shop/` → 308 `/shop`. `/Shop` and `/PRODUCT/...` → 404. `?sort`, `?category`,
  `?utm_*` and `?lang=pt` all canonicalise to the clean URL. There is no hreflang, which is correct while only English is indexable.
- **L7 · Legacy redirects** (`next.config.ts:7-21`) are all single-hop 308. `/management-console` → `/admin` → 307
  `/admin/login` (2 hops, noindex, acceptable). No chains to indexable URLs.

---

## Appendix A — Route inventory (`src/app/(store)/**` + others)

Links in/out = unique internal hrefs on the crawled HTML. "In" counts are from the 31 crawled pages. Every
storefront page carries 16 header/footer links.

| URL | Indexable? | Title source | Description source | Canonical | Robots | JSON-LD | H1 | Links in / out |
|---|---|---|---|---|---|---|---|---|
| `/` | Y | `page.tsx` absolute | `page.tsx` | `/` | — | Organization | 1 (bilingual) | 30 / 26 |
| `/shop` | Y | `shop/page.tsx` absolute | `shop/page.tsx` | `/shop` | — | none | 1 | 30 / 29 |
| `/product/[slug]` ×9 | Y | `generateMetadata` (`name \| Advanced Research` + template) | `products.json` `shortDescription` | `/product/<slug>` | — | Product | 1 | 2–10 / 18–21 |
| `/about` | Y | `about/page.tsx` absolute | `about/page.tsx` | `/about` | — | none | 1 | 30 / 16 |
| `/announcements` | Y | `page.tsx` + template | `page.tsx` | `/announcements` | — | none | 1 | 30 / 16 |
| `/contact` | Y | `page.tsx` + template | `page.tsx` | `/contact` | — | none | 1 (bilingual) | 30 / 16 |
| `/our-location` | Y (**C2**) | `page.tsx` + template | `page.tsx` | `/our-location` | — | none | 1 | 30 / 16 |
| `/spot-a-fake` | Y | `page.tsx` + template | `page.tsx` | `/spot-a-fake` | — | none | 1 | 30 / 16 |
| `/wholesale` | Y | `page.tsx` + template | `page.tsx` | `/wholesale` | — | none | 1 | 30 / 16 |
| `/policies/[slug]` ×5 (refund, shipping, privacy, terms, press-release) | Y | `generateMetadata` ← `content/pages/*.md` `metaTitle` | `.md` `description` | `/policies/<slug>` | — | none | 1 | 30 / 16–17 |
| `/track-order` | N — noindex,follow (tool page) | `page.tsx` | `page.tsx` | `/track-order` | noindex, follow | none | 1 | 30 / 16 |
| `/login` | N — noindex,follow | `page.tsx` | `page.tsx` | `/login` | noindex, follow | none | 1 | 3 / 18 |
| `/signup` | N — noindex,follow | `page.tsx` | `page.tsx` | `/signup` | noindex, follow | none | 1 | 1 / 17 |
| `/forgot-password` | N — noindex,follow | `page.tsx` | root default | `/forgot-password` | noindex, follow | none | 1 | 2 / 17 |
| `/reset-password` | N — noindex,nofollow | `page.tsx` | root default | none | noindex, nofollow | none | 1 | 0 / 17 |
| `/verify-email` | N — noindex,nofollow | `page.tsx` | root default | none | noindex, nofollow | none | 1 | 0 / 17 |
| `/checkout` | N — noindex,nofollow | `page.tsx` | root default | `/checkout` | noindex, nofollow | none | 1 (bilingual) | 0 / 16 |
| `/order-confirmation/[orderNo]` | N — noindex,nofollow | `page.tsx` | root default | none | noindex, nofollow | none | 1 (0 if not found) | 0 / 16 |
| `/account`, `/account/details`, `/account/orders/[orderNo]` | N — 307 → `/login` (proxy) + layout noindex | `account/layout.tsx` template | — | — | noindex, nofollow | — | 1 | — |
| `/admin/**` (9 routes) | N — 307 → `/admin/login`, `X-Robots-Tag` | `(admin)/layout.tsx` | — | — | noindex, nofollow, nocache | — | 1 | — |
| `/api/admin/*`, `/uploads/[file]` | N — route handlers (401 / file / 404) | — | — | — | X-Robots-Tag (admin API) | — | — | — |
| `/robots.txt`, `/sitemap.xml` | live since `bbbc7bf` | `robots.ts`, `sitemap.ts` | — | — | — | — | — | — |
| not-found (`not-found.tsx` ×2) | N — 404 + noindex (unmatched paths) | "Page not found" | — | — | noindex | — | 1 | — |

## Appendix B — Crawl results (local production build, `267b16a`)

Canonical/og:url host is `http://localhost:3000` locally (M4); the paths are what matter. Live = `https://alluvihealthcare.co`.

| URL | Status | `<title>` | Meta description (chars) | Canonical path | Robots / X-Robots | JSON-LD |
|---|---|---|---|---|---|---|
| `/` | 200 | Alluvi - Premium Research Peptides for Laboratory R&D \| UK Supplier | 140 | `/` | — | Organization |
| `/shop` | 200 | Professional Research Solutions \| Alluvi Shop | 74 ("Clinical grade purity") | `/shop` | — | — |
| `/about` | 200 | About Alluvi \| Premium Research Peptides Supplier UK | 175 | `/about` | — | — |
| `/announcements` | 200 | Announcements \| Alluvi | 45 | `/announcements` | — | — |
| `/contact` | 200 | Contact \| Alluvi | 84 | `/contact` | — | — |
| `/our-location` | 200 | Alluvi's First Compounding Pharmacy in London \| Alluvi | 123 | `/our-location` | — | — |
| `/spot-a-fake` | 200 | Spot a Fake \| Alluvi | 78 | `/spot-a-fake` | — | — |
| `/wholesale` | 200 | Wholesale \| Alluvi | 58 | `/wholesale` | — | — |
| `/policies/refund-policy` | 200 | Refund Policy \| Alluvi - Returns & Refunds for Research Peptides | 149 | ✓ | — | — |
| `/policies/shipping-policy` | 200 | Shipping Policy \| Alluvi - UK Tracked Delivery & Cold Chain | 163 | ✓ | — | — |
| `/policies/privacy-policy` | 200 | Privacy Policy \| Alluvi - GDPR Compliant Data Protection | 144 | ✓ | — | — |
| `/policies/terms-of-service` | 200 | Terms of Service \| Alluvi - Website Terms & Conditions | 137 | ✓ | — | — |
| `/policies/press-release` | 200 | Press Release \| Alluvi - Official Public Statement | 150 | ✓ | — | — |
| `/product/retatrutide-40mg` | 200 | Retatrutide 40mg (R&D Only) \| Advanced Research \| Alluvi | 260 (template) | ✓ | — | Product |
| `/product/retatrutide-20mg` | 200 | Retatrutide 20mg (R&D Only) \| Advanced Research \| Alluvi | 260 (template) | ✓ | — | Product |
| `/product/tirzepatide-40mg` | 200 | Tirzepatide 40mg (R&D Only) \| Advanced Research \| Alluvi | 260 (template) | ✓ | — | Product |
| `/product/bpc-157-tb-500-40mg` | 200 | BPC-157 & TB-500 40mg (R&D Only) \| Advanced Research \| Alluvi | 265 (template) | ✓ | — | Product |
| `/product/glow-70mg` | 200 | Glow 70mg (R&D Only) \| Advanced Research \| Alluvi | 253 (template) | ✓ | — | Product |
| `/product/mots-c-40mg` | 200 | MOTS-C 40mg (R&D Only) \| Advanced Research \| Alluvi | 255 (template) | ✓ | — | Product |
| `/product/cjc-1295-10mg` | 200 | CJC-1295 (No DAC) 10mg (R&D Only) \| Advanced Research \| Alluvi | 271 (template) | ✓ | — | Product |
| `/product/tesamorelin-20mg` | 200 | Tesamorelin 20mg (R&D Only) \| Advanced Research \| Alluvi | 260 (template) | ✓ | — | Product |
| `/product/nad-plus-1000mg` | 200 | NAD+ 1,000mg \| Advanced Research \| Alluvi | 177 | ✓ | — | Product |
| `/track-order` | 200 | Track your order \| Alluvi | 79 | ✓ | noindex, follow | — |
| `/login` · `/signup` · `/forgot-password` | 200 | Sign in · Create an account · Reset your password | — | ✓ | noindex, follow | — |
| `/reset-password` · `/verify-email` | 200 | Choose a new password · Confirm your email | default | none | noindex, nofollow | — |
| `/checkout` | 200 | Checkout \| Alluvi | default | ✓ | noindex, nofollow | — |
| `/order-confirmation/ALV-000000` | 200 (soft 404, noindex) | Order confirmation \| Alluvi | default | none | noindex | — |
| `/account`, `/account/details` | 307 → `/login?next=…` | — | — | — | — | — |
| `/admin` | 307 → `/admin/login` | — | — | — | X-Robots-Tag noindex, nofollow | — |
| `/admin/login` | 200 | Sign in · Alluvi Admin | default | none | noindex, nofollow, nocache + header | — |

hreflang: none on any page.

## Appendix C — Duplicate, edge and redirect URLs

| URL | Result | Verdict |
|---|---|---|
| `/product/does-not-exist` | **200** + noindex (local and live) | **C1** |
| `/policies/nope` | **200** + noindex (local and live) | **C1** |
| `/this-page-does-not-exist` | 404 | OK |
| `/Shop`, `/PRODUCT/retatrutide-40mg` | 404 | OK |
| `/shop/` | 308 → `/shop` | OK |
| `/?lang=pt`, `/shop?lang=pt`, `/product/…?lang=pt` | 200, canonical → clean URL | OK (H1 hidden-text issue is H1) |
| `/shop?sort=price-asc`, `?category=…`, `?utm_source=x` | 200, canonical `/shop` | OK |
| `https://www.alluvihealthcare.co/` | **200** (no redirect), canonical → apex | **H2** |
| `http://alluvihealthcare.co/` | 301 → `https://www.alluvihealthcare.co/` | **H2** (wrong target host) |
| `/fake-sellers` | 308 → `/spot-a-fake#watchlist` | OK |
| `/order-confirmation`, `/order-information`, `/payment-*` | 308 → `/track-order` | OK |
| `/management-console` | 308 → `/admin` → 307 `/admin/login` | OK (noindex) |
| `/ai-service`, `/train-model`, `/test-product`, `/refersufbrfbrr` | 308 → `/` | OK |
| `/robots.txt`, `/sitemap.xml` | 404 at `267b16a`; **200 live** (`bbbc7bf`) | M3 |

## Appendix D — RUO-contradicting or risky copy (for SEO-D05-1)

| # | File:line | Quote | Problem |
|---|---|---|---|
| 1 | `src/app/(store)/our-location/page.tsx:48` | "Customers will be able to visit in store for prescriptions for Alluvi Peptides!" | Human medicinal supply |
| 2 | `src/app/(store)/our-location/page.tsx:6,8,24,35,37` | "Alluvi's First Compounding Pharmacy in London" / "opening of its first compounding pharmacy" | Pharmacy = human medicines |
| 3 | `src/components/home/pens-stability.tsx:105` | "This is why vials and Temu version peptide brands don't come close. Don't put your health at risk to save some quid." | Personal health / human use |
| 4 | `src/components/home/pens-stability.tsx:37` | "While others say 28 days in the fridge then throw it away," | References in-use instructions for patient pens |
| 5 | `src/app/(store)/shop/page.tsx:12,13,17` | "Clinical grade purity" / keyword "clinical grade" | Clinical/medical framing |
| 6 | `src/components/home/research-platform.tsx:103` | alt "Alluvi precision dosing pen" | Dosing |
| 7 | `src/components/home/research-platform.tsx:121` | "…and precision dosing devices — one connected system…" | Dosing |
| 8 | `src/components/home/research-platform.tsx:33` | "…structured data collection and nutritional analysis…" | Implies consumption |
| 9 | `src/components/home/research-platform.tsx:73` | "Stay on track with monthly research supply boxes." / "Consistency Is Key" | Reads like a personal regimen |
| 10 | `src/components/home/hero.tsx:48` | "premium peptides and supplements" | Supplements = consumption |
| 11 | `src/components/store/site-footer.tsx:39` | "…develops and evaluates premium peptides and supplements…" (every page) | Same |
| 12 | `content/pages/refund-policy.md:12` | "including peptide pens and supplements" | Same |
| 13 | `src/app/(store)/about/page.tsx:28` | "ISO-certified filling lines for research pens, delivering precise dosing accuracy and sterility" | Dosing; "ISO-certified" needs evidence |
| 14 | `src/app/(store)/about/page.tsx:25` | "We manufacture core APIs for our peptide range in-house" | Unverified claim (truth rule) |
| 15 | `content/pages/press-release.md:74` | "…not to purchase injectable products via social media…" | "Injectable" |
| 16 | `content/pages/press-release.md:15,57` | Eli Lilly/Mounjaro allegation; "MHRA v Peptide Clinics UK (2018)" | Unverified legal/brand claims (M5) |
| 17 | `content/products.json` (all pen products) | "pre-filled research device … delivery mechanism evaluation"; package "Pre-filled Research pen" | Pen format implies self-administration; frame as storage/stability format in D05-2/D06-1 |

The positive disclaimers are present and should stay: hero (`hero.tsx:55`), product view (`product-view.tsx:100`),
`/shop`, marquee, cart, footer, product `disclaimer`/`safetyNote`, and the checkout confirmation.

## Appendix E — Product JSON-LD completeness

| Property | Present | Note |
|---|---|---|
| name, description, image[], url | ✓ | description = templated short copy (H3) |
| sku | ✓ | = slug (acceptable) |
| brand | ✓ | `Brand: Alluvi` |
| offers.price / priceCurrency / availability / url / itemCondition | ✓ | price from DB pence → `"140.00"` GBP |
| offers.seller | ✓ | |
| mpn | ✗ misuse | batch number; remove |
| offers.shippingDetails | ✗ | add (GB, rate/free-shipping from shipping policy) |
| offers.hasMerchantReturnPolicy | ✗ | add from refund policy |
| priceValidUntil | ✗ | optional |
| aggregateRating / review | ✗ | correct: must stay absent (PLAN §3.2) |
| BreadcrumbList | ✗ | add (D02-1) |

## Appendix F — Performance risks visible in code (for SEO-D13-1)

| Risk | Evidence | Note |
|---|---|---|
| Hero phone image lazy-loaded | `hero.tsx:88-95`, rendered `loading="lazy"`, no preload | M6 |
| Scroll-linked motion in hero (client component) | `hero.tsx:1,6` `"use client"`, `motion/react` `useScroll/useSpring/useTransform` | Honours `useReducedMotion`; check INP/CLS on mobile |
| HTML weight | home 255 KB, `/shop` 272 KB, product ~170 KB (bilingual spans + marquee clones + RSC payload) | H1 fix reduces it |
| Script count | 70 `<script>` tags on a product page | Check JS per route in D13-1 |
| Smartsupp | `smartsupp-chat.tsx:12` `strategy="lazyOnload"` | Fine for LCP; consider load-on-interaction for INP/TBT |
| Telegram bubble | `telegram-bubble.tsx`: no script, no effect | No cost |
| Fonts | Manrope via `next/font` (self-hosted, swap); JetBrains Mono `preload:false` | OK |
| 3D | none rendered; three/r3f unused deps | L4 |
| Large images | Janoshik COA PNGs 780–810 KB; `alluvipharmacy.png` 224 KB with `priority` | Convert/compress; check usage |

## Fix status (2026-11-27, owner: "fix all")

| Finding | Status | Where |
|---|---|---|
| C1 soft 404 | **Fixed**: `ensureStatic = "navigation"` + existence check before Suspense; unknown product/policy slugs → 404 (verified) | product/policies `page.tsx`, ADR-024 |
| C2 RUO copy | **Fixed** for Appendix D #1–16; `/our-location` 308 → `/about`, removed from footer + sitemap. #17 (product pen copy) → D05-2/D06-1. `/about`: "in-house APIs" and "ISO-certified" removed; stats "99.95% purity" (contradicted by our COAs, 99.82–99.84%) and "1.26M+ members" replaced with evidenced figures | ADR-024 |
| H1 hidden pt-BR | **Interim**: `data-nosnippet` on pt-BR spans. Full removal on the 60-day roadmap | `t.tsx` |
| H2 host | **Fixed** in app: `www` → apex 308 (verified live). Correction: `http://alluvihealthcare.co` → `https://alluvihealthcare.co` in one hop; the original "http → www" reading was two interleaved curl outputs. Only `http://www.…` takes 2 hops (cPanel https, then the app rule), which is acceptable because nothing links to it. No cPanel change needed | `next.config.ts` |
| H3 thin product copy | Deferred to SEO-D05-2 / D06-1 (needs keyword data) | — |
| H4 structured data | **Fixed**: Organization + WebSite site-wide, BreadcrumbList, `hasMerchantReturnPolicy`, `mpn` removed. `shippingDetails` deferred (rates in DB) | `structured-data.ts` |
| M1 Open Graph | **Fixed**: `openGraphFor()` + `opengraph-image.tsx` | |
| M2 titles/H1 | Deferred to SEO-D04-1 (keyword data); meta keywords removed (L2) | |
| M3 sitemap | **Fixed**: product `lastmod` from DB; `/our-location` removed | `sitemap.ts` |
| M4 localhost origin | **Fixed**: CI guard in `deploy.yml` | |
| M5 press release | **Fixed**: unverifiable case + Lilly allegations + "injectable" removed | `press-release.md` |
| M6 hero lazy | **Fixed**: `preload` | `hero.tsx` |
| M7 interlinking | **Partly**: related products topped up to 4; breadcrumbs (schema). Research hub in D09-1 | |
| L1 / L2 | **Fixed**: marquee clones use `<p>`; meta keywords removed | |
