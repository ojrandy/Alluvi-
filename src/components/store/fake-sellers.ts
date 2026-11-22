/** Counterfeit watchlist, verbatim from the live /fake-sellers page (now part of /spot-a-fake). */
export type FakeSeller = { country: "United Kingdom" | "Brazil" | "Paraguay"; name: string; channel: string; handle: string; note: string };

export const FAKE_SELLER_FLAGS: Record<FakeSeller["country"], string> = {
  "United Kingdom": "🇬🇧",
  Brazil: "🇧🇷",
  Paraguay: "🇵🇾",
};

export const FAKE_SELLERS: FakeSeller[] = [
  { country: "United Kingdom", name: "Alluvi UK Wholesale", channel: "Instagram", handle: "@alluvi.uk.wholesale", note: "Impersonates Alluvi branding — not an authorised reseller. Products reported as relabelled." },
  { country: "United Kingdom", name: "Alluvi London Peptides", channel: "Standalone website", handle: "alluvi-london-peptides.co.uk", note: "Cloned product photography from alluvi.org. No verifiable lab testing or COA." },
  { country: "United Kingdom", name: "AlluviStore UK", channel: "Telegram", handle: "@alluvistore_uk", note: "Sells unverified vials under the Alluvi name. No connection to the official brand." },
  { country: "United Kingdom", name: "Alluvi Research Supplies", channel: "eBay", handle: "alluvi-research-supplies", note: "Listings flagged for counterfeit packaging and missing batch identifiers." },
  { country: "Brazil", name: "Alluvi Brasil Oficial", channel: "Instagram", handle: "@alluvi.brasil.oficial", note: "Falsely claims to be the official Brazilian distributor. Alluvi has no Brazilian distributor." },
  { country: "Brazil", name: "Peptídeos Alluvi BR", channel: "WhatsApp group", handle: "+55 11 9xxxx-xxxx", note: "Distributes counterfeit vials with forged Alluvi labels. Multiple buyer reports." },
  { country: "Brazil", name: "Alluvi São Paulo", channel: "Mercado Livre", handle: "alluvi-sao-paulo", note: "Listings use stolen Alluvi product photos. Not an authorised reseller." },
  { country: "Brazil", name: "Alluvi Lab Brasil", channel: "Standalone website", handle: "alluvilab-br.com", note: "Domain registered anonymously. No verifiable Certificate of Analysis on any product." },
  { country: "Paraguay", name: "Alluvi Paraguay Distribuidora", channel: "Facebook Marketplace", handle: "Alluvi Paraguay Distribuidora", note: "Claims exclusive Paraguayan distribution rights. No such partnership exists." },
  { country: "Paraguay", name: "Alluvi Asunción", channel: "Telegram", handle: "@alluvi_asuncion", note: "Sells under the Alluvi name with unverified sourcing. No COA provided on request." },
  { country: "Paraguay", name: "Alluvi Research PY", channel: "Instagram", handle: "@alluvi.research.py", note: "Reuses official Alluvi imagery without permission. Reported by buyers for product mismatch." },
  { country: "Paraguay", name: "Peptidos Alluvi Paraguay", channel: "Standalone website", handle: "peptidos-alluvi.py", note: "Domain not associated with Alluvi. Counterfeit vials confirmed via lab comparison." },
];
