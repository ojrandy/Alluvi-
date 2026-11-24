"use client";

import Link from "next/link";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderStatus } from "@/db/schema";
import { formatGBP } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AdminAvatar } from "../ui";

/** One row, pre-formatted on the server (dates in UK time) so server and client render the same text. */
export type OrdersTableRow = {
  id: string;
  orderNo: string;
  placedAt: string;
  placedAtIso: string;
  customerName: string;
  email: string;
  itemCount: number;
  totalPence: number;
  status: OrderStatus;
  paymentMethod: string;
};

/**
 * TanStack Table v9 used as a headless renderer only: pagination, search and the status filter
 * happen on the server (searchParams), so no client row models are registered.
 */
const features = tableFeatures({
  columnMeta: {} as { className?: string },
});
const col = createColumnHelper<typeof features, OrdersTableRow>();

// Phones: order no + customer on the left, total + status stacked on the right (no sideways scroll).
const SM = "hidden sm:table-cell";

const columns = col.columns([
  col.accessor("orderNo", {
    header: "Order",
    meta: { className: "pl-4 sm:pl-5 max-w-[11rem] sm:max-w-none" },
    cell: ({ row }) => (
      <>
        {/* Stretched link: the whole row is clickable, but it is still one focusable link. */}
        <Link
          href={`/admin/orders/${row.original.id}`}
          className="font-semibold tabular-nums outline-none after:absolute after:inset-0 hover:text-brand-ink focus-visible:text-brand-ink focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
        >
          {row.original.orderNo}
        </Link>
        <p className="truncate text-xs text-muted-foreground sm:hidden">{row.original.customerName}</p>
        <p className="text-xs text-muted-foreground md:hidden">
          <time dateTime={row.original.placedAtIso}>{row.original.placedAt}</time>
        </p>
      </>
    ),
  }),
  col.accessor("placedAt", {
    header: "Date",
    meta: { className: "hidden whitespace-nowrap text-muted-foreground md:table-cell" },
    cell: ({ row }) => <time dateTime={row.original.placedAtIso}>{row.original.placedAt}</time>,
  }),
  col.accessor("customerName", {
    header: "Customer",
    meta: { className: `${SM} max-w-[18rem]` },
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <AdminAvatar name={row.original.customerName || row.original.email} />
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.customerName}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      </div>
    ),
  }),
  col.accessor("itemCount", {
    header: "Items",
    meta: { className: `${SM} text-right tabular-nums` },
  }),
  col.accessor("totalPence", {
    header: "Total",
    meta: { className: `${SM} text-right font-medium tabular-nums` },
    cell: ({ getValue }) => formatGBP(getValue()),
  }),
  col.accessor("status", {
    header: "Status",
    meta: { className: SM },
    cell: ({ getValue }) => <OrderStatusBadge status={getValue()} />,
  }),
  col.accessor("paymentMethod", {
    header: "Payment",
    meta: { className: "hidden pr-5 whitespace-nowrap text-muted-foreground lg:table-cell" },
  }),
  col.display({
    id: "mobileSummary",
    header: "Total · status",
    meta: { className: "pr-4 text-right sm:hidden" },
    cell: ({ row }) => (
      <>
        <p className="font-medium tabular-nums">{formatGBP(row.original.totalPence)}</p>
        <OrderStatusBadge status={row.original.status} className="mt-1" />
      </>
    ),
  }),
]);

export function OrdersTable({ rows }: { rows: OrdersTableRow[] }) {
  const table = useTable({ features, columns, data: rows, getRowId: (r) => r.id });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="bg-surface hover:bg-surface">
            {group.headers.map((header) => (
              <TableHead key={header.id} className={cn(header.column.columnDef.meta?.className, "h-10 text-xs font-medium text-muted-foreground")}>
                <table.FlexRender header={header} />
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="relative hover:bg-surface">
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} className={cn("py-3", cell.column.columnDef.meta?.className)}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
