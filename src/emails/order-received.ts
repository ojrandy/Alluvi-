import { formatGBP } from "@/lib/money";
import { PAYMENT_RESPONSE_PROMISE } from "@/lib/payment-methods";
import { siteUrl } from "@/lib/site";
import {
  addressLines,
  brandColor,
  detailsTable,
  emailShell,
  esc,
  h2,
  itemsTable,
  itemsText,
  p,
  RUO_LINE,
  SECURITY_NOTE_TEXT,
  securityNote,
  type OrderEmailData,
} from "./layout";

/**
 * Customer confirmation (ADR-021). Confirms the chosen payment method and sets expectations; the
 * payment details themselves follow in a separate email the admin sends for this order.
 */
export function orderReceivedEmail(d: OrderEmailData) {
  const subject = `Order ${d.orderNo} received`;
  const trackUrl = `${siteUrl}/track-order`;
  const rows: [string, string][] = [
    ["Order number", d.orderNo],
    ["Amount", formatGBP(d.totalPence)],
    ["Payment method", d.paymentMethodLabel],
  ];

  const html = emailShell({
    preheader: `Thanks for your order. We'll email payment details for ${d.paymentMethodLabel} ${PAYMENT_RESPONSE_PROMISE}.`,
    heading: `Thank you, ${d.firstName}. We've received your order.`,
    body: [
      detailsTable(rows, "Order number"),
      h2("What happens next"),
      p(
        `You chose to pay by <strong>${esc(d.paymentMethodLabel)}</strong>. Our team will email the payment details for this order to this address ${esc(PAYMENT_RESPONSE_PROMISE)}. You don't need to do anything until then.`,
      ),
      p("Once your payment is confirmed we prepare your order and email you tracking details when it ships."),
      securityNote(trackUrl),
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
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "WHAT HAPPENS NEXT",
    `You chose to pay by ${d.paymentMethodLabel}. Our team will email the payment details for this order to this address ${PAYMENT_RESPONSE_PROMISE}. You don't need to do anything until then.`,
    "Once your payment is confirmed we prepare your order and email you tracking details when it ships.",
    "",
    SECURITY_NOTE_TEXT,
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
