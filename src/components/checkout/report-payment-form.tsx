"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportPayment, type PaymentActionResult } from "@/server/actions/payments";
import { controlClass } from "./form-field";
import { cn } from "@/lib/utils";

/** "I've sent payment" + optional reference (ADR-021). Tells the shop to look; it is not proof. */
export function ReportPaymentForm({ orderNo }: { orderNo: string }) {
  const [state, action, pending] = useActionState<PaymentActionResult | null, FormData>(reportPayment, null);
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        {state.data.message}
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="brand" size="xl" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        I&apos;ve sent payment
      </Button>
    );
  }

  const fieldError = state && !state.ok ? state.fieldErrors?.reference : undefined;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderNo" value={orderNo} />
      <div>
        <label htmlFor="payment-reference" className="mb-1.5 block text-sm font-medium">
          Payment reference <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="payment-reference"
          name="reference"
          maxLength={120}
          autoComplete="off"
          placeholder="e.g. transaction ID, MTCN or the name on the payment"
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "payment-reference-error" : "payment-reference-hint"}
          className={cn(controlClass)}
        />
        {fieldError ? (
          <p id="payment-reference-error" className="mt-1.5 text-sm text-destructive">
            {fieldError}
          </p>
        ) : (
          <p id="payment-reference-hint" className="mt-1.5 text-xs text-muted-foreground">
            Helps us find your payment faster.
          </p>
        )}
      </div>
      {state && !state.ok && !fieldError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="brand" size="xl" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {pending ? "Sending…" : "Confirm I've paid"}
        </Button>
        <Button type="button" variant="glass" size="xl" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
