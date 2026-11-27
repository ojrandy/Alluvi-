# SEO 30-Day Plan — alluvihealthcare.co

> **Window:** Day 1 = **Mon 30 Nov 2026** → Day 30 = **Tue 29 Dec 2026**
> **Market:** United Kingdom (google.co.uk), GBP. English is the indexed language.
> **Task IDs** (`SEO-Dxx-n`) match [TRACKER.md](TRACKER.md) and [PROMPTS.md](PROMPTS.md).

---

## 1. Where we start (baseline facts, 2026-11-27)

| Area | State | Impact |
|---|---|---|
| Domain | `alluvihealthcare.co` is new. The old domains (alluvi.store/.org/.bz) are **abandoned**, so no authority carries over | Expect Google to take time to trust the site. Long-tail first, head terms later |
| Rendering | Next.js 16 server rendering (the old site was a client-rendered SPA) | Big win: content is crawlable on first request |
| Metadata | Root `metadata` + `metadataBase` + title template; product pages have `generateMetadata` + Product/Offer JSON-LD | Good base |
| Sitemap / robots | **Missing**: no `app/sitemap.ts`, no `app/robots.ts` | Critical: fix on Day 2 |
| Canonicals | Not set per page; `?lang=pt` creates duplicate URLs (client-side language swap) | Duplicate-content risk: fix on Day 2 |
| Unknown product slug | Renders not-found + `noindex` but returns **HTTP 200** (streaming/PPR) | Soft-404s: fix on Day 2 |
| Organization / WebSite / Breadcrumb schema | Not present | Brand entity is weak: Day 2 |
| Product content | Short recovered copy; some lines contradict research-use-only (RUO) | Thin and risky: rewrite on Days 4–6 |
| Certificates (ADR-020) | New-domain COAs exist for **Reta 40, Reta 20, Tirz 40, BPC/TB 40, Glow 70**. **None** for NAD+, MOTS-C, CJC-1295, Tesamorelin | "Janoshik tested" may only be claimed for the five |
| Informational content | None | No topical authority: footer **Research** section (Days 9–24) |
| Backlinks | ~0 (new domain) | Earned-link programme from Day 8 |

## 2. Goals and KPIs

**North star:** every product page and core page ranks on page 1 of google.co.uk for its **primary
long-tail keyword**, and the brand owns its own name.

| KPI | Day 0 | Day 30 target | 90-day target | Source |
|---|---|---|---|---|
| Indexable URLs indexed (GSC → Pages) | 0 | 100% of sitemap (≈30 URLs) | 100% | GSC |
| Brand query "alluvi" / "alluvi healthcare" | — | #1 | #1 + sitelinks | GSC / SERP |
| Product pages with impressions | 0/9 | 9/9 | 9/9 | GSC Pages |
| Primary product keywords in top 10 | 0/9 | ≥ 4/9 | 9/9 | GSC / weekly report |
| Long-tail keywords in top 10 (any URL) | 0 | ≥ 15 | ≥ 60 | GSC Queries |
| Research guides published | 0 | 10 | 20+ | Repo |
| Earned referring domains (quality, relevant) | 0 | 8–15 | 30+ | GSC Links / Bing |
| Core Web Vitals (mobile, field or lab) | ? | All "Good" | All "Good" | PSI / GSC |
| Manual actions / security issues | 0 | 0 | 0 | GSC |

**Expectations to set with the client:** head terms such as "research peptides uk" and "buy retatrutide" need
**3–6 months** of authority on a new domain. Thirty days builds the base, captures long-tail and brand
searches, and starts the link profile at a natural pace.

## 3. Rules of engagement

### 3.1 Compliance (overrides everything)
- Every product view keeps: **"For laboratory research use only. Not for human consumption."**
- **Never write or target:** dosing/dosage, protocols, injection or reconstitution for use, cycles,
  weight loss/fat loss, bodybuilding, "for humans", prescriptions, side effects in humans, treatment or
  cure claims, before/after.
- Research guides describe **published research** (cite studies: PubMed / DOI / ClinicalTrials.gov),
  chemistry, mechanism *as studied*, handling and storage **for laboratory settings**, and quality testing.
- Excluded keywords are logged in TRACKER §8 and never used as targets.

### 3.2 Truthfulness
- No invented prices, purities, batch numbers, reviews, ratings, member counts or testimonials.
- No `AggregateRating` / `Review` schema unless real, on-site, verifiable reviews exist.
- "Janoshik tested" or certificate claims are allowed only for products with a certificate in `src/lib/certificates.ts`.

### 3.3 Links
- **Allowed:** digital PR, expert commentary, supplier and lab directories with editorial review, genuine
  community participation, partnerships, unlinked-mention reclamation, brand profiles.
- **Forbidden:** buying or renting links, PBNs, link exchanges at scale, automated tools (Money Robot,
  GSA, etc.), comment/forum spam, guest posts on "write for us" link farms.
- **Pace:** 2–5 new referring domains a week, growing slowly. Branded or URL anchors make up 70% or more.
  Exact-match commercial anchors stay at 5% or less.

### 3.4 Engineering
- Follow `CLAUDE.md`, `AGENTS.md`, `docs/CONVENTIONS.md`. Next.js 16: read `node_modules/next/dist/docs/`
  before using metadata routes, `generateMetadata`, `notFound`, caching.
- Keep existing URLs working. New pages live under **`/research/<slug>`** and appear in a footer
  **Research** column. No other new top-level routes without an ADR.
- Quality gates on every ship task: `npm run typecheck && npm run lint && npm run build`, plus a check at 360px and 1280px.
- Every structured-data change must pass the Rich Results Test / Schema validator.

### 3.5 Approval workflow
1. Claude writes `docs/seo/drafts/<TASK-ID>-<slug>.md` with a header block
   (`Status: DRAFT | APPROVED | CHANGES`, target keyword, URL, title, meta, word count).
2. The owner edits or comments and sets `Status: APPROVED`.
3. A ship task publishes only `APPROVED` drafts and records them in TRACKER §3.

## 4. Keyword → URL map (v0, validated with Keyword Planner on Day 3)

One **primary** keyword per URL. Secondary keywords support it. No two URLs share a primary keyword.

| URL | Primary keyword (v0) | Secondary / supporting |
|---|---|---|
| `/` | alluvi research peptides uk | alluvi, alluvi healthcare, uk research peptide supplier |
| `/shop` | research peptides uk | buy research peptides uk, lab peptides uk, peptide supplier uk |
| `/product/retatrutide-40mg` | retatrutide 40mg | retatrutide 40mg uk, retatrutide research peptide 40mg |
| `/product/retatrutide-20mg` | retatrutide 20mg | retatrutide 20mg uk, retatrutide vial 20mg |
| `/product/tirzepatide-40mg` | tirzepatide 40mg research peptide | tirzepatide 40mg uk, tirzepatide research grade |
| `/product/bpc-157-tb-500-40mg` | bpc-157 tb-500 blend 40mg | bpc 157 tb 500 uk, bpc-157 tb-500 research peptide |
| `/product/glow-70mg` | glow peptide 70mg | glow peptide blend uk, ghk-cu bpc-157 tb-500 blend* |
| `/product/mots-c-40mg` | mots-c 40mg | mots-c uk, mots-c research peptide |
| `/product/cjc-1295-10mg` | cjc-1295 no dac 10mg | cjc 1295 no dac uk, mod grf 1-29 10mg* |
| `/product/tesamorelin-20mg` | tesamorelin 20mg | tesamorelin uk research peptide |
| `/product/nad-plus-1000mg` | nad+ 1000mg vial | nad+ research uk, nad+ 1000mg |
| `/about` | about alluvi | alluvi healthcare company, uk peptide laboratory supplier |
| `/spot-a-fake` | fake alluvi peptides | is alluvi legit, alluvi verify, alluvi authentic |
| `/research` | peptide research guides | research peptide library uk |
| `/research/how-to-read-a-janoshik-coa` | how to read a janoshik certificate | janoshik test results explained, peptide coa explained |
| `/research/peptide-storage-lab-handling` | how to store research peptides | lyophilised peptide storage, peptide stability temperature |
| `/research/retatrutide` | retatrutide research | retatrutide mechanism, triple agonist gip glp-1 glucagon |
| `/research/tirzepatide` | tirzepatide research peptide | tirzepatide mechanism dual agonist |
| `/research/bpc-157-tb-500` | bpc-157 tb-500 research | bpc-157 studies, thymosin beta-4 research |
| `/research/glow-peptide-blend` | glow peptide blend | ghk-cu research, glow blend composition |
| `/research/mots-c` | mots-c research | mitochondrial-derived peptide research |
| `/research/cjc-1295-no-dac` | cjc-1295 no dac research | ghrh analogue research, mod grf 1-29 |
| `/research/tesamorelin` | tesamorelin research | ghrh analogue tesamorelin studies |
| `/research/nad-plus` | nad+ research | nad+ cellular metabolism research |

\* Composition or synonym terms must match the actual product label. Verify against `content/products.json` before use.

**Cannibalisation rules:** Reta 20mg and 40mg each target their **strength**. The guide targets the
**compound + research** intent and links to both. Product pages target transactional intent and guides
target informational intent. Never point both at the same query.

## 5. Weekly rhythm

| Day of week | Routine |
|---|---|
| **Monday** | Automatic weekly keyword report (Days 1, 8, 15, 22, 29). Read it and pull its top 3 actions into the week |
| Mon–Fri | Planned tasks below |
| **Sunday** | Week review (Days 7, 14, 21, 28) + **You:** upload GSC + Keyword Planner exports to `seo-reports` |

## 6. Day-by-day plan

Legend: **C** = Claude does it · **C→You** = Claude drafts, you approve · **You** = owner action

### Week 1 — Audit and foundations (30 Nov – 6 Dec)

| Day | Date | ID | Task | Owner | Deliverable |
|---|---|---|---|---|---|
| 1 | Mon 30 Nov | SEO-D01-1 | Set up Google Search Console (Domain property via Namecheap DNS TXT), Bing Webmaster Tools (import from GSC), confirm GA4 + consent; create Google Ads account for **Keyword Planner** (no campaign needed) | You | Access live |
| 1 | | SEO-D01-2 | **Technical SEO audit** (read-only) of the codebase + rendered pages | C | `audits/D01-technical-audit.md` |
| 1 | | — | Weekly report #1 (baseline, auto) | Routine | Claude Doc |
| 2 | Tue 1 Dec | SEO-D02-1 | **Technical foundation:** `sitemap.ts`, `robots.ts`, per-page canonicals, `?lang` canonicalisation, noindex for private routes, real 404 for unknown slugs, Organization + WebSite + BreadcrumbList JSON-LD | C | Shipped to `main` |
| 2 | | SEO-D02-2 | Submit sitemap in GSC + Bing; URL Inspection of `/` and `/shop` | You | Sitemap "Success" |
| 3 | Wed 2 Dec | SEO-D03-1 | Run Keyword Planner with the seed list (PLAN §4), UK, last 12 months → export CSV | You | CSV in `seo-reports` |
| 3 | | SEO-D03-2 | **Keyword research round 1:** SERP analysis + Planner data → keyword universe, intent, clusters, excluded list | C | `audits/D03-keyword-research.md` |
| 4 | Thu 3 Dec | SEO-D04-1 | **Keyword → URL map v1** + title / meta / H1 matrix for every indexable URL | C→You | `drafts/SEO-D04-1-metadata-matrix.md` |
| 5 | Fri 4 Dec | SEO-D05-1 | **Compliance copy pass:** remove RUO-contradicting copy site-wide; record ADR-024 | C→You | `drafts/SEO-D05-1-compliance-pass.md` |
| 5 | | SEO-D05-2 | **Product copy batch A** (Reta 40, Reta 20, Tirz 40) | C→You | `drafts/SEO-D05-2-products-a.md` |
| 6 | Sat 5 Dec | SEO-D06-1 | **Product copy batch B** (BPC/TB, Glow, MOTS-C, CJC, Tesamorelin, NAD+) | C→You | `drafts/SEO-D06-1-products-b.md` |
| 6 | | SEO-D06-2 | **Competitor & link-gap analysis** (top UK suppliers) | C | `audits/D06-competitors.md` |
| 7 | Sun 6 Dec | SEO-D07-1 | **Week-1 full analysis + backlink target list** (≥ 40 vetted prospects) + outreach templates | C | `reports/W1-analysis.md`, `audits/D07-link-prospects.md` |
| 7 | | SEO-D07-2 | Approve D04–D06 drafts; upload weekly exports | You | Drafts `APPROVED` |

### Week 2 — Ship on-page work, build the Research section, start links (7 – 13 Dec)

| Day | Date | ID | Task | Owner | Deliverable |
|---|---|---|---|---|---|
| 8 | Mon 7 Dec | SEO-D08-1 | **Ship approved on-page changes:** metadata matrix, compliance pass, product copy A+B, Product JSON-LD enrichment | C | Shipped |
| 8 | | SEO-D08-2 | Request indexing (URL Inspection) for the 9 products + `/` + `/shop` | You | Logged in TRACKER §6 |
| 8 | | SEO-D08-3 | **Links batch 1 — foundations:** brand profiles with identical name, URL and description (see D07 list) | You | TRACKER §7 |
| 8 | | — | Weekly report #2 (auto) | Routine | Claude Doc |
| 9 | Tue 8 Dec | SEO-D09-1 | **Build `/research` section:** index + `[slug]` from `content/research/*.md`, Article + Breadcrumb JSON-LD, footer Research column, "Research behind this compound" block on product pages, sitemap entries | C | Shipped (no guides yet → index shows only published) |
| 10 | Wed 9 Dec | SEO-D10-1 | **Guide 1:** How to read a Janoshik certificate (COA) | C→You | `drafts/SEO-D10-1-*.md` |
| 11 | Thu 10 Dec | SEO-D11-1 | **Guides 2 + 3:** Retatrutide research, Tirzepatide research | C→You | `drafts/SEO-D11-1-*.md` |
| 12 | Fri 11 Dec | SEO-D12-1 | **Publish approved guides 1–3** + internal links + sitemap | C | Shipped |
| 12 | | SEO-D12-2 | **Links batch 1 continued:** press-release distribution (newsroom/wire, nofollow is fine), reclaim unlinked mentions | You | TRACKER §7 |
| 13 | Sat 12 Dec | SEO-D13-1 | **Performance & image SEO:** CWV (LCP/INP/CLS) mobile, image alt text, dimensions, formats, 3D/marquee cost | C | Shipped + `audits/D13-performance.md` |
| 14 | Sun 13 Dec | SEO-D14-1 | **Week-2 review:** GSC coverage, indexing problems, first queries, adjust plan | C | `reports/W2-review.md` |
| 14 | | SEO-D14-2 | Approve D10–D11 drafts if not done; upload weekly exports | You | — |

### Week 3 — Content depth, E-E-A-T, authority (14 – 20 Dec)

| Day | Date | ID | Task | Owner | Deliverable |
|---|---|---|---|---|---|
| 15 | Mon 14 Dec | SEO-D15-1 | **Guides 4 + 5:** BPC-157/TB-500, Glow blend | C→You | drafts |
| 15 | | — | Weekly report #3 (auto) | Routine | Claude Doc |
| 16 | Tue 15 Dec | SEO-D16-1 | **Guides 6 + 7:** MOTS-C, CJC-1295 (no DAC) | C→You | drafts |
| 17 | Wed 16 Dec | SEO-D17-1 | **Guides 8 + 9:** Tesamorelin, NAD+ | C→You | drafts |
| 18 | Thu 17 Dec | SEO-D18-1 | **Trust pages:** `/about` E-E-A-T (who, testing process, quality, contact), `/spot-a-fake` brand-protection copy + FAQ | C→You | drafts |
| 18 | | SEO-D18-2 | **Links batch 2 — outreach** (send before the Christmas slowdown): research blogs, lab-supply directories, expert-quote requests, genuine community answers | You | TRACKER §7 |
| 19 | Fri 18 Dec | SEO-D19-1 | **Publish guides 4–9 + trust pages**; **internal-link audit** (hub ↔ spoke, anchors, orphans) | C | Shipped + `audits/D19-internal-links.md` |
| 20 | Sat 19 Dec | SEO-D20-1 | **Entity & AI visibility:** Organization `sameAs`, consistent brand facts, how ChatGPT/Perplexity/Google AI Overviews describe Alluvi; fixes | C | `audits/D20-entity-ai.md` + shipped fixes |
| 21 | Sun 20 Dec | SEO-D21-1 | **Mid-plan review:** striking-distance list (pos 8–20), CTR outliers, re-prioritise Week 4 | C | `reports/W3-review.md` |

### Week 4 — Optimise from data (21 – 29 Dec)

| Day | Date | ID | Task | Owner | Deliverable |
|---|---|---|---|---|---|
| 22 | Mon 21 Dec | SEO-D22-1 | **CTR optimisation:** rewrite titles/metas for high-impression, low-CTR URLs | C→You | draft → ship same day once approved |
| 22 | | — | Weekly report #4 (auto) | Routine | Claude Doc |
| 23 | Tue 22 Dec | SEO-D23-1 | **Striking-distance push:** expand/realign pages ranking 8–20 (sections, FAQ, internal links) | C→You | drafts |
| 24 | Wed 23 Dec | SEO-D24-1 | **Guide 10:** Peptide storage & lab handling + `/shop` intro copy | C→You | drafts |
| 25 | Thu 24 Dec | SEO-D25-1 | Publish approved D22–D24 work | C | Shipped |
| 26 | Fri 25 Dec | — | **Buffer (Christmas):** monitoring only | — | — |
| 27 | Sat 26 Dec | SEO-D27-1 | **Technical re-audit:** full crawl, status codes, canonicals, schema validation, CWV, sitemap vs indexed | C | `audits/D27-technical-reaudit.md` + fixes |
| 28 | Sun 27 Dec | SEO-D28-1 | **Backlink audit:** new links, quality, spam/negative-SEO check, disavow decision; plan links batch 3 | C | `audits/D28-backlinks.md` |
| 28 | | SEO-D28-2 | Upload weekly exports; links batch 3 (follow-ups) | You | — |
| 29 | Mon 28 Dec | SEO-D29-1 | **Content refresh:** update guides 1–3 with real GSC queries; add PAA questions | C→You | drafts → ship |
| 29 | | — | Weekly report #5 (auto) | Routine | Claude Doc |
| 30 | Tue 29 Dec | SEO-D30-1 | **Day-30 report + 60-day roadmap** (Days 31–90) | C | `reports/D30-report.md` |

## 7. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| New domain is slow to earn trust | High | Long-tail first, earned links at a steady pace, brand entity work, patience on head terms |
| YMYL / unapproved-pharma sensitivity | High | Strict RUO copy, cited research, clear company and testing info (E-E-A-T) |
| Competitor negative SEO (spam links) | Medium | Weekly link review from Day 21; disavow only proven toxic domains |
| Holiday slowdown (outreach replies, approvals) | Medium | Outreach front-loaded to Days 8–18; Day 26 buffer |
| Approval bottleneck | Medium | Batch drafts; ship tasks publish whatever is approved |
| Algorithm update during window | Low–Med | Follow Google Search Status; avoid shortcuts that updates target |
| Certificate gaps (4 products) | Known | No test claims on those pages until COAs arrive; update when supplied |
