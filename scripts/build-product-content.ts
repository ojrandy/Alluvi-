/**
 * Builds content/products.json from the scraped product pages (content-recovery/raw/pages).
 * Usage: npx tsx scripts/build-product-content.ts
 *
 * Copy is taken verbatim from the live site. Unknown values stay null; nothing is invented.
 */
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { ProductSpecs } from "../src/db/schema";

const RAW = path.join(process.cwd(), "content-recovery", "raw", "pages");
const OUT = path.join(process.cwd(), "content", "products.json");

type Page = {
  route: string;
  title: string;
  meta: Record<string, string>;
  fullText: string;
  images: { src: string; alt: string }[];
  links: { href: string; text: string }[];
};

export type ProductContent = {
  slug: string;
  name: string;
  pricePence: number;
  shortDescription: string;
  description: string;
  category: string | null;
  badge: string | null;
  disclaimer: string | null;
  safetyNote: string | null;
  labReportUrl: string | null;
  specs: ProductSpecs;
  images: { url: string; alt: string }[];
  relatedNames: string[];
  sortOrder: number;
  metaTitle: string;
};

const VIEW_LABELS: [string, string][] = [
  ["front", "front of packaging"],
  ["open", "opened packaging"],
  ["three", "opened packaging"],
  ["uv", "UV authenticity mark"],
  ["pen", "pre-filled research pen"], // after "open": "open" contains "pen"
];

const after = (lines: string[], label: string) => {
  const i = lines.indexOf(label);
  return i >= 0 && i + 1 < lines.length ? lines[i + 1] : null;
};

async function main() {
  const files = (await readdir(RAW)).filter((f) => f.startsWith("product__") && f.endsWith(".json"));
  const shop = JSON.parse(await readFile(path.join(RAW, "shop.json"), "utf8")) as Page;
  const shopLines = shop.fullText.split("\n").map((s) => s.trim()).filter(Boolean);

  const products: ProductContent[] = [];

  for (const f of files) {
    const p = JSON.parse(await readFile(path.join(RAW, f), "utf8")) as Page;
    const slug = p.route.replace("/product/", "");
    const lines = p.fullText.split("\n").map((s) => s.trim()).filter(Boolean);

    const name = p.title.split(" | ")[0].trim();
    const nameIdx = lines.indexOf(name);
    const priceLine = lines.slice(nameIdx).find((l) => /^£\s?\d/.test(l));
    if (!priceLine) throw new Error(`No price for ${slug}`);
    const pricePence = Math.round(parseFloat(priceLine.replace(/[£,\s]/g, "")) * 100);

    // Compound analysis table rows are tab-separated in innerText
    const headerIdx = lines.findIndex((l) => /^COMPOUND\s+CONCENTRATION\s+VERIFIED CONTENT$/.test(l));
    const compounds: ProductSpecs["compounds"] = [];
    if (headerIdx >= 0) {
      for (let i = headerIdx + 1; i < lines.length && !lines[i].startsWith("HOW TO READ"); i++) {
        const [compound, concentration, verifiedContent] = lines[i].split(/\t+/).map((s) => s.trim());
        if (compound && concentration) compounds.push({ compound, concentration, verifiedContent: verifiedContent ?? null });
      }
    }

    const pkgStart = lines.findIndex((l) => /^Each .+ kit includes:$/.test(l));
    const pkgEnd = lines.indexOf("Continue Your Research");
    const packageContents = pkgStart >= 0 ? lines.slice(pkgStart + 1, pkgEnd > pkgStart ? pkgEnd : undefined) : [];

    const relStart = lines.indexOf("COMPOUND", pkgEnd);
    const relatedNames = relStart >= 0 ? lines.slice(relStart + 1).filter((l) => /\(R&D Only\)|NAD\+/.test(l)) : [];

    // Lab reports (dedupe by URL; nicer labels for the generic ones)
    const seen = new Set<string>();
    const labReports: NonNullable<ProductSpecs["labReports"]> = [];
    for (const l of p.links) {
      if (!l.href.includes("verify.janoshik.com")) continue;
      const text = l.text.replace(/[↗]/g, "").trim();
      const generic = /View (Full )?Janoshik/i.test(text);
      if (seen.has(l.href)) {
        // Same report linked twice: keep the more specific label (e.g. "Purity Test")
        const existing = labReports.find((r) => r.url === l.href)!;
        if (!generic && existing.label === "Janoshik analytical report") existing.label = text;
        continue;
      }
      seen.add(l.href);
      labReports.push({ label: generic ? "Janoshik analytical report" : text, url: l.href });
    }

    const dateLine = lines.find((l) => l.startsWith("Date Tested:"));
    const [description, ...rest] = (p.meta.description ?? "").split(/\n\s*\n/);
    const disclaimer = rest.find((l) => l.startsWith("MANDATORY DISCLAIMER:"))?.trim() ?? lines.find((l) => l.startsWith("MANDATORY DISCLAIMER:")) ?? null;
    const safetyNote = lines.find((l) => l.startsWith("Safety Protocol:")) ?? null;
    const category = nameIdx > 0 ? lines[nameIdx - 1] : null; // "COMPOUND ANALYSIS" / "SUPPORT"

    const imgSeen = new Set<string>();
    // The main gallery comes first in the DOM; its folder (e.g. /images/reta20images) identifies this product.
    const firstOwn = p.images.find((i) => /\/images\/[a-z0-9]+images\//i.test(new URL(i.src).pathname));
    const folder = firstOwn ? new URL(firstOwn.src).pathname.split("/").slice(0, -1).join("/") : "";
    const images = p.images
      .map((i) => {
        const url = new URL(i.src).pathname;
        const view = VIEW_LABELS.find(([k]) => url.toLowerCase().includes(k))?.[1];
        return { url, alt: view ? `${name.replace(" (R&D Only)", "")}: ${view}` : i.alt };
      })
      .filter((i) => folder && i.url.startsWith(folder + "/") && !imgSeen.has(i.url) && imgSeen.add(i.url));

    const shopIdx = shopLines.indexOf(name);
    const badge = shopIdx > 0 && shopLines[shopIdx - 1] === "NEW ARRIVAL" ? "New arrival" : null;

    products.push({
      slug,
      name,
      pricePence,
      shortDescription: description.trim(),
      description: description.trim(),
      category: category === "SUPPORT" ? "Support" : category === "COMPOUND ANALYSIS" ? "Research compound" : null,
      badge,
      disclaimer,
      safetyNote,
      labReportUrl: labReports[0]?.url ?? null,
      specs: {
        batchNumber: after(lines, "BATCH NUMBER"),
        fillVolume: after(lines, "FILL VOLUME"),
        purity: after(lines, "PURITY"),
        dateTested: dateLine ? dateLine.replace("Date Tested:", "").trim() : null,
        compounds,
        packageContents,
        labReports,
      },
      images,
      relatedNames,
      sortOrder: shopIdx >= 0 ? shopIdx : 999,
      metaTitle: p.title,
    });
  }

  products.sort((a, b) => a.sortOrder - b.sortOrder);
  products.forEach((p, i) => (p.sortOrder = i + 1));

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(products, null, 2) + "\n");
  console.log(`Wrote ${products.length} products → ${path.relative(process.cwd(), OUT)}`);
  for (const p of products)
    console.log(
      `${p.sortOrder}. ${p.slug.padEnd(22)} £${(p.pricePence / 100).toFixed(2).padStart(7)}  imgs:${p.images.length} compounds:${p.specs.compounds?.length} reports:${p.specs.labReports?.length} pkg:${p.specs.packageContents?.length} related:${p.relatedNames.length}${p.badge ? " [" + p.badge + "]" : ""}`,
    );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
