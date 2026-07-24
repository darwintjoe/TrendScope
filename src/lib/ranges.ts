export interface RangeOption {
  label: string;
  value: string;
  yahooRange: string;
  yahooInterval: string;
}

/** Ranges used on main list (daily data for indicator scoring) */
export const DAILY_RANGES: RangeOption[] = [
  { label: "3M", value: "3mo", yahooRange: "3mo", yahooInterval: "1d" },
  { label: "6M", value: "6mo", yahooRange: "6mo", yahooInterval: "1d" },
  { label: "1Y", value: "1y", yahooRange: "1y", yahooInterval: "1d" },
  { label: "2Y", value: "2y", yahooRange: "2y", yahooInterval: "1d" },
  { label: "5Y", value: "5y", yahooRange: "5y", yahooInterval: "1d" },
];

/** Extended ranges including intraday for detail chart */
export const ALL_RANGES: RangeOption[] = [
  { label: "1D", value: "1d", yahooRange: "1d", yahooInterval: "30m" },
  { label: "5D", value: "5d", yahooRange: "5d", yahooInterval: "1h" },
  { label: "1M", value: "1mo", yahooRange: "1mo", yahooInterval: "1d" },
  ...DAILY_RANGES,
];

export function findRange(value: string): RangeOption {
  return ALL_RANGES.find((r) => r.value === value) ?? DAILY_RANGES[2];
}
