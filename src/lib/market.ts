export interface Market {
  code: string;
  name: string;
  suffix: string;
  flag: string;
}

export const MARKETS: Market[] = [
  { code: "ID", name: "Indonesia", suffix: ".JK", flag: "🇮🇩" },
  { code: "US", name: "United States", suffix: "", flag: "🇺🇸" },
  { code: "HK", name: "Hong Kong", suffix: ".HK", flag: "🇭🇰" },
  { code: "SG", name: "Singapore", suffix: ".SI", flag: "🇸🇬" },
  { code: "CN", name: "China", suffix: ".SS", flag: "🇨🇳" },
];

export function getMarket(code: string): Market | undefined {
  return MARKETS.find((m) => m.code === code);
}

export function applySuffix(ticker: string, marketCode: string): string {
  const market = getMarket(marketCode);
  if (!market) return ticker;
  if (ticker.endsWith(market.suffix)) return ticker;
  return ticker + market.suffix;
}

export function stripSuffix(ticker: string, marketCode: string): string {
  const market = getMarket(marketCode);
  if (!market) return ticker;
  if (ticker.endsWith(market.suffix)) {
    return ticker.slice(0, -market.suffix.length);
  }
  return ticker;
}
