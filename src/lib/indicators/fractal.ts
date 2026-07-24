import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { lookback: 5 };

/**
 * Bill Williams Fractal: find +fractal (5-bar up pivot) and -fractal (5-bar down pivot).
 */
export function fractalIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };
  const n = Math.max(p.lookback, 2);

  if (ohlc.length < n * 2 + 1) {
    return { name: "Fractal", color: "grey", value: "N/A" };
  }

  /* scan for recent fractals from the end */
  let lastUpFractal: { idx: number; price: number } | null = null;
  let lastDownFractal: { idx: number; price: number } | null = null;

  for (let i = ohlc.length - 1 - n; i >= n; i--) {
    const bar = ohlc[i];

    /* + fractal: high higher than n bars each side */
    let isUp = true;
    for (let j = 1; j <= n; j++) {
      if (ohlc[i - j].high >= bar.high || ohlc[i + j].high >= bar.high) {
        isUp = false;
        break;
      }
    }
    if (isUp && !lastUpFractal) {
      lastUpFractal = { idx: i, price: bar.high };
    }

    /* - fractal: low lower than n bars each side */
    let isDown = true;
    for (let j = 1; j <= n; j++) {
      if (ohlc[i - j].low <= bar.low || ohlc[i + j].low <= bar.low) {
        isDown = false;
        break;
      }
    }
    if (isDown && !lastDownFractal) {
      lastDownFractal = { idx: i, price: bar.low };
    }

    if (lastUpFractal && lastDownFractal) break;
  }

  const current = ohlc[ohlc.length - 1].close;
  let color: "green" | "red" | "grey" = "grey";
  let value = "none";

  if (lastUpFractal && lastUpFractal.idx > (lastDownFractal?.idx ?? -1)) {
    if (current > lastUpFractal.price) color = "green";
    else color = "red";
    value = `▲${lastUpFractal.price.toFixed(1)}`;
  } else if (lastDownFractal) {
    if (current < lastDownFractal.price) color = "red";
    else color = "green";
    value = `▼${lastDownFractal.price.toFixed(1)}`;
  }

  return { name: "Fractal", color, value };
}
