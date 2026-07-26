import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { period: 20, stdDev: 2.0, swingLookback: 10 };

/**
 * Breakout / Breakdown — price breaking key levels.
 *
 * Green: Close > Upper BB (long breakout)
 * Red:   Close < Last Swing Low (short breakdown)
 * Grey:  No breakout
 */
export function breakoutIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };

  if (ohlc.length < p.period + 1) {
    return { name: "Breakout", color: "grey", value: "N/A" };
  }

  const current = ohlc[ohlc.length - 1];

  // Calculate Upper BB
  const slice = ohlc.slice(-p.period);
  const closes = slice.map((c) => c.close);
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const variance = closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / closes.length;
  const stdDev = Math.sqrt(variance);
  const upperBB = mean + p.stdDev * stdDev;

  // Find last swing low (lowest low in lookback)
  const swingSlice = ohlc.slice(-p.swingLookback);
  const lastSwingLow = Math.min(...swingSlice.map((c) => c.low));

  // Check conditions
  const isLongBreakout = current.close > upperBB;
  const isShortBreakdown = current.close < lastSwingLow;

  let color: "green" | "red" | "grey" = "grey";
  let value = "—";

  if (isLongBreakout) {
    color = "green";
    value = `${current.close.toFixed(2)} > ${upperBB.toFixed(2)}`;
  } else if (isShortBreakdown) {
    color = "red";
    value = `${current.close.toFixed(2)} < ${lastSwingLow.toFixed(2)}`;
  }

  return { name: "Breakout", color, value };
}
