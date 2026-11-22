import "server-only";
import { db, schema } from "@/db";
import { adminNewOrderEmail } from "@/emails/admin-new-order";
import type { OrderEmailData } from "@/emails/layout";
import { orderReceivedEmail } from "@/emails/order-received";
import { sendMail } from "./mail";

type Template = "order-received" | "admin-new-order";

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

async function logEvent(orderId: string, type: "email_sent" | "email_failed", data: Record<string, unknown>) {
  try {
    await db.insert(schema.orderEvents).values({ orderId, type, data, actor: "system" });
  } catch (err) {
    console.error(`[order-events] could not log ${type}: ${errorCode(err)}`);
  }
}

function errorCode(err: unknown): string {
  const e = err as { code?: unknown; responseCode?: unknown; message?: unknown };
  if (typeof e?.code === "string") return e.code;
  if (typeof e?.responseCode === "number") return `SMTP_${e.responseCode}`;
  // Messages from nodemailer can echo addresses; keep only a short, generic prefix.
  return typeof e?.message === "string" ? e.message.split(/[:\n]/)[0].slice(0, 60) : "UNKNOWN";
}
