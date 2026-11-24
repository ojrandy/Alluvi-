import { z } from "zod";
import { ORDER_STATUSES } from "@/db/schema";
import { PAYMENT_STAGES } from "@/lib/payment-methods";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

/**
 * /admin/orders filters, read from searchParams by the list page AND the CSV export, so both see
 * exactly the same orders. Invalid values fall back to "no filter" instead of erroring: these come
 * from a URL the admin may have edited by hand.
 */
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const adminOrderFiltersSchema = z.object({
  q: z.preprocess(first, z.string().trim().max(100).catch("")).default(""),
  status: z.preprocess(first, z.enum(ORDER_STATUSES).optional().catch(undefined)),
  // ADR-021 payment stage of `pending_payment` orders (implies that status).
  pay: z.preprocess(first, z.enum(PAYMENT_STAGES).optional().catch(undefined)),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)).default(1),
});

export type AdminOrderFilters = z.output<typeof adminOrderFiltersSchema>;

export function parseAdminOrderFilters(params: Record<string, string | string[] | undefined> | URLSearchParams): AdminOrderFilters {
  const raw = params instanceof URLSearchParams ? Object.fromEntries(params) : params;
  return adminOrderFiltersSchema.parse(raw);
}

/** Query string for a filter set (page 1 and empty values omitted), e.g. for pagination links. */
export function adminOrdersQuery(f: Partial<AdminOrderFilters>): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.status) sp.set("status", f.status);
  if (f.pay) sp.set("pay", f.pay);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
