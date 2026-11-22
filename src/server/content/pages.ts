import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

/**
 * Policy pages recovered from the live site (content/pages/<slug>.md, built by
 * `npm run content:pages`). The files ship with the standalone bundle via
 * `outputFileTracingIncludes` in next.config.ts.
 */
export const POLICY_SLUGS = [
  "refund-policy",
  "shipping-policy",
  "privacy-policy",
  "terms-of-service",
  "press-release",
] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export type ContentPage = {
  slug: PolicySlug;
  title: string;
  subtitle?: string;
  metaTitle: string;
  navTitle: string;
  description: string;
  body: string;
};

export function isPolicySlug(s: string): s is PolicySlug {
  return (POLICY_SLUGS as readonly string[]).includes(s);
}

export async function getPolicyPage(slug: PolicySlug): Promise<ContentPage> {
  "use cache";
  cacheLife("max");

  const raw = await readFile(path.join(process.cwd(), "content", "pages", `${slug}.md`), "utf8");
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.replace(/\r\n?/g, "\n"));
  if (!m) throw new Error(`content/pages/${slug}.md has no front matter`);

  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].startsWith('"') ? (JSON.parse(kv[2]) as string) : kv[2];
  }

  return {
    slug,
    title: meta.title ?? slug,
    subtitle: meta.subtitle,
    metaTitle: meta.metaTitle ?? meta.title ?? slug,
    navTitle: meta.navTitle ?? meta.title ?? slug,
    description: meta.description ?? "",
    body: m[2].trim(),
  };
}
