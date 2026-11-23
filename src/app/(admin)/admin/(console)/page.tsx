import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ArrowRight, CalendarDays, Clock, PoundSterling, ShoppingBag, TrendingUp, type LucideIcon } from "lucide-react";
import { RevenueChartLazy } from "@/components/admin/revenue-chart-lazy";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatGBP, formatLondonDateTime } from "@/lib/format";
import { formatDayKey } from "@/lib/london-day";
import { requireAdmin } from "@/server/auth";
import { getLatestOrders, getOverviewKpis, getRevenueSeries } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Overview" };

/**
 * Admin overview (PRD FR-12). Each section streams on its own; every section authorises before it
 * reads (requireAdmin() is memoised per request, so this costs one JWT check).
 */
export default function AdminOverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:gap-8">
      <Suspense fallback={<KpiSkeleton />}>
        <Kpis />
      </Suspense>
      <Panel title="Revenue" description="Last 30 days · payment received, by order date (UK time)">
        <Suspense fallback={<Skeleton className="h-56 rounded-xl sm:h-64" />}>
          <RevenuePanel />
        </Suspense>
      </Panel>
      <Panel
        title="Latest orders"
        description="The 10 most recent orders"
        action={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            All orders <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
        flush
      >
        <Suspense fallback={<TableSkeleton />}>
          <LatestOrders />
        </Suspense>
      </Panel>
    </div>
  );
}

// ---------- KPIs ----------

async function Kpis() {
  await requireAdmin();
  const k = await getOverviewKpis();
  return (
    <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      <Kpi icon={CalendarDays} label="Orders today" value={k.ordersToday.toLocaleString("en-GB")} />
      <Kpi icon={ShoppingBag} label="Orders · 7 days" value={k.orders7d.toLocaleString("en-GB")} />
      <Kpi icon={TrendingUp} label="Revenue · 7 days" value={formatGBP(k.revenue7dPence)} />
      <Kpi icon={PoundSterling} label="Revenue · 30 days" value={formatGBP(k.revenue30dPence)} />
      <Kpi
        icon={Clock}
        label="Pending payments"
        value={k.pendingCount.toLocaleString("en-GB")}
        hint={k.pendingCount > 0 ? `${formatGBP(k.pendingPence)} awaiting` : "Nothing outstanding"}
        tone={k.pendingCount > 0 ? "warning" : undefined}
        className="col-span-2 lg:col-span-1"
      />
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "warning";
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <span
          className={`hidden size-7 shrink-0 place-items-center rounded-lg sm:grid ${tone === "warning" ? "bg-warning/15 text-warning" : "bg-brand-soft text-brand"}`}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <div>
        <p className="truncate text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.65rem]">{value}</p>
        {hint && <p className={`mt-1 truncate text-xs ${tone === "warning" ? "text-warning" : "text-muted-foreground"}`}>{hint}</p>}
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className={`h-[7.25rem] rounded-2xl sm:h-[8.1rem] ${i === 4 ? "col-span-2 lg:col-span-1" : ""}`} />
      ))}
    </div>
  );
}

// ---------- Revenue chart ----------

async function RevenuePanel() {
  await requireAdmin();
  const series = await getRevenueSeries(30);
  const total = series.reduce((sum, p) => sum + p.revenuePence, 0);
  const orders = series.reduce((sum, p) => sum + p.orders, 0);
  const data = series.map((p) => ({ ...p, label: formatDayKey(p.day) }));
  return (
    <figure>
      <p className="text-sm text-muted-foreground">
        <span className="text-lg font-semibold text-foreground tabular-nums">{formatGBP(total)}</span> from {orders}{" "}
        {orders === 1 ? "paid order" : "paid orders"}
      </p>
      <div className="mt-4 h-56 sm:h-64" role="img" aria-label={`Daily revenue chart, ${data[0].label} to ${data.at(-1)!.label}. Total ${formatGBP(total)}.`}>
        <RevenueChartLazy data={data} />
      </div>
    </figure>
  );
}

// ---------- Latest orders ----------

async function LatestOrders() {
  await requireAdmin();
  const orders = await getLatestOrders(10);
  if (orders.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-muted-foreground">No orders yet. New orders appear here as soon as they are placed.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4 sm:pl-5">Order</TableHead>
          <TableHead className="hidden sm:table-cell">Customer</TableHead>
          <TableHead className="hidden md:table-cell">Placed</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Items</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Total</TableHead>
          <TableHead className="hidden pr-5 sm:table-cell">Status</TableHead>
          {/* Phones: total and status share one right-hand column so the table fits without scrolling. */}
          <TableHead className="pr-4 text-right sm:hidden">Total · status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id} className="relative">
            <TableCell className="max-w-[11rem] pl-4 sm:max-w-none sm:pl-5">
              {/* The stretched link makes the whole row clickable while staying a single, focusable link. */}
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-medium tabular-nums outline-none after:absolute after:inset-0 hover:text-brand focus-visible:text-brand focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
              >
                {o.orderNo}
              </Link>
              <p className="truncate text-xs text-muted-foreground sm:hidden">{o.customerName}</p>
            </TableCell>
            <TableCell className="hidden max-w-[14rem] sm:table-cell">
              <p className="truncate">{o.customerName}</p>
              <p className="truncate text-xs text-muted-foreground">{o.email}</p>
            </TableCell>
            <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
              <time dateTime={o.createdAt.toISOString()}>{formatLondonDateTime(o.createdAt)}</time>
            </TableCell>
            <TableCell className="hidden text-right tabular-nums sm:table-cell">{o.itemCount}</TableCell>
            <TableCell className="hidden text-right font-medium tabular-nums sm:table-cell">{formatGBP(o.totalPence)}</TableCell>
            <TableCell className="hidden pr-5 sm:table-cell">
              <OrderStatusBadge status={o.status} />
            </TableCell>
            <TableCell className="pr-4 text-right sm:hidden">
              <p className="font-medium tabular-nums">{formatGBP(o.totalPence)}</p>
              <OrderStatusBadge status={o.status} className="mt-1" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-5" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg" />
      ))}
    </div>
  );
}

// ---------- layout ----------

function Panel({
  title,
  description,
  action,
  flush,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}) {
  const headingId = `panel-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section className="rounded-2xl border border-border bg-card" aria-labelledby={headingId}>
      <div className="flex items-start justify-between gap-4 p-5 pb-0">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className={flush ? "pt-4" : "p-5"}>{children}</div>
    </section>
  );
}
