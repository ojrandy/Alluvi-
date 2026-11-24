import { formatGBP } from "@/lib/money";
import { countryName } from "@/lib/constants";

/** Data every order email needs. Built once in placeOrder from the committed order. */
export type OrderEmailData = {
  id: string;
  orderNo: string;
  createdAt: Date;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postcode: string;
  country: string;
  shippingLabel: string;
  items: { name: string; quantity: number; unitPricePence: number; lineTotalPence: number }[];
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  customerNote: string | null;
  /** ADR-021: the method the customer chose. Payment DETAILS are never in these emails. */
  paymentMethod: string;
  paymentMethodLabel: string;
};

/** Order fields every email helper needs (no payment fields). */
export type OrderCore = Omit<OrderEmailData, "paymentMethod" | "paymentMethodLabel">;

export const RUO_LINE = "For laboratory research use only. Not for human consumption.";

export function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Inline styles only: many mail clients strip <style>. Light theme for readability in every client.
const C = { text: "#18181b", muted: "#71717a", border: "#e4e4e7", brand: "#ff8200", bg: "#f4f4f5" };

export function emailShell(opts: { preheader: string; heading: string; body: string }): string {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;border:1px solid ${C.border};">
<tr><td style="padding:24px 28px;border-bottom:3px solid ${C.brand};font-size:22px;font-weight:800;letter-spacing:1px;">ALLUVI</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${esc(opts.heading)}</h1>
${opts.body}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid ${C.border};font-size:12px;line-height:1.6;color:${C.muted};">${esc(RUO_LINE)}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${html}</p>`;
export const h2 = (text: string) => `<h2 style="margin:24px 0 10px;font-size:16px;">${esc(text)}</h2>`;

export function itemsTable(d: OrderCore): string {
  const rows = d.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:14px;">${esc(i.name)} <span style="color:${C.muted};">× ${i.quantity}</span></td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:14px;white-space:nowrap;">${esc(formatGBP(i.lineTotalPence))}</td></tr>`,
    )
    .join("");
  const total = (label: string, value: string, strong = false) => `<tr>
<td style="padding:6px 0;font-size:14px;${strong ? "font-weight:700;" : `color:${C.muted};`}">${esc(label)}</td>
<td align="right" style="padding:6px 0;font-size:14px;${strong ? "font-weight:700;" : ""}">${esc(value)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
${total("Subtotal", formatGBP(d.subtotalPence))}
${total(`Shipping (${d.shippingLabel})`, d.shippingPence === 0 ? "Free" : formatGBP(d.shippingPence))}
${total("Total", formatGBP(d.totalPence), true)}</table>`;
}

export function addressLines(d: OrderCore): string[] {
  return [
    `${d.firstName} ${d.lastName}`,
    d.addressLine1,
    d.addressLine2,
    d.city,
    d.postcode,
    countryName(d.country),
  ].filter((l): l is string => !!l);
}

export function itemsText(d: OrderCore): string {
  const lines = d.items.map((i) => `- ${i.name} x ${i.quantity}: ${formatGBP(i.lineTotalPence)}`);
  return [
    ...lines,
    `Subtotal: ${formatGBP(d.subtotalPence)}`,
    `Shipping (${d.shippingLabel}): ${d.shippingPence === 0 ? "Free" : formatGBP(d.shippingPence)}`,
    `Total: ${formatGBP(d.totalPence)}`,
  ].join("\n");
}

/** Bordered key/value table (e.g. order number, amount, method). Values are escaped. */
export function detailsTable(rows: [string, string][], highlight?: string): string {
  const cell = (i: number) => (i < rows.length - 1 ? `border-bottom:1px solid ${C.border};` : "");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:8px;margin:0 0 14px;">
${rows
  .map(
    ([k, v], i) => `<tr><td style="padding:10px 14px;font-size:14px;color:${C.muted};${cell(i)}">${esc(k)}</td>
<td align="right" style="padding:10px 14px;font-size:14px;font-weight:600;${k === highlight ? `color:${C.brand};` : ""}${cell(i)}">${esc(v)}</td></tr>`,
  )
  .join("")}</table>`;
}

/** Admin-written plain text kept exactly as typed (line breaks preserved), escaped, in a soft panel. */
export function preformatted(text: string): string {
  return `<div style="margin:0 0 14px;padding:16px 18px;background:#fafafa;border:1px solid ${C.border};border-radius:8px;font-size:15px;line-height:1.65;white-space:pre-wrap;word-break:break-word;">${esc(text)}</div>`;
}

/** Anti-phishing notice: tells customers how to verify payment details before paying. */
export function securityNote(trackUrl: string): string {
  return `<div style="margin:20px 0 14px;padding:14px 16px;border-left:3px solid ${C.brand};background:#fff7ed;font-size:13px;line-height:1.6;"><strong>Stay safe:</strong> we only send payment details from this email address, and we never change them by phone, text or social media. If anything looks different, check it against your order at <a href="${esc(trackUrl)}" style="color:${C.brand};">${esc(trackUrl)}</a> before paying.</div>`;
}

export const SECURITY_NOTE_TEXT =
  "Stay safe: we only send payment details from this email address, and we never change them by phone, text or social media. If anything looks different, check it against your order on our website before paying.";

export const mutedColor = C.muted;
export const borderColor = C.border;
export const brandColor = C.brand;
