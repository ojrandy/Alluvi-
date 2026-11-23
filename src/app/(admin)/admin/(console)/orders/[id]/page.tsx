import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Mail, Phone, UserRound } from "lucide-react";
import { OrderNoteForm, OrderStatusForm, OrderTrackingForm } from "@/components/admin/orders/order-forms";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderEvent, OrderStatus } from "@/db/schema";
import { countryName } from "@/lib/constants";
import { formatGBP, formatLondonDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, paymentMethodLabel, royalMailTrackingUrl } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/auth";
import { getAdminOrder, type AdminOrderDetail } from "@/server/queries/admin-orders";
import { getStoreSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Order" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** /admin/orders/[id] (PRD FR-13): fulfilment view. Mutations live in src/server/actions/orders.ts. */
export default function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Link
        href="/admin/orders"
        className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All orders
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <OrderDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [order, settings] = await Promise.all([getAdminOrder(id.toLowerCase()), getStoreSettings()]);
  if (!order) notFound();

  const units = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="mt-3 flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight tabular-nums">{order.orderNo}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed <time dateTime={order.createdAt.toISOString()}>{formatLondonDateTime(order.createdAt)}</time> · {units}{" "}
            {units === 1 ? "item" : "items"} · {paymentMethodLabel(order.paymentMethod)}
          </p>
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-right">{formatGBP(order.totalPence)}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Side column first in the DOM on phones: status is the thing the admin came to change. */}
        <div className="flex flex-col gap-6 lg:order-2">
          <Card title="Status">
            <OrderStatusForm orderId={order.id} status={order.status} trackingNumber={order.trackingNumber} />
          </Card>
          <Card
            title="Tracking"
            action={
              order.trackingNumber ? (
                <a
                  href={royalMailTrackingUrl(order.trackingNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  Royal Mail <ExternalLink className="size-3" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null
            }
          >
            <OrderTrackingForm orderId={order.id} trackingNumber={order.trackingNumber} disabled={order.status === "cancelled"} />
          </Card>
          <CustomerCard order={order} />
          <Card title="Internal note" description="Admins only. Never shown to the customer.">
            <OrderNoteForm orderId={order.id} internalNote={order.internalNote} />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:order-1">
          <ItemsCard order={order} shippingLabel={settings.shippingOptions.find((s) => s.key === order.shippingMethod)?.label ?? order.shippingMethod} />
          {order.customerNote && (
            <Card title="Customer note">
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{order.customerNote}</p>
            </Card>
          )}
          <Card title="Activity" description="Everything that happened to this order (UK time).">
            <Timeline events={order.events} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- items ----------

function ItemsCard({ order, shippingLabel }: { order: AdminOrderDetail; shippingLabel: string }) {
  return (
    <Card title="Items" flush>
      <ul className="divide-y divide-border">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
            <div className="min-w-0">
              {i.productId ? (
                <Link href={`/product/${i.productSlug}`} target="_blank" className="font-medium hover:text-brand">
                  {i.productName}
                </Link>
              ) : (
                <p className="font-medium">{i.productName}</p>
              )}
              <p className="text-xs text-muted-foreground tabular-nums">
                {i.quantity} × {formatGBP(i.unitPricePence)}
                {!i.productId && " · product since deleted"}
              </p>
            </div>
            <p className="shrink-0 font-medium tabular-nums">{formatGBP(i.lineTotalPence)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
        <Row label="Subtotal" value={formatGBP(order.subtotalPence)} />
        <Row label={`Shipping · ${shippingLabel}`} value={order.shippingPence === 0 ? "Free" : formatGBP(order.shippingPence)} />
        <Row label="Total" value={formatGBP(order.totalPence)} strong />
      </dl>
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", strong ? "pt-1.5 text-base font-semibold" : "text-muted-foreground")}>
      <dt className="min-w-0 truncate">{label}</dt>
      <dd className={cn("tabular-nums", !strong && "text-foreground")}>{value}</dd>
    </div>
  );
}

// ---------- customer ----------

function CustomerCard({ order }: { order: AdminOrderDetail }) {
  const address = [order.addressLine1, order.addressLine2, order.city, order.postcode, countryName(order.country)].filter(Boolean);
  return (
    <Card title="Customer">
      <div className="space-y-4 text-sm">
        <div className="space-y-1.5">
          <p className="font-medium">
            {order.firstName} {order.lastName}
          </p>
          <a href={`mailto:${order.email}`} className="flex items-center gap-2 break-all text-muted-foreground hover:text-foreground">
            <Mail className="size-3.5 shrink-0" aria-hidden="true" />
            {order.email}
          </a>
          {order.phone && (
            <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              {order.phone}
            </a>
          )}
          <p className="flex items-center gap-2 text-muted-foreground">
            <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
            {order.customerId ? "Has an account" : "Guest checkout"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Delivery address</p>
          <address className="mt-1.5 leading-relaxed not-italic">
            {address.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </address>
        </div>
      </div>
    </Card>
  );
}

// ---------- activity ----------

const TEMPLATE_LABEL: Record<string, string> = {
  "order-received": "order confirmation to customer",
  "admin-new-order": "new-order notification to shop",
  "order-shipped": "shipped email to customer",
};

const statusLabel = (v: unknown) => (typeof v === "string" && v in ORDER_STATUS_LABEL ? ORDER_STATUS_LABEL[v as OrderStatus] : String(v));

function describe(e: OrderEvent): { title: string; detail?: string; tone?: "error" | "brand" } {
  const d = (e.data ?? {}) as Record<string, unknown>;
  switch (e.type) {
    case "created":
      return { title: "Order placed", detail: typeof d.totalPence === "number" ? formatGBP(d.totalPence) : undefined, tone: "brand" };
    case "status_changed": {
      const restocked = Array.isArray(d.restocked) ? d.restocked.length : 0;
      const extras = [
        typeof d.trackingNumber === "string" ? `Tracking ${d.trackingNumber}` : null,
        d.to === "cancelled" ? (restocked ? `${restocked} ${restocked === 1 ? "product" : "products"} restocked` : "Nothing to restock") : null,
      ].filter(Boolean);
      return { title: `${statusLabel(d.from)} → ${statusLabel(d.to)}`, detail: extras.join(" · ") || undefined, tone: "brand" };
    }
    case "email_sent":
      return { title: `Sent ${TEMPLATE_LABEL[String(d.template)] ?? "email"}` };
    case "email_failed":
      return { title: `Failed to send ${TEMPLATE_LABEL[String(d.template)] ?? "email"}`, detail: typeof d.error === "string" ? d.error : undefined, tone: "error" };
    case "note":
      if (d.field === "tracking_number") return { title: d.to ? `Tracking number set to ${String(d.to)}` : "Tracking number removed" };
      if (d.field === "internal_note") return { title: d.cleared ? "Internal note cleared" : "Internal note updated" };
      return { title: "Note" };
    case "customer_linked":
      return { title: "Linked to a customer account", detail: d.via === "verified_email" ? "After the customer verified this email" : undefined };
    default:
      return { title: String(e.type) };
  }
}

function Timeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No activity recorded.</p>;
  return (
    <ol className="relative space-y-5 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-px before:bg-border">
      {[...events].reverse().map((e) => {
        const { title, detail, tone } = describe(e);
        return (
          <li key={e.id} className="relative pl-6">
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-card",
                tone === "error" ? "bg-destructive" : tone === "brand" ? "bg-brand" : "bg-muted-foreground/50",
              )}
            />
            <p className={cn("text-sm font-medium", tone === "error" && "text-destructive")}>{title}</p>
            {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
            <p className="mt-0.5 text-xs text-muted-foreground/80">
              <time dateTime={e.createdAt.toISOString()}>{formatLondonDateTime(e.createdAt)}</time>
              {" · "}
              {e.actor === "system" ? "System" : e.actor}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- layout ----------

function Card({ title, description, action, flush, children }: { title: string; description?: string; action?: ReactNode; flush?: boolean; children: ReactNode }) {
  const headingId = `card-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h3 id={headingId} className="text-base font-semibold tracking-tight">
            {title}
          </h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={flush ? "pt-3" : "p-5 pt-4"}>{children}</div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-3 flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-14 w-full max-w-md rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-96 rounded-2xl lg:order-2" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
