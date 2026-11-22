import Link from "next/link";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BankDetails } from "@/db/schema";
import { countryName } from "@/lib/constants";
import { formatLondonDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { OrderWithItems } from "@/server/queries/orders";

type Props = { order: OrderWithItems; bank: BankDetails | null; shippingLabel: string };

export function OrderConfirmationDetails({ order, bank, shippingLabel }: Props) {
  const awaitingPayment = order.status === "pending_payment";
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        {awaitingPayment && (
          <section aria-labelledby="pay-title" className="rounded-3xl border border-brand/40 bg-card p-5 shadow-glow sm:p-7">
            <div className="flex items-center gap-3">
              <Landmark className="size-5 text-brand" aria-hidden="true" />
              <h2 id="pay-title" className="text-h3">Pay by bank transfer</h2>
            </div>
            {bank ? (
              <dl className="mt-5 divide-y divide-border rounded-2xl border border-border text-sm">
                {[
                  ["Account name", bank.accountName],
                  ["Bank", bank.bankName],
                  ["Sort code", bank.sortCode],
                  ["Account number", bank.accountNumber],
                  ...(bank.iban ? [["IBAN", bank.iban]] : []),
                  ["Amount", formatGBP(order.totalPence)],
                  ["Payment reference", order.orderNo],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className={k === "Payment reference" ? "font-mono font-semibold text-brand select-all" : "font-semibold tabular-nums select-all"}>{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Our team will email you the bank details for this order shortly. Please use{" "}
                <strong className="font-mono text-foreground">{order.orderNo}</strong> as your payment reference.
              </p>
            )}
            {bank?.instructions && <p className="mt-4 text-sm text-muted-foreground">{bank.instructions}</p>}
          </section>
        )}

        <section aria-labelledby="next-title" className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <h2 id="next-title" className="text-h3">What happens next</h2>
          <ol className="mt-5 space-y-4">
            {[
              ["Make your bank transfer", `Send ${formatGBP(order.totalPence)} using ${order.orderNo} as the reference.`],
              ["We confirm your payment", "Once the transfer clears, we prepare your order in cold-chain packaging."],
              ["Dispatched with tracking", "You'll receive an email with your tracking number when your parcel leaves us."],
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
