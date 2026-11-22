import { Skeleton } from "@/components/ui/skeleton";

export function ProductViewSkeleton() {
  return (
    <div className="container-page pt-8 pb-20 md:pt-12" aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-8 h-20 w-full rounded-2xl" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <Skeleton className="aspect-[3/2] w-full rounded-3xl" />
          <div className="flex justify-center gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-16 rounded-xl sm:size-20" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
