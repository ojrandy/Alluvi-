import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink, FormSkeleton } from "@/components/admin/products/page-parts";
import { ProductForm } from "@/components/admin/products/product-form";
import { EMPTY_PRODUCT_FORM } from "@/lib/validators/admin-products";
import { requireAdmin } from "@/server/auth";
import { getProductPickerData } from "@/server/queries/admin-products";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <BackLink />
      <Suspense fallback={<FormSkeleton />}>
        <NewProduct />
      </Suspense>
    </div>
  );
}

async function NewProduct() {
  await requireAdmin();
  const picker = await getProductPickerData();
  return (
    <div className="mt-3 flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">New product</h2>
        <p className="mt-1 text-sm text-muted-foreground">It goes to the end of the shop. You can reorder it from the product list.</p>
      </header>
      <ProductForm initial={EMPTY_PRODUCT_FORM} picker={picker} />
    </div>
  );
}
