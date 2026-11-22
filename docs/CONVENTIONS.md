# Coding Conventions

> Rules every contributor (human or model) follows. Short on purpose — follow them strictly.

## General
- TypeScript strict. No `any`; use `unknown` + narrowing. No `// @ts-ignore`.
- Server Components by default. Add `"use client"` only for interactivity, at the smallest leaf.
- Files: `kebab-case.tsx`. Components: `PascalCase`. Functions/vars: `camelCase`. Constants: `SCREAMING_SNAKE`.
- Imports via `@/` alias. No deep relative paths (`../../..`).
- One concept per file. Keep files under ~250 lines; split when larger.
- Comments explain *why*, not *what*.

## Next.js 16 specifics
- **Read `node_modules/next/dist/docs/` before using an API you are unsure of** — v16 differs from older versions.
- Use `proxy.ts`, not `middleware.ts`.
- `params` and `searchParams` are **Promises** — `await` them.
- Caching: `'use cache'` + `cacheTag()`; invalidate with `revalidateTag()` / `updateTag()` from Server Actions.
- Use `next/image` for every image, `next/font` for fonts, `next/link` for internal links.
- Every route segment with data gets `loading.tsx` or a `<Suspense>` boundary; every route group has `error.tsx`.

## Data & server
- DB access only from `src/server/**` and `src/db/**` (both import `server-only`).
- Every Server Action: `"use server"` → Zod `safeParse` → authorize → do work → `revalidate*` → return `{ ok: true, data } | { ok: false, error }`. Never throw raw errors to the client.
- Database is MariaDB/MySQL: don't write raw SQL that needs `LATERAL`, CTE recursion or MySQL-8-only JSON functions. Keep Drizzle in `planetscale` mode.
- Money is integer pence. Format only at the edge with `formatGBP()` from `@/lib/format`.
- Totals are computed **only** in `src/server/pricing.ts`.
- Dates stored UTC; displayed `Europe/London` via `date-fns`.

## UI
- shadcn primitives in `components/ui/` — extend via `className`/variants, don't fork logic.
- Use design tokens (CSS variables in `globals.css`), not raw hex values in components.
- Mobile-first. Test at 360px, 768px, 1280px. No horizontal scroll.
- Every interactive element: visible focus state, accessible name, ≥ 44px touch target.
- Empty, loading and error states are part of "done".
- Motion: `motion` package, ≤ 300ms, respect `prefers-reduced-motion`.

## 3D
- Lives in `components/three/`, client-only, dynamically imported with `ssr:false`.
- Cap DPR at `[1, 1.75]`, use `frameloop="demand"` when static, compress GLB with Draco/meshopt, textures ≤ 1024px KTX2/WebP.
- Always provide a static fallback image and a `<noscript>`/reduced-motion path.

## Content & compliance
- Copy comes from `content/` (recovered from the live site). Do not invent product claims.
- Never add medical, dosing or human-use language. Keep the RUO disclaimer wherever products appear.

## Git
- Branch per task: `feat/D1-5-product-pages`. Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`.
- Before commit: `npm run typecheck && npm run lint && npm run build`.
- Never commit `.env*` (except `.env.example`).

## Definition of done
1. Acceptance criteria in prompt.md met. 2. Typecheck, lint, build pass. 3. Mobile + desktop checked.
4. [PROJECT_TRACKER.md](PROJECT_TRACKER.md) updated. 5. Docs updated if schema/architecture changed.
