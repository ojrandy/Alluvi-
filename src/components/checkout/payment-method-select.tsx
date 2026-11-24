"use client";

import type * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { T } from "@/components/i18n/t";
import { PaymentMethodIcon } from "@/components/payment/payment-method-icon";
import { useT } from "@/lib/i18n/client";
import { PAYMENT_GROUP_LABEL, PAYMENT_RESPONSE_PROMISE, type CheckoutPaymentMethod, type PaymentMethodGroup } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  methods: CheckoutPaymentMethod[];
  value: string;
  onChange: (key: string) => void;
  onBlur: () => void;
  /** react-hook-form field ref, so a validation error moves focus to the trigger. */
  triggerRef?: React.Ref<HTMLButtonElement>;
  error?: string;
};

const GROUP_ORDER: PaymentMethodGroup[] = ["bank", "app", "transfer", "crypto", "other"];

/**
 * Grouped dropdown of the enabled payment methods: brand icon, then name, then a short hint
 * (ADR-021). Radix Select gives keyboard support, type-ahead and the listbox semantics; the hint
 * sits outside ItemText so the closed trigger shows just icon + name.
 */
export function PaymentMethodSelect({ id, methods, value, onChange, onBlur, triggerRef, error }: Props) {
  const t = useT();
  const selected = methods.find((m) => m.key === value) ?? null;
  const groups = GROUP_ORDER.map((g) => ({ group: g, items: methods.filter((m) => m.group === g) })).filter((g) => g.items.length);
  const describedBy = [error ? `${id}-error` : null, `${id}-hint`].filter(Boolean).join(" ");

  return (
    <div>
      <label id={`${id}-label`} htmlFor={id} className="mb-2 block text-sm font-medium">
        <T>How would you like to pay?</T>
      </label>
      <SelectPrimitive.Root value={value || undefined} onValueChange={onChange} onOpenChange={(open) => !open && onBlur()}>
        <SelectPrimitive.Trigger
          ref={triggerRef}
          id={id}
          aria-labelledby={`${id}-label`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "group flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 text-left text-base transition-colors outline-none",
            "hover:border-foreground/25 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=open]:border-brand",
            "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3 data-placeholder:text-muted-foreground">
            <SelectPrimitive.Value placeholder={t("Select a payment method")} />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={16}
            className={cn(
              "z-50 max-h-[min(26rem,var(--radix-select-content-available-height))] w-(--radix-select-trigger-width) overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl",
              "origin-(--radix-select-content-transform-origin) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center bg-card text-muted-foreground">
              <ChevronUp className="size-4" aria-hidden="true" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-1.5">
              {groups.map(({ group, items }, gi) => (
                <SelectPrimitive.Group key={group}>
                  {gi > 0 && <SelectPrimitive.Separator className="mx-2 my-1.5 h-px bg-border" />}
                  <SelectPrimitive.Label className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    <T>{PAYMENT_GROUP_LABEL[group]}</T>
                  </SelectPrimitive.Label>
                  {items.map((m) => (
                    <SelectPrimitive.Item
                      key={m.key}
                      value={m.key}
                      className="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl py-2 pr-10 pl-3 outline-none select-none data-highlighted:bg-foreground/[0.06] data-[state=checked]:bg-brand-soft"
                    >
                      <SelectPrimitive.ItemText asChild>
                        <span className="flex min-w-0 items-center gap-3">
                          <PaymentMethodIcon method={m.key} />
                          <span className="truncate text-[15px] font-medium">{m.label}</span>
                        </span>
                      </SelectPrimitive.ItemText>
                      <span className="ml-auto hidden truncate text-xs text-muted-foreground min-[420px]:block">
                        <T>{m.hint}</T>
                      </span>
                      <SelectPrimitive.ItemIndicator className="absolute right-3">
                        <Check className="size-4 text-brand" aria-hidden="true" />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Group>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center bg-card text-muted-foreground">
              <ChevronDown className="size-4" aria-hidden="true" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {t(error)}
        </p>
      )}

      <div id={`${id}-hint`} className="mt-3 flex gap-3 rounded-2xl border border-border bg-white/[0.02] p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-muted-foreground">
          {selected ? (
            <>
              <span className="font-medium text-foreground">
                <T>Nothing to pay now.</T>
              </span>{" "}
              <T pt={`Depois de fazer o pedido, nossa equipe enviará por e-mail os dados de pagamento via ${selected.label} em até 2 horas úteis.`}>
                {`After you place your order, our team will email you the ${selected.label} payment details ${PAYMENT_RESPONSE_PROMISE}.`}
              </T>{" "}
              <T>We dispatch as soon as your payment is confirmed.</T>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">
                <T>Nothing to pay now.</T>
              </span>{" "}
              <T>Choose your preferred method. After you order, our team emails you the payment details for it.</T>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
