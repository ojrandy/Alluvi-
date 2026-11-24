"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, BellRing, Loader2, Pencil, Send } from "lucide-react";
import { FormAlert } from "@/components/account/form-alert";
import { textareaClass } from "@/components/admin/products/fields";
import { Button } from "@/components/ui/button";
import { UNFILLED_MARKER } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";
import { updateOrderStatus, type OrderActionResult } from "@/server/actions/orders";
import { sendPaymentInstructions, sendPaymentReminder, type PaymentActionResult } from "@/server/actions/payments";

function Result({ state }: { state: PaymentActionResult | OrderActionResult | null }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {state && !state.ok && <FormAlert className="py-2.5">{state.error}</FormAlert>}
      {state?.ok && (
        <FormAlert tone="success" className="py-2.5">
          {state.data.message}
        </FormAlert>
      )}
    </div>
  );
}

/**
 * Compose + send the payment details for one order (ADR-021). Prefilled from the method's template
 * with the order's values; `[[ … ]]` parts must be replaced before it can be sent (also enforced on
 * the server).
 */
export function PaymentDetailsForm({
  orderId,
  initialMessage,
  customerEmail,
  methodLabel,
  resend,
}: {
  orderId: string;
  initialMessage: string;
  customerEmail: string;
  methodLabel: string;
  resend: boolean;
}) {
  const [editing, setEditing] = useState(!resend);
  // On success, collapse to the "sent" view in the same transition, so the confirmation stays visible.
  const [state, action, pending] = useActionState(async (prev: PaymentActionResult | null, fd: FormData) => {
    const res = await sendPaymentInstructions(prev, fd);
    if (res.ok) setEditing(false);
    return res;
  }, null);
  const [message, setMessage] = useState(initialMessage);
  const unfilled = UNFILLED_MARKER.test(message);
  const fieldError = state && !state.ok ? state.fieldErrors?.message : undefined;

  if (!editing) {
    return (
      <div className="space-y-3">
        <Result state={state} />
        <Button type="button" variant="outline" className="h-10 w-full" onClick={() => setEditing(true)}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit &amp; resend details
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <div className="space-y-1.5">
        <label htmlFor="payment-message" className="text-sm font-medium">
          Message to {customerEmail}
        </label>
        <textarea
          id="payment-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={12}
          maxLength={5000}
          spellCheck={false}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby="payment-message-hint"
          className={cn(textareaClass, "min-h-72 font-mono text-[13px]", unfilled && !fieldError && "border-warning/70 focus-visible:border-warning")}
        />
        {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
        {unfilled ? (
          <p id="payment-message-hint" className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs leading-relaxed">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span>
              Replace each <code className="font-semibold">[[ … ]]</code> with your real {methodLabel} details. Save them once in Settings → Payment
              methods and next time this is one click.
            </span>
          </p>
        ) : (
          <p id="payment-message-hint" className="text-xs leading-relaxed text-muted-foreground">
            Sent from the store email with the order number, amount and a security notice. The customer also sees it on their order page.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || unfilled} className="h-10 flex-1">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {pending ? "Sending…" : resend ? "Send updated details" : "Send payment details"}
        </Button>
        {resend && (
          <Button type="button" variant="outline" className="h-10" onClick={() => setEditing(false)} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function PaymentReminderForm({ orderId, lastReminder }: { orderId: string; lastReminder: string | null }) {
  const [state, action, pending] = useActionState(sendPaymentReminder, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <Button type="submit" variant="outline" disabled={pending} className="h-10 w-full">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <BellRing className="size-4" aria-hidden="true" />}
        {pending ? "Sending…" : "Send payment reminder"}
      </Button>
      {lastReminder && <p className="text-center text-xs text-muted-foreground">Last reminder {lastReminder}</p>}
    </form>
  );
}

/** One-click pending_payment → paid, through the same audited status action as the Status card. */
export function MarkPaidForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(updateOrderStatus, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value="paid" />
      <Result state={state} />
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? "Updating…" : "Money received: mark as paid"}
      </Button>
    </form>
  );
}
