export { formatGBP, formatPriceLabel } from "./money";

/** Dates are stored in UTC and shown in UK time (CONVENTIONS). Intl handles BST/GMT. */
const londonDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const londonDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatLondonDateTime = (d: Date) => londonDateTime.format(d);
export const formatLondonDate = (d: Date) => londonDate.format(d);
