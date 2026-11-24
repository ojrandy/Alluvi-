import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackageOpen, Plus } from "lucide-react";
import { ProductsList } from "@/components/admin/products/products-list";
import { PageHeader, primaryAction } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/server/auth";
import { listAdminProducts } from "@/server/queries/admin-products";

export const metadata: Metadata = { title: "Products" };

/** /admin/products (PRD FR-15): every product incl. hidden ones, in shop order. */
export default function AdminProductsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6">
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
      <PageHeader
        title="Products"
        description={`${rows.length} ${rows.length === 1 ? "product" : "products"} · ${visible} visible in the shop. Arrows set the shop order.`}
        actions={
          <Link href="/admin/products/new" className={primaryAction}>
            <Plus className="size-4" aria-hidden="true" />
            New product
          </Link>
        }
      />
      <section aria-label="Products" className="overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-card">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <PackageOpen className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-semibold">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run <code className="rounded bg-muted px-1">npm run db:seed</code> to load the recovered catalogue, or{" "}
              <Link href="/admin/products/new" className="font-medium text-brand-ink hover:underline">
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
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-14 w-full max-w-md rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-[36rem] rounded-[1.25rem]" />
    </div>
  );
}
