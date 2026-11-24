import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { OrderConfirmationDetails } from "@/components/checkout/order-confirmation-details";
import { UnlockOrderForm } from "@/components/checkout/unlock-order-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentCustomer } from "@/server/customer-auth";
import { canViewOrder } from "@/server/order-access";
import { customerOwnsOrder } from "@/server/queries/customer-orders";
import { ORDER_NO_PATTERN } from "@/server/order-number";
import { getOrderByNo } from "@/server/queries/orders";
import { getStoreSettings } from "@/server/settings";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default function OrderConfirmationPage(props: PageProps<"/order-confirmation/[orderNo]">) {
  return (
    <div className="container-page pt-10 pb-20 md:pt-16 md:pb-28">
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-3xl rounded-3xl" />}>
        <Confirmation {...props} />
      </Suspense>
    </div>
  );
}

async function Confirmation({ params, searchParams }: PageProps<"/order-confirmation/[orderNo]">) {
  const { orderNo: raw } = await params;
  const orderNo = decodeURIComponent(raw).toUpperCase();
  if (!ORDER_NO_PATTERN.test(orderNo)) notFound();

  // Access check first: without the cookie (or owning the order via a signed-in account) we reveal
  // nothing, not even whether the order exists.
  if (!(await canViewOrder(orderNo)) && !(await isOwnOrder(orderNo))) {
    return (
      <section className="mx-auto max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[0.05]" aria-hidden="true">
          <Lock className="size-5 text-muted-foreground" />
        </span>
        <h1 className="text-h2 mt-5">View order {orderNo}</h1>
        <p className="mt-3 text-muted-foreground">
          For your privacy, confirm the email address used for this order to see its details.
        </p>
        <UnlockOrderForm orderNo={orderNo} />
        <p className="mt-6 text-sm text-muted-foreground">
          Or <Link href="/track-order" className="text-brand underline underline-offset-4">track your order</Link>.
        </p>
      </section>
    );
  }

  const [order, settings, sp] = await Promise.all([getOrderByNo(orderNo), getStoreSettings(), searchParams]);
  if (!order) notFound();
  const account = typeof sp.account === "string" ? sp.account : null;
  const shippingLabel = settings.shippingOptions.find((o) => o.key === order.shippingMethod)?.label ?? order.shippingMethod;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <h1 className="text-h1 mt-5 text-balance">Thank you, {order.firstName}. Your order is placed.</h1>
        <p className="text-lead mt-4">
          Order number <strong className="font-mono text-foreground select-all">{order.orderNo}</strong>. A confirmation has
          been sent to {order.email}.
        </p>
        {account === "created" && (
          <p className="mx-auto mt-5 max-w-lg rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
            Your account has been created and you&apos;re signed in. This order is saved to your account.
          </p>
        )}
        {account === "requested" && (
          <p className="mx-auto mt-5 max-w-lg rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
            Your order was placed as a guest. If you already have an Alluvi account with this email,{" "}
            <Link href="/login" className="text-brand underline underline-offset-4">log in</Link> to see your order history.
          </p>
        )}
      </header>

      <OrderConfirmationDetails order={order} shippingLabel={shippingLabel} />
    </div>
  );
}

async function isOwnOrder(orderNo: string): Promise<boolean> {
  const customer = await getCurrentCustomer();
  return customer ? customerOwnsOrder(customer.id, orderNo) : false;
}
