"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { controlClass, FormField, TextInput } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import { SHIPPING_COUNTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { updateAccountDetails } from "@/server/actions/account";
import { FormAlert } from "./form-alert";

export type DetailsDefaults = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
};

export function AccountDetailsForm({ defaults }: { defaults: DetailsDefaults }) {
  const [state, action, pending] = useActionState(updateAccountDetails, null);
  const failed = state && !state.ok ? state : null;
  const fe = failed?.fieldErrors ?? {};
  // After a failed submit, React resets the form: put the submitted values back.
  const v = { ...defaults, ...(failed?.values ?? {}) };

  return (
    <form action={action} noValidate className="space-y-10">
      <div aria-live="polite">
        {failed && <FormAlert>{failed.error}</FormAlert>}
        {state?.ok && <FormAlert tone="success">Saved. Checkout will use these details next time.</FormAlert>}
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="text-h3 mb-4">Contact</legend>
        <FormField id="acc-first" label="First name" error={fe.firstName}>
          <TextInput id="acc-first" name="firstName" autoComplete="given-name" required maxLength={100} defaultValue={v.firstName} error={fe.firstName} />
        </FormField>
        <FormField id="acc-last" label="Last name" error={fe.lastName}>
          <TextInput id="acc-last" name="lastName" autoComplete="family-name" required maxLength={100} defaultValue={v.lastName} error={fe.lastName} />
        </FormField>
        <FormField id="acc-email" label="Email" hint="Contact us if you need to change the email on your account." className="sm:col-span-2">
          <TextInput id="acc-email" type="email" value={defaults.email} readOnly disabled hint="Contact us if you need to change the email on your account." className="opacity-70" />
        </FormField>
        <FormField id="acc-phone" label="Phone" optional error={fe.phone} className="sm:col-span-2">
          <TextInput id="acc-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={v.phone} error={fe.phone} />
        </FormField>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="text-h3 mb-1">Default delivery address</legend>
        <p className="mb-3 text-sm text-muted-foreground sm:col-span-2">Pre-fills checkout. Leave blank if you&apos;d rather enter it each time.</p>
        <FormField id="acc-country" label="Country" error={fe.country} className="sm:col-span-2">
          <select id="acc-country" name="country" autoComplete="country" defaultValue={v.country} className={cn(controlClass, "appearance-none bg-surface")}>
            {SHIPPING_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </FormField>
        <FormField id="acc-line1" label="Address" error={fe.line1} className="sm:col-span-2">
          <TextInput id="acc-line1" name="line1" autoComplete="address-line1" maxLength={255} defaultValue={v.line1} error={fe.line1} />
        </FormField>
        <FormField id="acc-line2" label="Apartment, suite, etc." optional error={fe.line2} className="sm:col-span-2">
          <TextInput id="acc-line2" name="line2" autoComplete="address-line2" maxLength={255} defaultValue={v.line2} error={fe.line2} />
        </FormField>
        <FormField id="acc-city" label="Town / city" error={fe.city}>
          <TextInput id="acc-city" name="city" autoComplete="address-level2" maxLength={100} defaultValue={v.city} error={fe.city} />
        </FormField>
        <FormField id="acc-postcode" label="Postcode" error={fe.postcode}>
          <TextInput id="acc-postcode" name="postcode" autoComplete="postal-code" autoCapitalize="characters" maxLength={20} defaultValue={v.postcode} error={fe.postcode} />
        </FormField>
      </fieldset>

      <Button type="submit" variant="brand" size="xl" disabled={pending} className="w-full sm:w-auto">
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
