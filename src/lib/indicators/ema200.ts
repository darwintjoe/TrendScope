import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = { period: 200 };

/**
 * Price vs 200 EMA — long-term trend direction.
 *
 * Green: Price > 200 EMA (bullish)
 * Red:   Price < 200 EMA (bearish)
 * Grey:  Insufficient data
 */
export function ema200Indicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "EMA 200", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const closes = ohlc.map((c) => c.close);

  try {
    const result = TI.EMA.calculate({ values: closes, period: p.period });

    if (!result || result.length === 0) {
      return { name: "EMA 200", color: "grey", value: "N/A" };
    }

    const ema = result[result.length - 1];
    const current = closes[closes.length - 1];

    let color: "green" | "red" | "grey" = "grey";
    if (current > ema) color = "green";
    else if (current < ema) color = "red";

    return { name: "EMA 200", color, value: ema.toFixed(2) };
  } catch {
    return { name: "EMA 200", color: "grey", value: "err" };
  }
}
