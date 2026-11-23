import type { OrderStatus } from "@/db/schema";

/** Customer-facing status labels (confirmation page, track order, emails). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Payment received",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** The happy path, in order (DATA_MODEL state machine). `cancelled` can branch off any step before shipping. */
export const ORDER_STATUS_PATH = ["pending_payment", "paid", "processing", "shipped", "completed"] as const satisfies readonly OrderStatus[];

/** Royal Mail public tracking page for a tracking number. */
export const royalMailTrackingUrl = (trackingNumber: string) =>
  `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(trackingNumber.replace(/\s+/g, ""))}`;

const PAYMENT_METHOD_LABEL: Record<string, string> = { bank_transfer: "Bank transfer" };

/** "bank_transfer" → "Bank transfer"; unknown keys are humanised rather than hidden. */
export const paymentMethodLabel = (key: string) =>
  PAYMENT_METHOD_LABEL[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
