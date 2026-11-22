import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder matching ProductCard's footprint, so streaming in the grid causes no layout shift. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card">
          <Skeleton className="aspect-[3/2] rounded-none" />
          <div className="flex flex-col items-center gap-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-12 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
