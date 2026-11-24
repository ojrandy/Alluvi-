"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { T } from "@/components/i18n/t";
import type { ShippingOption } from "@/db/schema";
import { SHIPPING_COUNTRIES, UK_ONLY_SHIPPING_PREFIX } from "@/lib/constants";
import { useLang, useT } from "@/lib/i18n/client";
import { formatGBP } from "@/lib/money";
import { cn } from "@/lib/utils";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validators/checkout";
import { placeOrder } from "@/server/actions/checkout";
import { useCart, useCartHydrated } from "@/stores/cart";
import { controlClass, FormField, TextInput } from "./form-field";
import { OrderSummary } from "./order-summary";
import { PaymentMethodSelect } from "./payment-method-select";
import type { CheckoutPaymentMethod } from "@/lib/payment-methods";
import { useCheckoutQuote } from "./use-checkout-quote";

/** The signed-in customer's details, used to prefill the form. Null for guests. */
export type CheckoutAccount = Pick<
  CheckoutFormValues,
  "email" | "firstName" | "lastName" | "phone" | "addressLine1" | "addressLine2" | "city" | "postcode"
> & { country: string };

type Props = {
  shippingOptions: ShippingOption[];
  paymentMethods: CheckoutPaymentMethod[];
  promoLabel: string | null;
  account: CheckoutAccount | null;
};

const pickShipping = (options: ShippingOption[], country: string) =>
  options.find((o) => (country === "GB") === o.key.startsWith(UK_ONLY_SHIPPING_PREFIX))?.key ?? options[0]?.key ?? "";

export function CheckoutForm({ shippingOptions, paymentMethods, promoLabel, account }: Props) {
  const loggedIn = !!account;
  // A saved country outside the shipping list (e.g. a list change since) falls back to the UK.
  const initialCountry = (SHIPPING_COUNTRIES.some((c) => c.code === account?.country) ? account?.country : "GB") as CheckoutFormValues["country"];
  const router = useRouter();
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [placed, setPlaced] = useState(false);
  const t = useT();
  const lang = useLang();
  const countryName = (code: string, fallback: string) => {
    if (lang !== "pt") return fallback;
    try {
      return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(code) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: {
      email: account?.email ?? "",
      firstName: account?.firstName ?? "",
      lastName: account?.lastName ?? "",
      phone: account?.phone ?? "",
      addressLine1: account?.addressLine1 ?? "",
      addressLine2: account?.addressLine2 ?? "",
      city: account?.city ?? "",
      postcode: account?.postcode ?? "",
      country: initialCountry,
      shippingMethod: pickShipping(shippingOptions, initialCountry),
      // No default: the customer must choose (ADR-021). A single enabled method is preselected.
      paymentMethod: paymentMethods.length === 1 ? paymentMethods[0].key : "",
      customerNote: "",
      ruoAccepted: false as unknown as true, // must be ticked; the schema enforces literal(true)
      website: "",
      createAccount: false,
      password: "",
    },
  });
  const { register, handleSubmit, setValue, setError, formState, control } = form;
  const errors = formState.errors;
  const country = useWatch({ control, name: "country" });
  const shippingMethod = useWatch({ control, name: "shippingMethod" });
  const createAccount = useWatch({ control, name: "createAccount" });

  // Keep shipping consistent with the destination (UK vs international).
  useEffect(() => {
    const current = shippingOptions.find((o) => o.key === shippingMethod);
    const wantsUk = country === "GB";
    if (!current || current.key.startsWith(UK_ONLY_SHIPPING_PREFIX) !== wantsUk) {
      setValue("shippingMethod", pickShipping(shippingOptions, country), { shouldValidate: true });
    }
  }, [country, shippingMethod, shippingOptions, setValue]);

  // Move focus to the error banner so keyboard and screen-reader users hear what went wrong.
  useEffect(() => {
    if (formError) document.getElementById("checkout-error")?.focus();
  }, [formError]);

  const quote = useCheckoutQuote(lines, shippingMethod, country, hydrated && !placed);
  const visibleOptions = shippingOptions.filter((o) => (country === "GB") === o.key.startsWith(UK_ONLY_SHIPPING_PREFIX));

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startSubmit(async () => {
      const res = await placeOrder({ ...values, items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) });
      if (res.ok) {
        setPlaced(true);
        const flag = res.data.accountCreated ? "?account=created" : res.data.accountRequested ? "?account=requested" : "";
        router.replace(`/order-confirmation/${res.data.orderNo}${flag}`);
        clear();
        return;
      }
      // The chosen method was switched off since this page loaded: clear it and reload the list.
      if (res.fieldErrors?.paymentMethod) {
        setValue("paymentMethod", "");
        router.refresh();
      }
      for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
        if (field in values) setError(field as keyof CheckoutFormValues, { message }, { shouldFocus: true });
      }
      if (res.issues?.length) {
        quote.setIssueIds(new Set(res.issues.map((i) => i.productId)));
        quote.setError(res.error);
      }
      setFormError(res.error);
    });
  });

  if (!hydrated) return <div className="h-96" aria-busy="true" />;
  if (lines.length === 0 && !placed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <ShoppingBag className="size-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-h3 mt-4">
          <T>Your cart is empty</T>
        </h2>
        <p className="mt-2 text-muted-foreground">
          <T>Add a research compound to your cart to check out.</T>
        </p>
        <Button asChild variant="brand" size="xl" className="mt-6">
          <Link href="/shop">
            <T>Browse the shop</T>
          </Link>
        </Button>
      </div>
    );
  }

  const busy = submitting || placed;

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
      <div className="space-y-10">
        {formError && (
          <p id="checkout-error" tabIndex={-1} role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none">
            {t(formError)}
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="text-h3 mb-4">
            <T>Contact</T>
          </legend>
          <p className="-mt-2 text-sm text-muted-foreground">
            {loggedIn ? (
              <T>Signed in. This order will be saved to your account.</T>
            ) : (
              <>
                <T>Have an account?</T>{" "}
                <Link href="/login?next=%2Fcheckout" className="text-brand underline-offset-4 hover:underline">
                  <T>Sign in</T>
                </Link>{" "}
                <T>to use your saved details. Or continue as a guest.</T>
              </>
            )}
          </p>
          <FormField id="email" label="Email" error={errors.email?.message}>
            <TextInput id="email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
          </FormField>
          <FormField id="phone" label="Phone" error={errors.phone?.message} hint="For delivery updates from the courier.">
            <TextInput id="phone" type="tel" autoComplete="tel" error={errors.phone?.message} hint="For delivery updates from the courier." {...register("phone")} />
          </FormField>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="text-h3 mb-4">
            <T>Delivery address</T>
          </legend>
          <FormField id="firstName" label="First name" error={errors.firstName?.message}>
            <TextInput id="firstName" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          </FormField>
          <FormField id="lastName" label="Last name" error={errors.lastName?.message}>
            <TextInput id="lastName" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
          </FormField>
          <FormField id="country" label="Country" error={errors.country?.message} className="sm:col-span-2">
            <select id="country" autoComplete="country" className={cn(controlClass, "appearance-none bg-surface")} {...register("country")}>
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryName(c.code, c.name)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="addressLine1" label="Address" error={errors.addressLine1?.message} className="sm:col-span-2">
            <TextInput id="addressLine1" autoComplete="address-line1" error={errors.addressLine1?.message} {...register("addressLine1")} />
          </FormField>
          <FormField id="addressLine2" label="Apartment, suite, etc." optional error={errors.addressLine2?.message} className="sm:col-span-2">
            <TextInput id="addressLine2" autoComplete="address-line2" error={errors.addressLine2?.message} {...register("addressLine2")} />
          </FormField>
          <FormField id="city" label="Town / city" error={errors.city?.message}>
            <TextInput id="city" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
          </FormField>
          <FormField id="postcode" label="Postcode" error={errors.postcode?.message}>
            <TextInput id="postcode" autoComplete="postal-code" autoCapitalize="characters" error={errors.postcode?.message} {...register("postcode")} />
          </FormField>
        </fieldset>

        <fieldset>
          <legend className="text-h3 mb-4">
            <T>Shipping</T>
          </legend>
          <div className="space-y-3" role="radiogroup" aria-describedby={errors.shippingMethod ? "shipping-error" : undefined}>
            {visibleOptions.map((o) => (
              <label key={o.key} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:ring-3 has-focus-visible:ring-ring/40">
                <input type="radio" value={o.key} className="mt-1 size-4 accent-[var(--brand)]" {...register("shippingMethod")} />
                <span className="flex-1">
                  <span className="block font-medium">{t(o.label)}</span>
                  {o.description && <span className="mt-0.5 block text-sm text-muted-foreground">{t(o.description)}</span>}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {promoLabel || o.pricePence === 0 ? <T>Free</T> : formatGBP(o.pricePence)}
                </span>
              </label>
            ))}
          </div>
          {errors.shippingMethod && <p id="shipping-error" className="mt-2 text-sm text-destructive">{t(errors.shippingMethod.message ?? "")}</p>}
        </fieldset>

        <fieldset>
          <legend className="text-h3 mb-4">
            <T>Payment</T>
          </legend>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <PaymentMethodSelect
                id="paymentMethod"
                methods={paymentMethods}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                triggerRef={field.ref}
                error={errors.paymentMethod?.message}
              />
            )}
          />
          <FormField id="customerNote" label="Order note" optional error={errors.customerNote?.message} className="mt-5">
            <textarea id="customerNote" rows={3} className={cn(controlClass, "h-auto py-3")} {...register("customerNote")} />
          </FormField>
        </fieldset>

        {!loggedIn && (
          <div className="rounded-2xl border border-border p-4">
            <Controller
              control={form.control}
              name="createAccount"
              render={({ field }) => (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                  <Checkbox checked={!!field.value} onCheckedChange={(c) => field.onChange(c === true)} className="size-5" />
                  <T>Create an account with these details</T>
                </label>
              )}
            />
            {createAccount && (
              <FormField id="password" label="Password" error={errors.password?.message} hint="At least 10 characters." className="mt-3">
                <TextInput id="password" type="password" autoComplete="new-password" error={errors.password?.message} hint="At least 10 characters." {...register("password")} />
              </FormField>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              <T>Optional. Guest checkout works exactly the same.</T>
            </p>
          </div>
        )}

        {/* Honeypot: hidden from people and assistive tech; bots that fill every field get rejected. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
      </div>

      <div className="space-y-5 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:self-start">
        <OrderSummary cartLines={lines} quote={quote.quote} quoteError={quote.error} issueIds={quote.issueIds} pending={quote.pending} promoLabel={promoLabel} />

        <div className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-4">
          <Controller
            control={form.control}
            name="ruoAccepted"
            render={({ field }) => (
              <label className="flex cursor-pointer gap-3 text-sm leading-relaxed">
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(c) => field.onChange(c === true)}
                  aria-invalid={errors.ruoAccepted ? true : undefined}
                  aria-describedby={errors.ruoAccepted ? "ruo-error" : undefined}
                  className="mt-0.5 size-5"
                />
                <span>
                  <T>I confirm I am 18 or over, that these products are for laboratory research use only and not for human consumption, and I agree to the</T>{" "}
                  <Link href="/policies/terms-of-service" target="_blank" className="text-brand underline underline-offset-2">
                    <T>Terms of Service</T>
                  </Link>{" "}
                  <T>and</T>{" "}
                  <Link href="/policies/refund-policy" target="_blank" className="text-brand underline underline-offset-2">
                    <T>Refund Policy</T>
                  </Link>
                  .
                </span>
              </label>
            )}
          />
          {errors.ruoAccepted && <p id="ruo-error" className="mt-2 text-sm text-destructive">{t(errors.ruoAccepted.message ?? "")}</p>}
        </div>

        <Button type="submit" variant="brand" size="xl" className="w-full" disabled={busy || !!quote.error}>
          {busy ? <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" /> : <Lock data-icon="inline-start" aria-hidden="true" />}
          {busy ? (
            <T>Placing order…</T>
          ) : (
            <>
              <T>Place order</T>
              {quote.quote ? ` · ${formatGBP(quote.quote.totalPence)}` : ""}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
