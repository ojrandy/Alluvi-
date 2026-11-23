"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert } from "@/components/account/form-alert";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { ORDER_TRANSITIONS } from "@/lib/order-transitions";
import { cn } from "@/lib/utils";
import { updateOrderNote, updateOrderStatus, updateOrderTracking, type OrderActionResult } from "@/server/actions/orders";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-white/[0.03] px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function Result({ state }: { state: OrderActionResult | null }) {
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

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

// ---------- status ----------

/**
 * Offers only the moves the state machine allows from the current status. The server re-checks
 * every transition, so a stale page (someone else changed the order) gets a clear error, not a jump.
 */
export function OrderStatusForm({ orderId, status, trackingNumber }: { orderId: string; status: OrderStatus; trackingNumber: string | null }) {
  const options = ORDER_TRANSITIONS[status];
  const [state, action, pending] = useActionState(updateOrderStatus, null);
  const [picked, setNext] = useState<OrderStatus | "">("");
  // After a successful move the options change; fall back instead of keeping a now-illegal choice.
  const next: OrderStatus | "" = picked && options.includes(picked) ? picked : options.length === 1 ? options[0] : "";
  const fe = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  if (options.length === 0) {
    return (
      <div className="space-y-3">
        <Result state={state} />
        <p className="text-sm text-muted-foreground">
          {status === "cancelled" ? "This order was cancelled. Cancelled orders can't be reopened." : "This order is complete. No further changes."}
        </p>
      </div>
    );
  }

  const cancelling = next === "cancelled";
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <div className="space-y-1.5">
        <label htmlFor="order-status" className="text-sm font-medium">
          Move to
        </label>
        <select
          id="order-status"
          name="status"
          required
          value={next}
          onChange={(e) => setNext(e.target.value as OrderStatus)}
          aria-invalid={fe.status ? true : undefined}
          aria-describedby={fe.status ? "order-status-error" : undefined}
          className={cn(inputClass, "appearance-none bg-surface")}
        >
          {options.length > 1 && (
            <option value="" disabled>
              Choose a status…
            </option>
          )}
          {options.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <FieldError id="order-status-error" message={fe.status} />
      </div>

      {next === "shipped" && (
        <div className="space-y-1.5">
          <label htmlFor="ship-tracking" className="text-sm font-medium">
            Tracking number <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="ship-tracking"
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. AB123456789GB"
            aria-invalid={fe.trackingNumber ? true : undefined}
            aria-describedby={fe.trackingNumber ? "ship-tracking-error" : "ship-tracking-hint"}
            className={cn(inputClass, "uppercase placeholder:normal-case")}
          />
          <FieldError id="ship-tracking-error" message={fe.trackingNumber} />
          <p id="ship-tracking-hint" className="text-xs text-muted-foreground">
            The customer gets one “shipped” email, with this tracking number if you add it now.
          </p>
        </div>
      )}
      {cancelling && (
        <FormAlert tone="info" className="py-2.5">
          Cancelling puts the items back in stock and can&apos;t be undone.
        </FormAlert>
      )}

      <Button type="submit" variant={cancelling ? "destructive" : "default"} disabled={pending || !next} className="h-10 w-full">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? "Updating…" : cancelling ? "Cancel order" : next ? `Mark as ${ORDER_STATUS_LABEL[next].toLowerCase()}` : "Update status"}
      </Button>
    </form>
  );
}

// ---------- tracking ----------

export function OrderTrackingForm({ orderId, trackingNumber, disabled }: { orderId: string; trackingNumber: string | null; disabled?: boolean }) {
  const [state, action, pending] = useActionState(updateOrderTracking, null);
  const fe = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <div className="space-y-1.5">
        <label htmlFor="order-tracking" className="text-sm font-medium">
          Tracking number
        </label>
        <div className="flex gap-2">
          <input
            id="order-tracking"
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            key={trackingNumber ?? ""}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            placeholder="Royal Mail tracking number"
            aria-invalid={fe.trackingNumber ? true : undefined}
            aria-describedby={fe.trackingNumber ? "order-tracking-error" : undefined}
            className={cn(inputClass, "min-w-0 flex-1 uppercase placeholder:normal-case disabled:opacity-50")}
          />
          <Button type="submit" variant="outline" disabled={pending || disabled} className="h-10 shrink-0 px-4">
            {pending ? <Loader2 className="animate-spin" aria-label="Saving" /> : "Save"}
          </Button>
        </div>
        <FieldError id="order-tracking-error" message={fe.trackingNumber} />
      </div>
    </form>
  );
}

// ---------- internal note ----------

export function OrderNoteForm({ orderId, internalNote }: { orderId: string; internalNote: string | null }) {
  const [state, action, pending] = useActionState(updateOrderNote, null);
  const fe = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <label htmlFor="order-note" className="sr-only">
        Internal note
      </label>
      <textarea
        id="order-note"
        name="internalNote"
        defaultValue={internalNote ?? ""}
        key={internalNote ?? ""}
        rows={4}
        maxLength={5000}
        placeholder="Only visible to admins. e.g. payment matched on 22 Nov"
        aria-invalid={fe.internalNote ? true : undefined}
        aria-describedby={fe.internalNote ? "order-note-error" : undefined}
        className={cn(inputClass, "h-auto min-h-24 resize-y py-2 leading-relaxed")}
      />
      <FieldError id="order-note-error" message={fe.internalNote} />
      <Button type="submit" variant="outline" disabled={pending} className="h-10 w-full sm:w-auto">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? "Saving…" : "Save note"}
      </Button>
    </form>
  );
}
