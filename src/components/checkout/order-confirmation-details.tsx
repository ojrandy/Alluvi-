import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { PaymentMethodIcon } from "@/components/payment/payment-method-icon";
import { Button } from "@/components/ui/button";
import { countryName } from "@/lib/constants";
import { formatLondonDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { payByDate, paymentMethodName, PAYMENT_RESPONSE_PROMISE } from "@/lib/payment-methods";
import type { OrderWithItems } from "@/server/queries/orders";
import { ReportPaymentForm } from "./report-payment-form";

type Props = { order: OrderWithItems; shippingLabel: string };

export function OrderConfirmationDetails({ order, shippingLabel }: Props) {
  const method = order.paymentMethodLabel ?? paymentMethodName(order.paymentMethod);
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        {order.status === "pending_payment" && <PaymentPanel order={order} method={method} />}

        <section aria-labelledby="next-title" className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <h2 id="next-title" className="text-h3">What happens next</h2>
          <ol className="mt-5 space-y-4">
            {[
              ["We email your payment details", `Our team sends the ${method} details for this order to ${order.email} ${PAYMENT_RESPONSE_PROMISE}.`],
              ["You pay and let us know", `Send ${formatGBP(order.totalPence)} using ${order.orderNo} as the reference, then press “I've sent payment”.`],
              ["We confirm and dispatch", "Once your payment arrives we prepare your order in cold-chain packaging and email you the tracking number."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft font-mono text-sm font-semibold text-brand">{i + 1}</span>
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button asChild variant="glass" size="xl" className="mt-6">
            <Link href="/track-order">Track your order</Link>
          </Button>
        </section>
      </div>

      <aside className="space-y-6">
        <section aria-labelledby="sum-title" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 id="sum-title" className="text-h3">Summary</h2>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold">{ORDER_STATUS_LABEL[order.status]}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Placed {formatLondonDateTime(order.createdAt)}</p>
          <ul className="mt-4 divide-y divide-border text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-3">
                <span>
                  {i.productName} <span className="text-muted-foreground">× {i.quantity}</span>
                </span>
                <span className="tabular-nums">{formatGBP(i.lineTotalPence)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatGBP(order.subtotalPence)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="tabular-nums">{order.shippingPence === 0 ? "Free" : formatGBP(order.shippingPence)}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatGBP(order.totalPence)}</dd></div>
          </dl>
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 text-sm">
            <PaymentMethodIcon method={order.paymentMethod} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Payment method</p>
              <p className="truncate font-medium">{method}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="ship-title" className="rounded-3xl border border-border bg-card p-5 text-sm sm:p-6">
          <h2 id="ship-title" className="font-semibold">Delivery</h2>
          <address className="mt-2 leading-relaxed text-muted-foreground not-italic">
            {order.firstName} {order.lastName}
            <br />
            {order.addressLine1}
            {order.addressLine2 && (<><br />{order.addressLine2}</>)}
            <br />
            {order.city} {order.postcode}
            <br />
            {countryName(order.country)}
          </address>
          <p className="mt-3 text-muted-foreground">{shippingLabel}</p>
        </section>
      </aside>
    </div>
  );
}

/**
 * Payment for an order awaiting payment (ADR-021). Before the admin sends details: what to expect.
 * After: the exact details we emailed (so the customer can verify an email against the website),
 * then "I've sent payment".
 */
function PaymentPanel({ order, method }: { order: OrderWithItems; method: string }) {
  const sentAt = order.paymentInstructionsSentAt;
  const reportedAt = order.customerReportedPaidAt;

  return (
    <section aria-labelledby="pay-title" className="rounded-3xl border border-brand/40 bg-card p-5 shadow-glow sm:p-7">
      <div className="flex items-center gap-3">
        <PaymentMethodIcon method={order.paymentMethod} className="size-9" />
        <div className="min-w-0">
          <h2 id="pay-title" className="text-h3">
            {sentAt ? `Pay with ${method}` : "Payment details on their way"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatGBP(order.totalPence)} · reference <span className="font-mono font-semibold text-brand select-all">{order.orderNo}</span>
          </p>
        </div>
      </div>

      {!sentAt ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-border bg-white/[0.02] p-4 text-sm">
          <Clock className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Nothing to pay yet.</span> Our team will email the {method} payment details to{" "}
            <span className="text-foreground">{order.email}</span> {PAYMENT_RESPONSE_PROMISE}. They will also appear here, so you can check them
            before paying.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-border bg-white/[0.02]">
            <p className="border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
              Sent to your email {formatLondonDateTime(sentAt)} · please pay by {formatLondonDateTime(payByDate(sentAt))}
            </p>
            <p className="px-4 py-4 text-[15px] leading-relaxed break-words whitespace-pre-wrap select-text">{order.paymentInstructions}</p>
          </div>
          <div className="mt-5">
            {reportedAt ? (
              <p role="status" className="flex items-start gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                <span>
                  You told us you paid on {formatLondonDateTime(reportedAt)}
                  {order.customerPaymentRef ? ` (reference ${order.customerPaymentRef})` : ""}. We&apos;ll confirm as soon as it arrives.
                </span>
              </p>
            ) : (
              <ReportPaymentForm orderNo={order.orderNo} />
            )}
          </div>
        </>
      )}

      <p className="mt-5 flex gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden="true" />
        We only send payment details by email from our store address, and they always match this page. We never change them by phone, text or
        social media.
      </p>
    </section>
  );
}
