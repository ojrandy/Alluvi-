"use client";

import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, inputClass, textareaClass } from "@/components/admin/products/fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BankFormInput, ShippingRowInput } from "@/lib/validators/admin-settings";
import {
  saveBankDetails,
  saveFreeShippingPromo,
  saveNotifyEmail,
  saveShippingOptions,
  type SettingsResult,
} from "@/server/actions/settings";

type PromoState = { enabled: boolean; label: string; startDay: string; endDay: string };

type Props = {
  bank: BankFormInput & { iban: string; instructions: string };
  bankIsPlaceholder: boolean;
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
    <section aria-labelledby={id} className="rounded-2xl border border-border bg-card">
      <form onSubmit={onSubmit} noValidate>
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </header>
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">{children}</div>
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-3 sm:px-6">
          <p aria-live="polite" className={cn("mr-auto text-sm empty:hidden", save.notice?.ok ? "text-emerald-400" : "text-destructive")}>
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
      <BankCard initial={props.bank} placeholder={props.bankIsPlaceholder} />
      <ShippingCard initial={props.shipping} />
      <PromoCard initial={props.promo} />
      <NotifyCard initial={props.notifyEmail} envFallback={props.envNotifyFallback} />
    </div>
  );
}

function BankCard({ initial, placeholder }: { initial: Props["bank"]; placeholder: boolean }) {
  const [v, setV] = useState(initial);
  const save = useSave(saveBankDetails);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));
  const e = save.errors;
  return (
    <Card
      title="Bank transfer"
      description={
        placeholder ? (
          <span className="text-amber-400">
            These are still the seeded placeholders, so customers are not shown any bank details yet. Enter the real account.
          </span>
        ) : (
          "Shown on the order confirmation page and in the customer's order email."
        )
      }
      save={save}
      onSubmit={(ev) => save.submit(ev, v)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="bank-accountName" label="Account name" error={e.accountName}>
          <input {...aria("bank-accountName", e.accountName)} className={inputClass} value={v.accountName} onChange={set("accountName")} autoComplete="off" />
        </Field>
        <Field id="bank-bankName" label="Bank" error={e.bankName}>
          <input {...aria("bank-bankName", e.bankName)} className={inputClass} value={v.bankName} onChange={set("bankName")} autoComplete="off" />
        </Field>
        <Field id="bank-sortCode" label="Sort code" error={e.sortCode}>
          <input {...aria("bank-sortCode", e.sortCode)} className={inputClass} value={v.sortCode} onChange={set("sortCode")} inputMode="numeric" placeholder="12-34-56" autoComplete="off" />
        </Field>
        <Field id="bank-accountNumber" label="Account number" error={e.accountNumber}>
          <input {...aria("bank-accountNumber", e.accountNumber)} className={inputClass} value={v.accountNumber} onChange={set("accountNumber")} inputMode="numeric" autoComplete="off" />
        </Field>
        <Field id="bank-iban" label="IBAN" optional error={e.iban} className="sm:col-span-2">
          <input {...aria("bank-iban", e.iban)} className={inputClass} value={v.iban} onChange={set("iban")} autoComplete="off" />
        </Field>
        <Field id="bank-instructions" label="Payment instructions" optional error={e.instructions} hint="E.g. “Use your order number as the payment reference.”" className="sm:col-span-2">
          <textarea {...aria("bank-instructions", e.instructions)} className={textareaClass} value={v.instructions} onChange={set("instructions")} rows={3} />
        </Field>
      </div>
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
