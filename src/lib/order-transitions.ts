import type { OrderStatus } from "@/db/schema";

/**
 * Order state machine (docs/DATA_MODEL.md "Order state machine"). Shared so the admin UI only
 * offers legal moves, but the authority is `updateOrderStatus` (src/server/actions/orders.ts),
 * which re-checks against this map under a row lock.
 *
 * pending_payment ──▶ paid ──▶ processing ──▶ shipped ──▶ completed
 *        └──────────────┴───────────┴──▶ cancelled
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => ORDER_TRANSITIONS[from].includes(to);
