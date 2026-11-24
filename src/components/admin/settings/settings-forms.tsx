"use client";

import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, inputClass, textareaClass } from "@/components/admin/products/fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentMethodIcon } from "@/components/payment/payment-method-icon";
import { getPaymentMethodDef, PAYMENT_DUE_DAYS, PAYMENT_GROUP_LABEL, UNFILLED_MARKER, type PaymentMethodGroup } from "@/lib/payment-methods";
import type { PaymentMethodRowInput, ShippingRowInput } from "@/lib/validators/admin-settings";
import {
  saveFreeShippingPromo,
  saveNotifyEmail,
  savePaymentMethods,
  saveShippingOptions,
  type SettingsResult,
} from "@/server/actions/settings";

type PromoState = { enabled: boolean; label: string; startDay: string; endDay: string };

type Props = {
  paymentMethods: PaymentMethodRowInput[];
  shipping: ShippingRowInput[];
  promo: PromoState;
  notifyEmail: string;
  envNotifyFallback: boolean;
};

/** One save state per card: pending flag, server field errors, and a polite status line. */
function useSave(action: (input: unknown) => Promise<SettingsResult>) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = (e: FormEvent<HTMLFormElement>, input: unknown) => {
    e.preventDefault();
    const form = e.currentTarget;
    setNotice(null);
    start(async () => {
      const res = await action(input);
      if (res.ok) {
        setErrors({});
        setNotice({ ok: true, text: res.data.message });
        return;
      }
      setErrors(res.fieldErrors ?? {});
      setNotice({ ok: false, text: res.error });
      requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
    });
  };
  return { pending, errors, notice, submit };
}

function Card({
  title,
  description,
  save,
  onSubmit,
  children,
}: {
  title: string;
  description: ReactNode;
  save: ReturnType<typeof useSave>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-[1.25rem] border border-border bg-card shadow-card">
      <form onSubmit={onSubmit} noValidate>
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <h2 id={id} className="text-[15px] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </header>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">{children}</div>
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-3 sm:px-6">
          <p aria-live="polite" className={cn("mr-auto text-sm empty:hidden", save.notice?.ok ? "text-success" : "text-destructive")}>
            {save.notice?.text}
          </p>
          <Button type="submit" disabled={save.pending} className="h-10 px-4">
            {save.pending ? "Saving…" : "Save"}
          </Button>
        </footer>
      </form>
    </section>
  );
}

function aria(id: string, error?: string) {
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined };
}

export function SettingsForms(props: Props) {
  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodsCard initial={props.paymentMethods} />
      <ShippingCard initial={props.shipping} />
      <PromoCard initial={props.promo} />
      <NotifyCard initial={props.notifyEmail} envFallback={props.envNotifyFallback} />
    </div>
  );
}

const GROUP_ORDER: PaymentMethodGroup[] = ["bank", "app", "transfer", "crypto", "other"];

/**
 * ADR-021: which methods checkout offers, and the details template sent for each. Templates are
 * admin-only: customers only ever see them inside the email sent for their own order.
 */
function PaymentMethodsCard({ initial }: { initial: PaymentMethodRowInput[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const save = useSave(savePaymentMethods);
  const e = save.errors;
  const enabledCount = rows.filter((r) => r.enabled).length;
  const update = (key: string, patch: Partial<PaymentMethodRowInput>) => setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const setAll = (enabled: boolean) => setRows((r) => r.map((row) => ({ ...row, enabled })));

  return (
    <Card
      title="Payment methods"
      description={
        <>
          Customers pick one at checkout. After each order you email that method&apos;s details from the order page. Write your real details here once
          (replace every <code className="text-foreground">[[ … ]]</code>) and sending takes one click. These are never shown on the website.
        </>
      }
      save={save}
      onSubmit={(ev) => save.submit(ev, { methods: rows })}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{enabledCount}</span> of {rows.length} offered at checkout
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-9" onClick={() => setAll(true)}>
            Turn all on
          </Button>
          <Button type="button" variant="outline" className="h-9" onClick={() => setAll(false)}>
            Turn all off
          </Button>
        </div>
      </div>
      {e.methods && <p className="text-sm text-destructive">{e.methods}</p>}
      <details className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">Placeholders you can use</summary>
        <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
          {[
            ["{{first_name}}", "customer's first name"],
            ["{{order_no}}", "order number (payment reference)"],
            ["{{amount}}", "order total, e.g. £120.00"],
            ["{{method}}", "payment method name"],
            ["{{pay_by}}", `due date (${PAYMENT_DUE_DAYS} days after sending)`],
          ].map(([token, what]) => (
            <li key={token}>
              <code className="text-foreground">{token}</code> {what}
            </li>
          ))}
        </ul>
      </details>

      {GROUP_ORDER.map((group) => {
        const groupRows = rows.filter((r) => getPaymentMethodDef(r.key)?.group === group);
        if (!groupRows.length) return null;
        return (
          <section key={group} aria-label={PAYMENT_GROUP_LABEL[group]}>
            <h3 className="mb-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">{PAYMENT_GROUP_LABEL[group]}</h3>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {groupRows.map((row) => {
                const def = getPaymentMethodDef(row.key)!;
                const index = rows.findIndex((r) => r.key === row.key);
                const err = e[`methods.${index}.template`];
                const needsDetails = UNFILLED_MARKER.test(row.template);
                const isOpen = open === row.key || !!err;
                const id = `pm-${row.key}`;
                return (
                  <li key={row.key} className={cn("bg-card", !row.enabled && "bg-muted/30")}>
                    <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                      <PaymentMethodIcon method={row.key} className={cn(!row.enabled && "opacity-40 grayscale")} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", !row.enabled && "text-muted-foreground")}>{def.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.enabled ? (needsDetails ? <span className="text-warning">Needs your details</span> : "Details ready") : "Hidden at checkout"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 px-2.5 text-xs"
                        aria-expanded={isOpen}
                        aria-controls={`${id}-template`}
                        onClick={() => setOpen(isOpen ? null : row.key)}
                      >
                        {isOpen ? "Close" : "Edit details"}
                      </Button>
                      <label className="relative inline-flex h-11 cursor-pointer items-center">
                        <span className="sr-only">Offer {def.label} at checkout</span>
                        <input
                          type="checkbox"
                          role="switch"
                          className="peer sr-only"
                          checked={row.enabled}
                          onChange={(ev) => update(row.key, { enabled: ev.target.checked })}
                        />
                        <span
                          aria-hidden="true"
                          className="h-6 w-10 rounded-full bg-foreground/15 transition-colors peer-checked:bg-brand peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 after:absolute after:top-1/2 after:left-0.5 after:size-5 after:-translate-y-1/2 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4"
                        />
                      </label>
                    </div>
                    {isOpen && (
                      <div id={`${id}-template`} className="border-t border-border px-3 py-3 sm:px-4">
                        <Field id={`${id}-tpl`} label={`${def.label} payment details`} error={err} hint="Sent as plain text. Line breaks are kept.">
                          <textarea
                            {...aria(`${id}-tpl`, err)}
                            className={cn(textareaClass, "min-h-56 font-mono text-[13px]")}
                            value={row.template}
                            onChange={(ev) => update(row.key, { template: ev.target.value })}
                            rows={10}
                            maxLength={3000}
                            spellCheck={false}
                          />
                        </Field>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </Card>
  );
}

const EMPTY_ROW: ShippingRowInput = { key: "", label: "", description: "", price: "", freeOver: "" };

function ShippingCard({ initial }: { initial: ShippingRowInput[] }) {
  const [rows, setRows] = useState(initial.length ? initial : [EMPTY_ROW]);
  const save = useSave(saveShippingOptions);
  const e = save.errors;
  const update = (i: number, k: keyof ShippingRowInput, value: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: value } : row)));

  return (
    <Card
      title="Shipping options"
      description={
        <>
          Offered at checkout in this order and priced on the server for every order. Keys starting with <code className="text-foreground">uk_</code> are UK
          only. Existing orders keep the price they were placed with.
        </>
      }
      save={save}
      onSubmit={(ev) => save.submit(ev, { options: rows })}
    >
      {e.options && <p className="text-sm text-destructive">{e.options}</p>}
      <ol className="flex flex-col gap-4">
        {rows.map((row, i) => {
          const err = (k: string) => e[`options.${i}.${k}`];
          const id = (k: string) => `ship-${i}-${k}`;
          return (
            <li key={i} className="rounded-xl border border-border p-4">
              <fieldset className="grid gap-4 sm:grid-cols-6">
                <legend className="sr-only">Shipping option {i + 1}</legend>
                <Field id={id("label")} label="Label" error={err("label")} className="sm:col-span-4">
                  <input {...aria(id("label"), err("label"))} className={inputClass} value={row.label} onChange={(ev) => update(i, "label", ev.target.value)} />
                </Field>
                <Field id={id("key")} label="Key" error={err("key")} className="sm:col-span-2">
                  <input {...aria(id("key"), err("key"))} className={cn(inputClass, "font-mono")} value={row.key} onChange={(ev) => update(i, "key", ev.target.value)} placeholder="uk_standard" autoComplete="off" spellCheck={false} />
                </Field>
                <Field id={id("description")} label="Description" optional error={err("description")} className="sm:col-span-6">
                  <input {...aria(id("description"), err("description"))} className={inputClass} value={row.description ?? ""} onChange={(ev) => update(i, "description", ev.target.value)} />
                </Field>
                <Field id={id("price")} label="Price (£)" error={err("price")} className="sm:col-span-2">
                  <input {...aria(id("price"), err("price"))} className={inputClass} value={row.price} onChange={(ev) => update(i, "price", ev.target.value)} inputMode="decimal" placeholder="4.99" />
                </Field>
                <Field id={id("freeOver")} label="Free over (£)" optional error={err("freeOver")} hint="Free when the subtotal reaches this." className="sm:col-span-3">
                  <input {...aria(id("freeOver"), err("freeOver"))} className={inputClass} value={row.freeOver} onChange={(ev) => update(i, "freeOver", ev.target.value)} inputMode="decimal" />
                </Field>
                <div className="flex items-end sm:col-span-1 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    disabled={rows.length === 1}
                    onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                    aria-label={`Remove shipping option ${row.label || i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="sm:sr-only">Remove</span>
                  </Button>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div>
        <Button type="button" variant="outline" className="h-10" disabled={rows.length >= 12} onClick={() => setRows((r) => [...r, EMPTY_ROW])}>
          <Plus className="size-4" aria-hidden="true" />
          Add option
        </Button>
      </div>
    </Card>
  );
}

function PromoCard({ initial }: { initial: PromoState }) {
  const [v, setV] = useState(initial);
  const save = useSave(saveFreeShippingPromo);
  const e = save.errors;
  return (
    <Card
      title="Free-shipping promotion"
      description="While active, every order ships free and checkout shows the label. Dates are whole UK days."
      save={save}
      onSubmit={(ev) => save.submit(ev, v.enabled ? v : { enabled: false })}
    >
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" className="size-4 accent-primary" checked={v.enabled} onChange={(ev) => setV((s) => ({ ...s, enabled: ev.target.checked }))} />
        Run a free-shipping promotion
      </label>
      {v.enabled && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="promo-label" label="Label" error={e.label}>
            <input {...aria("promo-label", e.label)} className={inputClass} value={v.label} onChange={(ev) => setV((s) => ({ ...s, label: ev.target.value }))} />
          </Field>
          <Field id="promo-start" label="Starts" error={e.startDay}>
            <input {...aria("promo-start", e.startDay)} type="date" className={inputClass} value={v.startDay} onChange={(ev) => setV((s) => ({ ...s, startDay: ev.target.value }))} />
          </Field>
          <Field id="promo-end" label="Ends (inclusive)" error={e.endDay}>
            <input {...aria("promo-end", e.endDay)} type="date" className={inputClass} value={v.endDay} onChange={(ev) => setV((s) => ({ ...s, endDay: ev.target.value }))} />
          </Field>
        </div>
      )}
    </Card>
  );
}

function NotifyCard({ initial, envFallback }: { initial: string; envFallback: boolean }) {
  const [email, setEmail] = useState(initial);
  const save = useSave(saveNotifyEmail);
  return (
    <Card
      title="Order notifications"
      description={envFallback ? "Not set here yet, so new-order emails go to ORDER_NOTIFY_EMAIL from the server environment." : "Every new order is emailed to this address."}
      save={save}
      onSubmit={(ev) => save.submit(ev, { email })}
    >
      <Field id="notify-email" label="Notification email" error={save.errors.email} className="max-w-md">
        <input {...aria("notify-email", save.errors.email)} type="email" className={inputClass} value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" />
      </Field>
    </Card>
  );
}
