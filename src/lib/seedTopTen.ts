export const SEED_TOP_TEN: Record<string, string[]> = {
  ID: ["BBCA", "BBRI", "BMRI", "ASII", "TLKM", "BBYB", "UNVR", "ARTO", "MAPI", "ADRO"],
  US: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "BRK-B", "LLY", "AVGO", "TSLA"],
  HK: ["0700.HK", "9988.HK", "1299.HK", "0005.HK", "2318.HK", "3690.HK", "9618.HK", "1810.HK", "2020.HK", "0941.HK"],
  SG: ["D05.SI", "O39.SI", "U11.SI", "Z74.SI", "C6L.SI", "Y92.SI", "A17U.SI", "S58.SI", "C38U.SI", "BN4.SI"],
  CN: ["600519.SS", "601318.SS", "600036.SS", "000858.SZ", "601398.SS", "600276.SS", "600900.SS", "000333.SZ", "601888.SS", "600030.SS"],
};

export function getDefaultTickers(marketCode: string): string[] {
  return SEED_TOP_TEN[marketCode] ?? SEED_TOP_TEN["ID"];
}
