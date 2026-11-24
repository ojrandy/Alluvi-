import { formatGBP } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { brandColor, detailsTable, emailShell, esc, p } from "./layout";

export type PaymentReportedEmailData = {
  id: string;
  orderNo: string;
  customerName: string;
  totalPence: number;
  paymentMethodLabel: string;
  reference: string | null;
};

/** Shop notification: the customer pressed "I've sent payment" (ADR-021). Not proof of payment. */
export function adminPaymentReportedEmail(d: PaymentReportedEmailData) {
  const adminUrl = `${siteUrl}/admin/orders/${d.id}`;
  const subject = `Payment reported for ${d.orderNo}: ${formatGBP(d.totalPence)} via ${d.paymentMethodLabel}`;
  const rows: [string, string][] = [
    ["Order", d.orderNo],
    ["Customer", d.customerName],
    ["Amount", formatGBP(d.totalPence)],
    ["Method", d.paymentMethodLabel],
    ["Their reference", d.reference ?? "Not given"],
  ];
  const html = emailShell({
    preheader: `${d.customerName} says they have paid for ${d.orderNo}.`,
    heading: `Payment reported for ${d.orderNo}`,
    body: [
      p(`${esc(d.customerName)} says they have sent payment. Check that the money has arrived before marking the order paid.`),
      detailsTable(rows, "Order"),
      p(`<a href="${esc(adminUrl)}" style="display:inline-block;background:${brandColor};color:#0a0a0a;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:999px;">Open order</a>`),
    ].join("\n"),
  });
  const text = [
    `Payment reported for ${d.orderNo}`,
    "",
    `${d.customerName} says they have sent payment. Check that the money has arrived before marking the order paid.`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Open order: ${adminUrl}`,
  ].join("\n");
  return { subject, html, text };
}
