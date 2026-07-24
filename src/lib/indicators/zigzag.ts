import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { minSwing: 5 };

/**
 * ZigZag indicator: identifies swing highs and swing lows,
 * then determines trend by last pivot direction.
 */
export function zigzagIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };
  const swingBars = Math.max(p.minSwing, 2);

  if (ohlc.length < swingBars * 2 + 1) {
    return { name: "ZigZag", color: "grey", value: "N/A" };
  }

  /* find pivots within rolling window */
  type Pivot = { idx: number; type: "high" | "low"; price: number };
  const pivots: Pivot[] = [];

  for (let i = swingBars; i < ohlc.length - swingBars; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= swingBars; j++) {
      if (ohlc[i - j].high >= ohlc[i].high || ohlc[i + j].high >= ohlc[i].high) {
        isHigh = false;
      }
      if (ohlc[i - j].low <= ohlc[i].low || ohlc[i + j].low <= ohlc[i].low) {
        isLow = false;
      }
    }

    if (isHigh) pivots.push({ idx: i, type: "high", price: ohlc[i].high });
    if (isLow) pivots.push({ idx: i, type: "low", price: ohlc[i].low });
  }

  if (pivots.length < 2) {
    return { name: "ZigZag", color: "grey", value: "no pivots" };
  }

  const lastPivot = pivots[pivots.length - 1];
  const current = ohlc[ohlc.length - 1].close;

  let color: "green" | "red" | "grey" = "grey";
  if (lastPivot.type === "low" && current > lastPivot.price) {
    color = "green";
  } else if (lastPivot.type === "high" && current < lastPivot.price) {
    color = "red";
  }

  return {
    name: "ZigZag",
    color,
    value: `${lastPivot.type === "high" ? "▲" : "▼"}${lastPivot.price.toFixed(1)}`,
  };
}
