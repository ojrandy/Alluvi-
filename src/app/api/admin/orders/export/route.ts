import type { NextRequest } from "next/server";
import { countryName } from "@/lib/constants";
import { londonDayKey } from "@/lib/london-day";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { parseAdminOrderFilters } from "@/lib/validators/admin-orders";
import { verifySession } from "@/server/auth";
import { EXPORT_MAX_ROWS, listOrdersForExport } from "@/server/queries/admin-orders";

/**
 * GET /api/admin/orders/export?q=&status= : CSV of the orders the list page shows for the same
 * filters (all pages). Admin only: proxy.ts answers 401 optimistically and this handler re-checks
 * the full session (password version included). Uses verifySession() rather than requireAdmin()
 * so an API caller gets a 401, not a redirect to the login page.
 *
 * Excel-safe: UTF-8 BOM (so "£" and accents survive), CRLF line ends, RFC 4180 quoting, and cells
 * that start with = + - @ (formula injection) are prefixed with an apostrophe.
 */
export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const filters = parseAdminOrderFilters(request.nextUrl.searchParams);
  const { orders, truncated } = await listOrdersForExport(filters);

  const header = [
    "Order no",
    "Placed (UK time)",
    "Status",
    "First name",
    "Last name",
    "Email",
    "Phone",
    "Address line 1",
    "Address line 2",
    "City",
    "Postcode",
    "Country",
    "Items",
    "Units",
    "Subtotal (GBP)",
    "Shipping (GBP)",
    "Total (GBP)",
    "Shipping method",
    "Payment method",
    "Tracking number",
    "Customer note",
    "Internal note",
    "Account",
  ];

  const lines = [header.map(cell).join(",")];
  for (const o of orders) {
    lines.push(
      [
        o.orderNo,
        londonDateTime(o.createdAt),
        ORDER_STATUS_LABEL[o.status],
        o.firstName,
        o.lastName,
        o.email,
        o.phone,
        o.addressLine1,
        o.addressLine2,
        o.city,
        o.postcode,
        countryName(o.country),
        o.items.map((i) => `${i.productName} x ${i.quantity}`).join("; "),
        o.items.reduce((n, i) => n + i.quantity, 0),
        pounds(o.subtotalPence),
        pounds(o.shippingPence),
        pounds(o.totalPence),
        o.shippingMethod,
        o.paymentMethod,
        o.trackingNumber,
        o.customerNote,
        o.internalNote,
        o.customerId ? "Yes" : "Guest",
      ]
        .map(cell)
        .join(","),
    );
  }
  if (truncated) lines.push(cell(`Export limited to the newest ${EXPORT_MAX_ROWS.toLocaleString("en-GB")} orders. Narrow the filters to export the rest.`));

  const body = "﻿" + lines.join("\r\n") + "\r\n";
  const suffix = [filters.status, filters.q ? "search" : null].filter(Boolean).join("-");
  const filename = `alluvi-orders-${londonDayKey(new Date())}${suffix ? `-${suffix}` : ""}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** One CSV field: neutralise spreadsheet formulas, then quote when needed (RFC 4180). */
function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  let s = value.replace(/\r\n?/g, "\n");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 1234 → "12.34" (plain number, no £, so Excel can sum the column). */
const pounds = (pence: number) => (pence / 100).toFixed(2);

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "2026-11-22 14:05" in UK time: unambiguous and parsed as a date by Excel in every locale. */
function londonDateTime(d: Date): string {
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
