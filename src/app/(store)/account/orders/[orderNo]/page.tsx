import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { OrderResult } from "@/components/track-order/track-order";
import { Skeleton } from "@/components/ui/skeleton";
import { countryName } from "@/lib/constants";
import { requireCustomer } from "@/server/customer-auth";
import { ORDER_NO_PATTERN } from "@/server/order-number";
import { toTrackedOrder } from "@/server/order-timeline";
import { getCustomerOrder } from "@/server/queries/customer-orders";

export const metadata: Metadata = { title: "Order" };

export default function AccountOrderPage(props: PageProps<"/account/orders/[orderNo]">) {
  return (
    <>
      <Link
        href="/account"
        className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All orders
      </Link>
      <Suspense fallback={<Skeleton className="mt-6 h-[28rem] w-full rounded-3xl" />}>
        <AccountOrder {...props} />
      </Suspense>
    </>
  );
}

async function AccountOrder({ params }: PageProps<"/account/orders/[orderNo]">) {
  const { orderNo: raw } = await params;
  const orderNo = decodeURIComponent(raw).toUpperCase();
  const customer = await requireCustomer(`/account/orders/${encodeURIComponent(orderNo)}`);
  if (!ORDER_NO_PATTERN.test(orderNo)) notFound();

  // Scoped to this customer: someone else's order number is indistinguishable from a missing one.
  const order = await getCustomerOrder(customer.id, orderNo);
  if (!order) notFound();
  const tracked = await toTrackedOrder(order);

  return (
    <div className="mt-6 space-y-6">
      <OrderResult order={tracked} />
      <section aria-labelledby="delivery-title" className="rounded-3xl border border-border bg-card p-5 sm:p-7 lg:max-w-[calc(100%-23.5rem)]">
        <h2 id="delivery-title" className="text-h3">Delivery</h2>
        <address className="mt-3 text-sm leading-relaxed not-italic text-muted-foreground">
          {[`${order.firstName} ${order.lastName}`, order.addressLine1, order.addressLine2, order.city, order.postcode, countryName(order.country)]
            .filter(Boolean)
            .map((l, i) => (
              <span key={i} className="block">{l}</span>
            ))}
        </address>
      </section>
    </div>
  );
}
