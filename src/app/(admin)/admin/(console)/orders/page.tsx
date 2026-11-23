import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react";
import { OrdersTable, type OrdersTableRow } from "@/components/admin/orders/orders-table";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { formatLondonDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, paymentMethodLabel } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { ADMIN_ORDERS_PAGE_SIZE, adminOrdersQuery, parseAdminOrderFilters, type AdminOrderFilters } from "@/lib/validators/admin-orders";
import { requireAdmin } from "@/server/auth";
import { countOrdersByStatus, listAdminOrders } from "@/server/queries/admin-orders";

export const metadata: Metadata = { title: "Orders" };

/** /admin/orders (PRD FR-13): server-side search, status filter and pagination via searchParams. */
export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Suspense fallback={<ListSkeleton />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin();
  const filters = parseAdminOrderFilters(await searchParams);
  const [list, counts] = await Promise.all([listAdminOrders(filters), countOrdersByStatus(filters.q)]);

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
  const exportHref = `/api/admin/orders/export${adminOrdersQuery({ q: filters.q, status: filters.status })}`;
  const first = (list.page - 1) * ADMIN_ORDERS_PAGE_SIZE + 1;
  const last = first + rows.length - 1;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchForm filters={filters} />
        <a
          href={exportHref}
          download
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </a>
      </div>

      <StatusChips filters={filters} counts={counts} />

      <section aria-label="Orders" className="rounded-2xl border border-border bg-card">
        {rows.length === 0 ? (
          <EmptyState filtered={!!(filters.q || filters.status)} />
        ) : (
          <>
            <OrdersTable rows={rows} />
            <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
              <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {first}–{last} of {list.total.toLocaleString("en-GB")}
              </p>
              <div className="flex items-center gap-1">
                <PageLink filters={filters} page={list.page - 1} disabled={list.page <= 1} label="Previous page">
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </PageLink>
                <span className="px-2 text-xs text-muted-foreground tabular-nums">
                  Page {list.page} of {list.pageCount}
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
    <Form action="/admin/orders" role="search" className="relative w-full sm:max-w-sm">
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
        className="h-10 w-full rounded-lg border border-input bg-white/[0.03] pr-10 pl-9 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      {filters.status && <input type="hidden" name="status" value={filters.status} />}
      {filters.q && (
        <Link
          href={`/admin/orders${adminOrdersQuery({ status: filters.status })}`}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </Form>
  );
}

function StatusChips({ filters, counts }: { filters: AdminOrderFilters; counts: Awaited<ReturnType<typeof countOrdersByStatus>> }) {
  const chips: { status?: OrderStatus; label: string; n: number }[] = [
    { label: "All", n: counts.all },
    ...ORDER_STATUSES.map((s) => ({ status: s, label: ORDER_STATUS_LABEL[s], n: counts[s] ?? 0 })),
  ];
  return (
    // Scrolls sideways on phones instead of wrapping into a tall block.
    <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]">
      <ul className="flex w-max gap-1.5">
        {chips.map((c) => {
          const active = filters.status === c.status;
          return (
            <li key={c.status ?? "all"}>
              <Link
                href={`/admin/orders${adminOrdersQuery({ q: filters.q, status: c.status })}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-brand/40 bg-brand-soft text-brand" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {c.label}
                <span className={cn("tabular-nums", active ? "text-brand" : "text-muted-foreground")}>{c.n.toLocaleString("en-GB")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PageLink({ filters, page, disabled, label, children }: { filters: AdminOrderFilters; page: number; disabled: boolean; label: string; children: ReactNode }) {
  const cls = "grid size-8 place-items-center rounded-md border border-border";
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
    <div className="px-5 py-14 text-center">
      <p className="text-sm font-medium">{filtered ? "No orders match these filters" : "No orders yet"}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {filtered ? (
          <>
            Try another search, or{" "}
            <Link href="/admin/orders" className="text-brand hover:underline">
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
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-10 w-full rounded-lg sm:max-w-sm" />
        <Skeleton className="hidden h-10 w-32 rounded-lg sm:block" />
      </div>
      <Skeleton className="h-8 w-full max-w-2xl rounded-full" />
      <Skeleton className="h-[32rem] rounded-2xl" />
    </div>
  );
}
