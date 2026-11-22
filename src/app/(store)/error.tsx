"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Next.js 16: error boundaries receive `retry` (not `reset`).
export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page section-y flex flex-1 flex-col items-center justify-center text-center">
      <p className="eyebrow mb-4">Something went wrong</p>
      <h1 className="text-h1 max-w-xl text-balance">We couldn&apos;t load this page.</h1>
      <p className="text-lead mt-4 max-w-md">
        Please try again. If it keeps happening, contact support and we&apos;ll look into it.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button variant="brand" size="xl" onClick={() => retry()}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="glass" size="xl">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
