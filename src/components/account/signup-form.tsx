"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { FormField, TextInput } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import { signup } from "@/server/actions/account-auth";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, null);

  if (state?.ok) return <CheckInbox email={state.data.email} />;

  const failed = state && !state.ok ? state : null;
  const fe = failed?.fieldErrors ?? {};
  const v = failed?.values ?? {};

  return (
    <form action={action} noValidate className="space-y-4">
      {failed && <FormAlert id="signup-error">{failed.error}</FormAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="signup-first" label="First name" error={fe.firstName}>
          <TextInput id="signup-first" name="firstName" autoComplete="given-name" required maxLength={100} defaultValue={v.firstName} error={fe.firstName} />
        </FormField>
        <FormField id="signup-last" label="Last name" error={fe.lastName}>
          <TextInput id="signup-last" name="lastName" autoComplete="family-name" required maxLength={100} defaultValue={v.lastName} error={fe.lastName} />
        </FormField>
      </div>
      <FormField id="signup-email" label="Email" error={fe.email}>
        <TextInput id="signup-email" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={255} defaultValue={v.email} error={fe.email} />
      </FormField>
      <FormField id="signup-password" label="Password" error={fe.password} hint="At least 10 characters. A short phrase works well.">
        <PasswordInput
          id="signup-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={72}
          error={fe.password}
          hint="At least 10 characters. A short phrase works well."
        />
      </FormField>

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="signup-website">Website</label>
        <input id="signup-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" variant="brand" size="xl" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/policies/terms-of-service" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link> and{" "}
        <Link href="/policies/privacy-policy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
      </p>
    </form>
  );
}

function CheckInbox({ email }: { email: string }) {
  return (
    <div className="py-2 text-center" role="status">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft" aria-hidden="true">
        <MailCheck className="size-6 text-brand" />
      </span>
      <h2 className="text-h3 mt-5">Check your inbox</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        We&apos;ve sent an email to <strong className="break-all text-foreground">{email}</strong>. Open the link inside to confirm your
        address and finish setting up your account. The link expires in 30 minutes.
      </p>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Nothing arrived? Check your spam folder. If you already had an account, the email explains how to sign in.
      </p>
      <Button asChild variant="glass" size="xl" className="mt-6 w-full">
        <Link href="/login">Go to sign in</Link>
      </Button>
    </div>
  );
}
