import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = {};

/**
 * Volume Weighted Average Price (Annual) — institutional fair value.
 *
 * Green: Close > VWAP (above fair value, bullish)
 * Red:   Close < VWAP (below fair value, bearish)
 * Grey:  Insufficient data
 */
export function vwapIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };

  if (ohlc.length < 20) {
    return { name: "VWAP", color: "grey", value: "N/A" };
  }

  // Use all available data as "annual" approximation
  let cumVol = 0;
  let cumTP = 0;

  for (const bar of ohlc) {
    const tp = (bar.high + bar.low + bar.close) / 3;
    cumTP += tp * bar.volume;
    cumVol += bar.volume;
  }

  if (cumVol === 0) return { name: "VWAP", color: "grey", value: "N/A" };

  const vwap = cumTP / cumVol;
  const current = ohlc[ohlc.length - 1].close;

  let color: "green" | "red" | "grey" = "grey";
  if (current > vwap) color = "green";
  else if (current < vwap) color = "red";

  return { name: "VWAP", color, value: vwap.toFixed(2) };
}
