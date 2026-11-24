import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrder } from "@/components/track-order/track-order";
import { Skeleton } from "@/components/ui/skeleton";
import { T } from "@/components/i18n/t";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Alluvi order with your order number and email address.",
  alternates: { canonical: "/track-order" },
  robots: { index: false, follow: true },
};

/** Static shell; the lookup is a rate-limited Server Action, so nothing personal is ever prerendered. */
export default function TrackOrderPage() {
  return (
    <div className="container-page pt-10 pb-20 md:pt-16 md:pb-28">
      <header className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Orders</p>
        <h1 className="text-h1 mt-3 text-balance">Track your order</h1>
        <p className="text-lead mt-4">
          Enter the order number from your confirmation email and the email address you used at checkout.
        </p>
      </header>
      {/* useSearchParams (?order= prefill) needs a Suspense boundary to keep the shell static. */}
      <Suspense fallback={<Skeleton className="mx-auto mt-10 h-72 max-w-xl rounded-3xl" />}>
        <TrackOrder />
      </Suspense>
      <p className="mt-14 text-center text-sm text-muted-foreground">
        <T>For laboratory research use only. Not for human consumption.</T>
      </p>
    </div>
  );
}
