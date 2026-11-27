import type { Metadata } from "next";
import { openGraphFor } from "@/lib/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronDown } from "lucide-react";
import { extractHeadings, Markdown, type Heading } from "@/components/content/markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { breadcrumbJsonLd, jsonLdHtml } from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import { getPolicyPage, isPolicySlug, POLICY_SLUGS, type PolicySlug } from "@/server/content/pages";

/**
 * Fully static route (catalogue/content data is 'use cache'). An unknown slug is then rendered to
 * completion before responding instead of streaming the fallback shell with a 200, so notFound()
 * returns a real 404 (next/dist/docs ensureStatic.md "Dynamic route parameters"; SEO audit D01, C1).
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isPolicySlug(slug)) notFound();
  const page = await getPolicyPage(slug);
  return {
    title: { absolute: page.metaTitle },
    description: page.description,
    alternates: { canonical: `/policies/${slug}` },
    openGraph: openGraphFor({ title: page.metaTitle, description: page.description, path: `/policies/${slug}` }),
  };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  // Check before the Suspense boundary so unknown slugs get a real 404, not a streamed soft 404
  // (next/dist/docs streaming.md "The HTTP contract").
  const { slug } = await params;
  if (!isPolicySlug(slug)) notFound();

  return (
    <Suspense fallback={<PolicySkeleton />}>
      <Policy slug={slug} />
    </Suspense>
  );
}

async function Policy({ slug }: { slug: PolicySlug }) {
  const page = await getPolicyPage(slug);
  const headings = extractHeadings(page.body);
  const others = await Promise.all(POLICY_SLUGS.filter((s) => s !== slug).map((s) => getPolicyPage(s)));

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: page.navTitle, path: `/policies/${slug}` },
  ]);

  return (
    <div className="container-page pt-12 pb-20 md:pt-20 md:pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(breadcrumbs)} />
      <header className="max-w-3xl">
        <p className="eyebrow">{slug === "press-release" ? "Press release" : "Policies"}</p>
        <h1 className="text-h1 mt-4 text-balance">{page.title}</h1>
        {page.subtitle && <p className="text-lead mt-4 max-w-2xl text-balance">{page.subtitle}</p>}
      </header>

      <div className="mt-10 grid grid-cols-1 gap-10 md:mt-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        {headings.length > 2 && <Toc headings={headings} />}
        <article className={cn(headings.length <= 2 && "lg:col-start-2")}>
          <Markdown source={page.body} />
        </article>
      </div>

      <nav aria-label="Other policies" className="mt-20 border-t border-border pt-10">
        <h2 className="eyebrow text-muted-foreground">More from Alluvi</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/policies/${o.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                {o.navTitle}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Toc({ headings }: { headings: Heading[] }) {
  const list = (
    <ol className="space-y-1 text-sm">
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            className="block rounded-lg px-3 py-1.5 leading-snug text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      {/* Mobile: collapsible, so the article starts near the top. */}
      <details className="group rounded-2xl border border-border bg-card lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
          On this page
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <nav aria-label="On this page" className="border-t border-border p-2">
          {list}
        </nav>
      </details>
      <nav aria-label="On this page" className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-height)+1.5rem)] max-h-[calc(100vh-var(--header-height)-3rem)] overflow-y-auto">
          <p className="eyebrow mb-3 px-3 text-muted-foreground">On this page</p>
          {list}
        </div>
      </nav>
    </>
  );
}

function PolicySkeleton() {
  return (
    <div className="container-page pt-12 pb-20 md:pt-20" aria-busy="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-5 h-12 w-2/3" />
      <div className="mt-14 space-y-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-[70ch]" />
        ))}
      </div>
    </div>
  );
}
