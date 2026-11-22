# Delivery Plan

> The time-boxed schedule. Task IDs here match [PROJECT_TRACKER.md](PROJECT_TRACKER.md) and the
> prompts in [/prompt.md](../prompt.md).

**Deadline:** v1 accepted by client end of Day 2. **Rule:** if a task overruns its box by 50%,
cut scope (see "cut list"), don't extend the day.

## Day 0 — Setup (done)
| ID | Task | Box |
|----|------|-----|
| D0-1 | Scaffold Next.js 16 + Tailwind v4 + shadcn, install deps, configs | 1h |
| D0-2 | Docs, CLAUDE.md, prompt.md | 1h |

## Day 1 — Content, catalogue, ordering
| ID | Task | Box |
|----|------|-----|
| D1-1 | Recover content from live site (Playwright scrape → `content/`), fill CONTENT_INVENTORY | 1.5h |
| D1-2 | DB schema, migrations, seed products from recovered data | 1h |
| D1-3 | Design system: brand tokens, typography, store layout (header, footer, mobile nav, RUO banner) | 1.5h |
| D1-4 | Home page (parity + upgraded design) | 1.5h |
| D1-5 | Shop + product detail pages | 1.5h |
| D1-6 | Static pages: about, spot-a-fake, our-location, policies | 1h |
| D1-7 | Cart (zustand) + cart drawer | 1h |
| D1-8 | Checkout + `placeOrder` + emails + confirmation page | 2h |
| D1-9 | Track order page | 0.5h |

## Day 2 — Dashboard, SEO, launch
| ID | Task | Box |
|----|------|-----|
| D2-1 | Admin auth (login, session, proxy, requireAdmin) | 1h |
| D2-1A | Customer accounts: signup/login/reset/account, checkout opt-in | 2.5h |
| D2-2 | Admin shell + overview | 1h |
| D2-3 | Orders list, detail, status/tracking, CSV export | 2h |
| D2-4 | Products CRUD | 1.5h |
| D2-5 | Settings (bank details, shipping options) | 0.5h |
| D2-6 | SEO: metadata, sitemap, robots, JSON-LD, redirects, security headers | 1h |
| D2-7 | QA pass: mobile, a11y, Lighthouse, error/empty/loading states | 1.5h |
| D2-8 | GitHub Actions → Namecheap pipeline, DNS, SPF/DKIM, E2E order test with client, handover | 2h |

## v2 — Post-launch (unscheduled, quote separately)
| ID | Task |
|----|------|
| V2-1 | Account extras (multiple addresses, reorder, GDPR delete) |
| V2-2 | Klyme open-banking payment + webhook |
| V2-3 | Wholesale portal + wholesale pricing |
| V2-4 | Discount codes |
| V2-5 | Dashboard analytics charts + low-stock alerts |
| V2-6 | Multi-admin with roles + audit log |
| V2-7 | 3D product viewer / hero (react-three-fiber) |
| V2-8 | Order notifications to Telegram/WhatsApp |
| V2-9 | Automated tests (Playwright E2E for checkout + admin) |

## Cut list (in order, if behind)
Note: D2-1A adds ~2.5h to Day 2. That is covered by the first three cuts below if needed.
1. Testimonial/marketing animations → static.
2. CSV export → copy from table.
3. Settings page → env/constants file.
4. Overview metrics → latest orders only.

## Client dependencies (request on Day 0)
Domain/DNS access · Namecheap cPanel login (SSH enabled) · SMTP mailbox · bank details for transfers ·
GA property access · Klyme account (v2) · any product photos in higher resolution.
