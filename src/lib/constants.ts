/** Countries we ship to (ISO 3166-1 alpha-2). The UK first; the rest use international shipping. */
export const SHIPPING_COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "LU", name: "Luxembourg" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "DK", name: "Denmark" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "GR", name: "Greece" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
] as const;

export type CountryCode = (typeof SHIPPING_COUNTRIES)[number]["code"];
export const COUNTRY_CODES = SHIPPING_COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

export const countryName = (code: string) => SHIPPING_COUNTRIES.find((c) => c.code === code)?.name ?? code;

/** Shipping option keys that only apply to UK addresses. Others are international. */
export const UK_ONLY_SHIPPING_PREFIX = "uk_";

export const MAX_LINE_QTY = 10;
export const MAX_CART_LINES = 20;
export const ORDER_NO_PREFIX = "ALV-";
