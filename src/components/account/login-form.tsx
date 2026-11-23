"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { FormField, TextInput } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import { login } from "@/server/actions/account-auth";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  const failed = state && !state.ok ? state : null;
  const fe = failed?.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {failed && <FormAlert id="login-error">{failed.error}</FormAlert>}
      <FormField id="login-email" label="Email" error={fe.email}>
        <TextInput
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={255}
          defaultValue={failed?.values?.email ?? ""}
          error={fe.email}
        />
      </FormField>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground/90">
            Password
          </label>
          <Link href="/forgot-password" className="text-sm text-brand underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="login-password" name="password" autoComplete="current-password" required maxLength={200} error={fe.password} />
        {fe.password && (
          <p id="login-password-error" className="text-sm text-destructive">
            {fe.password}
          </p>
        )}
      </div>
      <Button type="submit" variant="brand" size="xl" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
