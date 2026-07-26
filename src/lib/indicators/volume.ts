import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { avgPeriod: 50, threshold: 1.5 };

/**
 * Volume vs 50-day average — confirms or weakens price moves.
 *
 * Green: Volume > 1.5x average + closing up
 * Red:   Volume > 1.5x average + closing down
 * Grey:  Volume below 1.5x average
 */
export function volumeIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };
  if (ohlc.length < p.avgPeriod + 1) {
    return { name: "Volume", color: "grey", value: "N/A" };
  }

  const recent = ohlc[ohlc.length - 1];
  const lookback = ohlc.slice(-p.avgPeriod - 1, -1);
  const avgVol = lookback.reduce((s, c) => s + c.volume, 0) / lookback.length;

  if (avgVol === 0) return { name: "Volume", color: "grey", value: "N/A" };

  const volRatio = recent.volume / avgVol;
  const isGreen = recent.close > recent.open;

  let color: "green" | "red" | "grey" = "grey";
  if (volRatio > p.threshold && isGreen) color = "green";
  else if (volRatio > p.threshold && !isGreen) color = "red";

  return {
    name: "Volume",
    color,
    value: `${volRatio.toFixed(1)}x`,
  };
}
