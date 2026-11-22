/**
 * Build content/pages/<slug>.md from the scraped live pages (content-recovery/raw/pages/*.json).
 *
 *   npm run content:pages
 *
 * Copy stays verbatim. Only mechanical fixes are applied: words the scraper glued together across
 * <br> tags are split, and bare emails/URLs become Markdown links.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Block = { tag: string; text: string };
type Page = { title: string; meta: { description?: string }; blocks: Block[] };

const POLICIES: Record<string, string> = {
  "refund-policy": "policies__refund__policy",
  "shipping-policy": "policies__shipping__policy",
  "privacy-policy": "policies__privacy__policy",
  "terms-of-service": "policies__terms__of__service",
  "press-release": "policies__press__release",
};

const GLUE_FIXES: [RegExp, string][] = [
  [/^AlluviShipping Policy$/, "Shipping Policy"],
  [/Coverageand/g, "Coverage and"],
];

function linkify(text: string) {
  return text
    .replace(/(https?:\/\/[^\s)]+)/g, "[$1]($1)")
    .replace(/(?<![\w./:[])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,})/g, "[$1](mailto:$1)");
}

function fix(text: string) {
  let t = text.trim();
  for (const [re, to] of GLUE_FIXES) t = t.replace(re, to);
  return t;
}

function toMarkdown(page: Page) {
  const out: string[] = [];
  let title = "";
  let subtitle = "";
  let prevLi = false;
  for (const b of page.blocks) {
    const text = fix(b.text);
    if (!text) continue;
    if (b.tag === "h1") {
      title = text;
      continue;
    }
    if (b.tag === "h2" && !subtitle && out.length === 0) {
      subtitle = text;
      continue;
    }
    if (b.tag !== "li" && prevLi) out.push("");
    prevLi = b.tag === "li";
    if (b.tag === "h2" || b.tag === "h3") out.push(`## ${text}`, "");
    else if (b.tag === "h4") out.push(`### ${text}`, "");
    else if (b.tag === "li") out.push(`- ${linkify(text)}`);
    else {
      // "Email: research@alluvi.orgWebsite: https://alluvi.org" → two paragraphs
      for (const part of text.split(/(?<=\.org)(?=Website:)/)) out.push(linkify(part), "");
    }
  }
  return { title, subtitle, body: out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n" };
}

async function main() {
  const outDir = path.join("content", "pages");
  await mkdir(outDir, { recursive: true });
  for (const [slug, file] of Object.entries(POLICIES)) {
    const page = JSON.parse(
      await readFile(path.join("content-recovery", "raw", "pages", `${file}.json`), "utf8"),
    ) as Page;
    const { title, subtitle, body } = toMarkdown(page);
    const metaTitle = page.title.replace(/\s*\|\s*Alluvi.*$/, "").trim();
    const front = [
      "---",
      `title: ${JSON.stringify(title)}`,
      subtitle ? `subtitle: ${JSON.stringify(subtitle)}` : null,
      `metaTitle: ${JSON.stringify(page.title)}`,
      `navTitle: ${JSON.stringify(metaTitle)}`,
      `description: ${JSON.stringify(page.meta.description ?? "")}`,
      "---",
    ]
      .filter(Boolean)
      .join("\n");
    await writeFile(path.join(outDir, `${slug}.md`), `${front}\n\n${body}`, "utf8");
    console.log(`wrote ${slug}.md`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
