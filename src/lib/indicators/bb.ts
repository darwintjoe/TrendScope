import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { period: 20, stdDev: 2.0, squeezeLookback: 120 };

/**
 * Bollinger Bands Squeeze — volatility contraction.
 *
 * Green: BB Width = 120-day low (squeeze occurred)
 * Grey:  No squeeze
 */
export function bbIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };

  if (ohlc.length < p.squeezeLookback) {
    return { name: "BB Squeeze", color: "grey", value: "N/A" };
  }

  // Calculate BB Width for each bar
  const widths: number[] = [];

  for (let i = p.period - 1; i < ohlc.length; i++) {
    const slice = ohlc.slice(i - p.period + 1, i + 1);
    const closes = slice.map((c) => c.close);
    const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
    const variance = closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / closes.length;
    const stdDev = Math.sqrt(variance);

    const upper = mean + p.stdDev * stdDev;
    const lower = mean - p.stdDev * stdDev;
    const mid = mean;

    const width = mid !== 0 ? ((upper - lower) / mid) * 100 : 0;
    widths.push(width);
  }

  if (widths.length < p.squeezeLookback) {
    return { name: "BB Squeeze", color: "grey", value: "N/A" };
  }

  const currentWidth = widths[widths.length - 1];
  const lookbackWidths = widths.slice(-p.squeezeLookback);
  const minWidth = Math.min(...lookbackWidths);

  const isSqueeze = currentWidth <= minWidth * 1.001; // small tolerance

  return {
    name: "BB Squeeze",
    color: isSqueeze ? "green" : "grey",
    value: currentWidth.toFixed(2),
  };
}
