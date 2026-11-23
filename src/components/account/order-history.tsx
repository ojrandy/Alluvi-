import Link from "next/link";
import { ChevronRight, PackageOpen, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatLondonDate } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { royalMailTrackingUrl } from "@/lib/order-status";
import type { CustomerOrderSummary } from "@/server/queries/customer-orders";

function itemsLabel(o: CustomerOrderSummary) {
  const [first, ...rest] = o.itemNames;
  if (!first) return `${o.itemCount} item${o.itemCount === 1 ? "" : "s"}`;
  return rest.length ? `${first} + ${rest.length} more` : first;
}

export function OrderHistory({ orders }: { orders: CustomerOrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.05]" aria-hidden="true">
          <PackageOpen className="size-6 text-muted-foreground" />
        </span>
        <h3 className="text-h3 mt-5">No orders yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Orders you place while signed in appear here. Guest orders placed with your email appear once your email is confirmed.
        </p>
        <Button asChild variant="brand" size="xl" className="mt-6">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.orderNo} className="group relative rounded-2xl border border-border bg-card transition-colors hover:border-white/20">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Link
                  href={`/account/orders/${o.orderNo}`}
                  className="font-mono font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                >
                  {o.orderNo}
                </Link>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-1.5 truncate text-sm text-muted-foreground">
                <time dateTime={o.createdAt.toISOString()}>{formatLondonDate(o.createdAt)}</time>
                <span aria-hidden="true"> · </span>
                {itemsLabel(o)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              {o.trackingNumber && (
                // Above the card's stretched link so it stays independently clickable.
                <a
                  href={royalMailTrackingUrl(o.trackingNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-brand hover:bg-white/[0.05]"
                >
                  <Truck className="size-4" aria-hidden="true" />
                  Track parcel
                  <span className="sr-only">for order {o.orderNo} (opens in a new tab)</span>
                </a>
              )}
              <span className="ml-auto text-base font-semibold tabular-nums sm:ml-0">{formatGBP(o.totalPence)}</span>
              <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
