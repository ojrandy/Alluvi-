/**
 * Money is integer pence everywhere (CONVENTIONS). These helpers only format for display;
 * totals are computed in src/server/pricing.ts.
 */

/** Live-site style price label, e.g. 12000 → "£ 120 GBP", 12050 → "£ 120.50 GBP". */
export function formatPriceLabel(pence: number): string {
  const pounds = pence / 100;
  const amount = Number.isInteger(pounds) ? pounds.toString() : pounds.toFixed(2);
  return `£ ${amount} GBP`;
}

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** Accounting-style amount for cart, checkout and emails, e.g. 12000 → "£120.00". */
export function formatGBP(pence: number): string {
  return gbp.format(pence / 100);
}
