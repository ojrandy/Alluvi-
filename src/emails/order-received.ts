import { formatGBP } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import {
  addressLines,
  bankRows,
  borderColor,
  brandColor,
  emailShell,
  esc,
  h2,
  itemsTable,
  itemsText,
  p,
  RUO_LINE,
  type OrderEmailData,
} from "./layout";

/** Customer confirmation with bank-transfer instructions (order number is the payment reference). */
export function orderReceivedEmail(d: OrderEmailData) {
  const subject = `Order ${d.orderNo} received: payment instructions`;
  const trackUrl = `${siteUrl}/track-order`;

  const bank = d.bankDetails
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${borderColor};border-radius:8px;">
${[...bankRows(d.bankDetails), ["Amount", formatGBP(d.totalPence)], ["Payment reference", d.orderNo]]
  .map(
    ([k, v], i, all) => `<tr><td style="padding:10px 14px;font-size:14px;color:#71717a;${i < all.length - 1 ? `border-bottom:1px solid ${borderColor};` : ""}">${esc(k)}</td>
<td align="right" style="padding:10px 14px;font-size:14px;font-weight:600;${k === "Payment reference" ? `color:${brandColor};` : ""}${i < all.length - 1 ? `border-bottom:1px solid ${borderColor};` : ""}">${esc(v)}</td></tr>`,
  )
  .join("")}</table>
<div style="height:14px"></div>
${d.bankDetails.instructions ? p(esc(d.bankDetails.instructions)) : ""}`
    : p("Our team will email you the bank details for this order shortly.");

  const html = emailShell({
    preheader: `Thanks for your order. Pay by bank transfer using reference ${d.orderNo}.`,
    heading: `Thank you, ${d.firstName}. We've received your order.`,
    body: [
      p(`Your order number is <strong>${esc(d.orderNo)}</strong>. Please pay by bank transfer and use your order number as the payment reference, so we can match your payment.`),
      h2("Bank transfer details"),
      bank,
      p(`${d.bankDetails?.instructions ? "" : "We dispatch your order once your payment has cleared. "}You'll receive an email with tracking details when it ships.`),
      h2("Order summary"),
      itemsTable(d),
      h2("Delivery address"),
      p(addressLines(d).map(esc).join("<br>")),
      p(`Track your order any time at <a href="${esc(trackUrl)}" style="color:${brandColor};">${esc(trackUrl)}</a> with your order number and email.`),
    ].join("\n"),
  });

  const text = [
    `Thank you, ${d.firstName}. We've received your order.`,
    "",
    `Order number: ${d.orderNo}`,
    "Please pay by bank transfer and use your order number as the payment reference.",
    "",
    "BANK TRANSFER DETAILS",
    ...(d.bankDetails
      ? [...bankRows(d.bankDetails), ["Amount", formatGBP(d.totalPence)], ["Payment reference", d.orderNo]].map(([k, v]) => `${k}: ${v}`)
      : ["Our team will email you the bank details for this order shortly."]),
    ...(d.bankDetails?.instructions ? ["", d.bankDetails.instructions] : []),
    "",
    "We dispatch your order once your payment has cleared.",
    "",
    "ORDER SUMMARY",
    itemsText(d),
    "",
    "DELIVERY ADDRESS",
    ...addressLines(d),
    "",
    `Track your order: ${trackUrl}`,
    "",
    RUO_LINE,
  ].join("\n");

  return { subject, html, text };
}
