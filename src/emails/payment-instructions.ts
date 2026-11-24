import { formatLondonDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { brandColor, detailsTable, emailShell, esc, h2, p, preformatted, RUO_LINE, SECURITY_NOTE_TEXT, securityNote } from "./layout";

export type PaymentInstructionsEmailData = {
  orderNo: string;
  firstName: string;
  totalPence: number;
  paymentMethodLabel: string;
  /** The admin's message, already filled with the order values. Plain text. */
  instructions: string;
  payBy: Date;
  /** true = the "friendly reminder" variant of the same email. */
  reminder?: boolean;
};

/**
 * Payment details for ONE order, sent by the admin from /admin/orders/[id] (ADR-021). The admin's
 * text is escaped and shown verbatim; the amount and reference rows come from the saved order.
 */
export function paymentInstructionsEmail(d: PaymentInstructionsEmailData) {
  const trackUrl = `${siteUrl}/track-order`;
  const orderUrl = `${siteUrl}/order-confirmation/${encodeURIComponent(d.orderNo)}`;
  const payBy = formatLondonDateTime(d.payBy);
  const subject = d.reminder ? `Reminder: payment for order ${d.orderNo}` : `Payment details for order ${d.orderNo}`;
  const intro = d.reminder
    ? `A friendly reminder that we haven't received payment for order ${d.orderNo} yet. If you've already paid, thank you, and please ignore this email or let us know your payment reference.`
    : `Here are the ${d.paymentMethodLabel} payment details for your order ${d.orderNo}.`;
  const rows: [string, string][] = [
    ["Order number", d.orderNo],
    ["Amount", formatGBP(d.totalPence)],
    ["Payment method", d.paymentMethodLabel],
    ["Please pay by", `${payBy} (UK time)`],
  ];

  const html = emailShell({
    preheader: d.reminder ? `Payment for ${d.orderNo} is still outstanding.` : `How to pay ${formatGBP(d.totalPence)} for order ${d.orderNo}.`,
    heading: d.reminder ? `Payment reminder for order ${d.orderNo}` : `Payment details for order ${d.orderNo}`,
    body: [
      p(esc(intro)),
      detailsTable(rows, "Order number"),
      h2("How to pay"),
      preformatted(d.instructions),
      p(
        `After paying, let us know by pressing <strong>“I've sent payment”</strong> on <a href="${esc(orderUrl)}" style="color:${brandColor};">your order page</a> or by replying to this email. We dispatch as soon as the payment is confirmed.`,
      ),
      securityNote(trackUrl),
    ].join("\n"),
  });

  const text = [
    d.reminder ? `Payment reminder for order ${d.orderNo}` : `Payment details for order ${d.orderNo}`,
    "",
    intro,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "HOW TO PAY",
    d.instructions,
    "",
    `After paying, let us know on your order page (${orderUrl}) or by replying to this email.`,
    "",
    SECURITY_NOTE_TEXT,
    "",
    RUO_LINE,
  ].join("\n");

  return { subject, html, text };
}
