import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

/**
 * 404 content. The root not-found renders it as <main> (unmatched URLs have no layout); the store
 * group renders it inside its layout, which already has <main>, so it must not add a second one.
 */
export function NotFoundContent({ as: Tag = "main" }: { as?: "main" | "div" }) {
  return (
    <Tag className="relative isolate flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div
        aria-hidden="true"
        className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_65%)]"
      />
      <Link href="/" aria-label="Alluvi home" className="text-foreground mb-12">
        <Logo className="h-10" />
      </Link>
      <p className="eyebrow mb-4">Error 404</p>
      <h1 className="text-h1 max-w-xl text-balance">This page doesn&apos;t exist.</h1>
      <p className="text-lead mt-4 max-w-md">
        The link may be outdated, or the page has moved. Fake Alluvi sites are common, so make sure
        you&apos;re on the official site.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="brand" size="xl">
          <Link href="/shop">Browse Research Peptides</Link>
        </Button>
        <Button asChild variant="glass" size="xl">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </Tag>
  );
}
