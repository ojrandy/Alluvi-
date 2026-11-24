import {
  siApple,
  siBinance,
  siBitcoin,
  siCashapp,
  siEthereum,
  siLitecoin,
  siMoneygram,
  siMonzo,
  siN26,
  siPayoneer,
  siPaypal,
  siRevolut,
  siSolana,
  siTether,
  siVenmo,
  siWesternunion,
  siWise,
  siXrp,
  siZelle,
} from "simple-icons";
import type { PaymentMethodConfig } from "@/db/schema";

/**
 * Payment methods offered at checkout (ADR-021). Client-safe: no payment details live here.
 *
 * The customer picks one at checkout; the order is saved with that key; the admin then emails the
 * payment details for that method (the per-method `template` in the `payment_methods` setting).
 * Keys are stored on orders: never rename one, add a new key instead.
 */

export type PaymentMethodGroup = "bank" | "app" | "transfer" | "crypto" | "other";

export const PAYMENT_GROUP_LABEL: Record<PaymentMethodGroup, string> = {
  bank: "Bank transfer",
  app: "Payment apps & wallets",
  transfer: "Money transfer services",
  crypto: "Cryptocurrency",
  other: "Other",
};

/** A brand mark (simple-icons path, 24×24 viewBox) or a generic glyph drawn by the UI. */
export type PaymentIcon = { kind: "brand"; path: string; hex: string } | { kind: "generic"; glyph: "bank" | "globe" | "euro" | "send" | "coin" | "wallet" };

export type PaymentMethodDef = {
  key: string;
  label: string;
  group: PaymentMethodGroup;
  /** One short line under the name in the dropdown. */
  hint: string;
  icon: PaymentIcon;
};

const brand = (i: { path: string; hex: string }): PaymentIcon => ({ kind: "brand", path: i.path, hex: i.hex });
const generic = (glyph: Extract<PaymentIcon, { kind: "generic" }>["glyph"]): PaymentIcon => ({ kind: "generic", glyph });

export const PAYMENT_METHODS: readonly PaymentMethodDef[] = [
  // ---- bank transfer
  { key: "bank_transfer", label: "UK bank transfer", group: "bank", hint: "Faster Payments, GBP", icon: generic("bank") },
  { key: "us_bank_transfer", label: "US bank transfer", group: "bank", hint: "ACH or domestic wire, USD", icon: generic("bank") },
  { key: "sepa_transfer", label: "SEPA transfer", group: "bank", hint: "Euro bank transfer", icon: generic("euro") },
  { key: "international_wire", label: "International wire", group: "bank", hint: "SWIFT transfer, any country", icon: generic("globe") },
  // ---- payment apps & wallets
  { key: "paypal", label: "PayPal", group: "app", hint: "Worldwide", icon: brand(siPaypal) },
  { key: "zelle", label: "Zelle", group: "app", hint: "US bank accounts", icon: brand(siZelle) },
  { key: "cash_app", label: "Cash App", group: "app", hint: "US & UK", icon: brand(siCashapp) },
  { key: "venmo", label: "Venmo", group: "app", hint: "US", icon: brand(siVenmo) },
  { key: "apple_cash", label: "Apple Cash", group: "app", hint: "US, via Messages or Wallet", icon: brand(siApple) },
  { key: "revolut", label: "Revolut", group: "app", hint: "UK, EU & worldwide", icon: brand(siRevolut) },
  { key: "wise", label: "Wise", group: "app", hint: "Worldwide, multi-currency", icon: brand(siWise) },
  { key: "monzo", label: "Monzo", group: "app", hint: "UK", icon: brand(siMonzo) },
  { key: "n26", label: "N26", group: "app", hint: "EU", icon: brand(siN26) },
  { key: "payoneer", label: "Payoneer", group: "app", hint: "Worldwide", icon: brand(siPayoneer) },
  // ---- money transfer services
  { key: "western_union", label: "Western Union", group: "transfer", hint: "Worldwide, cash or bank", icon: brand(siWesternunion) },
  { key: "moneygram", label: "MoneyGram", group: "transfer", hint: "Worldwide, cash or bank", icon: brand(siMoneygram) },
  { key: "remitly", label: "Remitly", group: "transfer", hint: "International transfers", icon: generic("send") },
  // ---- cryptocurrency
  { key: "bitcoin", label: "Bitcoin (BTC)", group: "crypto", hint: "Bitcoin network", icon: brand(siBitcoin) },
  { key: "ethereum", label: "Ethereum (ETH)", group: "crypto", hint: "Ethereum mainnet", icon: brand(siEthereum) },
  { key: "usdt", label: "Tether (USDT)", group: "crypto", hint: "TRC-20 or ERC-20", icon: brand(siTether) },
  { key: "usdc", label: "USD Coin (USDC)", group: "crypto", hint: "ERC-20, Solana or Base", icon: generic("coin") },
  { key: "litecoin", label: "Litecoin (LTC)", group: "crypto", hint: "Litecoin network", icon: brand(siLitecoin) },
  { key: "solana", label: "Solana (SOL)", group: "crypto", hint: "Solana network", icon: brand(siSolana) },
  { key: "xrp", label: "XRP", group: "crypto", hint: "XRP Ledger", icon: brand(siXrp) },
  { key: "binance_pay", label: "Binance Pay", group: "crypto", hint: "Any supported coin", icon: brand(siBinance) },
  // ---- fallback
  { key: "other", label: "Other", group: "other", hint: "Tell us in the order note", icon: generic("wallet") },
];

const BY_KEY = new Map(PAYMENT_METHODS.map((m) => [m.key, m]));

export const PAYMENT_METHOD_KEYS = PAYMENT_METHODS.map((m) => m.key);

export const getPaymentMethodDef = (key: string) => BY_KEY.get(key) ?? null;

/** Name for any stored key: catalogue → humanised key (never hides an unknown value). */
export const paymentMethodName = (key: string) =>
  BY_KEY.get(key)?.label ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// ---------- response promise (copy shared by checkout, confirmation and emails) ----------

/** What we promise the customer after they order. Client-approved wording (2026-11-24). */
export const PAYMENT_RESPONSE_PROMISE = "within 2 business hours";
/** Unpaid orders are flagged overdue (and may be cancelled) this many days after details are sent. */
export const PAYMENT_DUE_DAYS = 5;
/** A reminder makes sense once this long has passed since the details were sent. */
export const PAYMENT_REMINDER_AFTER_HOURS = 48;

// ---------- details templates ----------

/**
 * Placeholders the admin can use in a template. Filled from the saved order on the server, so the
 * amount always matches the server-computed total (never typed by hand).
 */
export const TEMPLATE_TOKENS = ["first_name", "order_no", "amount", "method", "pay_by"] as const;
export type TemplateToken = (typeof TEMPLATE_TOKENS)[number];

/** `[[ … ]]` marks a part of a template the admin still has to fill in. Sending is blocked while one remains. */
export const UNFILLED_MARKER = /\[\[[^\]]*\]\]/;

const DEFAULT_TEMPLATE_BODY: Record<PaymentMethodGroup, string> = {
  bank: `Account name: [[account name]]
Bank: [[bank name]]
[[sort code / routing number / IBAN]]
Account number: [[account number]]

Amount: {{amount}}
Payment reference: {{order_no}}`,
  app: `Send {{amount}} via {{method}} to: [[your {{method}} username, email or phone]]

Please add {{order_no}} in the payment note so we can match your payment.`,
  transfer: `Receiver name: [[full name]]
Receiver country / city: [[country, city]]
Amount: {{amount}}

Once sent, reply to this email with the transfer control number (MTCN / reference) and {{order_no}}.`,
  crypto: `Send the equivalent of {{amount}} in {{method}} to:
[[wallet address]]
Network: [[network]]

Use the exchange rate at the time you pay. After sending, reply with the transaction ID (hash) and {{order_no}}.`,
  other: `[[How to pay]]

Amount: {{amount}}
Reference: {{order_no}}`,
};

export function defaultTemplate(key: string): string {
  const group = BY_KEY.get(key)?.group ?? "other";
  return `Hi {{first_name}},

Here are the payment details for your order {{order_no}}.

${DEFAULT_TEMPLATE_BODY[group]}

Please pay by {{pay_by}}. We dispatch as soon as your payment is confirmed.`;
}

export function fillTemplate(template: string, values: Record<TemplateToken, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, name: string) =>
    (TEMPLATE_TOKENS as readonly string[]).includes(name) ? values[name as TemplateToken] : whole,
  );
}

// ---------- merging admin config over the catalogue ----------

export type ResolvedPaymentMethod = PaymentMethodDef & { enabled: boolean; template: string };

/**
 * Catalogue order, with the admin's enabled flag + template per key. A method missing from the
 * stored config (new in code, or nothing saved yet) is enabled with the default template.
 */
export function resolvePaymentMethods(stored: PaymentMethodConfig[] | null): ResolvedPaymentMethod[] {
  const byKey = new Map((stored ?? []).map((c) => [c.key, c]));
  return PAYMENT_METHODS.map((m) => {
    const c = byKey.get(m.key);
    return { ...m, enabled: c ? c.enabled : true, template: c?.template?.trim() ? c.template : defaultTemplate(m.key) };
  });
}

/** What the checkout needs (no templates). */
export type CheckoutPaymentMethod = Pick<PaymentMethodDef, "key" | "label" | "group" | "hint">;

// ---------- payment stage (derived; status stays `pending_payment` until the admin marks paid) ----------

export const PAYMENT_STAGES = ["needs_details", "awaiting_payment", "customer_reported", "overdue"] as const;
export type PaymentStage = (typeof PAYMENT_STAGES)[number];


export const PAYMENT_STAGE_LABEL: Record<PaymentStage, string> = {
  needs_details: "Needs payment details",
  awaiting_payment: "Details sent",
  customer_reported: "Customer says paid",
  overdue: "Overdue",
};

export function paymentStage(
  o: { status: string; paymentInstructionsSentAt: Date | null; customerReportedPaidAt: Date | null },
  now = new Date(),
): PaymentStage | null {
  if (o.status !== "pending_payment") return null;
  if (!o.paymentInstructionsSentAt) return "needs_details";
  if (o.customerReportedPaidAt) return "customer_reported";
  return now.getTime() - o.paymentInstructionsSentAt.getTime() >= PAYMENT_DUE_DAYS * 86_400_000 ? "overdue" : "awaiting_payment";
}

export const payByDate = (sentAt: Date) => new Date(sentAt.getTime() + PAYMENT_DUE_DAYS * 86_400_000);
