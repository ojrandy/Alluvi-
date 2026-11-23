import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { ProductsList } from "@/components/admin/products/products-list";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/server/auth";
import { listAdminProducts } from "@/server/queries/admin-products";

export const metadata: Metadata = { title: "Products" };

/** /admin/products (PRD FR-15): every product incl. hidden ones, in shop order. */
export default function AdminProductsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <Suspense fallback={<ListSkeleton />}>
        <Products />
      </Suspense>
    </div>
  );
}

async function Products() {
  await requireAdmin();
  const rows = await listAdminProducts();
  const visible = rows.filter((r) => r.isActive).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "product" : "products"} · {visible} visible in the shop. Arrows set the shop order.
        </p>
        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Plus className="size-4" aria-hidden="true" />
          New product
        </Link>
      </div>
      <section aria-label="Products" className="overflow-hidden rounded-2xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run <code className="rounded bg-muted px-1">npm run db:seed</code> to load the recovered catalogue, or{" "}
              <Link href="/admin/products/new" className="text-brand hover:underline">
                add a product
              </Link>
              .
            </p>
          </div>
        ) : (
          <ProductsList rows={rows} />
        )}
      </section>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-5 w-72 rounded" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <Skeleton className="h-[36rem] rounded-2xl" />
    </div>
  );
}
