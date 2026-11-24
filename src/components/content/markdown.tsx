import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { labLink } from "@/lib/lab-links";

/**
 * Minimal, safe Markdown → React renderer for our own content (product descriptions, policy
 * pages). It never emits raw HTML: unknown syntax renders as text, so admin-entered copy cannot
 * inject markup. Supported: ## / ### headings (with ids), paragraphs, - / 1. lists, > quotes,
 * **bold**, *italic*, [links](url) (http(s), mailto, tel and site-relative only), hard rules.
 * Chosen over react-markdown to avoid a dependency for this small subset (DECISIONS ADR-014).
 */

export type Heading = { id: string; text: string; level: 2 | 3 };

type Block =
  | { kind: "h"; level: 2 | 3; text: string; id: string }
  | { kind: "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "hr" };

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[*_`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const seen = new Map<string, number>();
  let para: string[] = [];

  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flush();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      const text = h[2].trim();
      const base = slugifyHeading(text) || "section";
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      blocks.push({ kind: "h", level: h[1].length <= 2 ? 2 : 3, text, id: n ? `${base}-${n}` : base });
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flush();
      blocks.push({ kind: "hr" });
      continue;
    }
    const list = /^([-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (list) {
      flush();
      const kind = /^\d/.test(list[1]) ? "ol" : "ul";
      const items = [list[2]];
      while (i + 1 < lines.length) {
        const next = /^([-*•]|\d+[.)])\s+(.*)$/.exec(lines[i + 1].trim());
        if (!next || /^\d/.test(next[1]) !== (kind === "ol")) break;
        items.push(next[2]);
        i++;
      }
      blocks.push({ kind, items });
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      blocks.push({ kind: "quote", text: line.replace(/^>\s?/, "") });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

export function extractHeadings(source: string, level: 2 | 3 = 2): Heading[] {
  return parseMarkdown(source)
    .filter((b): b is Extract<Block, { kind: "h" }> => b.kind === "h" && b.level <= level)
    .map((b) => ({ id: b.id, text: stripMarks(b.text), level: b.level }));
}

function stripMarks(text: string) {
  return text.replace(/\*\*?|__?/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function safeHref(url: string): string | null {
  const u = labLink(url.trim());
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  if (u.startsWith("#")) return u;
  return null;
}

/** Inline: links, **bold**, *italic*. Everything else is text (React escapes it). */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${k++}`;
    if (m[1] !== undefined) {
      const href = safeHref(m[2]);
      if (!href) out.push(m[1]);
      else if (href.startsWith("/")) out.push(<Link key={key} href={href}>{m[1]}</Link>);
      else {
        const external = /^https?:/i.test(href);
        out.push(
          <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {m[1]}
          </a>,
        );
      }
    } else if (m[3] !== undefined) out.push(<strong key={key}>{m[3]}</strong>);
    else if (m[4] !== undefined) out.push(<em key={key}>{m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className={cn("prose-alluvi", className)}>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        switch (b.kind) {
          case "h": {
            const H = b.level === 2 ? "h2" : "h3";
            return (
              <H key={key} id={b.id}>
                <a href={`#${b.id}`} className="heading-anchor">
                  {renderInline(b.text, key)}
                </a>
              </H>
            );
          }
          case "p":
            return <p key={key}>{renderInline(b.text, key)}</p>;
          case "ul":
          case "ol": {
            const L = b.kind;
            return (
              <L key={key}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </L>
            );
          }
          case "quote":
            return <blockquote key={key}>{renderInline(b.text, key)}</blockquote>;
          case "hr":
            return <hr key={key} />;
        }
      })}
    </div>
  );
}
