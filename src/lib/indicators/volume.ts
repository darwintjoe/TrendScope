import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { avgPeriod: 20 };

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
  if (volRatio > 1.2 && isGreen) color = "green";
  else if (volRatio > 1.2 && !isGreen) color = "red";

  return {
    name: "Volume",
    color,
    value: `${volRatio.toFixed(1)}x`,
  };
}
