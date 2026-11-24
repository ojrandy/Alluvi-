import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, FormSkeleton } from "@/components/admin/products/page-parts";
import { ProductForm } from "@/components/admin/products/product-form";
import { formatLondonDateTime } from "@/lib/format";
import { requireAdmin } from "@/server/auth";
import { getAdminProduct, getProductPickerData, toProductFormInput } from "@/server/queries/admin-products";

export const metadata: Metadata = { title: "Edit product" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <BackLink />
      <Suspense fallback={<FormSkeleton />}>
        <EditProduct params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function EditProduct({ params, searchParams }: Pick<PageProps<"/admin/products/[id]">, "params" | "searchParams">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [product, picker, sp] = await Promise.all([getAdminProduct(id.toLowerCase()), getProductPickerData(id.toLowerCase()), searchParams]);
  if (!product) notFound();

  return (
    <div className="mt-3 flex flex-col gap-6">
      <header className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">{product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {product.isActive ? "Visible in the shop" : product.orderCount > 0 ? "Archived (hidden from the shop)" : "Hidden from the shop"} · in {product.orderCount}{" "}
          {product.orderCount === 1 ? "order" : "orders"} · last saved <time dateTime={product.updatedAt.toISOString()}>{formatLondonDateTime(product.updatedAt)}</time>
        </p>
      </header>
      {/* key: a fresh form after navigating between products (RHF keeps defaultValues otherwise). */}
      <ProductForm
        key={product.id}
        productId={product.id}
        initial={toProductFormInput(product)}
        loadedStock={product.stock}
        originalSlug={product.slug}
        version={product.updatedAt.getTime()}
        picker={picker}
        createdNotice={sp.created === "1"}
      />
    </div>
  );
}
