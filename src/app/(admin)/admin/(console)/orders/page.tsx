import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Inbox, Search, X } from "lucide-react";
import { OrdersTable, type OrdersTableRow } from "@/components/admin/orders/orders-table";
import { PageHeader, secondaryAction } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { formatLondonDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, paymentMethodLabel } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { ADMIN_ORDERS_PAGE_SIZE, adminOrdersQuery, parseAdminOrderFilters, type AdminOrderFilters } from "@/lib/validators/admin-orders";
import { requireAdmin } from "@/server/auth";
import { countOrdersByPaymentStage, countOrdersByStatus, listAdminOrders } from "@/server/queries/admin-orders";
import { PAYMENT_STAGE_LABEL, PAYMENT_STAGES } from "@/lib/payment-methods";

export const metadata: Metadata = { title: "Orders" };

/** /admin/orders (PRD FR-13): server-side search, status filter and pagination via searchParams. */
export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6">
      <Suspense fallback={<ListSkeleton />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin();
  const filters = parseAdminOrderFilters(await searchParams);
  const [list, counts, payCounts] = await Promise.all([listAdminOrders(filters), countOrdersByStatus(filters.q), countOrdersByPaymentStage(filters.q)]);

  const rows: OrdersTableRow[] = list.rows.map((r) => ({
    id: r.id,
    orderNo: r.orderNo,
    placedAt: formatLondonDateTime(r.createdAt),
    placedAtIso: r.createdAt.toISOString(),
    customerName: r.customerName,
    email: r.email,
    itemCount: r.itemCount,
    totalPence: r.totalPence,
    status: r.status,
    paymentMethod: paymentMethodLabel(r.paymentMethod),
  }));
  const exportHref = `/api/admin/orders/export${adminOrdersQuery({ q: filters.q, status: filters.status, pay: filters.pay })}`;
  const first = (list.page - 1) * ADMIN_ORDERS_PAGE_SIZE + 1;
  const last = first + rows.length - 1;

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${counts.all.toLocaleString("en-GB")} ${counts.all === 1 ? "order" : "orders"}${filters.q ? ` matching “${filters.q}”` : ""} · send payment details, then mark paid when the money arrives.`}
        actions={
          <a href={exportHref} download className={secondaryAction}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </a>
        }
      />

      <section aria-label="Orders" className="overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:px-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex min-w-0 flex-col gap-2.5">
            <StatusTabs filters={filters} counts={counts} />
            <PaymentTabs filters={filters} counts={payCounts} />
          </div>
          <SearchForm filters={filters} />
        </div>

        {rows.length === 0 ? (
          <EmptyState filtered={!!(filters.q || filters.status || filters.pay)} />
        ) : (
          <>
            <OrdersTable rows={rows} />
            <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
              <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                Showing <span className="font-semibold text-foreground">{first}–{last}</span> of {list.total.toLocaleString("en-GB")}
              </p>
              <div className="flex items-center gap-1.5">
                <PageLink filters={filters} page={list.page - 1} disabled={list.page <= 1} label="Previous page">
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </PageLink>
                <span className="px-2 text-xs text-muted-foreground tabular-nums">
                  Page <span className="font-semibold text-foreground">{list.page}</span> of {list.pageCount}
                </span>
                <PageLink filters={filters} page={list.page + 1} disabled={list.page >= list.pageCount} label="Next page">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </PageLink>
              </div>
            </nav>
          </>
        )}
      </section>
    </>
  );
}

function SearchForm({ filters }: { filters: AdminOrderFilters }) {
  return (
    // next/form: a GET form that navigates client-side; submitting resets to page 1.
    <Form action="/admin/orders" role="search" className="relative w-full sm:max-w-sm 2xl:max-w-xs">
      <label htmlFor="orders-q" className="sr-only">
        Search orders
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id="orders-q"
        name="q"
        type="search"
        defaultValue={filters.q}
        key={filters.q}
        maxLength={100}
        placeholder="Order no, email or name"
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-xl border border-input bg-card pr-10 pl-9 text-sm outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {filters.status && <input type="hidden" name="status" value={filters.status} />}
      {filters.pay && <input type="hidden" name="pay" value={filters.pay} />}
      {filters.q && (
        <Link
          href={`/admin/orders${adminOrdersQuery({ status: filters.status })}`}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </Form>
  );
}

function StatusTabs({ filters, counts }: { filters: AdminOrderFilters; counts: Awaited<ReturnType<typeof countOrdersByStatus>> }) {
  const tabs: { status?: OrderStatus; label: string; n: number }[] = [
    { label: "All", n: counts.all },
    ...ORDER_STATUSES.map((s) => ({ status: s, label: ORDER_STATUS_LABEL[s], n: counts[s] ?? 0 })),
  ];
  return (
    // Scrolls sideways on phones instead of wrapping into a tall block.
    <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 2xl:mx-0 2xl:px-0 [scrollbar-width:none]">
      <ul className="flex w-max gap-1 rounded-xl bg-muted p-1">
        {tabs.map((t) => {
          const active = !filters.pay && filters.status === t.status;
          return (
            <li key={t.status ?? "all"}>
              <Link
                href={`/admin/orders${adminOrdersQuery({ q: filters.q, status: t.status })}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-card text-foreground shadow-[0_1px_2px_rgb(16_24_40/0.1)]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                    active ? "bg-brand text-brand-foreground" : "bg-foreground/[0.06] text-muted-foreground",
                  )}
                >
                  {t.n.toLocaleString("en-GB")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** ADR-021 payment stages of orders awaiting payment. "Needs payment details" is the admin's to-do list. */
function PaymentTabs({ filters, counts }: { filters: AdminOrderFilters; counts: Awaited<ReturnType<typeof countOrdersByPaymentStage>> }) {
  return (
    <nav aria-label="Filter by payment stage" className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 2xl:mx-0 2xl:px-0 [scrollbar-width:none]">
      <ul className="flex w-max items-center gap-1.5">
        <li className="pr-1 text-xs font-medium text-muted-foreground" aria-hidden="true">
          Payment
        </li>
        {PAYMENT_STAGES.map((stage) => {
          const active = filters.pay === stage;
          const n = counts[stage];
          const tone = stage === "overdue" ? "bg-destructive/10 text-destructive" : stage === "awaiting_payment" ? "bg-foreground/[0.06]" : "bg-brand text-brand-foreground";
          return (
            <li key={stage}>
              <Link
                href={`/admin/orders${adminOrdersQuery(active ? { q: filters.q } : { q: filters.q, status: "pending_payment", pay: stage })}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {PAYMENT_STAGE_LABEL[stage]}
                <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums", active ? "bg-background/20" : n > 0 ? tone : "bg-foreground/[0.06]")}>
                  {n.toLocaleString("en-GB")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PageLink({ filters, page, disabled, label, children }: { filters: AdminOrderFilters; page: number; disabled: boolean; label: string; children: ReactNode }) {
  const cls = "grid size-8 place-items-center rounded-lg border border-border bg-card";
  if (disabled) {
    return (
      <span role="link" aria-disabled="true" aria-label={label} className={cn(cls, "opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={`/admin/orders${adminOrdersQuery({ ...filters, page })}`} aria-label={label} className={cn(cls, "outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring")}>
      {children}
    </Link>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold">{filtered ? "No orders match these filters" : "No orders yet"}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {filtered ? (
          <>
            Try another search, or{" "}
            <Link href="/admin/orders" className="font-medium text-brand-ink hover:underline">
              show all orders
            </Link>
            .
          </>
        ) : (
          "New orders appear here as soon as they are placed."
        )}
      </p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-14 w-full max-w-md rounded-lg" />
        <Skeleton className="hidden h-10 w-32 rounded-xl sm:block" />
      </div>
      <Skeleton className="h-[34rem] rounded-[1.25rem]" />
    </div>
  );
}
