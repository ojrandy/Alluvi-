import { formatLondonDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { addressLines, brandColor, emailShell, esc, h2, itemsTable, itemsText, p, type OrderEmailData } from "./layout";

/** Shop notification with the full order and a link to the dashboard. */
export function adminNewOrderEmail(d: OrderEmailData) {
  const adminUrl = `${siteUrl}/admin/orders/${d.id}`;
  const placed = formatLondonDateTime(d.createdAt);
  const subject = `New order ${d.orderNo}: ${formatGBP(d.totalPence)} (awaiting bank transfer)`;

  const contact = [
    `<strong>${esc(`${d.firstName} ${d.lastName}`)}</strong>`,
    `<a href="mailto:${esc(d.email)}" style="color:${brandColor};">${esc(d.email)}</a>`,
    d.phone ? esc(d.phone) : null,
  ]
    .filter(Boolean)
    .join("<br>");

  const html = emailShell({
    preheader: `${d.orderNo}: ${formatGBP(d.totalPence)} from ${d.firstName} ${d.lastName}`,
    heading: `New order ${d.orderNo}`,
    body: [
      p(`Placed ${esc(placed)} (UK time). Status: <strong>awaiting bank transfer</strong>. Mark it paid in the dashboard once the payment with reference <strong>${esc(d.orderNo)}</strong> arrives.`),
      p(`<a href="${esc(adminUrl)}" style="display:inline-block;background:${brandColor};color:#0a0a0a;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:999px;">Open order in dashboard</a>`),
      h2("Items"),
      itemsTable(d),
      h2("Customer"),
      p(contact),
      h2("Ship to"),
      p(addressLines(d).map(esc).join("<br>")),
      p(`Shipping method: ${esc(d.shippingLabel)}`),
      d.customerNote ? h2("Customer note") + p(esc(d.customerNote).replace(/\n/g, "<br>")) : "",
    ].join("\n"),
  });

  const text = [
    `New order ${d.orderNo}`,
    `Placed: ${placed} (UK time)`,
    "Status: awaiting bank transfer",
    `Dashboard: ${adminUrl}`,
    "",
    "ITEMS",
    itemsText(d),
    "",
    "CUSTOMER",
    `${d.firstName} ${d.lastName}`,
    d.email,
    d.phone ?? "",
    "",
    "SHIP TO",
    ...addressLines(d),
    `Shipping method: ${d.shippingLabel}`,
    ...(d.customerNote ? ["", "CUSTOMER NOTE", d.customerNote] : []),
  ].join("\n");

  return { subject, html, text };
}
