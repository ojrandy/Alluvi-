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

/** Catalogue name for a stored key (src/lib/payment-methods.ts); unknown keys are humanised, not hidden. */
export { paymentMethodName as paymentMethodLabel } from "./payment-methods";
