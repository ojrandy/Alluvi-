"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, MailCheck, MailQuestion } from "lucide-react";
import { FormField, TextInput } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import { forgotPassword, resetPassword, verifyEmail } from "@/server/actions/account-recovery";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, null);

  if (state?.ok) {
    return (
      <div className="py-2 text-center" role="status">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft" aria-hidden="true">
          <MailCheck className="size-6 text-brand" />
        </span>
        <h2 className="text-h3 mt-5">Check your inbox</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          If an account exists for <strong className="break-all text-foreground">{state.data.email}</strong>, we&apos;ve emailed you a link
          to reset your password. It expires in 30 minutes.
        </p>
        <Button asChild variant="glass" size="xl" className="mt-6 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  const failed = state && !state.ok ? state : null;
  return (
    <form action={action} noValidate className="space-y-4">
      {failed && <FormAlert id="forgot-error">{failed.error}</FormAlert>}
      <FormField id="forgot-email" label="Email" error={failed?.fieldErrors?.email}>
        <TextInput
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={255}
          defaultValue={failed?.values?.email ?? ""}
          error={failed?.fieldErrors?.email}
        />
      </FormField>
      <Button type="submit" variant="brand" size="xl" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {pending ? "Sending…" : "Email me a reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  const failed = state && !state.ok ? state : null;
  const fe = failed?.fieldErrors ?? {};
  const linkDead = failed && !failed.fieldErrors;

  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {failed && (
        <FormAlert id="reset-error">
          {failed.error}
          {linkDead && (
            <>
              {" "}
              <Link href="/forgot-password" className="text-brand underline underline-offset-4">Request a new link</Link>.
            </>
          )}
        </FormAlert>
      )}
      <FormField id="reset-password" label="New password" error={fe.password} hint="At least 10 characters.">
        <PasswordInput id="reset-password" name="password" autoComplete="new-password" required minLength={10} maxLength={72} error={fe.password} hint="At least 10 characters." />
      </FormField>
      <FormField id="reset-confirm" label="Confirm new password" error={fe.confirmPassword}>
        <PasswordInput id="reset-confirm" name="confirmPassword" autoComplete="new-password" required maxLength={72} error={fe.confirmPassword} />
      </FormField>
      <Button type="submit" variant="brand" size="xl" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {pending ? "Saving…" : "Set new password"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">You&apos;ll be signed in, and signed out everywhere else.</p>
    </form>
  );
}

/**
 * A button rather than auto-confirming on page load: mail scanners pre-open links, and a GET that
 * consumed the single-use token would burn it before the customer ever clicks.
 */
export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmail, null);
  const failed = state && !state.ok ? state : null;

  return (
    <form action={action} className="space-y-4 text-center">
      <input type="hidden" name="token" value={token} />
      {failed && (
        <FormAlert id="verify-error" className="text-left">
          {failed.error} <Link href="/login" className="text-brand underline underline-offset-4">Sign in</Link> to request a new link.
        </FormAlert>
      )}
      <Button type="submit" variant="brand" size="xl" disabled={pending} className="w-full">
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {pending ? "Confirming…" : "Confirm my email"}
      </Button>
    </form>
  );
}

/** Shown when a reset/verify link is missing, malformed, expired or used. */
export function DeadLink({ kind }: { kind: "reset" | "verify" }) {
  return (
    <div className="py-2 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[0.05]" aria-hidden="true">
        <MailQuestion className="size-6 text-muted-foreground" />
      </span>
      <h2 className="text-h3 mt-5">This link has expired</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Links are valid for 30 minutes and can be used once.{" "}
        {kind === "reset" ? "Request a new one below." : "Sign in to your account to send a new confirmation link."}
      </p>
      <Button asChild variant="brand" size="xl" className="mt-6 w-full">
        {kind === "reset" ? <Link href="/forgot-password">Request a new link</Link> : <Link href="/login?next=%2Faccount">Sign in</Link>}
      </Button>
    </div>
  );
}
