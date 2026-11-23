import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  pending_payment: "bg-warning/15 text-warning",
  paid: "bg-brand-soft text-brand",
  processing: "bg-brand-soft text-brand",
  shipped: "bg-success/15 text-success",
  completed: "bg-white/[0.07] text-foreground/80",
  cancelled: "bg-destructive/15 text-destructive",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap", TONE[status], className)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
