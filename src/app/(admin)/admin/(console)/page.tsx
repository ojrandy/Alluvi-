import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, cache, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, ArrowUpRight, Banknote, CheckCircle2, Download, Package, Plus, Receipt, ShoppingBag, Wallet, type LucideIcon } from "lucide-react";
import { RevenueOverview } from "@/components/admin/revenue-overview";
import { AdminAvatar, Delta, Panel, PageHeader, pillAction, primaryAction, secondaryAction } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { formatGBP, formatLondonDateTime } from "@/lib/format";
import { formatDayKey } from "@/lib/london-day";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/auth";
import { getLatestOrders, getLowStockProducts, getOverviewKpis, getRevenueSeries, getTopProducts } from "@/server/queries/admin";
import { countOrdersByPaymentStage, countOrdersByStatus } from "@/server/queries/admin-orders";

export const metadata: Metadata = { title: "Dashboard" };

/** Two sections read the KPIs (cards + attention card): one query per request. */
const kpis = cache(async () => {
  await requireAdmin();
  return getOverviewKpis();
});

/**
 * Admin dashboard (PRD FR-12). Every section streams on its own behind a same-size skeleton and
 * authorises before it reads (requireAdmin() is memoised per request: one JWT check).
 */
export default function AdminDashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={
          <Suspense fallback={<span className="inline-block h-4 w-44 animate-pulse rounded bg-foreground/[0.06] align-middle" />}>
            <Today />
          </Suspense>
        }
        actions={
          <>
            <a href="/api/admin/orders/export" download className={secondaryAction}>
              <Download className="size-4" aria-hidden="true" />
              Export orders
            </a>
            <Link href="/admin/products/new" className={primaryAction}>
              <Plus className="size-4" aria-hidden="true" />
              New product
            </Link>
          </>
        }
      />

      <Suspense fallback={<KpiSkeleton />}>
        <Kpis />
      </Suspense>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Sales overview" description="Payment received, by order date (UK time)" className="xl:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <SalesOverview />
          </Suspense>
        </Panel>
        <div className="flex min-w-0 flex-col gap-6">
          <Suspense fallback={<Skeleton className="h-[11.5rem] rounded-[1.25rem]" />}>
            <AttentionCard />
          </Suspense>
          <Panel title="Orders by status" description="All time" className="flex-1">
            <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
              <StatusBreakdown />
            </Suspense>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Latest orders"
          description="Most recent first"
          className="xl:col-span-2"
          flush
          action={
            <Link href="/admin/orders" className={pillAction}>
              View all <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        >
          <Suspense fallback={<RowsSkeleton rows={7} />}>
            <LatestOrders />
          </Suspense>
        </Panel>
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Top products" description="By revenue · last 30 days" flush>
            <Suspense fallback={<RowsSkeleton rows={5} />}>
              <TopProducts />
            </Suspense>
          </Panel>
          <Panel
            title="Low stock"
            description="Visible products with 5 or fewer left"
            flush
            action={
              <Link href="/admin/products" className={pillAction}>
                Manage
              </Link>
            }
          >
            <Suspense fallback={<RowsSkeleton rows={3} />}>
              <LowStock />
            </Suspense>
          </Panel>
        </div>
      </div>
    </div>
  );
}

async function Today() {
  await requireAdmin(); // request-time: the date must be "now", never a build-time value
  const today = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  return <>{today} · Here&apos;s how the store is doing.</>;
}

// ---------- KPI cards ----------

async function Kpis() {
  const k = await kpis();
  const aov = k.paidOrders30d > 0 ? Math.round(k.revenue30dPence / k.paidOrders30d) : 0;
  return (
    <section aria-label="Key figures" className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
      <Kpi
        tone="violet"
        icon={Wallet}
        label="Revenue · 30 days"
        value={formatGBP(k.revenue30dPence)}
        delta={<Delta current={k.revenue30dPence} previous={k.revenuePrev30dPence} />}
        hint="vs previous 30 days"
      />
      <Kpi
        tone="sky"
        icon={Banknote}
        label="Revenue · 7 days"
        value={formatGBP(k.revenue7dPence)}
        delta={<Delta current={k.revenue7dPence} previous={k.revenuePrev7dPence} />}
        hint="vs previous 7 days"
      />
      <Kpi
        tone="mint"
        icon={ShoppingBag}
        label="Orders · 7 days"
        value={k.orders7d.toLocaleString("en-GB")}
        delta={<Delta current={k.orders7d} previous={k.ordersPrev7d} />}
        hint={`${k.ordersToday.toLocaleString("en-GB")} placed today`}
      />
      <Kpi
        tone="peach"
        icon={Receipt}
        label="Average order · 30 days"
        value={aov ? formatGBP(aov) : "—"}
        hint={`${k.paidOrders30d.toLocaleString("en-GB")} paid ${k.paidOrders30d === 1 ? "order" : "orders"}`}
      />
    </section>
  );
}

const KPI_TONE = {
  violet: { card: "bg-kpi-violet", icon: "text-kpi-violet-ink" },
  sky: { card: "bg-kpi-sky", icon: "text-kpi-sky-ink" },
  mint: { card: "bg-kpi-mint", icon: "text-kpi-mint-ink" },
  peach: { card: "bg-kpi-peach", icon: "text-kpi-peach-ink" },
} as const;

function Kpi({
  tone,
  icon: Icon,
  label,
  value,
  delta,
  hint,
}: {
  tone: keyof typeof KPI_TONE;
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: ReactNode;
  hint: string;
}) {
  const t = KPI_TONE[tone];
  return (
    <div className={cn("flex min-w-0 flex-col justify-between gap-5 rounded-[1.25rem] p-5", t.card)}>
      <div className="flex items-center gap-2.5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-card/80", t.icon)}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <p className="truncate text-[13px] font-semibold text-foreground/80">{label}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-foreground tabular-nums">{value}</p>
        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-foreground/65">
          {delta}
          <span className="truncate">{hint}</span>
        </p>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[9.25rem] rounded-[1.25rem]" />
      ))}
    </div>
  );
}

// ---------- sales chart ----------

async function SalesOverview() {
  await requireAdmin();
  // 180 days: the visible 90 plus the 90 before, so every range can show a like-for-like change.
  const all = (await getRevenueSeries(180)).map((p) => ({ ...p, label: formatDayKey(p.day) }));
  return <RevenueOverview series={all.slice(90)} previous={all.slice(0, 90)} />;
}

function ChartSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-12 w-40 rounded-lg" />
        <Skeleton className="h-9 w-56 rounded-xl" />
      </div>
      <Skeleton className="mt-5 h-60 rounded-xl sm:h-80" />
    </div>
  );
}

// ---------- needs attention ----------

/** ADR-021: what needs the admin now. Payment details to send first, then payments to check. */
async function AttentionCard() {
  const [k, stages] = await Promise.all([kpis(), requireAdmin().then(() => countOrdersByPaymentStage(""))]);
  const toSend = stages.needs_details;
  const toCheck = stages.customer_reported;
  const clear = toSend === 0 && toCheck === 0 && stages.overdue === 0;
  const href = toSend > 0 ? "needs_details" : toCheck > 0 ? "customer_reported" : "overdue";
  return (
    <section aria-labelledby="attention-title" className="relative overflow-hidden rounded-[1.25rem] bg-ink p-5 text-ink-foreground sm:p-6">
      {/* decorative rings, echoing the brand mark */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-52 rounded-full border-[18px] border-brand/20" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-12 size-28 rounded-full bg-brand/20 blur-2xl" />
      <div className="relative">
        <p id="attention-title" className="flex items-center gap-2 text-sm font-semibold text-ink-foreground/80">
          {clear ? <CheckCircle2 className="size-4 text-brand" aria-hidden="true" /> : <AlertTriangle className="size-4 text-brand" aria-hidden="true" />}
          Payment details to send
        </p>
        <p className="mt-3 text-[2rem] leading-none font-semibold tracking-[-0.02em] tabular-nums">
          {toSend.toLocaleString("en-GB")}
          <span className="ml-2 text-sm font-medium tracking-normal text-ink-foreground/60">{toSend === 1 ? "order" : "orders"}</span>
        </p>
        <p className="mt-1.5 text-sm text-ink-foreground/70">
          {clear
            ? k.pendingCount
              ? `All details sent · ${formatGBP(k.pendingPence)} awaiting payment`
              : "Nothing waiting. Nice."
            : [
                toCheck ? `${toCheck} reported paid` : null,
                stages.overdue ? `${stages.overdue} overdue` : null,
                `${formatGBP(k.pendingPence)} awaiting payment`,
              ]
                .filter(Boolean)
                .join(" · ")}
        </p>
        {!clear && (
          <Link
            href={`/admin/orders?status=pending_payment&pay=${href}`}
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm font-semibold text-brand-foreground transition-transform outline-none hover:bg-[color-mix(in_oklch,var(--brand),white_10%)] focus-visible:ring-3 focus-visible:ring-brand/50 active:scale-[0.98]"
          >
            {toSend > 0 ? "Send payment details" : "Review payments"} <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}

// ---------- status breakdown ----------

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "var(--chart-1)",
  paid: "var(--chart-2)",
  processing: "var(--chart-4)",
  shipped: "var(--teal)",
  completed: "var(--chart-3)",
  cancelled: "var(--chart-5)",
};

async function StatusBreakdown() {
  await requireAdmin();
  const counts = await countOrdersByStatus("");
  const total = counts.all;
  const rows = ORDER_STATUSES.map((s) => ({ status: s, n: counts[s] ?? 0 }));
  if (total === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>;

  // Pure SVG donut (server-rendered, no chart library): one stroked circle per status.
  const R = 42;
  const C = 2 * Math.PI * R;
  const nonZero = rows.filter((r) => r.n > 0);
  const segments = nonZero.map((r, i) => ({
    ...r,
    len: (r.n / total) * C,
    start: (nonZero.slice(0, i).reduce((sum, x) => sum + x.n, 0) / total) * C,
  }));
  // A 1.2-unit gap between segments, but never on a single full ring.
  const gap = segments.length > 1 ? 1.2 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="11" />
          {segments.map((s) => (
            <circle
              key={s.status}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={STATUS_COLOR[s.status]}
              strokeWidth="11"
              strokeDasharray={`${Math.max(s.len - gap, 0.01)} ${C}`}
              strokeDashoffset={-s.start}
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xl leading-none font-semibold tabular-nums">{total.toLocaleString("en-GB")}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">orders</p>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-0.5 text-[13px]">
        {rows.map((r) => (
          <li key={r.status}>
            <Link
              href={`/admin/orders?status=${r.status}`}
              className="-mx-1.5 flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: STATUS_COLOR[r.status] }} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{ORDER_STATUS_LABEL[r.status]}</span>
              <span className="font-semibold tabular-nums">{r.n.toLocaleString("en-GB")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- latest orders ----------

async function LatestOrders() {
  await requireAdmin();
  const orders = await getLatestOrders(7);
  if (orders.length === 0) {
    return <EmptyRows icon={ShoppingBag} text="No orders yet. New orders appear here as soon as they are placed." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Latest orders</caption>
        <thead>
          <tr className="border-y border-border bg-surface text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2.5 pl-5 font-medium sm:pl-6">Customer</th>
            <th scope="col" className="hidden py-2.5 pr-4 font-medium md:table-cell">Order</th>
            <th scope="col" className="hidden py-2.5 pr-4 font-medium 2xl:table-cell">Placed</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-medium">Total</th>
            <th scope="col" className="hidden py-2.5 pr-6 font-medium sm:table-cell">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => (
            <tr key={o.id} className="group relative transition-colors hover:bg-surface">
              <td className="py-3 pl-5 sm:pl-6">
                <div className="flex min-w-0 items-center gap-3">
                  <AdminAvatar name={o.customerName || o.email} />
                  <div className="min-w-0">
                    {/* Stretched link: the whole row is clickable, but it is still one focusable link. */}
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="block max-w-[14rem] truncate font-medium text-foreground outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                    >
                      {o.customerName || o.email}
                    </Link>
                    <p className="max-w-[14rem] truncate text-xs text-muted-foreground md:hidden">{o.orderNo}</p>
                    <p className="hidden max-w-[14rem] truncate text-xs text-muted-foreground md:block">{o.email}</p>
                  </div>
                </div>
              </td>
              <td className="hidden py-3 pr-4 font-medium whitespace-nowrap text-muted-foreground tabular-nums md:table-cell">{o.orderNo}</td>
              <td className="hidden py-3 pr-4 whitespace-nowrap text-muted-foreground 2xl:table-cell">
                <time dateTime={o.createdAt.toISOString()}>{formatLondonDateTime(o.createdAt)}</time>
              </td>
              <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                {formatGBP(o.totalPence)}
                <OrderStatusBadge status={o.status} className="mt-1 h-5 px-2 text-[11px] sm:hidden" />
              </td>
              <td className="hidden py-3 pr-6 sm:table-cell">
                <OrderStatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- side lists ----------

async function TopProducts() {
  await requireAdmin();
  const top = await getTopProducts(30, 5);
  if (top.length === 0) return <EmptyRows icon={Package} text="No paid orders in the last 30 days." />;
  const max = top[0].revenuePence || 1;
  return (
    <ol className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
      {top.map((p, i) => (
        <li key={p.slug}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="flex min-w-0 items-baseline gap-2">
              <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="truncate font-medium">{p.name}</span>
            </p>
            <p className="shrink-0 font-semibold tabular-nums">{formatGBP(p.revenuePence)}</p>
          </div>
          <div className="mt-1.5 flex items-center gap-3 pl-6">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max((p.revenuePence / max) * 100, 4)}%` }} />
            </div>
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{p.units.toLocaleString("en-GB")} sold</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

async function LowStock() {
  await requireAdmin();
  const low = await getLowStockProducts(5, 5);
  if (low.length === 0) return <EmptyRows icon={CheckCircle2} text="Everything visible is well stocked." />;
  return (
    <ul className="divide-y divide-border border-t border-border">
      {low.map((p) => (
        <li key={p.id}>
          <Link
            href={`/admin/products/${p.id}`}
            className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors outline-none hover:bg-surface focus-visible:bg-surface sm:px-6"
          >
            <span className="min-w-0 truncate font-medium">{p.name}</span>
            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold tabular-nums",
                p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
              )}
            >
              {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EmptyRows({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 pt-2 pb-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2.5 px-5 pb-5 sm:px-6" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg" />
      ))}
    </div>
  );
}
