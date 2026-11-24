"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import type { Order } from "@/db/schema";
import { paymentInstructionsEmail } from "@/emails/payment-instructions";
import { firstFieldErrors, type ActionResult } from "@/lib/action-result";
import { formatLondonDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { fillTemplate, payByDate, paymentMethodName, PAYMENT_REMINDER_AFTER_HOURS, UNFILLED_MARKER } from "@/lib/payment-methods";
import { requireAdmin } from "../auth";
import { getCurrentCustomer } from "../customer-auth";
import { dbErrorCode } from "../db-errors";
import { sendMail } from "../mail";
import { canViewOrder } from "../order-access";
import { errorCode, sendPaymentReportedEmail } from "../order-emails";
import { ORDER_NO_PATTERN } from "../order-number";
import { customerOwnsOrder } from "../queries/customer-orders";
import { rateLimit } from "../rate-limit";
import { getIpHash } from "../request";
import { getStoreSettings } from "../settings";

/**
 * Payment details per order (ADR-021).
 *
 * Admin: send details → (optional) reminder → mark paid via the normal status form.
 * Customer: "I've sent payment" (+ optional reference) → shop is notified.
 *
 * The email is sent FIRST and the order is updated only when the mail server accepted it, so
 * "details sent" on the dashboard always means the customer really was emailed.
 */

export type PaymentActionResult = ActionResult<{ message: string }>;

const methodLabel = (o: Pick<Order, "paymentMethod" | "paymentMethodLabel">) => o.paymentMethodLabel ?? paymentMethodName(o.paymentMethod);

async function logEmailFailure(orderId: string, template: string, err: unknown, actor: string) {
  try {
    await db.insert(schema.orderEvents).values({ orderId, type: "email_failed", data: { template, error: errorCode(err) }, actor });
  } catch {
    // Logging must never mask the original failure.
  }
}

// ---------- admin: send payment details ----------

const sendSchema = z.object({
  orderId: z.uuid("Unknown order"),
  message: z
    .string()
    .transform((v) => v.replace(/\r\n/g, "\n").trim())
    .pipe(
      z
        .string()
        .min(20, "Write the payment details for the customer")
        .max(5000, "Keep the message under 5,000 characters")
        .refine((v) => !UNFILLED_MARKER.test(v), "Replace every [[ … ]] placeholder with the real details first"),
    ),
});

export async function sendPaymentInstructions(_prev: PaymentActionResult | null, formData: FormData): Promise<PaymentActionResult> {
  const parsed = sendSchema.safeParse({ orderId: formData.get("orderId"), message: formData.get("message") ?? "" });
  if (!parsed.success) return { ok: false, error: "Please check the message.", fieldErrors: firstFieldErrors(parsed.error.issues) };
  const admin = await requireAdmin();
  const { orderId } = parsed.data;

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "This order no longer exists." };
  if (order.status !== "pending_payment") return { ok: false, error: "Payment details can only be sent while the order is awaiting payment." };

  const sentAt = new Date();
  const payBy = payByDate(sentAt);
  const label = methodLabel(order);
  // Tokens left in the text (e.g. pasted from a template) are filled here from the saved order.
  const instructions = fillTemplate(parsed.data.message, {
    first_name: order.firstName,
    order_no: order.orderNo,
    amount: formatGBP(order.totalPence),
    method: label,
    pay_by: formatLondonDateTime(payBy),
  });
  if (/\{\{\s*[a-z_]+\s*\}\}/.test(instructions)) {
    return { ok: false, error: "Please check the message.", fieldErrors: { message: "Remove or fix the unknown {{ … }} placeholder" } };
  }

  let messageId: string;
  try {
    ({ messageId } = await sendMail({
      to: order.email,
      ...paymentInstructionsEmail({ orderNo: order.orderNo, firstName: order.firstName, totalPence: order.totalPence, paymentMethodLabel: label, instructions, payBy }),
    }));
  } catch (err) {
    console.error(`[order ${order.orderNo}] payment-instructions email failed: ${errorCode(err)}`);
    await logEmailFailure(order.id, "payment-instructions", err, admin.email);
    refresh();
    return { ok: false, error: "The email could not be sent, so nothing was saved. Check the mail settings and try again." };
  }

  const resend = !!order.paymentInstructionsSentAt;
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.orders)
        .set({ paymentInstructions: instructions, paymentInstructionsSentAt: sentAt, paymentReminderSentAt: null })
        .where(eq(schema.orders.id, order.id));
      await tx.insert(schema.orderEvents).values({
        orderId: order.id,
        type: "payment_instructions_sent",
        data: { method: order.paymentMethod, resend, messageId },
        actor: admin.email,
      });
    });
  } catch (err) {
    // The customer HAS the email; only our record failed. Say so plainly rather than "nothing sent".
    console.error(`[order ${order.orderNo}] payment-instructions record failed: ${dbErrorCode(err)}`);
    return { ok: false, error: "The email was sent, but the order could not be updated. Reload the page before sending again." };
  }
  refresh();
  return { ok: true, data: { message: resend ? "Updated payment details sent to the customer." : "Payment details sent to the customer." } };
}

// ---------- admin: reminder ----------

const reminderSchema = z.object({ orderId: z.uuid("Unknown order") });

export async function sendPaymentReminder(_prev: PaymentActionResult | null, formData: FormData): Promise<PaymentActionResult> {
  const parsed = reminderSchema.safeParse({ orderId: formData.get("orderId") });
  if (!parsed.success) return { ok: false, error: "Unknown order." };
  const admin = await requireAdmin();

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, parsed.data.orderId)).limit(1);
  if (!order) return { ok: false, error: "This order no longer exists." };
  if (order.status !== "pending_payment") return { ok: false, error: "This order is no longer awaiting payment." };
  if (!order.paymentInstructions || !order.paymentInstructionsSentAt) return { ok: false, error: "Send the payment details first." };

  // The original deadline, or two days from now if that has already passed.
  const minimum = new Date(Date.now() + PAYMENT_REMINDER_AFTER_HOURS * 3_600_000);
  const original = payByDate(order.paymentInstructionsSentAt);
  const payBy = original > minimum ? original : minimum;

  let messageId: string;
  try {
    ({ messageId } = await sendMail({
      to: order.email,
      ...paymentInstructionsEmail({
        orderNo: order.orderNo,
        firstName: order.firstName,
        totalPence: order.totalPence,
        paymentMethodLabel: methodLabel(order),
        instructions: order.paymentInstructions,
        payBy,
        reminder: true,
      }),
    }));
  } catch (err) {
    console.error(`[order ${order.orderNo}] payment-reminder email failed: ${errorCode(err)}`);
    await logEmailFailure(order.id, "payment-reminder", err, admin.email);
    refresh();
    return { ok: false, error: "The reminder could not be sent. Check the mail settings and try again." };
  }

  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.update(schema.orders).set({ paymentReminderSentAt: now }).where(eq(schema.orders.id, order.id));
      await tx.insert(schema.orderEvents).values({ orderId: order.id, type: "payment_reminder_sent", data: { messageId }, actor: admin.email });
    });
  } catch (err) {
    console.error(`[order ${order.orderNo}] payment-reminder record failed: ${dbErrorCode(err)}`);
  }
  refresh();
  return { ok: true, data: { message: "Reminder sent to the customer." } };
}

// ---------- customer: "I've sent payment" ----------

const reportSchema = z.object({
  orderNo: z.string().trim().toUpperCase().regex(ORDER_NO_PATTERN, "Unknown order"),
  reference: z
    .string()
    .trim()
    .max(120, "Keep the reference under 120 characters")
    .transform((v) => v || null),
});

export async function reportPayment(_prev: PaymentActionResult | null, formData: FormData): Promise<PaymentActionResult> {
  const parsed = reportSchema.safeParse({ orderNo: formData.get("orderNo") ?? "", reference: formData.get("reference") ?? "" });
  if (!parsed.success) return { ok: false, error: "Please check the reference.", fieldErrors: firstFieldErrors(parsed.error.issues) };
  const { orderNo, reference } = parsed.data;

  // Same access rule as the order page: placed/unlocked in this browser, or the signed-in owner.
  const customer = await getCurrentCustomer();
  const allowed = (await canViewOrder(orderNo)) || (customer ? await customerOwnsOrder(customer.id, orderNo) : false);
  if (!allowed) return { ok: false, error: "Please open this order from your confirmation email or Track order first." };

  const limit = await rateLimit(`report-payment:${await getIpHash()}`, 5, 10 * 60);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNo, orderNo)).limit(1);
  if (!order) return { ok: false, error: "We couldn't find this order." };
  if (order.status !== "pending_payment") return { ok: true, data: { message: "Thanks, this order is no longer awaiting payment." } };
  if (!order.paymentInstructionsSentAt) {
    return { ok: false, error: "We haven't sent the payment details for this order yet. Please wait for our email before paying." };
  }

  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.orders)
        .set({ customerReportedPaidAt: now, customerPaymentRef: reference })
        .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pending_payment")));
      await tx.insert(schema.orderEvents).values({
        orderId: order.id,
        type: "customer_reported_paid",
        data: { reference, repeat: !!order.customerReportedPaidAt },
        actor: "customer",
      });
    });
  } catch (err) {
    console.error(`[order ${order.orderNo}] report-payment failed: ${dbErrorCode(err)}`);
    return { ok: false, error: "Something went wrong. Please try again, or reply to our payment email." };
  }

  after(async () => {
    const settings = await getStoreSettings().catch(() => null);
    await sendPaymentReportedEmail(
      {
        id: order.id,
        orderNo: order.orderNo,
        customerName: `${order.firstName} ${order.lastName}`.trim(),
        totalPence: order.totalPence,
        paymentMethodLabel: methodLabel(order),
        reference,
      },
      settings?.notifyEmail ?? process.env.ORDER_NOTIFY_EMAIL ?? null,
    );
  });
  refresh();
  return { ok: true, data: { message: "Thank you. We'll confirm as soon as your payment arrives." } };
}
