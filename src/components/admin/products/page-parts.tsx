import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function BackLink() {
  return (
    <Link
      href="/admin/products"
      className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      All products
    </Link>
  );
}

export function FormSkeleton() {
  return (
    <div className="mt-3 flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-14 w-full max-w-md rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-[40rem] rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
