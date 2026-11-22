"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unlockOrder } from "@/server/actions/order-access";
import { TextInput } from "./form-field";

/** Shown on a confirmation page opened in a browser that didn't place the order. */
export function UnlockOrderForm({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(unlockOrder, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="mt-8 flex flex-col gap-3 text-left">
      <input type="hidden" name="orderNo" value={orderNo} />
      <label htmlFor="unlock-email" className="text-sm font-medium">
        Email used at checkout
      </label>
      <TextInput
        id="unlock-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state && !state.ok ? state.error : undefined}
      />
      {state && !state.ok && (
        <p id="unlock-email-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="brand" size="xl" disabled={pending} className="mt-2">
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        View order
      </Button>
    </form>
  );
}
