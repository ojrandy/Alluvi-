import { royalMailTrackingUrl } from "@/lib/order-status";
import { siteUrl } from "@/lib/site";
import { addressLines, brandColor, emailShell, esc, h2, itemsTable, itemsText, p, RUO_LINE, type OrderEmailData } from "./layout";

export type ShippedEmailData = Omit<OrderEmailData, "bankDetails"> & { trackingNumber: string | null };

/** Customer "your order has shipped" email, sent once when an admin moves the order to `shipped`. */
export function orderShippedEmail(d: ShippedEmailData) {
  const subject = `Order ${d.orderNo} has shipped`;
  const trackUrl = `${siteUrl}/track-order`;
  const carrierUrl = d.trackingNumber ? royalMailTrackingUrl(d.trackingNumber) : null;

  const tracking = d.trackingNumber
    ? p(
        `Your tracking number is <strong>${esc(d.trackingNumber)}</strong>. ` +
          `<a href="${esc(carrierUrl)}" style="color:${brandColor};">Track it with Royal Mail</a>.`,
      )
    : p(`You can follow your order at <a href="${esc(trackUrl)}" style="color:${brandColor};">${esc(trackUrl)}</a> with your order number and email.`);

  const html = emailShell({
    preheader: `Good news: order ${d.orderNo} is on its way.`,
    heading: `Your order is on its way, ${d.firstName}.`,
    body: [
      p(`Order <strong>${esc(d.orderNo)}</strong> has been dispatched.`),
      tracking,
      h2("Order summary"),
      itemsTable({ ...d, bankDetails: null }),
      h2("Delivering to"),
      p(addressLines({ ...d, bankDetails: null }).map(esc).join("<br>")),
    ].join("\n"),
  });

  const text = [
    `Your order is on its way, ${d.firstName}.`,
    "",
    `Order ${d.orderNo} has been dispatched.`,
    ...(d.trackingNumber ? [`Tracking number: ${d.trackingNumber}`, `Track with Royal Mail: ${carrierUrl}`] : [`Track your order: ${trackUrl}`]),
    "",
    "ORDER SUMMARY",
    itemsText({ ...d, bankDetails: null }),
    "",
    "DELIVERING TO",
    ...addressLines({ ...d, bankDetails: null }),
    "",
    RUO_LINE,
  ].join("\n");

  return { subject, html, text };
}
