"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/server/actions/account-recovery";

export function ResendVerification() {
  const [state, action, pending] = useActionState(resendVerification, null);
  return (
    <form action={action} className="flex flex-col gap-2 sm:items-end">
      <Button type="submit" variant="glass" size="xl" disabled={pending || state?.ok}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {state?.ok ? "Link sent" : "Send confirmation link"}
      </Button>
      <p aria-live="polite" className="text-xs text-muted-foreground sm:text-right">
        {state?.ok ? `Sent to ${state.data.email}. It expires in 30 minutes.` : state && !state.ok ? state.error : null}
      </p>
    </form>
  );
}
