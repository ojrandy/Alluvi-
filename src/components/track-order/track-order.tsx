"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, ExternalLink, Loader2, Truck, XCircle } from "lucide-react";
import { FormField, TextInput } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import { formatGBP } from "@/lib/money";
import { cn } from "@/lib/utils";
import { trackOrder, type TrackedOrder } from "@/server/actions/track-order";

export function TrackOrder() {
  const prefill = useSearchParams().get("order")?.slice(0, 16) ?? "";
  const [state, action, pending] = useActionState(trackOrder, null);
  const resultRef = useRef<HTMLDivElement>(null);
  const error = state && !state.ok ? state.error : undefined;
  // React resets the form after the action; these defaults put the submitted values back.
  const values = state && !state.ok ? state.values : undefined;
  const order = state?.ok ? state.data : null;

  useEffect(() => {
    if (order) resultRef.current?.focus();
  }, [order]);

  return (
    <>
      <form action={action} noValidate className="mx-auto mt-10 max-w-xl rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="track-order-no" label="Order number">
            <TextInput
              id="track-order-no"
              name="orderNo"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ALV-7KQ2XM"
              maxLength={32}
              defaultValue={values?.orderNo ?? prefill}
              className="font-mono uppercase placeholder:normal-case"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "track-error" : undefined}
            />
          </FormField>
          <FormField id="track-email" label="Email address">
            <TextInput
              id="track-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={255}
              defaultValue={values?.email ?? ""}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "track-error" : undefined}
            />
          </FormField>
        </div>
        <div aria-live="polite">
          {error && (
            <p id="track-error" role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" variant="brand" size="xl" disabled={pending} className="mt-5 w-full">
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
          {pending ? "Looking up your order…" : "Track order"}
        </Button>
      </form>

      {order && (
        <div ref={resultRef} tabIndex={-1} className="mx-auto mt-10 max-w-4xl outline-none" aria-labelledby="tracked-title">
          <OrderResult order={order} />
        </div>
      )}
    </>
  );
}

export function OrderResult({ order }: { order: TrackedOrder }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="tracked-title" className="text-h3">
              Order <span className="font-mono">{order.orderNo}</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Placed {order.placedAt}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              order.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-brand-soft text-brand",
            )}
          >
            {order.statusLabel}
          </span>
        </div>

        <ol className="mt-7" aria-label="Order progress">
          {order.timeline.map((step, i) => {
            const last = i === order.timeline.length - 1;
            return (
              <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={step.state === "current" ? "step" : undefined}>
                {!last && (
                  <span
                    aria-hidden="true"
                    className={cn("absolute top-7 bottom-0 left-[0.6875rem] w-px", step.state === "done" ? "bg-success/50" : "bg-border")}
                  />
                )}
                <StepIcon state={step.state} />
                <div className="min-w-0 pt-0.5">
                  <p className={cn("font-medium", step.state === "upcoming" && "text-muted-foreground")}>{step.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {step.at ?? (step.state === "upcoming" ? "Pending" : step.state === "current" ? "In progress" : "Done")}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {order.tracking ? (
          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-border bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Truck className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="text-sm text-muted-foreground">Royal Mail tracking number</p>
                <p className="font-mono font-semibold break-all select-all">{order.tracking.number}</p>
              </div>
            </div>
            <Button asChild variant="glass" size="xl">
              <a href={order.tracking.url} target="_blank" rel="noopener noreferrer">
                Track with Royal Mail
                <ExternalLink data-icon="inline-end" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          </div>
        ) : (
          order.status !== "cancelled" && (
            <p className="mt-7 text-sm text-muted-foreground">
              Your tracking number will appear here and be emailed to you once your parcel is dispatched.
            </p>
          )
        )}
      </section>

      <aside className="space-y-6">
        <section aria-labelledby="tracked-items" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 id="tracked-items" className="text-h3">Items</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-3">
                <span>
                  {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
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
        <Button asChild variant="glass" size="xl" className="w-full">
          <Link href={`/order-confirmation/${order.orderNo}`}>
            {order.status === "pending_payment" ? "View payment details" : "View full order"}
          </Link>
        </Button>
      </aside>
    </div>
  );
}

function StepIcon({ state }: { state: TrackedOrder["timeline"][number]["state"] }) {
  const cls = "relative size-6 shrink-0";
  if (state === "done") return <CheckCircle2 className={cn(cls, "text-success")} aria-hidden="true" />;
  if (state === "cancelled") return <XCircle className={cn(cls, "text-destructive")} aria-hidden="true" />;
  if (state === "current")
    return (
      <span className={cn(cls, "grid place-items-center")} aria-hidden="true">
        <span className="absolute size-6 animate-ping rounded-full bg-brand/30 motion-reduce:hidden" />
        <span className="size-3 rounded-full bg-brand" />
      </span>
    );
  return <Circle className={cn(cls, "text-muted-foreground/50")} aria-hidden="true" />;
}
