import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminNewOrderEmail } from "@/emails/admin-new-order";
import type { OrderEmailData } from "@/emails/layout";
import { orderReceivedEmail } from "@/emails/order-received";
import { orderShippedEmail, type ShippedEmailData } from "@/emails/order-shipped";
import { adminPaymentReportedEmail, type PaymentReportedEmailData } from "@/emails/admin-payment-reported";
import { sendMail } from "./mail";

type Template = "order-received" | "admin-new-order" | "order-shipped" | "admin-payment-reported";

/**
 * Send the customer confirmation and the shop notification for a COMMITTED order. Each send is
 * independent and logged as an order event; nothing here can throw back into the checkout.
 * Logs carry the order number and an error code only, never names, emails or addresses.
 */
export async function sendNewOrderEmails(data: OrderEmailData, notifyEmail: string | null) {
  const jobs: { template: Template; to: string | null; build: () => { subject: string; html: string; text: string }; replyTo?: string }[] = [
    { template: "order-received", to: data.email, build: () => orderReceivedEmail(data) },
    { template: "admin-new-order", to: notifyEmail, build: () => adminNewOrderEmail(data), replyTo: data.email },
  ];

  await Promise.all(
    jobs.map(async (job) => {
      try {
        if (!job.to) throw Object.assign(new Error("No recipient configured"), { code: "NO_RECIPIENT" });
        const { messageId } = await sendMail({ to: job.to, replyTo: job.replyTo, ...job.build() });
        await logEvent(data.id, "email_sent", { template: job.template, messageId });
      } catch (err) {
        const code = errorCode(err);
        console.error(`[order ${data.orderNo}] email ${job.template} failed: ${code}`);
        await logEvent(data.id, "email_failed", { template: job.template, error: code });
      }
    }),
  );
}

/**
 * Customer "shipped" email. Called only after a committed processing → shipped transition, which
 * happens at most once per order (the state machine has no way back). As a second guard it skips
 * when an `order-shipped` email is already logged as sent. Never throws.
 */
export async function sendOrderShippedEmail(data: ShippedEmailData) {
  const template: Template = "order-shipped";
  try {
    const [already] = await db
      .select({ id: schema.orderEvents.id })
      .from(schema.orderEvents)
      .where(
        and(
          eq(schema.orderEvents.orderId, data.id),
          eq(schema.orderEvents.type, "email_sent"),
          sql`JSON_UNQUOTE(JSON_EXTRACT(${schema.orderEvents.data}, '$.template')) = ${template}`,
        ),
      )
      .limit(1);
    if (already) return;
    const { messageId } = await sendMail({ to: data.email, ...orderShippedEmail(data) });
    await logEvent(data.id, "email_sent", { template, messageId });
  } catch (err) {
    const code = errorCode(err);
    console.error(`[order ${data.orderNo}] email ${template} failed: ${code}`);
    await logEvent(data.id, "email_failed", { template, error: code });
  }
}

/** Shop notification when a customer presses "I've sent payment" (ADR-021). Never throws. */
export async function sendPaymentReportedEmail(data: PaymentReportedEmailData, notifyEmail: string | null) {
  const template: Template = "admin-payment-reported";
  try {
    if (!notifyEmail) throw Object.assign(new Error("No recipient configured"), { code: "NO_RECIPIENT" });
    const { messageId } = await sendMail({ to: notifyEmail, ...adminPaymentReportedEmail(data) });
    await logEvent(data.id, "email_sent", { template, messageId });
  } catch (err) {
    const code = errorCode(err);
    console.error(`[order ${data.orderNo}] email ${template} failed: ${code}`);
    await logEvent(data.id, "email_failed", { template, error: code });
  }
}

async function logEvent(orderId: string, type: "email_sent" | "email_failed", data: Record<string, unknown>) {
  try {
    await db.insert(schema.orderEvents).values({ orderId, type, data, actor: "system" });
  } catch (err) {
    console.error(`[order-events] could not log ${type}: ${errorCode(err)}`);
  }
}

export function errorCode(err: unknown): string {
  const e = err as { code?: unknown; responseCode?: unknown; message?: unknown };
  if (typeof e?.code === "string") return e.code;
  if (typeof e?.responseCode === "number") return `SMTP_${e.responseCode}`;
  // Messages from nodemailer can echo addresses; keep only a short, generic prefix.
  return typeof e?.message === "string" ? e.message.split(/[:\n]/)[0].slice(0, 60) : "UNKNOWN";
}
