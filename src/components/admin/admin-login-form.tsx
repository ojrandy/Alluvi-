"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { FormAlert } from "@/components/account/form-alert";
import { PasswordInput } from "@/components/account/password-input";
import { FormField, TextInput } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import { adminLogin } from "@/server/actions/admin-auth";

export function AdminLoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, action, pending] = useActionState(adminLogin, null);
  const error = state && !state.ok ? state.error : undefined;

  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {error && <FormAlert id="admin-login-error">{error}</FormAlert>}
      <FormField id="admin-email" label="Email">
        <TextInput
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
          maxLength={255}
          defaultValue={state && !state.ok ? state.values?.email : ""}
          aria-describedby={error ? "admin-login-error" : undefined}
        />
      </FormField>
      <FormField id="admin-password" label="Password">
        <PasswordInput id="admin-password" name="password" autoComplete="current-password" required maxLength={200} />
      </FormField>
      <Button type="submit" variant="brand" size="xl" disabled={pending} className="mt-2 w-full">
        {pending ? (
          <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />
        ) : (
          <LockKeyhole data-icon="inline-start" aria-hidden="true" />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
