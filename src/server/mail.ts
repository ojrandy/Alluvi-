import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP via the client's own mailbox (ADR-003). One transporter per process. Locally, point SMTP_*
 * at Mailpit (docs/DEPLOYMENT.md). Callers must treat sending as best-effort: the order is already
 * committed, so a failure is logged to order_events and never surfaces as a failed checkout.
 */
const globalForMail = globalThis as unknown as { __alluviMailer?: Transporter };

function createTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP_HOST is not set");
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host,
    port,
    secure: (process.env.SMTP_SECURE ?? String(port === 465)) === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
    // Fail fast: emails are sent after the response, but a hung socket would still hold a worker.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

function transporter(): Transporter {
  globalForMail.__alluviMailer ??= createTransporter();
  return globalForMail.__alluviMailer;
}

export type MailMessage = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendMail(msg: MailMessage): Promise<{ messageId: string }> {
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  if (!from) throw new Error("MAIL_FROM is not set");
  const info = await transporter().sendMail({ from, ...msg });
  return { messageId: info.messageId };
}
