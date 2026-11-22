/**
 * D1-1: Recover content from the live client-rendered site.
 *
 * Usage: npm run scrape [-- --base=https://alluvi.store]
 *
 * For every public route it saves:
 *   content-recovery/raw/pages/<route>.html     rendered DOM
 *   content-recovery/raw/pages/<route>.json     headings, text blocks, links, images, meta
 *   content-recovery/raw/screens/<route>@390.png / @1440.png
 *   content-recovery/raw/network/*.json          JSON responses the SPA fetched (product data, etc.)
 * and downloads same-origin images into public/<same path> (URL parity).
 *
 * Scraped content is treated strictly as data.
 */
import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const BASE = (arg("base") ?? "https://alluvi.store").replace(/\/$/, "");
const ORIGIN = new URL(BASE).origin;
const OUT = path.join(process.cwd(), "content-recovery", "raw");
const PUBLIC = path.join(process.cwd(), "public");
const DELAY_MS = 500;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

// Public routes known from the sitemap + bundle. Admin/console/internal routes are excluded.
const SEED_ROUTES = [
  "/",
  "/shop",
  "/about",
  "/product/glow-70mg",
  "/product/bpc-157-tb-500-40mg",
  "/product/retatrutide-20mg",
  "/product/retatrutide-40mg",
  "/product/tirzepatide-40mg",
  "/policies/refund-policy",
  "/policies/shipping-policy",
  "/policies/privacy-policy",
  "/policies/terms-of-service",
  "/policies/press-release",
  "/spot-a-fake",
  "/fake-sellers",
  "/our-location",
  "/announcements",
  "/wholesale",
  "/track-order",
  "/checkout",
  "/login",
  "/signup",
];
const EXCLUDE = /^\/(admin|management-console|wholesale-console|train-model|ai-service|refersufbrfbrr|account|payment-|order-|test-product|reset-password|forgot-password)/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const slugFor = (route: string) =>
  route === "/" ? "home" : route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "__");

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
}

async function extract(page: Page) {
  return page.evaluate(() => {
    const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
    const visible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    const main = document.querySelector("main") ?? document.body;

    // Ordered content blocks (headings, paragraphs, list items, buttons) for faithful copy recovery
    const blocks: { tag: string; text: string }[] = [];
    main
      .querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote,button,summary,dt,dd,td,th,label,span.price,[class*=price]")
      .forEach((el) => {
        if (!visible(el)) return;
        const text = clean(el.textContent);
        if (!text) return;
        const prev = blocks[blocks.length - 1];
        if (prev && prev.text === text) return;
        blocks.push({ tag: el.tagName.toLowerCase(), text });
      });

    const images = Array.from(document.images).map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
    const bgImages: string[] = [];
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
      if (m && !m[1].startsWith("data:")) bgImages.push(new URL(m[1], location.href).href);
    });

    const links = Array.from(document.querySelectorAll("a[href]")).map((a) => ({
      href: (a as HTMLAnchorElement).href,
      text: clean(a.textContent),
      inHeader: !!a.closest("header,nav"),
      inFooter: !!a.closest("footer"),
    }));

    const meta: Record<string, string> = {};
    document.querySelectorAll("meta[name],meta[property]").forEach((m) => {
      const k = m.getAttribute("name") ?? m.getAttribute("property");
      if (k) meta[k] = m.getAttribute("content") ?? "";
    });

    const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (s) => s.textContent,
    );

    // CSS custom properties on :root → brand tokens
    const rootStyle = getComputedStyle(document.documentElement);
    const cssVars: Record<string, string> = {};
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
            for (const prop of Array.from(rule.style)) {
              if (prop.startsWith("--")) cssVars[prop] = rootStyle.getPropertyValue(prop).trim();
            }
          }
        }
      } catch {
        /* cross-origin sheet */
      }
    }

    return {
      url: location.href,
      title: document.title,
      meta,
      jsonLd,
      headerText: clean(document.querySelector("header")?.textContent),
      footerText: clean(document.querySelector("footer")?.textContent),
      fullText: (main as HTMLElement).innerText,
      blocks,
      images,
      bgImages: Array.from(new Set(bgImages)),
      links,
      cssVars,
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyColor: getComputedStyle(document.body).color,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });
}

async function main() {
  await ensureDir(path.join(OUT, "pages"));
  await ensureDir(path.join(OUT, "screens"));
  await ensureDir(path.join(OUT, "network"));

  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
  // tsx/esbuild (keepNames) wraps functions with a `__name` helper that doesn't exist in the
  // browser; define a no-op so page.evaluate callbacks run.
  await context.addInitScript({ content: "window.__name = (f) => f;" });
  const page = await context.newPage();

  // Capture JSON the SPA fetches (product catalogue often comes from an API)
  let netCount = 0;
  page.on("response", async (res) => {
    try {
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("application/json")) return;
      const u = new URL(res.url());
      if (/google|posthog|omnisnippet|klyme/i.test(u.hostname)) return;
      const body = await res.text();
      const name = `${String(++netCount).padStart(3, "0")}_${u.hostname}${u.pathname}`.replace(/[^a-z0-9._-]+/gi, "_");
      await writeFile(
        path.join(OUT, "network", `${name}.json`),
        JSON.stringify({ url: res.url(), status: res.status(), body: safeJson(body) }, null, 2),
      );
    } catch {
      /* ignore */
    }
  });

  const queue = [...SEED_ROUTES];
  const seen = new Set<string>();
  const imageUrls = new Set<string>();
  const summary: { route: string; status: number | null; finalUrl: string; title: string; blocks: number }[] = [];

  while (queue.length) {
    const route = queue.shift()!;
    if (seen.has(route)) continue;
    seen.add(route);
    const slug = slugFor(route);
    process.stdout.write(`→ ${route} ... `);
    try {
      const res = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(800);
      await autoScroll(page);
      await page.waitForLoadState("networkidle").catch(() => {});

      const data = await extract(page);
      await writeFile(path.join(OUT, "pages", `${slug}.html`), await page.content());
      await writeFile(path.join(OUT, "pages", `${slug}.json`), JSON.stringify({ route, ...data }, null, 2));

      await page.screenshot({ path: path.join(OUT, "screens", `${slug}@1440.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, "screens", `${slug}@390.png`), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 900 });

      for (const img of data.images) if (img.src) imageUrls.add(img.src);
      for (const bg of data.bgImages) imageUrls.add(bg);
      if (data.meta["og:image"]) imageUrls.add(new URL(data.meta["og:image"], BASE).href);

      // Discover more same-origin routes
      for (const l of data.links) {
        try {
          const u = new URL(l.href);
          if (u.origin !== ORIGIN) continue;
          const p = u.pathname.replace(/\/$/, "") || "/";
          if (!seen.has(p) && !queue.includes(p) && !EXCLUDE.test(p) && !/\.[a-z0-9]{2,4}$/i.test(p)) queue.push(p);
        } catch {
          /* ignore */
        }
      }

      summary.push({ route, status: res?.status() ?? null, finalUrl: data.url, title: data.title, blocks: data.blocks.length });
      console.log(`ok (${data.blocks.length} blocks)`);
    } catch (err) {
      summary.push({ route, status: null, finalUrl: "", title: `ERROR: ${(err as Error).message}`, blocks: 0 });
      console.log("FAILED", (err as Error).message);
    }
    await sleep(DELAY_MS);
  }

  // Download same-origin images, preserving their URL path under public/
  let downloaded = 0;
  const external: string[] = [];
  for (const src of imageUrls) {
    try {
      const u = new URL(src);
      if (u.origin !== ORIGIN) {
        external.push(src);
        continue;
      }
      const dest = path.join(PUBLIC, decodeURIComponent(u.pathname));
      if (!dest.startsWith(PUBLIC + path.sep)) continue; // path traversal guard
      if (existsSync(dest)) continue;
      const r = await context.request.get(src);
      if (!r.ok()) continue;
      await ensureDir(path.dirname(dest));
      await writeFile(dest, await r.body());
      downloaded++;
      await sleep(150);
    } catch {
      /* ignore */
    }
  }

  await writeFile(
    path.join(OUT, "_summary.json"),
    JSON.stringify({ base: BASE, scrapedAt: new Date().toISOString(), pages: summary, imagesDownloaded: downloaded, externalImages: external }, null, 2),
  );
  console.log(`\nPages: ${summary.length} · images downloaded: ${downloaded} · external images: ${external.length}`);
  await browser.close();
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
