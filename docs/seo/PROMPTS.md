# SEO Prompts — one per task, in plan order

> Paste **§0 Session primer** at the start of every new Claude Code session, then **one** task prompt.
> Every prompt uses the project format **ROLE · CONTEXT · TASK · CONSTRAINTS · ACCEPTANCE · OUTPUT**.
> IDs match [PLAN.md](PLAN.md) §6 and [TRACKER.md](TRACKER.md) §1. Shared blocks in §1 are referenced
> by name (e.g. "apply **RULES-SEO**"); Claude must open this file and apply them exactly.
>
> Tips for best results
> - One task per session (or `/clear` between tasks). Long sessions blur the constraints.
> - If Claude asks something the docs answer, reply: "Check docs/seo/PLAN.md §x".
> - Drafts are approved by editing the header to `status: APPROVED` or saying "approved: <file>".
> - **Ship** prompts stop before pushing; you reply `ship` to deploy (a push to `main` deploys the live site).

---

## 0. Session primer (paste at the start of every SEO session)

```
You are the principal engineer and senior SEO lead on the Alluvi storefront (CLAUDE.md), working the
30-day SEO programme in docs/seo/.
Before doing anything:
1. Read docs/seo/README.md, docs/seo/PLAN.md and docs/seo/TRACKER.md.
2. Tell me in ≤6 lines: current plan day, tasks DONE, today's tasks, drafts AWAITING APPROVAL, anything BLOCKED.
3. Note the shared blocks in docs/seo/PROMPTS.md §1. Every task prompt depends on them.
Do not change anything yet. Wait for the task prompt.
```

---

## 1. Shared blocks (referenced by every task)

### RULES-SEO
```
- Canonical origin: https://alluvihealthcare.co (siteUrl in src/lib/site.ts). Market: UK, en-GB, GBP.
- Compliance (PLAN §3.1): keep "For laboratory research use only. Not for human consumption." on every
  product view. Never write or target dosing, protocols, reconstitution-for-use, cycles, weight/fat loss,
  bodybuilding, human use, prescriptions, treatment/cure, human side effects, before/after.
  Log any such keyword in TRACKER §8 instead.
- Truth (PLAN §3.2): no invented prices, purities, batch numbers, reviews, ratings, members, testimonials.
  Facts come from content/products.json, content/site.json, content/pages/*, src/lib/certificates.ts,
  or a cited primary source. Janoshik/certificate claims ONLY for products in src/lib/certificates.ts.
  No Review/AggregateRating schema.
- One primary keyword per URL (PLAN §4). Product pages = transactional; /research pages = informational.
- Links (PLAN §3.3): recommend earned links only. Never suggest paid links, PBNs or automated tools.
- Keep every existing URL working. New public pages only under /research/<slug>.
```

### RULES-ENG
```
- Follow CLAUDE.md, AGENTS.md, docs/CONVENTIONS.md. Next.js 16 differs from training data: before using
  metadata routes (sitemap/robots), generateMetadata, alternates/canonical, notFound, 'use cache' or
  streaming, read the matching guide in node_modules/next/dist/docs/ and follow it.
- Smallest change that solves the problem; no new dependency without an ADR in docs/DECISIONS.md.
- 3D/motion is progressive enhancement; nothing may delay LCP.
- Never print .env.local values.
```

### DRAFT-HEADER (top of every draft, one block per URL)
```
---
task: SEO-Dxx-n
status: DRAFT            # DRAFT | CHANGES | APPROVED
url: /path
primary_keyword: ...
secondary_keywords: [..., ...]
search_intent: transactional | informational | navigational
title: "..."             # ≤ 60 chars, primary keyword near the front, brand last: "… | Alluvi"
meta_description: "..."  # 140–155 chars, benefit + RUO-safe call to action
h1: "..."
word_count: n
internal_links_out: [/url, ...]
sources: [ ... ]         # file paths or citations used for every factual claim
notes_for_owner: "..."   # anything that needs a decision
---
```

### FINISH-DRAFT (end of every C→You task)
```
Finish:
1. Write drafts to docs/seo/drafts/<TASK-ID>-<slug>.md using DRAFT-HEADER, status: DRAFT.
2. Self-check every draft against RULES-SEO; list any line you changed for compliance.
3. Update docs/seo/TRACKER.md: task row → AWAITING APPROVAL (date, note); add rows to §3.
4. Reply with: draft paths, one-line summary per URL, decisions I must make. No long explanations.
```

### FINISH-SHIP (end of every task that changes code or published copy)
```
Finish:
1. Run `npm run typecheck && npm run lint && npm run build` and fix every error.
2. Start `npm run start` (or dev) and verify: changed URLs return the right status; view-source shows
   the expected <title>, meta description, canonical, robots and JSON-LD; no horizontal overflow at 360px
   and 1280px. Validate JSON-LD (structure + required properties).
3. Update docs/seo/TRACKER.md (task → DONE with date + note; §3/§4/§6 as relevant), docs/PROJECT_TRACKER.md
   change log if code changed, and docs/DECISIONS.md if a decision was made.
4. Run `python -m graphify update .` only if graphify-out/ exists.
5. Commit with a clear message. **Do NOT push.** Show me: files changed, what to verify, risks.
   Push to origin main only after I reply "ship" (a push to main deploys production).
```

### FINISH-ANALYSIS (end of every audit/report task)
```
Finish:
1. Write the report to the path given. Open with a ≤5-bullet executive summary, then findings ranked
   by impact (Critical / High / Medium / Low), each with evidence (file:line, URL, or SERP observation)
   and a concrete fix + owner + effort (S/M/L).
2. Update docs/seo/TRACKER.md (task → DONE, date, note; KPIs/logs if you have data).
3. Reply with the summary and the top 3 actions only.
```

### RESEARCH-GUIDE-TEMPLATE (structure for every /research/<slug> draft)
```
H1: <Compound> — research overview
1. Answer-first intro (40–60 words): what the compound is, its research class, and the RUO notice.
2. Key facts table: name / synonyms, class, sequence or formula, molecular weight, CAS (only if verified
   in PubChem or another primary source and cited), form supplied (from products.json), storage (lyophilised).
3. What the research has studied: summary of published work, each claim cited [n]. Describe findings
   as "in <model> studies, researchers observed…". No human-use advice or outcome promises.
4. Mechanism as studied (receptor/pathway), cited.
5. Research status: preclinical or clinical-trial phase with ClinicalTrials.gov IDs where they exist.
6. Laboratory handling & storage: storage temperature, light/moisture, stability. Lab context only.
7. Quality & testing: how batches are verified; link /research/how-to-read-a-janoshik-coa. Mention
   certificates only if the product is in src/lib/certificates.ts.
8. FAQ (4–6 Qs from People Also Ask / GSC, RUO-safe, 40–80-word answers).
9. Related products (the matching /product URLs) + RUO disclaimer.
10. References: ≥ 6 sources (PubMed/PMC/DOI/ClinicalTrials.gov), formatted [n] Author, Title, Journal, Year, link.
Metadata: author "Alluvi Research Team", datePublished, dateModified. Length 1,200–1,800 words.
Article + BreadcrumbList JSON-LD. Never invent a named expert reviewer. If the owner has a qualified
reviewer, ask for their name and credentials in notes_for_owner.
```

---

# WEEK 1 — Audit and foundations

## SEO-D01-1 · Owner checklist (You)
```
[ ] GSC → Add property → Domain → alluvihealthcare.co → copy TXT → Namecheap Advanced DNS → add TXT → Verify
[ ] Bing Webmaster Tools → Import from Google Search Console
[ ] GA4: confirm the live property receives data only with consent (or decide not to use GA4)
[ ] Google Ads account (expert mode, no campaign, skip billing if allowed) → Tools → Keyword Planner opens
[ ] Note the dates in TRACKER §9
```

## SEO-D01-2 · Technical SEO audit (read-only)
```
ROLE: Senior technical SEO engineer auditing a Next.js 16 e-commerce site before launch.

CONTEXT: Apply RULES-SEO and RULES-ENG. Baseline facts are in docs/seo/PLAN.md §1. The site is
server-rendered Next.js 16 (src/app/(store)), metadata in src/app/layout.tsx and per-route
generateMetadata, product data in content/products.json + DB, i18n via ?lang=pt client swap
(src/lib/i18n/config.ts), legacy redirects in next.config.ts.

TASK (no code changes):
1. Inventory every public route (src/app/(store)/**) → table: URL, indexable? (y/n + why), title source,
   description source, canonical, robots, JSON-LD types, H1 count, internal links in/out.
2. Build and run the app (`npm run build && npm run start`). Fetch each URL with curl and record status
   code, <title>, meta description, canonical, robots meta, X-Robots-Tag, hreflang, JSON-LD.
3. Check: sitemap/robots presence; duplicate URLs (?lang, trailing slash, uppercase, query params);
   unknown product slug status (soft 404); redirect chains in next.config.ts; noindex on private routes
   (checkout, account, login, signup, order-confirmation, track-order, reset/forgot/verify, admin, api);
   heading hierarchy; image alt text and dimensions; thin or duplicate copy between products;
   RUO-contradicting copy (quote each line with file path); Product JSON-LD completeness (name, image,
   description, sku, brand, offers.price/priceCurrency/availability/url, itemCondition,
   shippingDetails/hasMerchantReturnPolicy if data exists).
4. Note performance risks visible in code (LCP element, 3D/motion, fonts, third-party scripts:
   Smartsupp, Telegram bubble).

CONSTRAINTS: Read-only. No edits except the report and the tracker. Evidence for every finding.

ACCEPTANCE: Every public route appears in the inventory. Each Critical/High finding has a concrete fix
mapped to a task ID (mostly SEO-D02-1, SEO-D05-1, SEO-D13-1).

OUTPUT: docs/seo/audits/D01-technical-audit.md, then FINISH-ANALYSIS.
```

## SEO-D02-1 · Technical foundation (ship)
```
ROLE: Principal Next.js 16 engineer implementing technical SEO foundations.

CONTEXT: Apply RULES-SEO and RULES-ENG. Fix list: docs/seo/audits/D01-technical-audit.md (Critical/High
items tagged SEO-D02-1). Read node_modules/next/dist/docs/ for metadata routes (sitemap, robots),
generateMetadata alternates, and notFound/status behaviour under streaming before coding.

TASK:
1. src/app/sitemap.ts: home, shop, about, spot-a-fake, our-location, contact, wholesale, announcements,
   policies/*, every ACTIVE product (from the same data source as the product pages), and later every
   published /research/* entry (leave a typed hook). Absolute URLs from siteUrl; lastModified from data
   where available. Exclude private/transactional routes and ?lang variants.
2. src/app/robots.ts: allow all; disallow /admin, /api, /checkout, /account, /order-confirmation,
   /login, /signup, /forgot-password, /reset-password, /verify-email; Sitemap: <siteUrl>/sitemap.xml.
3. Canonicals: every indexable page sets alternates.canonical to its clean path (no query string), so
   ?lang=pt and other params collapse to the clean URL. Do NOT add hreflang (Portuguese is a client-side
   swap on the same URL, so it has no separate URL).
4. robots noindex,follow on all private/transactional routes (metadata, not robots.txt alone).
5. Unknown /product/<slug> and /policies/<slug> must return a real HTTP 404 (not 200 + noindex). Find
   the Next 16-correct way (notFound before streaming starts / dynamicParams / generateStaticParams)
   and prove it with curl -I.
6. JSON-LD: Organization (name, url, logo, email from site.json, sameAs only for profiles listed in
   content/site.json) + WebSite on the home page; BreadcrumbList on product, policy and shop pages.
   Use one shared helper (e.g. src/lib/seo/jsonld.ts) that escapes "<" safely.
7. Make sure metadataBase uses siteUrl and OG/Twitter images resolve to absolute URLs.

CONSTRAINTS: No visual changes. No new dependencies. Keep existing redirects.

ACCEPTANCE:
- /sitemap.xml valid XML, only 200-status canonical URLs, 9 products present.
- /robots.txt correct; /product/does-not-exist → 404; /?lang=pt canonical → https://alluvihealthcare.co/
- Every indexable page has exactly one canonical; private routes show noindex.
- JSON-LD parses and has the required properties (record in TRACKER §9).

OUTPUT: FINISH-SHIP. Then remind me to do SEO-D02-2.
```

## SEO-D02-2 · Owner checklist (You)
```
[ ] After deploy: open https://alluvihealthcare.co/sitemap.xml and /robots.txt in a browser
[ ] GSC → Sitemaps → submit sitemap.xml; Bing → Sitemaps → submit
[ ] GSC → URL Inspection → / and /shop → Test live URL → Request indexing
[ ] Log in TRACKER §6
```

## SEO-D03-1 · Owner checklist (You)
```
[ ] Keyword Planner → Discover new keywords → "Start with keywords" → paste ≤10 seeds at a time from
    PLAN §4 (primary + secondary) → Location: United Kingdom → Language: English → Last 12 months
[ ] Repeat with "Start with a website" → a top competitor URL (from the D01/D06 notes)
[ ] Download each as CSV → upload to branch seo-reports → seo/inputs/2026-12-02/
[ ] Also drop a copy in docs/seo/inputs/ locally (NOT committed) for the D03-2 session, or paste the path
```

## SEO-D03-2 · Keyword research round 1
```
ROLE: Senior SEO analyst (UK e-commerce, YMYL-sensitive niche) doing keyword research.

CONTEXT: Apply RULES-SEO. Seed map: docs/seo/PLAN.md §4. Keyword Planner CSVs: <PASTE PATH(S)>
(UTF-16, tab-separated; detect encoding). Use WebSearch for google.co.uk SERP observation.

TASK:
1. Parse the Planner CSVs: keyword, avg monthly searches, 3-month/YoY change, competition, top-of-page bids.
2. Clean: dedupe, merge close variants, remove non-UK/irrelevant, move every non-compliant term to an
   "Excluded" list with the reason.
3. Classify intent (transactional / commercial / informational / navigational / brand-protection).
4. Cluster by topic and map each cluster to ONE URL from PLAN §4 (or propose a new /research slug).
   Flag cannibalisation risks.
5. For the top 25 keywords, inspect the SERP: who ranks top 10 (domain + page type), features (AI
   Overview, PAA, forums, shopping), and a difficulty estimate (Low/Med/High) with reasoning based on
   the kind of sites ranking.
6. Pick per URL: primary keyword (best mix of relevance × volume × achievability for a new domain) and 3–6 secondaries.
7. Collect People Also Ask questions per cluster (for FAQs and guides).

CONSTRAINTS: Never invent volumes: write "n/a" when Planner has none. Priority = achievable in 30–90 days
on a new domain, not raw volume.

ACCEPTANCE: Every indexable URL has a primary keyword with evidence. Excluded list populated. ≥ 100
keywords processed (or all available).

OUTPUT: docs/seo/audits/D03-keyword-research.md (tables) + update PLAN §4 only if a primary keyword
changes (note it in TRACKER §9) + add excluded terms to TRACKER §8. Then FINISH-ANALYSIS.
```

## SEO-D04-1 · Keyword→URL map v1 + metadata matrix
```
ROLE: Senior SEO strategist and conversion copywriter.

CONTEXT: Apply RULES-SEO. Inputs: docs/seo/audits/D03-keyword-research.md, D01 audit, current metadata
(generateMetadata in each route, content/site.json seo block, content/products.json).

TASK: For every indexable URL (including planned /research pages), write:
- primary + secondary keywords, intent
- title (≤ 60 chars, keyword-first, unique, " | Alluvi" suffix when it fits; note that the layout title
  template appends " | Alluvi", so give the bare title too)
- meta description (140–155 chars, unique, includes primary keyword + UK + a research-use-safe CTA)
- H1 (unique, close to but not identical to the title)
- 3–5 internal links it should give and receive (anchor text varied, mostly descriptive)
Also produce a cannibalisation check table (keyword → single URL).

CONSTRAINTS: Product titles keep the strength (e.g. 40mg). No superlatives you cannot prove
("best", "#1"). No pricing in titles (prices change).

ACCEPTANCE: Every URL unique on title, meta and H1; lengths verified with a quick script (report counts).

OUTPUT: docs/seo/drafts/SEO-D04-1-metadata-matrix.md (one DRAFT-HEADER block per URL), then FINISH-DRAFT.
```

## SEO-D05-1 · Compliance copy pass + ADR-024
```
ROLE: Compliance-minded copy editor for a research-chemical supplier, working with the engineer.

CONTEXT: Apply RULES-SEO. The owner allowed removal of copy that contradicts research-use-only. This
supersedes the "keep live wording verbatim" note in docs/CONTENT_INVENTORY.md (finding 2). Known
examples: "Don't put your health at risk to save some quid", "precision dosing devices", "visit in store
for prescriptions", "monthly research supply boxes", "1.26M+ Members" (unverifiable).

TASK:
1. Grep content/, src/ (components, i18n/pt.ts, emails) and DB seed sources for human-use, dosing,
   medical, health-outcome and unverifiable-claim language. List every hit: file:line, current text,
   problem, proposed replacement (keep length/tone similar so layouts hold), and the PT translation if
   the string is in i18n.
2. Draft ADR-024 text: "Research-use-only copy cleanup and SEO programme", covering context, decision,
   consequences (supersedes CONTENT_INVENTORY finding 2 wording decision).

CONSTRAINTS: Draft only. No edits to source yet. Legal policy pages: propose edits but flag them as
"client legal copy, owner must confirm".

ACCEPTANCE: Zero remaining hits for the risky phrases after the proposed replacements (show the grep
patterns used).

OUTPUT: docs/seo/drafts/SEO-D05-1-compliance-pass.md, then FINISH-DRAFT.
```

## SEO-D05-2 · Product copy batch A (Retatrutide 40mg, Retatrutide 20mg, Tirzepatide 40mg)
```
ROLE: Senior e-commerce SEO copywriter specialising in research-chemical suppliers (YMYL-safe).

CONTEXT: Apply RULES-SEO. Use: approved or draft metadata matrix (SEO-D04-1), keyword research (D03),
content/products.json (facts, specs, package contents), src/lib/certificates.ts (all three have
certificates), current product page layout (src/app/(store)/product/[slug] + components/product) to
know where copy renders.

TASK: For each product write:
1. Short description (40–60 words, above the fold, primary keyword in first sentence, RUO notice).
2. Long description (350–550 words) with H2s such as: Overview / Specifications / Quality & testing
   (certificate facts only from certificates.ts) / Storage & handling (lab) / What's in the package /
   Research context (2–3 sentences + link to the planned /research/<compound> guide).
3. Specs table data (only from products.json).
4. FAQ: 4 RUO-safe questions (shipping time from shipping policy, storage, verification, purity documentation).
5. Image alt text for each of the 4 images (front, pen, open, UV): descriptive, ≤ 125 chars, no stuffing.
6. Product JSON-LD fields to add (sku, mpn if real, brand Alluvi, additionalProperty for strength/purity
   only if documented, shippingDetails/returnPolicy from policies).
Make 20mg and 40mg Retatrutide copy distinct (≥ 70% unique text) and point each at its strength keyword.

CONSTRAINTS: No dosing, no outcomes, no comparisons to licensed medicines, no "pen" usage instructions
(describe the item, not its use). UK English.

ACCEPTANCE: Each product: primary keyword in title, H1, first 100 words, one H2, alt text of the main
image; readability ≈ grade 8–10; no claim without a source in the header's sources list.

OUTPUT: docs/seo/drafts/SEO-D05-2-products-a.md, then FINISH-DRAFT.
```

## SEO-D06-1 · Product copy batch B (6 products)
```
Run SEO-D05-2 again with these changes:
- Products: BPC-157 & TB-500 40mg, Glow 70mg, MOTS-C 40mg, CJC-1295 (No DAC) 10mg, Tesamorelin 20mg, NAD+ 1,000mg.
- Certificates exist ONLY for BPC/TB 40 and Glow 70 (src/lib/certificates.ts). For MOTS-C, CJC-1295,
  Tesamorelin and NAD+ the "Quality & testing" section describes the verification process and says
  documentation is available on request via /contact. Make NO purity or test-result claim.
- Glow: list the blend composition only as printed in products.json; if it is missing, ask in notes_for_owner.
- Output: docs/seo/drafts/SEO-D06-1-products-b.md, then FINISH-DRAFT.
```

## SEO-D06-2 · Competitor & link-gap analysis
```
ROLE: Competitive-intelligence SEO analyst.

CONTEXT: Apply RULES-SEO. Use D03 SERP data. WebSearch / WebFetch available. (Optionally delegate the
crawl to the searchfit-seo competitor-analyzer agent and verify its output.)

TASK:
1. Identify the 5 UK research-peptide suppliers that appear most in the top 10 for our primary keywords.
2. For each: site structure (category/product/guide pages), product page template (word count, schema,
   FAQ, COA presentation), content hubs, trust signals (about, testing, company info), technical
   observations (speed, rendering), visible link sources (press, directories, forums, Reddit, YouTube,
   brand mentions; use search operators like "competitor.com" -site:competitor.com).
3. Content gaps: topics/pages they rank for that we lack (map to /research or product updates).
4. Link gap: source TYPES that link to 2+ competitors and could genuinely link to us.
5. What they do that we must NOT copy (spammy links, human-use claims). Note it as a risk they carry.

CONSTRAINTS: Observations only from public pages; no scraping behind logins; no fabricated metrics
(no DR/DA numbers unless a source shows them).

ACCEPTANCE: 5 competitors profiled; ≥ 10 content-gap items; ≥ 10 link-source types with examples.

OUTPUT: docs/seo/audits/D06-competitors.md, then FINISH-ANALYSIS.
```

## SEO-D07-1 · Week-1 analysis + link prospect list + outreach templates
```
ROLE: Head of SEO preparing the Week-1 analysis and handing the link-building brief to the owner, who
will run outreach personally to real sites.

CONTEXT: Apply RULES-SEO (links: earned only). Inputs: docs/seo/audits/D01, D03, D06; weekly report #1
(Claude Doc / seo-reports branch seo/reports/); TRACKER.

TASK:
1. reports/W1-analysis.md: state of the site after Week 1, keyword priorities, risks, KPI baseline,
   the exact plan for Weeks 2–4 (confirm or adjust PLAN §6 and say why).
2. audits/D07-link-prospects.md: ≥ 40 vetted prospects grouped by tier and type:
   Tier 1 (editorial/PR: science & biotech news, UK business press, podcasts),
   Tier 2 (niche: lab-supply and research directories with editorial review, peptide-research blogs,
   university/lab resource pages that list suppliers, analytical-testing ecosystem),
   Tier 3 (foundational: brand profiles such as Crunchbase, LinkedIn company, Trustpilot business profile
   (no fake reviews), X, YouTube, Reddit account for genuine participation).
   For each: site, URL, why relevant, what to offer (data, expert quote, COA guide, resource), contact
   route, rel expected, risk notes. Exclude any site that sells links or has "write for us" link-farm signals.
3. Outreach templates (≤ 120 words each): PR pitch, resource-page suggestion, expert-quote reply,
   unlinked-mention reclaim, follow-up. Personalisation slots marked {{like_this}}.
4. Anchor-text plan (PLAN §3.3) and weekly pacing (2–5 new domains/week).

ACCEPTANCE: Prospects are real, reachable sites (each URL fetched or found via search); no paid-link vendors.

OUTPUT: the two files + update TRACKER §1/§2, then FINISH-ANALYSIS.
```

## SEO-D07-2 · Owner checklist (You)
```
[ ] Review drafts D04-1, D05-1, D05-2, D06-1 → set status: APPROVED (or CHANGES with comments)
[ ] Upload GSC export + Planner CSV to seo-reports → seo/inputs/2026-12-06/
[ ] Read W1-analysis + link prospects; pick the batch-1 targets
```

---

# WEEK 2 — Ship, Research section, links

## SEO-D08-1 · Ship approved on-page changes
```
ROLE: Principal engineer shipping approved SEO copy and metadata.

CONTEXT: Apply RULES-SEO and RULES-ENG. Ship ONLY drafts with status: APPROVED in docs/seo/drafts/
(D04-1 metadata matrix, D05-1 compliance pass, D05-2 and D06-1 product copy). Copy lives in content/
(products.json, site.json, pages/*.md) and is seeded into the DB (npm run db:seed). Check how product
copy flows JSON → DB → page before editing.

TASK:
1. Apply titles, metas, H1s per URL (generateMetadata / content files). Make the title template and
   bare titles produce exactly the approved strings.
2. Apply the compliance replacements (EN + PT strings), and write ADR-024 in docs/DECISIONS.md.
3. Apply product short/long descriptions, FAQs, alt text; render FAQ as visible content (FAQPage schema is
   optional and gives no rich result for this niche, so skip it unless trivial).
4. Enrich Product JSON-LD with the approved fields. Keep offers from server data (pence → "120.00").
5. Make sure the seed is idempotent and updates existing rows' copy (or document the admin step).
6. Update TRACKER §4 per product.

CONSTRAINTS: Ship nothing that is not APPROVED. List any approved item you could not apply and why.

ACCEPTANCE: For every changed URL, view-source shows the approved title/meta/H1/canonical; JSON-LD
valid; RUO disclaimer still present on every product view; no layout break at 360/1280.

OUTPUT: FINISH-SHIP. Then remind me to do SEO-D08-2 and SEO-D08-3.
```

## SEO-D08-2 / D08-3 · Owner checklist (You)
```
[ ] GSC URL Inspection → Request indexing: /, /shop, all 9 /product/* (≈10/day quota; finish on D09 if capped)
[ ] Log in TRACKER §6
[ ] Links batch 1 (foundations): create/claim brand profiles from D07 Tier 3. Use the SAME name ("Alluvi"),
    URL (https://alluvihealthcare.co), 1-sentence description, logo and contact email everywhere
[ ] Log each in TRACKER §7; send me the profile URLs so they can be added to Organization sameAs
```

## SEO-D09-1 · Build the /research section
```
ROLE: Principal Next.js 16 engineer and information architect.

CONTEXT: Apply RULES-SEO and RULES-ENG. Owner approved a footer "Research" column and pages under
/research/<slug>. Content will be Markdown files content/research/<slug>.md with front-matter (title,
description, h1, primaryKeyword, compound, relatedProducts[], datePublished, dateModified, status:
draft|published, faq[], references[]). Reuse the existing Markdown rendering used for policies
(content/pages + src/components/content) where possible.

TASK:
1. Routes: /research (index: intro + cards of published guides, grouped by "Guides" and "Compounds")
   and /research/[slug] (generateStaticParams over published files; unknown → real 404).
2. Page template per RESEARCH-GUIDE-TEMPLATE: breadcrumb, H1, answer-first intro, key-facts table,
   table of contents with anchors, body, FAQ (visible), references list, related products cards,
   RUO disclaimer, "last reviewed" date.
3. Metadata: title/description from front-matter, canonical, OG (type article); JSON-LD Article
   (headline, author Organization "Alluvi Research Team", publisher, dates, image) + BreadcrumbList.
4. Footer: add a "Research" column (site-footer.tsx) listing published guides (max 8 + "All research").
5. Product pages: "Research behind this compound" block linking to the matching guide when published.
6. sitemap.ts: include /research and each published guide with lastModified = dateModified.
7. Add one example file content/research/_example.md with status: draft (not routed) documenting the front-matter.

CONSTRAINTS: Must look as premium as the rest of the store (typography, spacing, mobile). No CMS, no new
dependency unless the existing Markdown stack cannot do it (then ADR). Drafts never render publicly.

ACCEPTANCE: With zero published guides, /research renders a tasteful "coming soon" state, stays in
the sitemap, and the footer column is hidden or shows only "All research". With a published test file, every element
renders, JSON-LD is valid, and the 404 works for unknown slugs.

OUTPUT: FINISH-SHIP.
```

## SEO-D10-1 · Guide 1: How to read a Janoshik certificate (COA)
```
ROLE: Analytical-chemistry science writer and SEO lead.

CONTEXT: Apply RULES-SEO and RESEARCH-GUIDE-TEMPLATE (adapted: this is a process guide, not a compound).
Primary keyword: see PLAN §4 / D04-1. Use D03 PAA questions. Real example data ONLY from
src/lib/certificates.ts and public/images/coa/ (task numbers, purity, verification keys as stored).
ADR-020: the public janoshik verification links still show the old domain, so explain verification in
general terms and send readers to /contact#certificates for batch documents.

TASK: Write the guide: what a COA is; who Janoshik is (cite their public site); anatomy of a certificate
(sample, task number, method HPLC/LC-MS, purity %, quantity/content, heavy metals, endotoxin/sterility
where present); how to check a certificate is genuine (verification key, matching batch, image
consistency); red flags of fake COAs (link /spot-a-fake); how Alluvi documents batches. Include an
annotated walkthrough of one real Alluvi certificate (describe it in text; propose an annotated image
as a follow-up). FAQ 5 Qs. ≥ 6 references (method explainers, pharmacopoeia/analytical sources).

OUTPUT: docs/seo/drafts/SEO-D10-1-janoshik-coa.md (full Markdown with front-matter for
content/research/how-to-read-a-janoshik-coa.md), then FINISH-DRAFT.
```

## SEO-D11-1 · Guides 2 + 3: Retatrutide, Tirzepatide
```
ROLE: Biomedical science writer (peptide pharmacology literature) and SEO lead.

CONTEXT: Apply RULES-SEO and RESEARCH-GUIDE-TEMPLATE. Keywords from D04-1 / D03. Cite primary
literature (PubMed/PMC, NEJM/Lancet trial publications, ClinicalTrials.gov IDs).

TASK: Write /research/retatrutide and /research/tirzepatide. Describe each compound's research class
(e.g. GIP/GLP-1/glucagon receptor tri-agonist; GIP/GLP-1 dual agonist), structure facts, mechanism as
studied, and research status (trial phases with IDs). Report published findings factually and neutrally
("in a phase 2 trial, researchers reported…"). Do NOT turn trial results into benefit claims, mention
doses as instructions, or frame them as weight-loss advice: state trial endpoints only as needed for
accuracy, with no promotional emphasis. Link the matching product pages (Reta 20mg + 40mg; Tirz 40mg) and the COA guide.

CONSTRAINTS: The "weight loss" family of keywords stays excluded as a target (TRACKER §8) even though
trial endpoints are described. Each guide ≥ 6 references.

OUTPUT: docs/seo/drafts/SEO-D11-1-retatrutide.md and SEO-D11-1-tirzepatide.md, then FINISH-DRAFT.
```

## SEO-D12-1 · Publish guides 1–3
```
ROLE: Principal engineer publishing approved content.

CONTEXT: Apply RULES-SEO and RULES-ENG. Publish ONLY APPROVED drafts among SEO-D10-1 and SEO-D11-1.

TASK: Create content/research/<slug>.md from each approved draft (status: published, dates set);
verify the product → guide links, guide → product links, footer column, sitemap entries; add 2–3
contextual links from existing pages (e.g. product "Quality & testing" → COA guide, /spot-a-fake →
COA guide). Update TRACKER §3 and §4 ("Guide linked").

ACCEPTANCE: Each guide returns 200, is in the sitemap, has valid Article + Breadcrumb JSON-LD, and has
≥ 3 internal links in and out. Lighthouse SEO = 100 on one guide.

OUTPUT: FINISH-SHIP. Then remind me to request indexing for the new URLs (TRACKER §6).
```

## SEO-D12-2 · Owner checklist (You)
```
[ ] Request indexing for published guides
[ ] Press release: publish the (RUO-clean) press release on a newsroom/wire; nofollow is fine, the value is
    brand mentions and discovery. Ask me to adapt content/pages/press-release.md first if needed
[ ] Search "alluvi" -site:alluvihealthcare.co → list unlinked mentions → send reclaim template (D07)
[ ] Log in TRACKER §7
```

## SEO-D13-1 · Performance & image SEO
```
ROLE: Web-performance engineer (Core Web Vitals) and 3D/WebGL specialist.

CONTEXT: Apply RULES-ENG (ADR-009: 3D is progressive enhancement). Measure with Lighthouse/PageSpeed
(mobile) on /, /shop, one product, one guide, against production after the last deploy.

TASK:
1. Record LCP element, LCP, INP/TBT, CLS, transfer size per page (before).
2. Fix the top issues: LCP image priority/fetchPriority and sizes; next/image dimensions everywhere;
   AVIF/WebP; font loading (Manrope subset, display swap); defer third-party scripts (Smartsupp already
   lazyOnload; verify); 3D/marquee: lazy, DPR-capped, paused off-screen, never the LCP; remove unused JS.
3. Image SEO: approved alt text applied; image file names stay (URL parity); image entries in the
   sitemap are optional (skip unless trivial).
4. Record the after numbers.

ACCEPTANCE: Mobile lab LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms on all four pages, or a documented reason
and follow-up.

OUTPUT: docs/seo/audits/D13-performance.md (before/after table), then FINISH-SHIP.
```

## SEO-D14-1 · Week-2 review
```
ROLE: Head of SEO running the weekly review.

CONTEXT: Inputs: latest weekly report (seo-reports branch / Claude Doc), GSC exports I provide
(<PASTE PATH>), TRACKER.

TASK: Fill TRACKER §2 (W2 column) and §5; analyse GSC Pages report (indexed / not indexed + reasons such as
"Crawled – currently not indexed" or "Discovered – not indexed") and propose fixes per URL; list the first queries
showing impressions and map them to URLs; check that every shipped change is visible in Google's cached
title/snippet; adjust Week-3 priorities if needed (say why).

OUTPUT: docs/seo/reports/W2-review.md, then FINISH-ANALYSIS.
```

---

# WEEK 3 — Content depth, E-E-A-T, authority

## SEO-D15-1 / D16-1 / D17-1 · Compound guides 4–9
```
Run SEO-D11-1 with these changes (one session per day):
- D15: BPC-157 & TB-500 (/research/bpc-157-tb-500) and Glow blend (/research/glow-peptide-blend).
  Glow: composition only as documented in products.json; cite research per component.
- D16: MOTS-C (/research/mots-c) and CJC-1295 no DAC (/research/cjc-1295-no-dac). Explain the
  DAC vs no-DAC distinction accurately (cited); note the "Mod GRF 1-29" synonym only if the sources support it.
- D17: Tesamorelin (/research/tesamorelin) and NAD+ (/research/nad-plus).
- For compounds without certificates (MOTS-C, CJC-1295, Tesamorelin, NAD+): no batch/purity claims.
- Most of these compounds are preclinical. Say so clearly and do not extrapolate to humans.
- Output: docs/seo/drafts/SEO-D15-1-*.md / SEO-D16-1-*.md / SEO-D17-1-*.md, then FINISH-DRAFT.
```

## SEO-D18-1 · Trust pages: About (E-E-A-T) + Spot a fake
```
ROLE: Brand & trust copywriter with SEO focus on E-E-A-T for YMYL-adjacent e-commerce.

CONTEXT: Apply RULES-SEO. Sources: content/site.json, content/pages/*, current /about and /spot-a-fake
pages, fake-sellers data (src/components/store/fake-sellers.ts), D03 brand-protection keywords.

TASK:
1. /about: who Alluvi is (only facts in site.json/content; list missing facts the owner should supply:
   company registration, address, years operating, team/roles), how products are sourced and tested,
   quality process, shipping & support promises from policies, contact routes, RUO commitment.
   Answer "is Alluvi legit" honestly using verifiable proof points.
2. /spot-a-fake: target "fake alluvi peptides" / "is alluvi legit": how to verify a genuine Alluvi product
   and website (official domain alluvihealthcare.co, official contact routes, packaging/UV features shown
   in product images, certificate checks → COA guide), watchlist explanation, how to report. FAQ 5 Qs.
3. Metadata per D04-1 and Organization facts the JSON-LD should carry.

CONSTRAINTS: No invented credentials or numbers. Mark every missing fact as a question for the owner.

OUTPUT: docs/seo/drafts/SEO-D18-1-about.md and SEO-D18-1-spot-a-fake.md, then FINISH-DRAFT.
```

## SEO-D18-2 · Owner checklist (You)
```
[ ] Links batch 2: send 15–25 personalised pitches from D07 Tier 1–2 (before 18 Dec; replies slow after)
[ ] Answer 3–5 genuine questions in relevant communities from a clearly identified brand account. Link
    only when it truly answers the question (prefer the COA guide). No astroturfing.
[ ] Log in TRACKER §7
```

## SEO-D19-1 · Publish guides 4–9 + trust pages; internal-link audit
```
ROLE: Principal engineer + internal-linking strategist.

CONTEXT: Apply RULES-SEO and RULES-ENG. Publish ONLY APPROVED drafts (D15–D18).

TASK:
1. Publish approved guides (as in SEO-D12-1) and apply approved About / Spot-a-fake copy + metadata.
2. Internal-link audit across all indexable URLs: build a link graph (from the rendered HTML of the
   built app); report orphans, pages with < 3 internal links in, over-optimised anchors, broken links.
3. Fix: hub ↔ spoke (research index ↔ guides ↔ products ↔ shop), related products, breadcrumbs, varied
   descriptive anchors; home → top categories/guides.

ACCEPTANCE: 0 orphans, 0 broken internal links, every product ≥ 5 internal links in, every guide ≥ 3.

OUTPUT: docs/seo/audits/D19-internal-links.md + FINISH-SHIP.
```

## SEO-D20-1 · Entity & AI visibility
```
ROLE: Entity-SEO and AI-search (AEO/GEO) specialist.

CONTEXT: Apply RULES-SEO. Brand profiles created so far: TRACKER §7.

TASK:
1. Organization JSON-LD: add sameAs for every live official profile; consistent name, logo, url, email,
   contactPoint; make sure the same one-sentence brand description appears across site and profiles.
2. Query Google (brand SERP, knowledge panel signs) and, via WebSearch, what public AI answer surfaces
   would draw on (Reddit, forums, directories). Record how Alluvi is described, inaccuracies, and missing facts.
3. Make key pages "answer-ready": short factual definitions at the top of guides, clear headings, FAQ
   phrased as real questions, facts in tables.
4. Decide on /llms.txt: recommend yes or no with reasoning (low cost, uncertain value). Implement only if yes and trivial.

OUTPUT: docs/seo/audits/D20-entity-ai.md + shipped fixes via FINISH-SHIP.
```

## SEO-D21-1 · Mid-plan review
```
Run SEO-D14-1 for Week 3 with these additions:
- Build the striking-distance list: queries at avg position 8–20 with ≥ 20 impressions (or the top 20 by
  impressions if data is thin) → URL → concrete action (content section, title tweak, internal links).
- CTR outliers: URLs with impressions ≥ 100 and CTR below the position benchmark.
- Re-prioritise Days 22–25 and say why.
- Output: docs/seo/reports/W3-review.md, then FINISH-ANALYSIS.
```

---

# WEEK 4 — Optimise from data

## SEO-D22-1 · CTR optimisation
```
ROLE: SERP-snippet copywriter running CTR experiments.

CONTEXT: Apply RULES-SEO. Input: W3-review CTR outliers + latest weekly report + GSC queries per page.

TASK: For each outlier URL: current title/meta, the queries it actually earns impressions for, a new
title/meta that matches those queries (keep the primary keyword), and the hypothesis. Max 8 URLs so
results stay measurable. Record "before" CTR/position in TRACKER §9 for a 14-day comparison.

OUTPUT: docs/seo/drafts/SEO-D22-1-ctr.md, then FINISH-DRAFT. (Ships in SEO-D25-1 or same day on approval.)
```

## SEO-D23-1 · Striking-distance push
```
ROLE: Senior SEO content strategist.

CONTEXT: Apply RULES-SEO. Input: striking-distance list (W3-review), current page copy, D03 PAA questions.

TASK: For each of the top 8 striking-distance URLs, draft the specific additions: a missing section that
covers the query intent, 1–2 FAQ entries, improved H2s, and 2–4 new internal links from relevant pages
(give source page + anchor). Keep each page's primary keyword. Do not drift into another page's intent.

OUTPUT: docs/seo/drafts/SEO-D23-1-striking-distance.md, then FINISH-DRAFT.
```

## SEO-D24-1 · Guide 10 (storage & lab handling) + /shop intro copy
```
ROLE: Laboratory science writer and e-commerce SEO copywriter.

CONTEXT: Apply RULES-SEO and RESEARCH-GUIDE-TEMPLATE (process guide).

TASK:
1. /research/peptide-storage-lab-handling: lyophilised vs solution stability (cited), temperature,
   light, moisture, freeze-thaw, aliquoting for laboratory work, labelling and documentation, shipping
   conditions on arrival. Strictly laboratory context. NO preparation-for-use instructions or volumes for
   use. FAQ 5 Qs, ≥ 6 references.
2. /shop: 120–200-word intro above the grid + 80-word outro (primary "research peptides uk"), linking
   to research guides and the COA guide; metadata from D04-1.

OUTPUT: docs/seo/drafts/SEO-D24-1-storage.md and SEO-D24-1-shop.md, then FINISH-DRAFT.
```

## SEO-D25-1 · Publish D22–D24
```
Run SEO-D12-1 for every APPROVED draft from SEO-D22-1, SEO-D23-1 and SEO-D24-1 (copy, metadata, guides,
internal links). Record the publish date for each CTR experiment in TRACKER §9. Then FINISH-SHIP.
```

## SEO-D27-1 · Technical re-audit
```
Run SEO-D01-2 again against PRODUCTION (https://alluvihealthcare.co) instead of the local build, plus:
- Compare sitemap URLs vs GSC indexed URLs (I'll paste the Pages export path: <PASTE PATH>).
- Validate all JSON-LD types on every template.
- Status codes for every sitemap URL, redirects in next.config.ts, 404 behaviour, canonical consistency.
- CWV from GSC (field) if available, otherwise lab.
- Compare with D01: what was fixed, what regressed.
Fix anything Critical/High in the same session (FINISH-SHIP); the rest goes to the 60-day roadmap.
Output: docs/seo/audits/D27-technical-reaudit.md.
```

## SEO-D28-1 · Backlink audit
```
ROLE: Link-profile analyst (quality + negative-SEO defence).

CONTEXT: Apply RULES-SEO. Inputs: TRACKER §7, GSC → Links export (<PASTE PATH>), Bing backlinks export if available.

TASK: Reconcile the earned-link log with the GSC/Bing links; classify every referring domain (earned /
profile / unknown / spam); compute the anchor mix vs the target; flag spam or negative-SEO patterns
(sudden spikes, foreign-language casino/pharma spam, exact-match anchors we didn't build). Recommend a
disavow ONLY for clearly toxic patterns that look manipulative (Google ignores most spam). Produce the
disavow file draft if needed. Plan links batch 3 (follow-ups + new Tier 1–2 targets) for Days 31–60.

OUTPUT: docs/seo/audits/D28-backlinks.md (+ docs/seo/drafts/disavow.txt if justified), then FINISH-ANALYSIS.
```

## SEO-D29-1 · Content refresh (guides 1–3)
```
ROLE: Senior SEO content strategist.

CONTEXT: Apply RULES-SEO. Inputs: GSC queries per guide URL (<PASTE PATH>), weekly report #5.

TASK: For the COA, Retatrutide and Tirzepatide guides: add sections/FAQs for real queries they earn
impressions for (compliant ones only), update references with any newer publications (cite), refresh
dateModified, and add internal links to guides published since. Draft first; ship after approval via
SEO-D12-1 steps.

OUTPUT: docs/seo/drafts/SEO-D29-1-refresh.md, then FINISH-DRAFT.
```

## SEO-D30-1 · Day-30 report + 60-day roadmap
```
ROLE: Head of SEO reporting to the business owner.

CONTEXT: Inputs: TRACKER (all sections), all audits and reports in docs/seo/, weekly reports #1–#5,
latest GSC exports (<PASTE PATH>).

TASK:
1. Results vs PLAN §2 KPIs (table: target, actual, status, why).
2. What worked, what didn't, what we learned about this niche on a new domain.
3. Ranking snapshot: every product + core page + guide (position, impressions, clicks).
4. Link profile summary and anchor mix.
5. 60-day roadmap (Days 31–90) as a week-by-week task table in the same format as PLAN §6, with IDs
   SEO-D31+… and matching prompts appended to PROMPTS.md (same structure), prioritised by expected
   impact on page-1 coverage for all products.
6. Owner asks: decisions, facts or assets needed (e.g. missing certificates, company details, reviewer).

OUTPUT: docs/seo/reports/D30-report.md + PLAN/PROMPTS/TRACKER updated for Days 31–90, then FINISH-ANALYSIS.
```
