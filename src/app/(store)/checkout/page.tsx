import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm, type CheckoutAccount } from "@/components/checkout/checkout-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentCustomer } from "@/server/customer-auth";
import { getStoreSettings, isPromoActive } from "@/server/settings";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default function CheckoutPage() {
  return (
    <div className="container-page pt-10 pb-20 md:pt-16 md:pb-28">
      <header className="mb-10">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="text-h1 mt-3">Checkout</h1>
      </header>
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutData />
      </Suspense>
      <p className="mt-14 text-center text-sm text-muted-foreground">
        For laboratory research use only. Not for human consumption.
      </p>
    </div>
  );
}

/** Per-request: reads the session cookie first (so this is never prerendered), then live settings. */
async function CheckoutData() {
  const customer = await getCurrentCustomer();
  const settings = await getStoreSettings();
  const promo = isPromoActive(settings.freeShippingPromo) ? (settings.freeShippingPromo?.label ?? "Free shipping") : null;
  const a = customer?.defaultAddress;
  const account: CheckoutAccount | null = customer
    ? {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone ?? "",
        addressLine1: a?.line1 ?? "",
        addressLine2: a?.line2 ?? "",
        city: a?.city ?? "",
        postcode: a?.postcode ?? "",
        country: a?.country ?? "GB",
      }
    : null;
  return <CheckoutForm shippingOptions={settings.shippingOptions} promoLabel={promo} account={account} />;
}

function CheckoutSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12" aria-busy="true" aria-label="Loading checkout">
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-3xl" />
    </div>
  );
}
